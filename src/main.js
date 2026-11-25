import './styles.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initIntro } from './intro.js';
import { initHero, initOutro } from './hero.js';
import { createAmbience } from './ambience.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.92 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  if (import.meta.env.DEV) window.__lenis = lenis;
}

initHero(reduced);
initOutro(reduced);

initIntro({
  reduced,
  onDone: () => {
    document.documentElement.classList.remove('is-locked');
    document.body.classList.add('is-ready');
    lenis?.start();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  },
});

document.fonts?.ready.then(() => ScrollTrigger.refresh());

/* Masthead state */
const masthead = document.querySelector('.masthead');
const syncMasthead = () => {
  masthead?.classList.toggle('is-scrolled', window.scrollY > 28);
};
window.addEventListener('scroll', syncMasthead, { passive: true });
syncMasthead();

/* Anchor scrolling through Lenis */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const selector = link.getAttribute('href');
    if (!selector || selector === '#') return;
    const target = document.querySelector(selector);
    if (!target) return;
    event.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -72, duration: 1.6 });
    else target.scrollIntoView({ block: 'start' });
  });
});

/* Reveal on scroll */
const revealEls = [...document.querySelectorAll('[data-reveal]')];
document.querySelectorAll('section').forEach((section) => {
  [...section.querySelectorAll('[data-reveal]')].forEach((el, index) => {
    el.style.setProperty('--d', `${Math.min(index, 5) * 0.08}s`);
  });
});

if (reduced) {
  revealEls.forEach((el) => el.classList.add('is-in'));
} else if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: '0px 0px -40px 0px' },
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-in'));
}

/* Act rail */
const rail = document.querySelector('.act-rail');
const railSections = ['artist', 'listen', 'film', 'sight', 'instrument', 'live', 'book']
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if (rail && railSections.length > 1 && 'IntersectionObserver' in window) {
  const railObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = railSections.indexOf(entry.target);
        rail.style.setProperty('--rail', `${(index / (railSections.length - 1)) * 88}%`);
      });
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  railSections.forEach((section) => railObserver.observe(section));
}

/* Forest ambience: synthesised wind and water, always user-started */
const ambience = createAmbience();
const ambienceButton = document.querySelector('.ambience-toggle');

if (ambienceButton) {
  ambienceButton.addEventListener('click', async () => {
    const on = await ambience.toggle(0.5);
    ambienceButton.classList.toggle('is-on', Boolean(on));
    ambienceButton.setAttribute('aria-pressed', String(Boolean(on)));
    ambienceButton.setAttribute(
      'aria-label',
      on ? 'Stop forest ambience' : 'Play forest ambience',
    );
  });
}

/* Audio gallery */
const player = new Audio();
player.preload = 'none';
player.volume = 0.72;

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const tracks = [...document.querySelectorAll('.track')].map((row) => {
  const entry = {
    row,
    src: row.dataset.src,
    seek: row.querySelector('.track-seek'),
    time: row.querySelector('.track-time'),
    button: row.querySelector('.track-play'),
    duration: 0,
  };
  if (entry.src) {
    entry.seek.disabled = true;
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.src = entry.src;
    probe.addEventListener('loadedmetadata', () => {
      entry.duration = probe.duration;
      if (active !== entry) entry.time.textContent = formatTime(probe.duration);
      probe.removeAttribute('src');
      probe.load();
    });
  }
  return entry;
});

let active = null;

function paintSeek(entry, ratio) {
  entry.seek.style.setProperty('--seek', `${ratio * 100}%`);
}

function releaseEntry(entry) {
  entry.row.classList.remove('is-playing');
  entry.button?.setAttribute('aria-pressed', 'false');
  entry.seek.value = 0;
  entry.seek.disabled = true;
  paintSeek(entry, 0);
  entry.time.textContent = formatTime(entry.duration || 0);
}

function selectTrack(entry) {
  if (active === entry) {
    if (player.paused) player.play();
    else player.pause();
    return;
  }
  if (active) {
    player.pause();
    releaseEntry(active);
  }
  active = entry;
  player.src = entry.src;
  player.currentTime = 0;
  entry.seek.disabled = false;
  entry.row.classList.add('is-playing');
  entry.button?.setAttribute('aria-pressed', 'true');
  entry.seek.value = 0;
  paintSeek(entry, 0);
  const attempt = player.play();
  attempt?.catch(() => {
    if (active === entry) {
      active = null;
      releaseEntry(entry);
    }
  });
}

tracks.forEach((entry) => {
  entry.button?.addEventListener('click', () => selectTrack(entry));
  entry.seek?.addEventListener('input', () => {
    if (active !== entry || !player.duration) return;
    player.currentTime = (Number(entry.seek.value) / 1000) * player.duration;
  });
});

player.addEventListener('play', () => {
  if (!active) return;
  active.row.classList.add('is-playing');
  active.button?.setAttribute('aria-pressed', 'true');
  ambience.duck(true);
});

player.addEventListener('pause', () => {
  ambience.duck(false);
  if (!active || player.ended) return;
  active.row.classList.remove('is-playing');
  active.button?.setAttribute('aria-pressed', 'false');
});

player.addEventListener('ended', () => {
  ambience.duck(false);
  if (!active) return;
  releaseEntry(active);
  active.time.textContent = formatTime(active.duration || player.duration);
  active = null;
});

player.addEventListener('timeupdate', () => {
  if (!active) return;
  const duration = player.duration;
  const ratio = duration ? player.currentTime / duration : 0;
  active.seek.value = Math.round(ratio * 1000);
  paintSeek(active, ratio);
  active.time.textContent = `${formatTime(player.currentTime)} / ${formatTime(duration)}`;
});

const volume = document.querySelector('.player-volume');
volume?.addEventListener('input', () => {
  player.volume = Number(volume.value) / 100;
  player.muted = player.volume === 0;
});

/* Film reels: only one speaks at a time */
const reels = [...document.querySelectorAll('.reel-frame video')];
reels.forEach((video) => {
  video.addEventListener('play', () => {
    reels.forEach((other) => {
      if (other !== video && !other.paused) other.pause();
    });
    ambience.duck(true);
  });
  video.addEventListener('pause', () => ambience.duck(false));
});

/* Booking form */
const form = document.querySelector('.booking');
const bookingEmail = import.meta.env.VITE_BOOKING_EMAIL;
const bookingEndpoint = import.meta.env.VITE_BOOKING_ENDPOINT;
const MAX_MESSAGE = 1500;
const RESEND_COOLDOWN = 20_000;
const formReadyAt = Date.now();

if (form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorLine = form.querySelector('.booking-error');
  const noteLine = form.querySelector('.booking-note');
  const setupLine = form.querySelector('.booking-setup');
  const successLine = form.querySelector('.success-line');
  const trap = form.querySelector('[name="company"]');

  if (bookingEndpoint) {
    if (noteLine) noteLine.textContent = 'SENT DIRECTLY TO THE ARTIST — NEVER STORED ON THIS SITE';
    if (successLine) successLine.textContent = 'The enquiry is on its way. The artist replies personally, usually within a day or two.';
  }

  const showError = (message) => {
    if (!errorLine) return;
    errorLine.textContent = message;
    errorLine.hidden = false;
  };

  const clearError = (event) => {
    event.target.closest('.field')?.classList.remove('is-error');
    if (errorLine) errorLine.hidden = true;
  };
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('input', clearError);
  });

  const readFields = () => {
    const data = new FormData(form);
    const value = (key) => String(data.get(key) || '').replace(/\s+/g, ' ').trim();
    return {
      name: value('name'),
      email: value('email'),
      phone: value('phone'),
      venue: value('venue'),
      occasion: value('occasion'),
      date: value('date'),
      message: String(data.get('message') || '').trim().slice(0, MAX_MESSAGE),
    };
  };

  const mailtoHref = (fields) => {
    const lines = [
      `Name: ${fields.name}`,
      `Email: ${fields.email}`,
      `Phone / WhatsApp: ${fields.phone || '—'}`,
      `Occasion: ${fields.occasion}`,
      `Event date: ${fields.date || 'TBC'}`,
      `City & venue: ${fields.venue || '—'}`,
      '',
      fields.message || '(No message)',
    ];
    const subject = `Booking enquiry — ${fields.occasion} — ${fields.date || 'date TBC'}`;
    return `mailto:${bookingEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  };

  const validate = () => {
    let valid = true;
    form.querySelectorAll('[required]').forEach((field) => {
      const wrapper = field.closest('.field');
      const value = field.value.trim();
      const ok =
        field.type === 'email'
          ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          : value.length > 0;
      wrapper?.classList.toggle('is-error', !ok);
      if (!ok) valid = false;
    });
    const phone = form.querySelector('[name="phone"]');
    if (phone?.value.trim()) {
      const ok = /^[+\d][\d\s().-]{5,}$/.test(phone.value.trim());
      phone.closest('.field')?.classList.toggle('is-error', !ok);
      if (!ok) valid = false;
    }
    return valid;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.classList.contains('is-sending') || form.classList.contains('is-sent')) return;

    // Honeypot and time trap: a human cannot fill the form this fast, and the
    // hidden field is never rendered to a real visitor.
    if (trap?.value.trim()) return;
    if (Date.now() - formReadyAt < 1500) {
      showError('Please take a moment and try again.');
      return;
    }

    if (!validate()) return;

    if (!bookingEndpoint && !bookingEmail) {
      if (setupLine) setupLine.hidden = false;
      return;
    }
    if (setupLine) setupLine.hidden = true;

    const fields = readFields();

    if (!bookingEndpoint) {
      window.location.href = mailtoHref(fields);
      form.classList.add('is-sent');
      return;
    }

    const cooldownKey = 'cg-booking-sent';
    try {
      const last = Number(localStorage.getItem(cooldownKey) || 0);
      if (last && Date.now() - last < RESEND_COOLDOWN) {
        showError('That note was just sent — give it a moment before writing again.');
        return;
      }
    } catch {
      /* storage unavailable: skip the client-side cooldown */
    }

    form.classList.add('is-sending');
    submitBtn?.setAttribute('aria-busy', 'true');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch(bookingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...fields, submittedAt: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      try {
        localStorage.setItem(cooldownKey, String(Date.now()));
      } catch {
        /* storage unavailable: fine */
      }
      form.classList.add('is-sent');
    } catch {
      showError(
        bookingEmail
          ? 'The note could not be sent. Please write to the artist directly instead.'
          : 'The note could not be sent. Check the connection and try again.',
      );
    } finally {
      form.classList.remove('is-sending');
      submitBtn?.removeAttribute('aria-busy');
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  form.querySelector('.text-btn')?.addEventListener('click', () => {
    form.classList.remove('is-sent');
    form.reset();
    try {
      localStorage.removeItem('cg-booking-sent');
    } catch {
      /* storage unavailable: fine */
    }
    form.querySelector('input')?.focus();
  });
}

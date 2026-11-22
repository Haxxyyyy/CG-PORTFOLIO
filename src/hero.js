import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createScene } from './scene.js';

gsap.registerPlugin(ScrollTrigger);

const SCROLL_LENGTH = '+=135%';

export function initHero(reduced) {
  const stage = document.querySelector('.hero-stage');
  const canvas = stage?.querySelector('.hero-canvas');
  if (!stage || !canvas) return;

  const scene = createScene(canvas, { reduced, mode: 'hero' });
  if (import.meta.env.DEV) (window.__scenes ||= {}).hero = scene;
  if (!scene || reduced) return;

  ScrollTrigger.create({
    trigger: stage.parentElement,
    start: 'top top',
    end: SCROLL_LENGTH,
    pin: true,
    scrub: 0.65,
    onUpdate: (self) => scene.setProgress(self.progress),
  });

  gsap.to('.hero-copy', {
    opacity: 0,
    y: -70,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '+=58%',
      scrub: true,
    },
  });

  gsap.to('.hero-scroll', {
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '+=24%',
      scrub: true,
    },
  });
}

export function initOutro(reduced) {
  const canvas = document.querySelector('.outro-canvas');
  if (!canvas) return;
  const scene = createScene(canvas, { reduced, mode: 'outro' });
  if (import.meta.env.DEV) (window.__scenes ||= {}).outro = scene;
}

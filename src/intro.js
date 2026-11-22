const TAU = Math.PI * 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function seeded(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

const lerpColor = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const VANE_STOPS = [
  [0.0, [22, 48, 38]],
  [0.16, [32, 92, 72]],
  [0.32, [46, 128, 92]],
  [0.5, [74, 128, 76]],
  [0.68, [124, 128, 66]],
  [0.84, [126, 104, 62]],
  [1.0, [92, 70, 44]],
];

function vaneColor(t) {
  for (let index = 1; index < VANE_STOPS.length; index += 1) {
    const [stop, color] = VANE_STOPS[index];
    const [prevStop, prevColor] = VANE_STOPS[index - 1];
    if (t <= stop) return lerpColor(prevColor, color, (t - prevStop) / (stop - prevStop));
  }
  return VANE_STOPS[VANE_STOPS.length - 1][1];
}

// One high-resolution feather painted once: vane gradient, barb strokes,
// iridescent eyespot, rachis, and the soft fluff at the quill.
function makeFeatherSprite() {
  const width = 512;
  const height = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const cx = width / 2;
  const top = height * 0.035;
  const quill = height * 0.975;
  const eyeY = height * 0.195;
  const eyeRx = width * 0.315;
  const eyeRy = height * 0.085;

  const rachisX = (t) => cx + Math.sin(t * Math.PI * 1.1 - 0.3) * 12 - 6 * t;
  const vaneWidth = (t) => {
    if (t < 0.06) return width * 0.02;
    if (t < 0.13) return width * (0.02 + ((t - 0.06) / 0.07) * 0.24);
    if (t < 0.34) return width * (0.26 + Math.sin(((t - 0.13) / 0.21) * Math.PI) * 0.1);
    if (t < 0.62) return width * (0.36 - ((t - 0.34) / 0.28) * 0.2);
    if (t < 0.8) return width * (0.16 - ((t - 0.62) / 0.18) * 0.08);
    return width * (0.08 - ((t - 0.8) / 0.2) * 0.05);
  };

  // Solid vane silhouette so the barbs read as one object, not loose lines.
  ctx.beginPath();
  const steps = 90;
  for (let index = 0; index <= steps; index += 1) {
    const t = (index / steps) * 0.94 + 0.03;
    const y = top + t * (quill - top);
    const x = rachisX(t) - vaneWidth(t) * (0.92 + Math.sin(t * 21) * 0.03);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let index = steps; index >= 0; index -= 1) {
    const t = (index / steps) * 0.94 + 0.03;
    const y = top + t * (quill - top);
    const x = rachisX(t) + vaneWidth(t) * (0.92 + Math.sin(t * 19 + 1) * 0.03);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  const vaneFill = ctx.createLinearGradient(0, top, 0, quill);
  for (const [stop, [r, g, b]] of VANE_STOPS) {
    vaneFill.addColorStop(stop, `rgba(${r}, ${g}, ${b}, 0.78)`);
  }
  ctx.fillStyle = vaneFill;
  ctx.fill();

  // Barbs: curved strokes fanning from the rachis, denser toward the eye.
  ctx.lineCap = 'round';
  for (let side = -1; side <= 1; side += 2) {
    for (let row = 0; row < 150; row += 1) {
      const t = 0.045 + (row / 150) * 0.9;
      if (t > 0.86 && row % 2 === 0) continue;
      const y = top + t * (quill - top);
      const rx = rachisX(t);
      const half = vaneWidth(t) * (0.94 + seeded(row * 2.7 + side) * 0.06);
      const sweep = (1 - t) * 26 + 8;
      const [r, g, b] = vaneColor(t);
      for (let barb = 0; barb < 3; barb += 1) {
        const share = (barb + 0.5) / 3;
        const length = half * (0.55 + share * 0.5);
        const droop = 10 + share * 34 + t * 30;
        const alpha = 0.16 + seeded(row * 5.1 + barb * 1.7 + side) * 0.24;
        ctx.beginPath();
        ctx.moveTo(rx, y);
        ctx.quadraticCurveTo(
          rx + side * length * 0.55,
          y - sweep * 0.25 + droop * 0.2,
          rx + side * length,
          y + droop * 0.55,
        );
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 1 + seeded(row * 3.3 + barb) * 1.1;
        ctx.stroke();
      }
    }
  }

  // Eyespot: bronze rim, emerald band, deep indigo heart, gold pupil.
  ctx.save();
  ctx.translate(rachisX(0.12), eyeY);
  ctx.rotate(-0.06);
  ctx.scale(1, eyeRy / eyeRx);
  const rings = [
    [1, ['#8f7a3c', '#6f8a4e', '#2f6b52']],
    [0.78, ['#c8a45c', '#3f8a63', '#20463f']],
    [0.55, ['#2f7d6a', '#1d4f52', '#101f33']],
    [0.34, ['#1a2f52', '#111c38', '#0a1226']],
  ];
  for (const [scale, colors] of rings) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeRx * scale);
    gradient.addColorStop(0, colors[2]);
    gradient.addColorStop(0.55, colors[1]);
    gradient.addColorStop(0.86, colors[0]);
    gradient.addColorStop(1, 'rgba(20, 30, 24, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, eyeRx * scale, 0, TAU);
    ctx.fill();
  }
  const pupil = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeRx * 0.3);
  pupil.addColorStop(0, 'rgba(236, 202, 128, 0.95)');
  pupil.addColorStop(0.35, 'rgba(180, 132, 62, 0.75)');
  pupil.addColorStop(0.8, 'rgba(40, 58, 62, 0.35)');
  pupil.addColorStop(1, 'rgba(12, 22, 20, 0)');
  ctx.fillStyle = pupil;
  ctx.beginPath();
  ctx.arc(0, 0, eyeRx * 0.36, 0, TAU);
  ctx.fill();
  ctx.restore();

  // Fluff: loose taupe strands below the vane.
  for (let index = 0; index < 90; index += 1) {
    const t = 0.78 + seeded(index * 1.9) * 0.2;
    const y = top + t * (quill - top);
    const side = seeded(index * 2.3) < 0.5 ? -1 : 1;
    const length = 6 + seeded(index * 3.7) * 22;
    ctx.beginPath();
    ctx.moveTo(rachisX(t), y);
    ctx.quadraticCurveTo(
      rachisX(t) + side * length * 0.5,
      y + 4,
      rachisX(t) + side * length,
      y + 10 + seeded(index) * 14,
    );
    ctx.strokeStyle = `rgba(${112 + Math.round(seeded(index) * 40)}, ${92 + Math.round(seeded(index * 1.3) * 30)}, ${60 + Math.round(seeded(index * 1.7) * 22)}, ${0.14 + seeded(index * 4.1) * 0.2})`;
    ctx.lineWidth = 0.8 + seeded(index * 5.3) * 0.8;
    ctx.stroke();
  }

  // Rachis: dark spine with a warm lit edge.
  ctx.beginPath();
  for (let index = 0; index <= 60; index += 1) {
    const t = index / 60;
    const x = rachisX(t);
    const y = top + t * (quill - top);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(58, 48, 28, 0.85)';
  ctx.lineWidth = 5.5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(214, 186, 128, 0.5)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  return canvas;
}

export function initIntro({ reduced, onDone }) {
  const intro = document.getElementById('intro');
  if (!intro) {
    onDone();
    return;
  }

  const canvas = intro.querySelector('.intro-canvas');
  const ctx = canvas?.getContext('2d') ?? null;
  const track = intro.querySelector('.intro-track i');
  const skip = intro.querySelector('.intro-skip');
  const startAt = performance.now();
  const minDuration = reduced ? 700 : 2600;

  let width = 1;
  let height = 1;
  let dpr = 1;
  let feathers = [];
  let gusts = [];
  let motes = [];
  let frame = 0;
  let exiting = false;

  const sprite = makeFeatherSprite();
  const spriteW = sprite.width;
  const spriteH = sprite.height;
  if (import.meta.env.DEV) window.__featherSprite = sprite;

  function build() {
    const small = width < 700;
    const count = small ? 9 : 14;

    feathers = Array.from({ length: count }, (_, index) => {
      const seed = index + 1;
      const depth = seeded(seed * 12.7);
      return {
        x: seeded(seed * 3.1) * width * 1.3 - width * 0.28,
        y: height * (0.08 + seeded(seed * 4.7) * 0.84),
        size: (small ? 60 : 78) + seeded(seed * 2.3) * (small ? 70 : 150),
        speed: 30 + seeded(seed * 5.9) * 66,
        amp: 12 + seeded(seed * 6.7) * 40,
        freq: 0.0022 + seeded(seed * 7.3) * 0.0045,
        phase: seeded(seed * 8.1) * TAU,
        rotation: -0.24 + (seeded(seed * 9.7) - 0.5) * 0.8,
        spin: (seeded(seed * 10.3) - 0.5) * 0.5,
        alpha: 0.32 + seeded(seed * 11.9) * 0.52,
        depth,
      };
    });

    motes = Array.from({ length: small ? 34 : 58 }, (_, index) => ({
      x: seeded(index * 2.9 + 0.7) * (width + 80) - 40,
      y: height * (0.06 + seeded(index * 3.9 + 0.2) * 0.88),
      speed: 26 + seeded(index * 4.7) * 70,
      amp: 5 + seeded(index * 5.9) * 16,
      size: 0.7 + seeded(index * 6.3) * 1.3,
      alpha: 0.07 + seeded(index * 7.7) * 0.14,
      phase: seeded(index * 8.9) * TAU,
      gold: seeded(index * 9.3) > 0.4,
    }));

    gusts = Array.from({ length: 5 }, (_, index) => ({
      y: height * (0.14 + index * 0.18),
      amp: 14 + seeded(index * 3.7 + 2) * 28,
      phase: seeded(index * 4.9 + 3) * TAU,
      speed: 0.1 + seeded(index * 5.3 + 4) * 0.16,
      alpha: 0.03 + seeded(index * 6.1 + 5) * 0.045,
    }));
  }

  function layout() {
    width = Math.max(1, intro.clientWidth);
    height = Math.max(1, intro.clientHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    if (!canvas) return;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    if (reduced) draw(0.55);
    else draw(0.001);
  }

  function drawWind(time) {
    if (!ctx) return;
    for (const gust of gusts) {
      const shift = Math.sin(time * gust.speed + gust.phase) * 46;
      ctx.beginPath();
      ctx.moveTo(-90 + shift, gust.y);
      ctx.bezierCurveTo(
        width * 0.3,
        gust.y - gust.amp,
        width * 0.62,
        gust.y + gust.amp,
        width + 90 + shift * 0.4,
        gust.y - gust.amp * 0.35,
      );
      ctx.strokeStyle = `rgba(214, 196, 150, ${gust.alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawMotes(time) {
    if (!ctx) return;
    const span = width + 80;
    for (const mote of motes) {
      const x = ((mote.x + mote.speed * time + 40) % span + span) % span - 40;
      const y = mote.y + Math.sin(time * 0.7 + mote.phase) * mote.amp;
      const alpha = mote.alpha * (0.55 + 0.45 * Math.sin(time * 0.9 + mote.phase * 2));
      if (alpha <= 0.01) continue;
      ctx.fillStyle = mote.gold
        ? `rgba(226, 197, 138, ${alpha})`
        : `rgba(190, 208, 172, ${alpha})`;
      ctx.fillRect(x, y, mote.size, mote.size);
    }
  }

  function draw(time) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    drawWind(time);

    const margin = 320;
    const span = width + margin * 2;

    for (const feather of feathers) {
      const x = ((feather.x + feather.speed * time + margin) % span + span) % span - margin;
      const y = feather.y
        + Math.sin(x * feather.freq + feather.phase) * feather.amp
        + Math.sin(time * 0.45 + feather.phase) * 6
        + feather.depth * 12;
      const rotation = feather.rotation
        + Math.sin(time * 0.33 + feather.phase) * 0.18
        + feather.spin * time * 0.12;
      const scale = (feather.size / spriteW) * (0.84 + feather.depth * 0.34);
      const alpha = clamp(
        feather.alpha
          * (0.75 + 0.25 * Math.sin(time * 0.6 + feather.phase))
          * (0.55 + feather.depth * 0.45),
        0,
        1,
      );

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        sprite,
        (-spriteW * scale) / 2,
        (-spriteH * scale) / 2,
        spriteW * scale,
        spriteH * scale,
      );
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    drawMotes(time);
  }

  function finish() {
    if (exiting) return;
    exiting = true;
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('resize', layout);
    skip?.removeEventListener('click', finish);
    track?.style.setProperty('--p', '1');
    intro.classList.add('is-leaving');
    document.documentElement.classList.remove('is-locked');
    window.setTimeout(() => intro.remove(), 1100);
    onDone();
  }

  function loop(now) {
    if (exiting) return;
    const elapsed = now - startAt;
    draw(Math.min(elapsed / 1000, 24));
    track?.style.setProperty('--p', String(Math.min(1, elapsed / minDuration)));
    if (elapsed >= minDuration) finish();
    else frame = requestAnimationFrame(loop);
  }

  layout();
  window.addEventListener('resize', layout, { passive: true });
  skip?.addEventListener('click', finish);
  window.setTimeout(finish, reduced ? 1600 : 5400);

  if (!reduced) frame = requestAnimationFrame(loop);
}

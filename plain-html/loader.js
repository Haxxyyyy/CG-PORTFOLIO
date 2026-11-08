(() => {
  const screen = document.querySelector('#loading-screen');
  const canvas = screen?.querySelector('.loading-feathers');
  if (!screen) return;

  const siteShell = document.querySelector('.site-shell');
  const skipButton = screen.querySelector('.loader-skip');
  const context = canvas?.getContext('2d', { alpha: true });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const progress = screen.querySelector('.loading-progress i');
  const feathers = [];
  const startedAt = performance.now();
  const minDuration = reducedMotion.matches ? 700 : 1750;
  let width = 1;
  let height = 1;
  let ratio = 1;
  let frame = 0;
  let active = true;
  let dismissed = false;

  screen.classList.add('is-active');
  siteShell?.setAttribute('inert', '');

  function random(seed) {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function resize() {
    if (!canvas || !context) return;
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    feathers.length = 0;
    const count = reducedMotion.matches ? 18 : Math.min(34, Math.max(22, Math.round(width / 34)));
    for (let i = 0; i < count; i += 1) {
      const seed = i + 1;
      const scale = 0.42 + random(seed * 2.1) * 0.82;
      feathers.push({
        x: random(seed * 3.7) * (width + 180) - 90,
        y: random(seed * 5.3) * (height + 120) - 60,
        length: 150 + random(seed * 4.2) * 150,
        scale,
        angle: 0.18 + random(seed * 6.8) * 0.62,
        speed: 13 + random(seed * 7.1) * 24,
        lift: 3 + random(seed * 8.7) * 9,
        sway: 0.035 + random(seed * 9.4) * 0.075,
        phase: random(seed * 10.3) * Math.PI * 2,
        opacity: 0.22 + random(seed * 11.9) * 0.43,
      });
    }
  }

  function drawFeather(feather, seconds) {
    const ctx = context;
    const driftX = seconds * feather.speed;
    const x = ((feather.x + driftX + 120) % (width + 240)) - 120;
    const y = feather.y - seconds * feather.lift
      + Math.sin(seconds * 1.05 + feather.phase) * 24
      + Math.sin(seconds * 2.1 + feather.phase * 0.65) * 7;
    const rotation = feather.angle
      + Math.sin(seconds * 0.8 + feather.phase) * feather.sway
      + Math.sin(seconds * 1.45 + feather.phase * 0.5) * feather.sway * 0.28;
    const length = feather.length;
    const halfWidth = length * 0.155;

    ctx.save();
    ctx.globalAlpha = feather.opacity;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(feather.scale, feather.scale);

    const vane = ctx.createLinearGradient(-halfWidth, 0, halfWidth, -length);
    vane.addColorStop(0, 'rgba(117, 145, 102, .76)');
    vane.addColorStop(0.42, 'rgba(39, 111, 91, .86)');
    vane.addColorStop(0.76, 'rgba(43, 81, 117, .84)');
    vane.addColorStop(1, 'rgba(178, 160, 103, .62)');
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-halfWidth * 0.66, -length * 0.22, -halfWidth * 1.18, -length * 0.72, 0, -length);
    ctx.bezierCurveTo(halfWidth * 1.18, -length * 0.72, halfWidth * 0.66, -length * 0.22, 0, 6);
    ctx.fillStyle = vane;
    ctx.fill();

    ctx.lineWidth = 0.75;
    ctx.strokeStyle = 'rgba(225, 219, 177, .38)';
    for (let index = 3; index <= 18; index += 1) {
      const t = index / 21;
      const stemY = -length * t;
      const spread = halfWidth * Math.sin(Math.PI * t) * 0.84;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, stemY);
        ctx.quadraticCurveTo(side * spread * 0.42, stemY - length * 0.018, side * spread, stemY - length * 0.055);
        ctx.stroke();
      }
    }

    const rachis = ctx.createLinearGradient(0, 0, 0, -length);
    rachis.addColorStop(0, 'rgba(223, 207, 151, .72)');
    rachis.addColorStop(0.55, 'rgba(194, 208, 167, .82)');
    rachis.addColorStop(1, 'rgba(224, 205, 145, .68)');
    ctx.beginPath();
    ctx.moveTo(0, 11);
    ctx.quadraticCurveTo(halfWidth * 0.12, -length * 0.48, 0, -length);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = rachis;
    ctx.stroke();

    const eyeY = -length * 0.76;
    const eyeRadius = length * 0.042;
    ctx.save();
    ctx.translate(0, eyeY);
    ctx.scale(0.72, 1.08);
    const eye = [
      [1.45, 'rgba(226, 204, 145, .88)'],
      [1.12, 'rgba(23, 51, 43, .97)'],
      [0.82, 'rgba(37, 118, 108, .98)'],
      [0.57, 'rgba(48, 92, 148, .98)'],
      [0.29, 'rgba(10, 29, 44, .98)'],
    ];
    for (const [multiplier, color] of eye) {
      ctx.beginPath();
      ctx.ellipse(0, 0, eyeRadius * multiplier, eyeRadius * multiplier * 1.18, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  function drawWind(seconds) {
    const ctx = context;
    for (let index = 0; index < 5; index += 1) {
      const y = height * (0.18 + index * 0.15) + Math.sin(seconds * 0.6 + index) * 18;
      const drift = ((seconds * (28 + index * 4) + index * width * 0.31) % (width + 420)) - 210;
      const gradient = ctx.createLinearGradient(drift - 180, y, drift + 240, y - 42);
      gradient.addColorStop(0, 'rgba(190, 205, 164, 0)');
      gradient.addColorStop(0.48, 'rgba(190, 205, 164, .13)');
      gradient.addColorStop(1, 'rgba(226, 211, 160, 0)');
      ctx.beginPath();
      ctx.moveTo(drift - 180, y + 34);
      ctx.bezierCurveTo(drift - 40, y - 22, drift + 70, y + 55, drift + 240, y - 42);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function draw(time) {
    if (!context || !active) return;
    const elapsed = Math.max(0, time - startedAt);
    const seconds = elapsed / 1000;
    context.clearRect(0, 0, width, height);
    drawWind(seconds);
    for (const feather of feathers) drawFeather(feather, seconds);
    if (progress) screen.style.setProperty('--loading-progress', `${Math.min(94, 8 + elapsed / 2300 * 86)}%`);
    if (!reducedMotion.matches && !document.hidden) frame = window.requestAnimationFrame(draw);
  }

  function handleResize() {
    resize();
    if (reducedMotion.matches && context) draw(performance.now());
  }

  function handleVisibilityChange() {
    if (document.hidden && frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    } else if (!document.hidden && active && !reducedMotion.matches && !frame) {
      start();
    }
  }

  function handleSkip() {
    beginExit();
  }

  function beginExit() {
    if (dismissed) return;
    dismissed = true;
    active = false;
    siteShell?.removeAttribute('inert');
    if (frame) window.cancelAnimationFrame(frame);
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    skipButton?.removeEventListener('click', handleSkip);
    screen.classList.add('is-leaving');
    window.setTimeout(() => screen.remove(), 950);
  }

  function finishAfterLoad() {
    const remaining = Math.max(0, minDuration - (performance.now() - startedAt));
    window.setTimeout(beginExit, remaining);
  }

  function start() {
    if (context) frame = window.requestAnimationFrame(draw);
  }

  resize();
  start();
  skipButton?.addEventListener('click', handleSkip);
  window.addEventListener('resize', handleResize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  if (document.readyState === 'complete') finishAfterLoad();
  else window.addEventListener('load', finishAfterLoad, { once: true });
  window.setTimeout(beginExit, 3400);
})();

(() => {
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.hero-particles');
  if (!hero || !canvas) return;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const particles = [];
  const holePositions = [0.14, 0.27, 0.40, 0.53, 0.66, 0.79, 0.90];
  let width = 1;
  let height = 1;
  let ratio = 1;
  let scrollProgress = 0;
  let targetScrollProgress = 0;
  let visible = false;
  let frame = 0;
  let elapsed = 0;
  let lastFrameTime = 0;
  let resizeFrame = 0;

  function random(seed) {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function smooth(value) {
    value = clamp(value, 0, 1);
    return value * value * value * (value * (value * 6 - 15) + 10);
  }

  function halton(index, base) {
    let fraction = 1;
    let result = 0;
    while (index > 0) {
      fraction /= base;
      result += fraction * (index % base);
      index = Math.floor(index / base);
    }
    return result;
  }

  function bezier(start, controlOne, controlTwo, end, progress) {
    const inverse = 1 - progress;
    const startWeight = inverse * inverse * inverse;
    const oneWeight = 3 * inverse * inverse * progress;
    const twoWeight = 3 * inverse * progress * progress;
    const endWeight = progress * progress * progress;
    return start * startWeight + controlOne * oneWeight + controlTwo * twoWeight + end * endWeight;
  }

  function makeParticles() {
    particles.length = 0;
    const count = Math.min(4200, Math.max(2200, Math.round(width * 2.7)));

    for (let index = 0; index < count; index += 1) {
      const seed = index + 1;
      const along = 1 - index / (count - 1);
      const offset = index === 0 ? -8.2 : (random(seed * 2.43) - 0.5) * 16.4;
      const hole = holePositions.some((position) => Math.abs(along - position) < 0.007 && Math.abs(offset) < 5.3);
      if (hole) continue;

      const verticalOrder = (offset + 8.2) / 16.4;
      const releaseDelay = (1 - along) * 0.565 + verticalOrder * 0.03;
      const start = flutePosition(along, offset);
      const padding = 22;
      const targetIndex = particles.length + 1;
      const targetX = padding + halton(targetIndex, 2) * (width - padding * 2);
      const targetY = padding + halton(targetIndex, 3) * (height - padding * 2);
      const deltaX = targetX - start.x;
      const deltaY = targetY - start.y;
      const distance = Math.max(1, Math.hypot(deltaX, deltaY));
      const perpendicularX = -deltaY / distance;
      const perpendicularY = deltaX / distance;
      const bend = (random(seed * 3.17) - 0.5) * Math.min(125, distance * 0.28);

      particles.push({
        along,
        offset,
        startX: start.x,
        startY: start.y,
        controlOneX: start.x + deltaX * 0.3 + perpendicularX * bend,
        controlOneY: start.y + deltaY * 0.3 + perpendicularY * bend,
        controlTwoX: start.x + deltaX * 0.72 + perpendicularX * bend * 0.55,
        controlTwoY: start.y + deltaY * 0.72 + perpendicularY * bend * 0.55,
        targetX,
        targetY,
        releaseDelay,
        phase: random(seed * 6.41) * Math.PI * 2,
        size: 0.78 + random(seed * 7.29) * 1.05,
        sage: index % 43 === 0,
      });
    }
  }

  function flutePosition(along, offset) {
    const startX = -0.035 * width;
    const endX = 0.94 * width;
    const centerX = startX + along * (endX - startX);
    const centerY = 0.79 * height + along * (0.58 * height - 0.79 * height);
    return {
      x: centerX - offset * 0.21,
      y: centerY + offset * 0.98,
    };
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    const seconds = reducedMotion.matches ? 0 : time * 0.001;
    const goldPath = new Path2D();
    const lightPath = new Path2D();
    const sagePath = new Path2D();
    const scatter = scrollProgress;

    for (const particle of particles) {
      const localProgress = reducedMotion.matches
        ? 0
        : smooth((scrollProgress - particle.releaseDelay) / 0.4);
      const x = bezier(particle.startX, particle.controlOneX, particle.controlTwoX, particle.targetX, localProgress)
        + Math.sin(seconds * 0.45 + particle.phase) * localProgress * 0.7;
      const y = bezier(particle.startY, particle.controlOneY, particle.controlTwoY, particle.targetY, localProgress)
        + Math.cos(seconds * 0.42 + particle.phase) * localProgress * 0.7;
      const particlePath = particle.sage ? sagePath : particle.offset < -2 ? lightPath : goldPath;
      particlePath.moveTo(x + particle.size, y);
      particlePath.arc(x, y, particle.size, 0, Math.PI * 2);
    }

    context.globalAlpha = 0.85 + Math.sin(seconds * 0.55) * 0.012 - scatter * 0.08;
    context.fillStyle = 'rgb(217, 177, 101)';
    context.fill(goldPath);
    context.fillStyle = 'rgb(246, 224, 174)';
    context.fill(lightPath);
    context.fillStyle = 'rgb(169, 188, 142)';
    context.fill(sagePath);
    context.globalAlpha = 1;
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    makeParticles();
    draw(elapsed);
  }

  function updateScroll() {
    const bounds = hero.getBoundingClientRect();
    const travel = Math.max(1, bounds.height - window.innerHeight);
    targetScrollProgress = clamp(-bounds.top / travel, 0, 1);
    if (reducedMotion.matches) draw(elapsed);
    else if (visible && (scrollProgress < 1 || targetScrollProgress < 1) && !frame) frame = window.requestAnimationFrame(animate);
  }

  function animate(time) {
    frame = 0;
    elapsed = time;
    if (visible && !reducedMotion.matches) {
      const delta = lastFrameTime ? Math.min(time - lastFrameTime, 50) : 16.67;
      lastFrameTime = time;
      const remaining = targetScrollProgress - scrollProgress;
      scrollProgress += remaining * (1 - Math.exp(-delta / 180));
      if (Math.abs(remaining) < 0.0004) scrollProgress = targetScrollProgress;
      draw(time);
      if (scrollProgress < 1 || targetScrollProgress < 1 || Math.abs(targetScrollProgress - scrollProgress) >= 0.0004) {
        frame = window.requestAnimationFrame(animate);
      }
    }
  }

  function setVisible(nextVisible) {
    visible = nextVisible;
    if (frame) window.cancelAnimationFrame(frame);
    if (visible && !reducedMotion.matches) {
      lastFrameTime = 0;
      frame = window.requestAnimationFrame(animate);
    }
    else draw(elapsed);
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', () => {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      resize();
      updateScroll();
    });
  }, { passive: true });
  reducedMotion.addEventListener?.('change', () => setVisible(visible));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => setVisible(entries[0].isIntersecting), { threshold: 0.02 }).observe(hero);
  } else {
    setVisible(true);
  }
  resize();
  updateScroll();
})();

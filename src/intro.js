const TAU = Math.PI * 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerpColor = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const rgba = (color, alpha) => `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha.toFixed(3)})`;

const THEMES = [
  // Emerald crown feather.
  [
    [0.0, [24, 52, 40]],
    [0.2, [34, 104, 78]],
    [0.42, [52, 138, 96]],
    [0.62, [86, 132, 76]],
    [0.82, [128, 118, 62]],
    [1.0, [104, 82, 48]],
  ],
  // Bronze / olive bird, warmer and quieter.
  [
    [0.0, [40, 48, 32]],
    [0.2, [78, 92, 48]],
    [0.42, [116, 122, 58]],
    [0.62, [150, 128, 66]],
    [0.82, [142, 106, 56]],
    [1.0, [96, 74, 44]],
  ],
  // Teal / indigo, the coolest of the three.
  [
    [0.0, [18, 40, 44]],
    [0.2, [26, 78, 84]],
    [0.42, [36, 112, 104]],
    [0.62, [62, 128, 92]],
    [0.82, [96, 116, 66]],
    [1.0, [84, 70, 46]],
  ],
];

function themeColor(stops, t) {
  for (let index = 1; index < stops.length; index += 1) {
    const [stop, color] = stops[index];
    const [prevStop, prevColor] = stops[index - 1];
    if (t <= stop) return lerpColor(prevColor, color, (t - prevStop) / (stop - prevStop));
  }
  return stops[stops.length - 1][1];
}

const LOCAL_LENGTH = 300;

// Every feather is generated as its own cloud of particles: no two share a
// silhouette, bend, eyespot, palette or barb spacing.
function makeFeather(seed, small) {
  const rand = mulberry32(seed * 7919 + 17);
  const widthScale = 0.6 + rand() * 0.85;
  const bend = (rand() - 0.5) * 1.5;
  const bendPhase = rand() * TAU;
  const eyeT = 0.09 + rand() * 0.15;
  const eyeSize = 0.62 + rand() * 0.55;
  const eyeSquash = 0.62 + rand() * 0.45;
  const eyeTilt = (rand() - 0.5) * 0.5;
  const theme = THEMES[Math.floor(rand() * THEMES.length)];
  const asym = 0.68 + rand() * 0.6;
  const ragged = 0.1 + rand() * 0.5;
  const quill = 0.8 + rand() * 0.14;
  const barbFreq = 46 + rand() * 40;
  const droopBase = 8 + rand() * 26;
  const density = small ? 0.68 : 1;

  const maxHalf = 46 * widthScale;
  const rachisX = (t) => bend * Math.pow(t, 1.35) * 62 + Math.sin(t * 3.1 + bendPhase) * 5;
  const halfAt = (t) => {
    if (t <= 0 || t >= quill) return 0;
    const profile = Math.pow(Math.sin((t / quill) * Math.PI), 0.72);
    return maxHalf * profile;
  };
  const localY = (t) => (t - 0.5) * LOCAL_LENGTH;

  const points = [];
  const add = (x, y, css, size, t) => {
    points.push({ x, y, css, s: size, t });
  };

  // Vane: rows of particles fanning away from the rachis, striped like barbs.
  const rows = Math.round(66 * density);
  for (let row = 0; row < rows; row += 1) {
    const t = ((row + rand() * 0.9) / rows) * quill;
    const half = halfAt(t);
    if (half < 2) continue;
    const notch = 1 - (rand() < ragged * 0.35 ? 0.25 + rand() * 0.4 : 0);
    for (let side = -1; side <= 1; side += 2) {
      const reach = half * (side < 0 ? 1 : asym) * notch;
      const across = Math.max(1, Math.round(reach / (small ? 8.4 : 6.2)));
      for (let step = 0; step < across; step += 1) {
        const u = (step + rand() * 0.95) / across;
        const x = rachisX(t) + side * reach * u;
        const droop = droopBase * u * (0.4 + t);
        const y = localY(t) + droop + (rand() - 0.5) * 2.4;
        const stripe = 0.72 + 0.28 * Math.sin((t * barbFreq + u * 2.6) * Math.PI);
        const base = themeColor(theme, clamp(t / quill + (rand() - 0.5) * 0.06, 0, 1));
        const color = [base[0] * stripe, base[1] * stripe, base[2] * stripe].map(Math.round);
        const alpha = (0.2 + rand() * 0.42) * (1 - u * 0.35);
        add(x, y, rgba(color, alpha), 1.5 + rand() * 1.3, t);
      }
    }
  }

  // Eyespot: bronze rim, emerald band, indigo heart, gold pupil.
  const eyeX = rachisX(eyeT);
  const eyeY = localY(eyeT);
  const eyeRx = Math.max(9, halfAt(eyeT) * 1.05) * eyeSize;
  const eyeRy = eyeRx * eyeSquash * 1.5;
  const eyeCount = Math.round(96 * density);
  const cosTilt = Math.cos(eyeTilt);
  const sinTilt = Math.sin(eyeTilt);
  for (let index = 0; index < eyeCount; index += 1) {
    const angle = rand() * TAU;
    const r = Math.sqrt(rand());
    const px = Math.cos(angle) * eyeRx * r;
    const py = Math.sin(angle) * eyeRy * r;
    let color;
    if (r > 0.88) color = [166, 138, 74];
    else if (r > 0.68) color = lerpColor([196, 158, 84], [58, 138, 96], (0.88 - r) / 0.2);
    else if (r > 0.42) color = lerpColor([44, 122, 104], [26, 62, 82], (0.68 - r) / 0.26);
    else if (r > 0.2) color = [22 + rand() * 12, 34 + rand() * 14, 62 + rand() * 20];
    else color = [226, 190, 116];
    add(
      eyeX + px * cosTilt - py * sinTilt,
      eyeY + px * sinTilt + py * cosTilt,
      rgba(color, 0.34 + rand() * 0.45),
      1.6 + rand() * 1.4,
      eyeT,
    );
  }

  // Rachis: a lit spine running past the vane into the bare quill.
  const spineCount = Math.round(52 * density);
  for (let index = 0; index < spineCount; index += 1) {
    const t = (index / spineCount) * 1.04;
    add(
      rachisX(t) + (rand() - 0.5) * 1.2,
      localY(t),
      rgba(t > quill ? [186, 158, 104] : [214, 186, 128], 0.3 + rand() * 0.4),
      1.3 + rand() * 0.9,
      t,
    );
  }

  // Fluff at the base of the vane.
  const fluffCount = Math.round(30 * density);
  for (let index = 0; index < fluffCount; index += 1) {
    const t = quill * (0.82 + rand() * 0.3);
    const side = rand() < 0.5 ? -1 : 1;
    add(
      rachisX(t) + side * (2 + rand() * 20),
      localY(t) + rand() * 12,
      rgba([132 + rand() * 40, 108 + rand() * 26, 74 + rand() * 20], 0.12 + rand() * 0.2),
      1 + rand() * 1.1,
      t,
    );
  }

  return points;
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
  const minDuration = reduced ? 700 : 3000;

  let width = 1;
  let height = 1;
  let dpr = 1;
  let feathers = [];
  let gusts = [];
  let motes = [];
  let frame = 0;
  let exiting = false;

  function build() {
    const small = width < 700;
    // Enough birds to feel like a flock crossing the room, spaced by depth so
    // the frame never turns into a wall of feathers.
    const count = small ? 12 : 24;
    const columns = small ? 3 : 6;

    feathers = Array.from({ length: count }, (_, index) => {
      const rand = mulberry32(index * 331 + 29);
      const depth = rand();
      const column = index % columns;
      const row = Math.floor(index / columns);
      return {
        points: makeFeather(index + 3, small),
        x: ((column + rand() * 0.85) / columns) * (width + 500) - 250,
        y: ((row + rand() * 0.8) / Math.ceil(count / columns)) * (height + 160) - 80,
        size: (small ? 96 : 150) + rand() * (small ? 110 : 190) * (0.55 + depth * 0.7),
        speed: 22 + rand() * 46 + depth * 22,
        fall: 3 + rand() * 12,
        amp: 18 + rand() * 52,
        freq: 0.0016 + rand() * 0.0034,
        phase: rand() * TAU,
        rotation: (rand() - 0.5) * 1.7,
        spin: (rand() - 0.5) * 0.22,
        sway: 0.12 + rand() * 0.26,
        flex: 3 + rand() * 9,
        flutter: 1.1 + rand() * 1.8,
        alpha: 0.42 + rand() * 0.45,
        depth,
      };
    }).sort((a, b) => a.depth - b.depth);

    motes = Array.from({ length: small ? 34 : 64 }, (_, index) => {
      const rand = mulberry32(index * 913 + 5);
      return {
        x: rand() * (width + 80) - 40,
        y: height * (0.06 + rand() * 0.88),
        speed: 26 + rand() * 70,
        amp: 5 + rand() * 16,
        size: 0.7 + rand() * 1.3,
        alpha: 0.07 + rand() * 0.14,
        phase: rand() * TAU,
        gold: rand() > 0.4,
      };
    });

    gusts = Array.from({ length: 5 }, (_, index) => {
      const rand = mulberry32(index * 571 + 11);
      return {
        y: height * (0.14 + index * 0.18),
        amp: 14 + rand() * 28,
        phase: rand() * TAU,
        speed: 0.1 + rand() * 0.16,
        alpha: 0.03 + rand() * 0.045,
      };
    });
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
    ctx.save();
    ctx.setLineDash([3, 18]);
    ctx.lineDashOffset = -time * 26;
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
    ctx.restore();
  }

  function drawMotes(time) {
    if (!ctx) return;
    const span = width + 80;
    for (const mote of motes) {
      const x = (((mote.x + mote.speed * time + 40) % span) + span) % span - 40;
      const y = mote.y + Math.sin(time * 0.7 + mote.phase) * mote.amp;
      const alpha = mote.alpha * (0.55 + 0.45 * Math.sin(time * 0.9 + mote.phase * 2));
      if (alpha <= 0.01) continue;
      ctx.fillStyle = mote.gold
        ? `rgba(226, 197, 138, ${alpha})`
        : `rgba(190, 208, 172, ${alpha})`;
      ctx.fillRect(x, y, mote.size, mote.size);
    }
  }

  function drawFeather(feather, time) {
    const margin = 300;
    const span = width + margin * 2;
    const x = (((feather.x + feather.speed * time + margin) % span) + span) % span - margin;
    const vertical = height + 260;
    const y =
      ((((feather.y + feather.fall * time + 130) % vertical) + vertical) % vertical - 130) +
      Math.sin(x * feather.freq + feather.phase) * feather.amp +
      Math.sin(time * 0.45 + feather.phase) * 8;
    const rotation =
      feather.rotation +
      Math.sin(time * 0.4 + feather.phase) * feather.sway +
      feather.spin * time;
    const scale = (feather.size / LOCAL_LENGTH) * (0.8 + feather.depth * 0.35);
    const alpha = clamp(
      feather.alpha * (0.78 + 0.22 * Math.sin(time * 0.6 + feather.phase)) * (0.6 + feather.depth * 0.4),
      0,
      1,
    );
    if (alpha <= 0.02) return;

    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    ctx.globalAlpha = alpha;
    for (const point of feather.points) {
      const wave =
        Math.sin(time * feather.flutter + point.t * 4.5 + feather.phase) *
        feather.flex *
        (0.25 + point.t);
      const lx = (point.x + wave) * scale;
      const ly = point.y * scale;
      ctx.fillStyle = point.css;
      const size = point.s * scale;
      ctx.fillRect(x + lx * cos - ly * sin, y + lx * sin + ly * cos, size, size);
    }
  }

  function draw(time) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    drawWind(time);
    ctx.globalAlpha = 1;
    for (const feather of feathers) drawFeather(feather, time);
    ctx.globalAlpha = 1;
    drawMotes(time);
  }

  if (import.meta.env.DEV) {
    window.__intro = {
      canvas,
      draw,
      get feathers() {
        return feathers;
      },
    };
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
  window.setTimeout(finish, reduced ? 1600 : 6000);

  if (!reduced) frame = requestAnimationFrame(loop);
}

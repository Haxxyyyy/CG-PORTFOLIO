const TAU = Math.PI * 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => {
  const v = clamp(t, 0, 1);
  return v * v * (3 - 2 * v);
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cubic = (a, b, c, d, t) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

const cubicTangent = (a, b, c, d, t) => {
  const u = 1 - t;
  return 3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c);
};

// Alpha is baked into cached swatches so the per-frame loop never builds strings.
const PALETTE = [
  'rgba(43, 33, 22, ',   // bark
  'rgba(63, 91, 49, ',    // moss
  'rgba(111, 138, 76, ',  // moss light
  'rgba(217, 177, 101, ', // gold
  'rgba(242, 238, 225, ', // ivory
  'rgba(18, 32, 23, ',    // deep green
  'rgba(122, 86, 40, ',   // flute mid wood
  'rgba(217, 169, 95, ',  // flute light wood
];
const STEPS = 18;
const SWATCH = PALETTE.map((base) =>
  Array.from({ length: STEPS + 1 }, (_, step) => `${base}${(step / STEPS).toFixed(3)})`),
);

const GLYPH_CHARS = ['\u266A', '\u266B', '\u266C', '\u2669'];

function makeGlyph(char, rand) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '104px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(char, size / 2, size / 2 + 6);

  const data = ctx.getImageData(0, 0, size, size).data;
  const points = [];
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      if (data[(y * size + x) * 4 + 3] > 120) {
        points.push([(x - size / 2) / size, (y - size / 2) / size]);
      }
    }
  }
  const target = 42;
  if (points.length <= target) return points;
  const thinned = [];
  const stride = points.length / target;
  for (let index = 0; index < target; index += 1) {
    const jitter = Math.floor(rand() * Math.max(1, stride));
    thinned.push(points[Math.min(points.length - 1, Math.floor(index * stride) + jitter)]);
  }
  return thinned;
}

export function createScene(canvas, { reduced = false, mode = 'hero' } = {}) {
  const ctx = canvas?.getContext('2d');
  const host = canvas?.parentElement;
  if (!ctx || !host) return null;

  const isOutro = mode === 'outro';
  const withFlute = !isOutro;
  const withNotes = !isOutro;

  const state = {
    w: 1,
    h: 1,
    dpr: 1,
    progress: 0,
    time: 0,
    running: false,
    visible: true,
    frame: 0,
  };

  let field = [];
  let fluteField = [];
  let grass = [];
  let motes = [];
  let drifters = [];
  let notes = [];
  let emitters = [];
  let glyphs = [];
  let small = false;
  let fluteIndex = 0;
  let lastTime = 0;
  let emitClock = 0;
  let glyphTimer = 0;

  const halton = (index, base) => {
    let fraction = 1;
    let result = 0;
    let n = index;
    while (n > 0) {
      fraction /= base;
      result += fraction * (n % base);
      n = Math.floor(n / base);
    }
    return result;
  };

  function buildGlyphs() {
    if (glyphs.length) return;
    const rand = mulberry32(7);
    glyphs = GLYPH_CHARS.map((char) => makeGlyph(char, rand)).filter((points) => points.length > 6);
  }

  function gauss(rand) {
    return (rand() + rand() + rand() - 1.5) / 1.5;
  }

  function push(particle) {
    field.push(particle);
  }

  function pushFlute(particle, along) {
    particle.fi = fluteIndex;
    particle.ft = along;
    fluteIndex += 1;
    fluteField.push(particle);
  }

  function scatter(rand, angle, spread, minDistance, maxDistance) {
    const a = angle + (rand() - 0.5) * spread;
    const distance = minDistance + Math.pow(rand(), 1.35) * (maxDistance - minDistance);
    return [Math.cos(a) * distance, Math.sin(a) * distance];
  }

  // The flute disintegrates into a floating score: most particles travel curved
  // paths onto sampled music glyphs, the rest settle into a Halton-spread dust.
  function buildMorphTargets(rand) {
    if (!fluteField.length || !glyphs.length) return;
    const { w, h } = state;
    const minDim = Math.min(w, h);
    const spots = small
      ? [
          [0.46, 0.12, 0.42],
          [0.74, 0.27, 0.34],
          [0.88, 0.1, 0.26],
        ]
      : [
          [0.56, 0.2, 0.3],
          [0.7, 0.1, 0.22],
          [0.83, 0.27, 0.34],
          [0.65, 0.43, 0.2],
          [0.93, 0.14, 0.16],
        ];

    const targets = [];
    for (const [nx, ny, ns] of spots) {
      const glyph = glyphs[Math.floor(rand() * glyphs.length)];
      const scale = minDim * ns;
      const copies = Math.max(1, Math.round(190 / glyph.length));
      for (const [gx, gy] of glyph) {
        for (let copy = 0; copy < copies; copy += 1) {
          targets.push([
            nx * w + gx * scale + (rand() - 0.5) * 4,
            ny * h + gy * scale + (rand() - 0.5) * 4,
          ]);
        }
      }
    }
    for (let index = targets.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(rand() * (index + 1));
      [targets[index], targets[swap]] = [targets[swap], targets[index]];
    }

    let cursor = 0;
    for (const p of fluteField) {
      let tx;
      let ty;
      if (cursor < targets.length) {
        [tx, ty] = targets[cursor];
        cursor += 1;
      } else {
        tx = 24 + halton(p.fi + 1, 2) * (w - 48);
        ty = 24 + halton(p.fi + 1, 3) * (h * 0.8);
      }
      const dx = tx - p.x;
      const dy = ty - p.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const bend = (rand() - 0.5) * Math.min(170, distance * 0.32);
      const px = -dy / distance;
      const py = dx / distance;
      p.tx = tx;
      p.ty = ty;
      p.c1x = p.x + dx * 0.3 + px * bend;
      p.c1y = p.y + dy * 0.3 + py * bend;
      p.c2x = p.x + dx * 0.72 + px * bend * 0.45;
      p.c2y = p.y + dy * 0.72 + py * bend * 0.45;
      p.md = 0.06 + (1 - p.ft) * 0.22 + rand() * 0.08;
      p.mv = 0.36 + rand() * 0.16;
    }
  }

  function layout() {
    const rect = host.getBoundingClientRect();
    state.w = Math.max(1, rect.width);
    state.h = Math.max(1, rect.height);
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.7);
    canvas.width = Math.round(state.w * state.dpr);
    canvas.height = Math.round(state.h * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    const w = state.w;
    const h = state.h;
    small = w < 720;
    const diag = Math.hypot(w, h);
    const rand = mulberry32(0x51ed270b);

    field = [];
    fluteField = [];
    fluteIndex = 0;
    grass = [];
    motes = [];
    drifters = [];
    notes = [];
    emitters = [];

    /* ---- Bough: one mossy limb crossing the stage ---- */
    if (!isOutro) {
    const spine = [
      [-0.06 * w, 0.315 * h],
      [0.3 * w, 0.395 * h],
      [0.66 * w, 0.205 * h],
      [1.06 * w, 0.255 * h],
    ];

    const boughCount = small ? 1250 : 2300;
    for (let index = 0; index < boughCount; index += 1) {
      const t = Math.pow(rand(), 0.88);
      const bx = cubic(spine[0][0], spine[1][0], spine[2][0], spine[3][0], t);
      const by = cubic(spine[0][1], spine[1][1], spine[2][1], spine[3][1], t);
      const tx = cubicTangent(spine[0][0], spine[1][0], spine[2][0], spine[3][0], t);
      const ty = cubicTangent(spine[0][1], spine[1][1], spine[2][1], spine[3][1], t);
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;
      const thickness = lerp(small ? 20 : 27, 8, t) * (0.85 + rand() * 0.3);
      const off = gauss(rand) * thickness;
      const roll = rand();
      const color = roll < 0.5 ? 0 : roll < 0.79 ? 1 : roll < 0.92 ? 2 : 3;
      const [sx, sy] = scatter(rand, -Math.PI / 2, 1.5, 40, diag * 0.52);

      push({
        x: bx + nx * off,
        y: by + ny * off,
        sx,
        sy,
        d: 0.06 + t * 0.3 + rand() * 0.12,
        a: 0.28 + rand() * 0.52,
        c: color,
        s: 0.7 + rand() * 1.7,
        ph: rand() * TAU,
        sp: 0.35 + rand() * 0.9,
        wob: 0.5 + rand() * 1.1,
      });
    }

    // Twigs rising off the limb, each capped with a leaf cluster.
    const twigs = small ? 4 : 6;
    for (let index = 0; index < twigs; index += 1) {
      const t = 0.16 + (index / twigs) * 0.8 + rand() * 0.05;
      const tx0 = cubic(spine[0][0], spine[1][0], spine[2][0], spine[3][0], t);
      const ty0 = cubic(spine[0][1], spine[1][1], spine[2][1], spine[3][1], t);
      const dir = index % 2 === 0 ? -1 : 1;
      const length = (small ? 46 : 70) + rand() * (small ? 50 : 90);
      const cx = tx0 + dir * length * 0.55;
      const cy = ty0 - length * 0.62;
      const ex = tx0 + dir * length;
      const ey = ty0 - length * 1.05;

      for (let step = 0; step < 110; step += 1) {
        const u = rand();
        const px = quadratic(tx0, cx, ex, u);
        const py = quadratic(ty0, cy, ey, u);
        const off = gauss(rand) * lerp(3.4, 1.1, u);
        const [sx, sy] = scatter(rand, -Math.PI / 2, 1.4, 30, diag * 0.45);
        push({
          x: px + off,
          y: py + off * 0.6,
          sx,
          sy,
          d: 0.08 + rand() * 0.32,
          a: 0.3 + rand() * 0.45,
          c: rand() < 0.65 ? 0 : 1,
          s: 0.6 + rand() * 1.2,
          ph: rand() * TAU,
          sp: 0.4 + rand() * 0.7,
          wob: 0.4 + rand() * 0.8,
        });
      }

      const leaves = small ? 26 : 38;
      for (let step = 0; step < leaves; step += 1) {
        const [sx, sy] = scatter(rand, -Math.PI / 2, 1.4, 30, diag * 0.4);
        push({
          x: ex + gauss(rand) * 20,
          y: ey + gauss(rand) * 26,
          sx,
          sy,
          d: 0.07 + rand() * 0.3,
          a: 0.3 + rand() * 0.5,
          c: rand() < 0.6 ? 1 : rand() < 0.85 ? 2 : 4,
          s: 0.9 + rand() * 1.8,
          ph: rand() * TAU,
          sp: 0.35 + rand() * 0.6,
          wob: 0.6 + rand() * 1,
        });
      }
    }

    // Overgrowth along the top of the limb.
    const mossClusters = small ? 10 : 16;
    for (let index = 0; index < mossClusters; index += 1) {
      const t = 0.05 + rand() * 0.95;
      const bx = cubic(spine[0][0], spine[1][0], spine[2][0], spine[3][0], t);
      const by = cubic(spine[0][1], spine[1][1], spine[2][1], spine[3][1], t) - (small ? 10 : 16);
      for (let step = 0; step < 26; step += 1) {
        const [sx, sy] = scatter(rand, -Math.PI / 2, 1.2, 30, diag * 0.42);
        push({
          x: bx + gauss(rand) * (small ? 26 : 40),
          y: by + gauss(rand) * 14,
          sx,
          sy,
          d: 0.05 + rand() * 0.3,
          a: 0.22 + rand() * 0.48,
          c: rand() < 0.5 ? 1 : rand() < 0.85 ? 2 : 3,
          s: 0.8 + rand() * 1.6,
          ph: rand() * TAU,
          sp: 0.5 + rand() * 0.9,
          wob: 0.5 + rand() * 1.1,
        });
      }
    }

    /* ---- Hanging vines ---- */
    const vines = small ? 5 : 8;
    for (let index = 0; index < vines; index += 1) {
      const t = 0.12 + rand() * 0.86;
      const bx = cubic(spine[0][0], spine[1][0], spine[2][0], spine[3][0], t);
      const by = cubic(spine[0][1], spine[1][1], spine[2][1], spine[3][1], t) + 6;
      const length = (small ? 70 : 110) + rand() * (small ? 120 : 250);
      const lean = (rand() - 0.5) * (small ? 40 : 70);
      const phase = rand() * TAU;
      const steps = Math.max(8, Math.round(length / 7));

      for (let step = 0; step <= steps; step += 1) {
        const u = step / steps;
        const sway = Math.sin(state.progress * 0.4 + phase + u * 2.2) * u * 4;
        const x = bx + lean * u * u + sway;
        const y = by + length * u;
        const [sx, sy] = scatter(rand, -Math.PI / 2, 1.8, 24, diag * 0.38);
        push({
          x,
          y,
          sx,
          sy,
          d: 0.04 + rand() * 0.34,
          a: 0.26 + rand() * 0.4,
          c: rand() < 0.55 ? 1 : rand() < 0.85 ? 2 : 5,
          s: 0.6 + rand() * 1.1,
          ph: phase + u * 3.1 + rand() * 0.5,
          sp: 0.55 + rand() * 0.75,
          wob: 0.6 + u * 3.4,
        });

        if (step % 3 === 0) {
          for (let side = 0; side < 2; side += 1) {
            const dir = side === 0 ? -1 : 1;
            const [lsx, lsy] = scatter(rand, -Math.PI / 2, 1.6, 24, diag * 0.38);
            push({
              x: x + dir * (3 + rand() * 6),
              y: y + 2 + rand() * 3,
              sx: lsx,
              sy: lsy,
              d: 0.04 + rand() * 0.34,
              a: 0.24 + rand() * 0.36,
              c: rand() < 0.7 ? 1 : 2,
              s: 0.9 + rand() * 1.4,
              ph: rand() * TAU,
              sp: 0.6 + rand() * 0.8,
              wob: 0.8 + u * 3,
            });
          }
        }
      }
    }
    }

    /* ---- Bansuri: a tube of dust between bough and grass ---- */
    if (withFlute) {
      const x0 = small ? 0.02 * w : 0.42 * w;
      const y0 = small ? 0.705 * h : 0.7 * h;
      const x1 = small ? 0.97 * w : 0.985 * w;
      const y1 = small ? 0.625 * h : 0.61 * h;
      const length = Math.hypot(x1 - x0, y1 - y0);
      const angle = Math.atan2(y1 - y0, x1 - x0);
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      const radius = clamp(length * 0.021, 7, 15);

      const pointAt = (t, off = 0) => ({
        x: x0 + (x1 - x0) * t + nx * off,
        y: y0 + (y1 - y0) * t + ny * off,
      });

      const radiusAt = (t) => {
        const swell = 1 - Math.abs(t - 0.46) * 0.55;
        const endTaper = t < 0.045 || t > 0.965 ? 0.72 : 1;
        return radius * swell * endTaper;
      };

      const tubeCount = small ? 760 : 1250;
      for (let index = 0; index < tubeCount; index += 1) {
        const t = rand();
        const r = radiusAt(t);
        const off = gauss(rand) * r;
        const p = pointAt(t, off);
        const roll = rand();
        const color = roll < 0.44 ? 0 : roll < 0.68 ? 6 : roll < 0.82 ? 7 : roll < 0.92 ? 3 : 4;
        pushFlute({
          x: p.x,
          y: p.y,
          a: 0.3 + rand() * 0.58,
          c: color,
          s: 0.7 + rand() * 1.5,
          ph: rand() * TAU,
          sp: 0.5 + rand() * 1,
          wob: 0.7 + rand() * 1.3,
        }, t);
      }

      for (let index = 0; index < (small ? 80 : 130); index += 1) {
        const t = rand();
        const side = rand() < 0.5 ? -1 : 1;
        const p = pointAt(t, radiusAt(t) * side * 0.94);
        pushFlute({
          x: p.x,
          y: p.y,
          a: 0.4 + rand() * 0.5,
          c: rand() < 0.6 ? 7 : 3,
          s: 0.8 + rand() * 1.3,
          ph: rand() * TAU,
          sp: 0.6 + rand() * 0.9,
          wob: 0.6 + rand() * 1,
        }, t);
      }

      // Finger holes: dark mouths ringed with a thin gold lip.
      const holeT = [0.36, 0.43, 0.5, 0.57, 0.64, 0.71, 0.78];
      for (const t of holeT) {
        const center = pointAt(t, -radiusAt(t) * 0.45);
        for (let index = 0; index < 16; index += 1) {
          const a = (index / 16) * TAU;
          pushFlute({
            x: center.x + Math.cos(a) * radius * 0.5,
            y: center.y + Math.sin(a) * radius * 0.42,
            a: 0.5 + rand() * 0.4,
            c: index % 3 === 0 ? 3 : 5,
            s: 0.7 + rand() * 0.9,
            ph: rand() * TAU,
            sp: 0.8 + rand() * 1.2,
            wob: 0.5 + rand() * 1.2,
          }, t);
        }
        emitters.push({ x: center.x, y: center.y - 4 });
      }

      // Mouth hole and binding bands.
      const mouth = pointAt(0.14, -radius * 0.42);
      for (let index = 0; index < 18; index += 1) {
        const a = (index / 18) * TAU;
        pushFlute({
          x: mouth.x + Math.cos(a) * radius * 0.55,
          y: mouth.y + Math.sin(a) * radius * 0.4,
          a: 0.55,
          c: 5,
          s: 0.9,
          ph: rand() * TAU,
          sp: 0.9,
          wob: 0.4,
        }, 0.14);
      }
      for (const t of [0.052, 0.088]) {
        const band = pointAt(t, 0);
        for (let index = 0; index < 22; index += 1) {
          const off = lerp(-radiusAt(t), radiusAt(t), index / 21);
          pushFlute({
            x: band.x + nx * off,
            y: band.y + ny * off,
            a: 0.55 + rand() * 0.3,
            c: index % 2 === 0 ? 3 : 0,
            s: 1.1,
            ph: rand() * TAU,
            sp: 1.1,
            wob: 0.3,
          }, t);
        }
      }

      if (!glyphs.length) buildGlyphs();
      buildMorphTargets(rand);
    }

    /* ---- Grass bank ---- */
    const bladeCount = small ? 64 : 108;
    for (let index = 0; index < bladeCount; index += 1) {
      const x = (index / bladeCount) * w + (rand() - 0.5) * 26;
      const base = h * (0.955 + rand() * 0.045);
      const height = h * (0.02 + rand() * 0.065) * (small ? 0.85 : 1);
      const lean = (rand() - 0.5) * 52;
      const phase = rand() * TAU;
      const steps = 10;
      const color = rand() < 0.55 ? 5 : rand() < 0.85 ? 1 : 2;
      for (let step = 0; step < steps; step += 1) {
        const u = step / steps;
        const [sx, sy] = scatter(rand, -Math.PI / 2, 1, 30, diag * 0.32);
        grass.push({
          x: x + lean * u * u,
          y: base - height * u,
          sx,
          sy,
          d: 0.22 + rand() * 0.24,
          a: 0.3 + rand() * 0.4,
          c: color,
          s: 0.8 + rand() * 1.1,
          ph: phase + u,
          sp: 0.6 + rand() * 0.8,
          wob: 0.8 + u * 3.2,
        });
      }
    }

    // Bank shadow under the blades.
    const bank = ctx.createLinearGradient(0, h * 0.88, 0, h);
    bank.addColorStop(0, 'rgba(6, 14, 10, 0)');
    bank.addColorStop(0.55, 'rgba(6, 14, 10, 0.72)');
    bank.addColorStop(1, '#050d0a');
    state.bank = bank;
    state.radius = withFlute ? clamp(Math.hypot(w, h) * 0.012, 8, 15) : 12;

    /* ---- Ambient spores ---- */
    const moteCount = small ? 50 : 90;
    for (let index = 0; index < moteCount; index += 1) {
      motes.push({
        x: rand() * w,
        y: rand() * h * 0.92,
        s: 0.5 + rand() * 1.1,
        a: 0.1 + rand() * 0.28,
        ph: rand() * TAU,
        sp: 0.15 + rand() * 0.4,
        drift: 4 + rand() * 12,
      });
    }

    // Farewell: a handful of quiet glyphs rising through warm light.
    if (isOutro) {
      if (!glyphs.length) buildGlyphs();
      for (let index = 0; index < (small ? 7 : 12); index += 1) {
        const glyph = glyphs[Math.floor(rand() * glyphs.length)];
        if (!glyph) continue;
        const colorRoll = rand();
        drifters.push({
          glyph,
          x: 0.08 * w + rand() * 0.84 * w,
          y: h * (0.25 + rand() * 0.68),
          rise: 5 + rand() * 9,
          sway: 8 + rand() * 18,
          scale: (small ? 16 : 22) + rand() * (small ? 10 : 16),
          alpha: 0.14 + rand() * 0.2,
          dot: 1 + rand() * 0.8,
          ph: rand() * TAU,
          rot: (rand() - 0.5) * 0.4,
          c: colorRoll < 0.6 ? 3 : colorRoll < 0.86 ? 4 : 2,
        });
      }
    }

    if (reduced) draw(0);
  }

  function quadratic(a, b, c, t) {
    const u = 1 - t;
    return u * u * a + 2 * u * t * b + t * t * c;
  }

  function drawMotes(time, alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (const mote of motes) {
      const x = (mote.x + time * mote.drift + Math.sin(time * 0.3 + mote.ph) * 14) % (state.w + 40) - 20;
      const y = mote.y + Math.cos(time * mote.sp + mote.ph) * 12;
      const a = mote.a * (0.6 + 0.4 * Math.sin(time * mote.sp * 2 + mote.ph));
      ctx.fillStyle = SWATCH[3][Math.min(STEPS, Math.round(a * STEPS))];
      ctx.fillRect(x, y, mote.s, mote.s);
    }
    ctx.restore();
  }

  function drawField(time, progress) {
    const { w, h, dpr } = state;
    const swirl = progress * 0.02;

    for (let index = 0; index < field.length; index += 1) {
      const p = field[index];
      let local = 0;
      if (progress > p.d) local = smoothstep(clamp((progress - p.d) / 0.42, 0, 1));

      const wob = Math.sin(time * p.sp + p.ph) * p.wob * (1 + local * 2.4);
      const x = p.x + p.sx * local + wob + Math.sin(p.y * swirl + time * 0.4) * local * 10;
      const y = p.y + p.sy * local + Math.cos(time * p.sp * 0.9 + p.ph) * p.wob * 0.7;
      if (x < -40 || x > w + 40 || y < -40 || y > h + 40) continue;

      const shimmer = 0.8 + 0.2 * Math.sin(time * p.sp * 1.8 + p.ph * 2);
      const alpha = clamp(p.a * shimmer * (1 - local), 0, 1);
      if (alpha < 0.02) continue;

      const step = Math.min(STEPS, Math.max(0, Math.round(alpha * STEPS)));
      ctx.fillStyle = SWATCH[p.c][step];
      const s = p.s * (1 - local * 0.45);
      ctx.fillRect(x, y, s, s);
    }
  }

  function drawFluteField(time, progress) {
    if (!fluteField.length) return;
    const fade = 1 - smoothstep(clamp((progress - 0.78) / 0.22, 0, 1));
    if (fade <= 0.01) return;

    for (let index = 0; index < fluteField.length; index += 1) {
      const p = fluteField[index];
      const local = progress > p.md ? smoothstep(clamp((progress - p.md) / p.mv, 0, 1)) : 0;
      const settle = 1 - local * 0.82;
      const wob = Math.sin(time * p.sp + p.ph) * p.wob * settle;
      const wobY = Math.cos(time * p.sp * 0.85 + p.ph) * p.wob * 0.7 * settle;
      const x = (local > 0 ? cubic(p.x, p.c1x, p.c2x, p.tx, local) : p.x) + wob;
      const y = (local > 0 ? cubic(p.y, p.c1y, p.c2y, p.ty, local) : p.y) + wobY;

      const shimmer = 0.82 + 0.18 * Math.sin(time * p.sp * 1.7 + p.ph * 2);
      const alpha = clamp(p.a * shimmer * fade, 0, 1);
      if (alpha < 0.02) continue;

      const step = Math.min(STEPS, Math.max(0, Math.round(alpha * STEPS)));
      ctx.fillStyle = SWATCH[p.c][step];
      const size = p.s * (1 + local * 0.35);
      ctx.fillRect(x, y, size, size);
    }
  }

  function drawGlow(time, progress, alpha) {
    if (!withFlute || alpha <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let index = 0; index < emitters.length; index += 1) {
      const hole = emitters[index];
      const pulse = 0.5 + Math.sin(time * 1.3 + index * 0.9) * 0.5;
      const r = state.radius * (2.6 + pulse * 2.2);
      const glow = ctx.createRadialGradient(hole.x, hole.y, 0, hole.x, hole.y, r);
      glow.addColorStop(0, `rgba(240, 213, 158, ${0.1 * alpha * (0.35 + pulse * 0.65)})`);
      glow.addColorStop(1, 'rgba(240, 213, 158, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function spawnNote() {
    if (!withNotes || !glyphs.length || !emitters.length) return;
    if (notes.length > (small ? 9 : 15)) return;
    const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
    const hole = emitters[Math.floor(Math.random() * emitters.length)];
    const scatterX = [];
    const scatterY = [];
    for (let index = 0; index < glyph.length; index += 1) {
      const angle = Math.random() * TAU;
      const distance = 10 + Math.random() * 34;
      scatterX.push(Math.cos(angle) * distance);
      scatterY.push(Math.sin(angle) * distance - 8);
    }
    const palette = Math.random();
    notes.push({
      glyph,
      x: hole.x,
      y: hole.y,
      vx: 12 + Math.random() * 20,
      vy: -(24 + Math.random() * 26),
      scale: (small ? 15 : 18) + Math.random() * (small ? 8 : 11),
      rot: (Math.random() - 0.5) * 0.4,
      spin: (Math.random() - 0.5) * 0.7,
      phase: Math.random() * TAU,
      life: 0,
      dur: 6 + Math.random() * 3,
      dot: 1.3 + Math.random() * 0.9,
      css: palette < 0.6 ? 'rgba(234, 202, 138, 0.9)' : palette < 0.86 ? 'rgba(242, 238, 225, 0.85)' : 'rgba(169, 188, 142, 0.85)',
      scatterX,
      scatterY,
    });
  }

  function updateNotes(dt) {
    if (!withNotes) return;
    emitClock += dt;
    if (emitClock > 0.52 && state.progress < 0.35) {
      emitClock = 0;
      spawnNote();
    }
    for (let index = notes.length - 1; index >= 0; index -= 1) {
      const note = notes[index];
      note.life += dt;
      if (note.life > note.dur) {
        notes.splice(index, 1);
        continue;
      }
      note.x += (note.vx + Math.sin(note.life * 1.1 + note.phase) * 10) * dt;
      note.y += note.vy * dt;
      note.rot += note.spin * dt;
    }
  }

  function drawNotes(progress) {
    if (!notes.length) return;
    ctx.save();
    for (const note of notes) {
      const appear = smoothstep(clamp(note.life / 0.5, 0, 1));
      const leave = smoothstep(clamp((note.life - (note.dur - 1.8)) / 1.8, 0, 1));
      const scroll = smoothstep(clamp(progress * 1.6, 0, 1));
      const alpha = appear * (1 - leave) * (1 - scroll);
      if (alpha <= 0.02) continue;
      const drift = leave * leave + scroll * scroll * 3;
      const cos = Math.cos(note.rot);
      const sin = Math.sin(note.rot);
      const scale = note.scale;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = note.css;
      const ox = Math.sin(note.life * 0.7 + note.phase) * 6;
      for (let index = 0; index < note.glyph.length; index += 1) {
        const [gx, gy] = note.glyph[index];
        const px = (gx * cos - gy * sin) * scale + note.scatterX[index] * drift + ox;
        const py = (gx * sin + gy * cos) * scale + note.scatterY[index] * drift;
        ctx.fillRect(note.x + px, note.y + py, note.dot, note.dot);
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawDrifters(time) {
    if (!drifters.length) return;
    const { w, h } = state;
    const range = h * 0.72;
    for (const d of drifters) {
      let y = (d.y - 30 - time * d.rise) % range;
      y = ((y % range) + range) % range + 30;
      const x = d.x + Math.sin(time * 0.3 + d.ph) * d.sway + Math.sin(time * 0.13 + d.ph * 2) * 12;
      const alpha = d.alpha * (0.65 + 0.35 * Math.sin(time * 0.4 + d.ph * 2));
      if (alpha < 0.02 || x < -40 || x > w + 40) continue;
      const step = Math.min(STEPS, Math.max(0, Math.round(alpha * STEPS)));
      ctx.fillStyle = SWATCH[d.c][step];
      const cos = Math.cos(d.rot + Math.sin(time * 0.2 + d.ph) * 0.12);
      const sin = Math.sin(d.rot + Math.sin(time * 0.2 + d.ph) * 0.12);
      for (const [gx, gy] of d.glyph) {
        ctx.fillRect(
          x + (gx * cos - gy * sin) * d.scale,
          y + (gx * sin + gy * cos) * d.scale,
          d.dot,
          d.dot,
        );
      }
    }
  }

  function drawGrass(time, progress) {
    const { w, h } = state;
    ctx.fillStyle = state.bank;
    ctx.fillRect(0, h * 0.88, w, h * 0.12);

    for (let index = 0; index < grass.length; index += 1) {
      const p = grass[index];
      let local = 0;
      if (progress > p.d) local = smoothstep(clamp((progress - p.d) / 0.4, 0, 1));
      const sway = Math.sin(time * 0.8 + p.ph) * p.wob * (1 + local * 2);
      const alpha = clamp(p.a * (0.8 + 0.2 * Math.sin(time * p.sp + p.ph)) * (1 - local), 0, 1);
      if (alpha < 0.02) continue;
      const step = Math.min(STEPS, Math.max(0, Math.round(alpha * STEPS)));
      ctx.fillStyle = SWATCH[p.c][step];
      ctx.fillRect(
        p.x + p.sx * local + sway,
        p.y + p.sy * local,
        p.s * (1 - local * 0.4),
        p.s,
      );
    }
  }

  function draw(time) {
    const { w, h, progress } = state;
    ctx.clearRect(0, 0, w, h);

    const zoom = 1 + progress * 0.05;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-w / 2, -h / 2);

    drawMotes(time, isOutro ? 1 : 1 - progress * 0.7);
    drawGlow(time, progress, clamp(1 - progress * 1.3, 0, 1));
    drawField(time, progress);
    drawFluteField(time, progress);
    drawDrifters(time);
    drawNotes(progress);
    drawGrass(time, progress);

    ctx.restore();
  }

  function loop(now) {
    if (!state.running) return;
    const seconds = now / 1000;
    const dt = lastTime ? Math.min(0.05, seconds - lastTime) : 0.016;
    lastTime = seconds;
    state.time = seconds;
    updateNotes(dt);
    draw(seconds);
    state.frame = requestAnimationFrame(loop);
  }

  function start() {
    if (reduced || state.running) return;
    state.running = true;
    lastTime = 0;
    state.frame = requestAnimationFrame(loop);
  }

  function stop() {
    state.running = false;
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
  }

  layout();
  start();

  glyphTimer = window.setTimeout(() => {
    if (glyphs.length) return;
    buildGlyphs();
    layout();
  }, 260);
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      window.clearTimeout(glyphTimer);
      glyphs = [];
      buildGlyphs();
      layout();
      if (reduced) draw(0);
    });
  }

  let resizeTimer = 0;
  window.addEventListener(
    'resize',
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        layout();
        if (reduced) draw(0);
      }, 140);
    },
    { passive: true },
  );

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        state.visible = entries[0].isIntersecting;
        if (state.visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0.01 },
    ).observe(host);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (state.visible) start();
  });

  return {
    setProgress(value) {
      state.progress = clamp(value, 0, 1);
    },
    render() {
      draw(state.time);
    },
    start,
    stop,
  };
}

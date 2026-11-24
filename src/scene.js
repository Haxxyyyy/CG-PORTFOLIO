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
  'rgba(7, 12, 9, ',      // bore / finger-hole shadow
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
  const target = 54;
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
  let bursts = [];
  let emitters = [];
  let glyphs = [];
  let pondShimmer = [];
  let pondLeaves = [];
  let ripples = [];
  let flowers = [];
  let ferns = [];
  const pondGeo = { cx: 0, cy: 0, rx: 0, ry: 0 };
  let small = false;
  let fluteIndex = 0;
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
          [0.4, 0.12, 0.42],
          [0.74, 0.28, 0.36],
          [0.9, 0.08, 0.26],
          [0.18, 0.32, 0.3],
        ]
      : [
          [0.5, 0.17, 0.32],
          [0.66, 0.08, 0.22],
          [0.83, 0.26, 0.36],
          [0.6, 0.45, 0.22],
          [0.94, 0.12, 0.17],
          [0.33, 0.32, 0.24],
          [0.78, 0.5, 0.26],
        ];

    const targets = [];
    for (const [nx, ny, ns] of spots) {
      const glyph = glyphs[Math.floor(rand() * glyphs.length)];
      const scale = minDim * ns;
      const tilt = (rand() - 0.5) * 0.7;
      const cos = Math.cos(tilt);
      const sin = Math.sin(tilt);
      const copies = Math.max(1, Math.round(320 / glyph.length));
      for (const [gx, gy] of glyph) {
        for (let copy = 0; copy < copies; copy += 1) {
          targets.push([
            nx * w + (gx * cos - gy * sin) * scale + (rand() - 0.5) * 4,
            ny * h + (gx * sin + gy * cos) * scale + (rand() - 0.5) * 4,
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
      p.md = 0.3 + (1 - p.ft) * 0.3 + rand() * 0.12;
      p.mv = 0.34 + rand() * 0.16;
    }
  }

  // The scroll burst: notes lift off the finger holes as the flute falls apart.
  function buildBursts(rand) {
    if (!withFlute || !emitters.length || !glyphs.length) return;
    const count = small ? 9 : 14;
    bursts = [];
    for (let index = 0; index < count; index += 1) {
      const origin = emitters[Math.floor(rand() * emitters.length)];
      const angle = -Math.PI / 2 + (rand() - 0.5) * 2.4;
      const distance = (90 + Math.pow(rand(), 1.2) * state.w * (small ? 0.4 : 0.5)) * (0.6 + rand() * 0.6);
      const micro = rand() < 0.28;
      const roll = rand();
      bursts.push({
        glyph: glyphs[Math.floor(rand() * glyphs.length)],
        ox: origin.x + (rand() - 0.5) * 24,
        oy: origin.y + (rand() - 0.5) * 16,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance - rand() * 90,
        lift: 50 + rand() * 160,
        delay: 0.26 + rand() * 0.34,
        dur: 0.5 + rand() * 0.3,
        scale: micro ? 16 + rand() * 12 : small ? 24 + rand() * 18 : 38 + rand() * 32,
        rot: (rand() - 0.5) * 0.9,
        spin: (rand() - 0.5) * 0.9,
        ph: rand() * TAU,
        c: roll < 0.62 ? 3 : roll < 0.86 ? 4 : 2,
        dot: 1.8 + rand() * 1.1,
      });
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
    emitters = [];
    pondShimmer = [];
    pondLeaves = [];
    ripples = [];
    flowers = [];
    ferns = [];

    /* ---- Boughs: a high limb left to right, a second from the bottom-left ---- */
    const spine = isOutro
      ? [
          [-0.1 * w, 0.58 * h],
          [0.28 * w, 0.66 * h],
          [0.66 * w, 0.58 * h],
          [1.1 * w, 0.64 * h],
        ]
      : [
          [-0.08 * w, 0.15 * h],
          [0.3 * w, 0.235 * h],
          [0.64 * w, 0.1 * h],
          [1.08 * w, 0.17 * h],
        ];
    const lowSpine = isOutro
      ? [
          [-0.12 * w, 1.06 * h],
          [0.1 * w, 1.0 * h],
          [0.4 * w, 0.985 * h],
          [0.72 * w, 1.04 * h],
        ]
      : [
          [-0.1 * w, 1.04 * h],
          [0.14 * w, 0.9 * h],
          [0.33 * w, 0.855 * h],
          [0.58 * w, 0.95 * h],
        ];

    const buildLimb = (points, count, baseThick, tipThick, mossClusters, twigs) => {
      for (let index = 0; index < count; index += 1) {
        const t = Math.pow(rand(), 0.88);
        const bx = cubic(points[0][0], points[1][0], points[2][0], points[3][0], t);
        const by = cubic(points[0][1], points[1][1], points[2][1], points[3][1], t);
        const tx = cubicTangent(points[0][0], points[1][0], points[2][0], points[3][0], t);
        const ty = cubicTangent(points[0][1], points[1][1], points[2][1], points[3][1], t);
        const len = Math.hypot(tx, ty) || 1;
        const nx = -ty / len;
        const ny = tx / len;
        const thickness = lerp(baseThick, tipThick, t) * (0.85 + rand() * 0.3);
        const off = gauss(rand) * thickness;
        const roll = rand();
        const color = roll < 0.46 ? 0 : roll < 0.74 ? 1 : roll < 0.9 ? 2 : 3;
        const [sx, sy] = scatter(rand, -Math.PI / 2, 1.5, 40, diag * 0.52);

        push({
          x: bx + nx * off,
          y: by + ny * off,
          sx,
          sy,
          d: 0.06 + t * 0.3 + rand() * 0.12,
          a: 0.3 + rand() * 0.54,
          c: color,
          s: 0.8 + rand() * 1.9,
          ph: rand() * TAU,
          sp: 0.35 + rand() * 0.9,
          wob: 0.5 + rand() * 1.1,
        });
      }

      // Twigs rising off the limb, each capped with a leaf cluster.
      for (let index = 0; index < twigs; index += 1) {
        const t = 0.16 + (index / Math.max(1, twigs)) * 0.8 + rand() * 0.05;
        const tx0 = cubic(points[0][0], points[1][0], points[2][0], points[3][0], t);
        const ty0 = cubic(points[0][1], points[1][1], points[2][1], points[3][1], t);
        const dir = index % 2 === 0 ? -1 : 1;
        const length = (small ? 46 : 74) + rand() * (small ? 50 : 100);
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

        const leaves = small ? 26 : 42;
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
      for (let index = 0; index < mossClusters; index += 1) {
        const t = 0.05 + rand() * 0.95;
        const bx = cubic(points[0][0], points[1][0], points[2][0], points[3][0], t);
        const by = cubic(points[0][1], points[1][1], points[2][1], points[3][1], t) - (small ? 10 : 16);
        for (let step = 0; step < 34; step += 1) {
          const [sx, sy] = scatter(rand, -Math.PI / 2, 1.2, 30, diag * 0.42);
          push({
            x: bx + gauss(rand) * (small ? 26 : 42),
            y: by + gauss(rand) * 15,
            sx,
            sy,
            d: 0.05 + rand() * 0.3,
            a: 0.24 + rand() * 0.5,
            c: rand() < 0.5 ? 1 : rand() < 0.85 ? 2 : 3,
            s: 0.8 + rand() * 1.7,
            ph: rand() * TAU,
            sp: 0.5 + rand() * 0.9,
            wob: 0.5 + rand() * 1.1,
          });
        }
      }

      // Tufts of grass growing straight out of the bark.
      const tufts = small ? 12 : 22;
      for (let index = 0; index < tufts; index += 1) {
        const t = 0.06 + rand() * 0.9;
        const bx = cubic(points[0][0], points[1][0], points[2][0], points[3][0], t);
        const by = cubic(points[0][1], points[1][1], points[2][1], points[3][1], t) - baseThick * 0.4;
        const blades = 2 + Math.floor(rand() * 3);
        for (let blade = 0; blade < blades; blade += 1) {
          const height = (small ? 14 : 22) + rand() * (small ? 22 : 40);
          const lean = (rand() - 0.5) * 30;
          const phase = rand() * TAU;
          const color = rand() < 0.5 ? 2 : rand() < 0.8 ? 1 : 4;
          for (let step = 0; step < 7; step += 1) {
            const u = step / 7;
            const [sx, sy] = scatter(rand, -Math.PI / 2, 1.3, 26, diag * 0.36);
            push({
              x: bx + lean * u * u + (rand() - 0.5) * 2,
              y: by - height * u,
              sx,
              sy,
              d: 0.06 + rand() * 0.3,
              a: 0.26 + rand() * 0.42,
              c: color,
              s: 0.7 + rand() * 1,
              ph: phase + u,
              sp: 0.6 + rand() * 0.7,
              wob: 0.6 + u * 3.4,
            });
          }
        }
      }
    };

    const density = isOutro ? 0.55 : 1;
    buildLimb(
      spine,
      Math.round((small ? 1900 : 3400) * density),
      small ? 26 : 36,
      11,
      Math.round((small ? 16 : 26) * density),
      Math.round((small ? 5 : 8) * density),
    );
    buildLimb(
      lowSpine,
      Math.round((small ? 620 : 1050) * density),
      small ? 18 : 24,
      6,
      Math.round((small ? 6 : 10) * density),
      Math.max(1, Math.round((small ? 1 : 2) * density)),
    );

    /* ---- Hanging vines ---- */
    const vines = Math.max(2, Math.round((small ? 7 : 12) * density));
    for (let index = 0; index < vines; index += 1) {
      const t = 0.12 + rand() * 0.86;
      const bx = cubic(spine[0][0], spine[1][0], spine[2][0], spine[3][0], t);
      const by = cubic(spine[0][1], spine[1][1], spine[2][1], spine[3][1], t) + 6;
      const right = t > 0.42;
      const length =
        (small ? 90 : 150) + rand() * (small ? 150 : 330) * (right ? 1 : 0.55);
      const lean = (rand() - 0.5) * (small ? 40 : 80);
      const phase = rand() * TAU;
      const steps = Math.max(10, Math.round(length / 6));

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

        if (step % 2 === 0) {
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

    /* ---- Bansuri: bore, embouchure, bindings, seven finger holes ---- */
    if (withFlute) {
      const x0 = small ? 0.02 * w : 0.42 * w;
      const y0 = small ? 0.72 * h : 0.715 * h;
      const x1 = small ? 0.98 * w : 0.99 * w;
      const y1 = small ? 0.62 * h : 0.60 * h;
      const length = Math.hypot(x1 - x0, y1 - y0);
      const angle = Math.atan2(y1 - y0, x1 - x0);
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      const radius = clamp(length * 0.024, 9, 19);

      const pointAt = (t, off = 0) => ({
        x: x0 + (x1 - x0) * t + nx * off,
        y: y0 + (y1 - y0) * t + ny * off,
      });

      const radiusAt = (t) => {
        const head = t < 0.06 ? lerp(0.78, 1, t / 0.06) : 1;
        const foot = t > 0.94 ? lerp(1, 0.86, (t - 0.94) / 0.06) : 1;
        const swell = 1 - Math.abs(t - 0.5) * 0.18;
        return radius * swell * head * foot;
      };

      const grain = (t) => 0.72 + 0.28 * Math.sin(t * 34 + Math.sin(t * 9) * 2);

      // Body: a filled cylinder, lit on the upper edge, shadowed underneath.
      const tubeCount = small ? 1050 : 2000;
      for (let index = 0; index < tubeCount; index += 1) {
        const t = rand();
        const r = radiusAt(t);
        const off = gauss(rand) * r * 0.9;
        const offN = off / r;
        const roll = rand();
        let color;
        if (offN < -0.55) color = roll < 0.5 ? 7 : 3;
        else if (offN > 0.68) color = 0;
        else if (roll < 0.34) color = 6;
        else if (roll < 0.62) color = 7;
        else if (roll < 0.86) color = 0;
        else color = 3;
        const p = pointAt(t, off);
        pushFlute({
          x: p.x,
          y: p.y,
          a: (0.34 + rand() * 0.5) * grain(t),
          c: color,
          s: 0.7 + rand() * 1.5,
          ph: rand() * TAU,
          sp: 0.5 + rand() * 1,
          wob: 0.7 + rand() * 1.3,
        }, t);
      }

      // Crisp lit silhouette on both edges.
      for (let index = 0; index < (small ? 150 : 260); index += 1) {
        const t = rand();
        const side = rand() < 0.5 ? -1 : 1;
        const p = pointAt(t, radiusAt(t) * side * 0.96);
        pushFlute({
          x: p.x,
          y: p.y,
          a: 0.42 + rand() * 0.46,
          c: rand() < 0.62 ? 7 : rand() < 0.8 ? 3 : 4,
          s: 0.8 + rand() * 1.3,
          ph: rand() * TAU,
          sp: 0.6 + rand() * 0.9,
          wob: 0.6 + rand() * 1,
        }, t);
      }

      // Bamboo nodes: thin dark collars across the barrel.
      for (const t of [0.3, 0.55, 0.8]) {
        const ring = pointAt(t, 0);
        for (let index = 0; index < 26; index += 1) {
          const off = lerp(-radiusAt(t) * 1.02, radiusAt(t) * 1.02, index / 25);
          pushFlute({
            x: ring.x + nx * off,
            y: ring.y + ny * off,
            a: 0.4 + rand() * 0.3,
            c: index % 2 === 0 ? 0 : 6,
            s: 1 + rand() * 0.8,
            ph: rand() * TAU,
            sp: 0.9,
            wob: 0.3,
          }, t);
        }
      }

      // Seven finger holes: dark well, gold lip, faint shadow above.
      const holeT = [0.36, 0.43, 0.5, 0.57, 0.64, 0.71, 0.78];
      for (const t of holeT) {
        const center = pointAt(t, -radiusAt(t) * 0.3);
        for (let index = 0; index < 12; index += 1) {
          const a = rand() * TAU;
          const rr = Math.sqrt(rand()) * radius * 0.3;
          pushFlute({
            x: center.x + Math.cos(a) * rr,
            y: center.y + Math.sin(a) * rr * 0.8,
            a: 0.7 + rand() * 0.3,
            c: 8,
            s: 1.1 + rand() * 0.9,
            ph: rand() * TAU,
            sp: 0.9,
            wob: 0.3,
          }, t);
        }
        for (let index = 0; index < 22; index += 1) {
          const a = (index / 22) * TAU;
          pushFlute({
            x: center.x + Math.cos(a) * radius * 0.62,
            y: center.y + Math.sin(a) * radius * 0.44,
            a: 0.5 + rand() * 0.4,
            c: index % 4 === 0 ? 7 : 3,
            s: 1 + rand() * 0.9,
            ph: rand() * TAU,
            sp: 1,
            wob: 0.4,
          }, t);
        }
        emitters.push({ x: center.x, y: center.y });
      }

      // Embouchure: lip plate with a dark breath hole.
      const mouth = pointAt(0.14, -radius * 0.16);
      for (let index = 0; index < 16; index += 1) {
        const a = rand() * TAU;
        const rr = Math.sqrt(rand()) * radius * 0.34;
        pushFlute({
          x: mouth.x + Math.cos(a) * rr,
          y: mouth.y + Math.sin(a) * rr * 0.7,
          a: 0.8,
          c: 8,
          s: 1.1 + rand() * 0.8,
          ph: rand() * TAU,
          sp: 0.9,
          wob: 0.3,
        }, 0.14);
      }
      for (let index = 0; index < 26; index += 1) {
        const a = (index / 26) * TAU;
        pushFlute({
          x: mouth.x + Math.cos(a) * radius * 1.02,
          y: mouth.y + Math.sin(a) * radius * 0.56,
          a: 0.55 + rand() * 0.35,
          c: index % 3 === 0 ? 3 : 7,
          s: 1 + rand() * 0.9,
          ph: rand() * TAU,
          sp: 1,
          wob: 0.35,
        }, 0.14);
      }
      emitters.push({ x: mouth.x, y: mouth.y });

      // Thread bindings: three wraps at the head, three at the foot.
      const bindings = [0.032, 0.05, 0.068, 0.932, 0.95, 0.968];
      for (let ring = 0; ring < bindings.length; ring += 1) {
        const t = bindings[ring];
        const band = pointAt(t, 0);
        const thread = ring % 2 === 0 ? 0 : 3;
        for (let index = 0; index < 30; index += 1) {
          const off = lerp(-radiusAt(t) * 1.04, radiusAt(t) * 1.04, index / 29);
          pushFlute({
            x: band.x + nx * off,
            y: band.y + ny * off,
            a: 0.6 + rand() * 0.3,
            c: index % 2 === 0 ? thread : 7,
            s: 1.2,
            ph: rand() * TAU,
            sp: 1.1,
            wob: 0.3,
          }, t);
        }
      }

      // Ends: sealed node at the head, open bore at the foot.
      for (const [t, open] of [[0.0, false], [1.0, true]]) {
        const cap = pointAt(t, 0);
        for (let index = 0; index < 24; index += 1) {
          const off = lerp(-radiusAt(t), radiusAt(t), index / 23);
          pushFlute({
            x: cap.x + nx * off,
            y: cap.y + ny * off,
            a: 0.55 + rand() * 0.3,
            c: index % 2 === 0 ? 6 : 0,
            s: 1.1,
            ph: rand() * TAU,
            sp: 0.9,
            wob: 0.3,
          }, t);
        }
        if (open) {
          for (let index = 0; index < 14; index += 1) {
            const a = rand() * TAU;
            const rr = Math.sqrt(rand()) * radius * 0.5;
            pushFlute({
              x: cap.x + Math.cos(a) * rr,
              y: cap.y + Math.sin(a) * rr,
              a: 0.85,
              c: 8,
              s: 1.1 + rand() * 0.8,
              ph: rand() * TAU,
              sp: 1,
              wob: 0.2,
            }, 1);
          }
        }
      }

      if (!glyphs.length) buildGlyphs();
      buildMorphTargets(rand);
      buildBursts(rand);
    }

    /* ---- Grass bank: a low back layer plus taller foreground blades ---- */
    const bladeCount = isOutro
      ? small ? 60 : 110
      : small ? 220 : 420;
    for (let index = 0; index < bladeCount; index += 1) {
      const back = rand() < 0.4;
      const x = (index / bladeCount) * w + (rand() - 0.5) * 26;
      const base = h * (0.955 + rand() * 0.045);
      const height = h * (0.03 + rand() * (isOutro ? 0.055 : 0.1)) * (small ? 0.85 : 1) * (back ? 0.55 : 1);
      const lean = (rand() - 0.5) * 52;
      const phase = rand() * TAU;
      const steps = back ? 7 : 14;
      const color = back ? 5 : rand() < 0.15 ? 5 : rand() < 0.6 ? 1 : 2;
      for (let step = 0; step < steps; step += 1) {
        const u = step / steps;
        const [sx, sy] = scatter(rand, -Math.PI / 2, 1, 30, diag * 0.32);
        grass.push({
          x: x + lean * u * u,
          y: base - height * u,
          sx,
          sy,
          d: 0.22 + rand() * 0.24,
          a: back ? 0.32 + rand() * 0.35 : 0.55 + rand() * 0.4,
          c: color,
          s: 1 + rand() * 1.7,
          ph: phase + u,
          sp: 0.6 + rand() * 0.8,
          wob: 0.8 + u * 3.2,
        });
      }
    }

    /* ---- Pond: still water, shore stones, drifting leaves ---- */
    pondGeo.cx = w * (isOutro ? 0.6 : 0.35);
    // The outro carries a footer over its lower edge, so its pond sits higher.
    pondGeo.cy = h * (isOutro ? 0.835 : 0.918);
    pondGeo.rx = Math.min(w * (isOutro ? 0.17 : 0.24), small ? 150 : isOutro ? 300 : 340);
    pondGeo.ry = pondGeo.rx * (small ? 0.24 : 0.17);

    // Shore: irregular stones and dark earth around the waterline.
    const shoreCount = small ? 70 : 140;
    for (let index = 0; index < shoreCount; index += 1) {
      const angle = rand() * TAU;
      const ring = 1 + gauss(rand) * 0.07;
      const sx0 = pondGeo.cx + Math.cos(angle) * pondGeo.rx * ring;
      const sy0 = pondGeo.cy + Math.sin(angle) * pondGeo.ry * ring;
      const roll = rand();
      push({
        x: sx0,
        y: sy0,
        sx: (rand() - 0.5) * 10,
        sy: 6 + rand() * 22,
        d: 0.1 + rand() * 0.3,
        a: 0.18 + rand() * 0.26,
        c: roll < 0.5 ? 5 : roll < 0.8 ? 0 : 6,
        s: 0.8 + rand() * 1.6,
        ph: rand() * TAU,
        sp: 0.6 + rand() * 0.8,
        wob: 0.5 + rand() * 0.8,
      });
    }

    // Water surface: short horizontal shimmer streaks.
    const shimmerCount = small ? 90 : 190;
    for (let index = 0; index < shimmerCount; index += 1) {
      const angle = rand() * TAU;
      const ring = Math.sqrt(rand()) * 0.92;
      pondShimmer.push({
        x: pondGeo.cx + Math.cos(angle) * pondGeo.rx * ring,
        y: pondGeo.cy + Math.sin(angle) * pondGeo.ry * ring * 0.94,
        len: 5 + rand() * (small ? 12 : 22),
        drift: (rand() - 0.5) * 0.5,
        ph: rand() * TAU,
        a: 0.18 + rand() * 0.26,
        c: rand() < 0.45 ? 1 : rand() < 0.78 ? 2 : 4,
        s: 0.8 + rand() * 1.2,
      });
    }

    // Ripples: three slow rings expanding across the surface.
    for (let index = 0; index < 3; index += 1) {
      ripples.push({
        x: pondGeo.cx + (rand() - 0.5) * pondGeo.rx * 1.1,
        y: pondGeo.cy + (rand() - 0.5) * pondGeo.ry * 0.9,
        ph: rand() * TAU,
        dur: 7 + rand() * 5,
        max: 0.35 + rand() * 0.5,
      });
    }

    // Floating leaves, bunched where the bank shelters them.
    for (let bunch = 0; bunch < 3; bunch += 1) {
      const bx = pondGeo.cx + (rand() - 0.5) * pondGeo.rx * 0.9;
      const by = pondGeo.cy + (rand() - 0.5) * pondGeo.ry * 0.6;
      for (let index = 0; index < (small ? 6 : 10); index += 1) {
        pondLeaves.push({
          x: bx + gauss(rand) * 11,
          y: by + gauss(rand) * 4.5,
          drift: (rand() - 0.5) * 0.8,
          ph: rand() * TAU,
          a: 0.16 + rand() * 0.24,
          c: rand() < 0.5 ? 1 : 2,
          s: 0.8 + rand() * 1.1,
        });
      }
    }

    /* ---- Wildflowers: sparse cream blooms among the grass ---- */
    const flowerCount = isOutro ? (small ? 24 : 40) : (small ? 44 : 84);
    for (let index = 0; index < flowerCount; index += 1) {
      const fx = rand() * w;
      const base = h * (0.952 + rand() * 0.045);
      const stem = h * (0.018 + rand() * 0.04);
      const lean = (rand() - 0.5) * 14;
      const phase = rand() * TAU;
      const bloom = rand();
      const petal = bloom < 0.6 ? 4 : bloom < 0.85 ? 3 : 2;
      for (let step = 0; step < 6; step += 1) {
        const u = step / 6;
        flowers.push({
          x: fx + lean * u * u,
          y: base - stem * u,
          sway: 0.4 + u * 1.6,
          a: 0.2 + rand() * 0.2,
          c: 5,
          s: 0.7 + rand() * 0.7,
          ph: phase + u,
        });
      }
      for (let petalIndex = 0; petalIndex < 6; petalIndex += 1) {
        const angle = (petalIndex / 6) * TAU + phase;
        flowers.push({
          x: fx + lean + Math.cos(angle) * 2.4,
          y: base - stem + Math.sin(angle) * 2.4,
          sway: 1.9,
          a: 0.34 + rand() * 0.3,
          c: petal,
          s: 0.8 + rand() * 0.8,
          ph: phase,
        });
      }
    }

    /* ---- Ferns at the foot of the tree (hero only) ---- */
    if (!isOutro) {
      const fernCount = small ? 4 : 7;
      for (let index = 0; index < fernCount; index += 1) {
        const fx = w * (0.03 + rand() * 0.2);
        const fy = h * (0.9 + rand() * 0.05);
        const length = h * (0.09 + rand() * 0.13);
        const dir = rand() < 0.5 ? -1 : 1;
        const lean = dir * (0.5 + rand() * 0.8);
        const phase = rand() * TAU;
        const fronds = 26;
        for (let step = 0; step < fronds; step += 1) {
          const u = step / fronds;
          const px = fx + lean * length * u * u;
          const py = fy - length * u;
          const leaflets = u < 0.35 ? 2 : u < 0.7 ? 3 : 4;
          for (let leaf = 0; leaf < leaflets; leaf += 1) {
            const side = leaf % 2 === 0 ? -1 : 1;
            const spread = (1 - u * 0.5) * (small ? 3 : 5);
            ferns.push({
              x: px + side * spread * (0.4 + leaf * 0.3),
              y: py - leaf * 0.8,
              sway: 0.6 + u * 1.4,
              a: 0.22 + rand() * 0.28,
              c: rand() < 0.55 ? 1 : 2,
              s: 0.8 + rand() * 1.1,
              ph: phase + u * 2,
            });
          }
        }
      }
    }

    // Bank shadow under the blades.
    const bank = ctx.createLinearGradient(0, h * 0.86, 0, h);
    bank.addColorStop(0, 'rgba(6, 14, 10, 0)');
    bank.addColorStop(0.5, 'rgba(5, 12, 9, 0.82)');
    bank.addColorStop(1, '#030806');
    state.bank = bank;
    state.radius = withFlute ? clamp(Math.hypot(w, h) * 0.012, 8, 15) : 12;

    // Pond water, cached as a gradient in the ellipse's own space.
    const pondGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, pondGeo.rx);
    pondGrad.addColorStop(0, 'rgba(34, 74, 56, 0.96)');
    pondGrad.addColorStop(0.55, 'rgba(20, 50, 39, 0.9)');
    pondGrad.addColorStop(1, 'rgba(10, 26, 20, 0)');
    state.pondGrad = pondGrad;

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

  // Scroll burst: each note flies up and out from a finger hole, fading fast.
  function drawBursts(time, progress) {
    if (!bursts.length) return;
    ctx.save();
    for (const b of bursts) {
      const local = clamp((progress - b.delay) / b.dur, 0, 1);
      if (local <= 0.001) continue;
      const eased = 1 - Math.pow(1 - local, 3);
      const pop = 1 + Math.sin(Math.min(1, local * 1.15) * Math.PI) * 0.22;
      const x = b.ox + b.dx * eased + Math.sin(time * 0.6 + b.ph) * 7 * eased;
      const y = b.oy + b.dy * eased - Math.sin(eased * Math.PI) * b.lift + Math.cos(time * 0.5 + b.ph) * 6 * eased;
      const alpha = smoothstep(clamp(local / 0.14, 0, 1)) * (1 - smoothstep(clamp((local - 0.72) / 0.28, 0, 1))) * 0.95;
      const step = Math.min(STEPS, Math.max(0, Math.round(alpha * STEPS)));
      ctx.fillStyle = SWATCH[b.c][step];
      const rot = b.rot + b.spin * eased * 2 + Math.sin(time * 0.4 + b.ph) * 0.07;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const scale = b.scale * pop * (0.6 + 0.4 * eased);
      for (const [gx, gy] of b.glyph) {
        ctx.fillRect(x + (gx * cos - gy * sin) * scale, y + (gx * sin + gy * cos) * scale, b.dot, b.dot);
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

  function drawBank() {
    const { w, h } = state;
    ctx.fillStyle = state.bank;
    ctx.fillRect(0, h * 0.86, w, h * 0.14);
  }

  // Ground shadow first, then the pond sits in it, then the blades overlap its near shore.
  function drawPond(time) {
    const { cx, cy, rx, ry } = pondGeo;
    if (!rx) return;
    const ratio = ry / rx;

    // Water body: a cached radial gradient squashed into the ellipse.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ratio);
    ctx.fillStyle = state.pondGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Shimmer: short streaks sliding on the surface.
    ctx.save();
    const boost = isOutro ? 1.4 : 1;
    for (const s of pondShimmer) {
      const drift = Math.sin(time * 0.24 + s.ph) * 6 + Math.sin(time * 0.11 + s.ph * 2) * 5;
      const alpha = s.a * boost * (0.55 + 0.45 * Math.sin(time * 0.6 + s.ph));
      ctx.fillStyle = SWATCH[s.c][Math.min(STEPS, Math.max(0, Math.round(alpha * STEPS)))];
      ctx.fillRect(s.x + drift, s.y, s.len, s.s);
    }
    ctx.restore();

    // Ripples: slow rings widening and fading.
    ctx.save();
    ctx.lineWidth = 1;
    for (const r of ripples) {
      const t = ((time + r.ph) % r.dur) / r.dur;
      const rad = Math.max(1, r.max * rx * (0.15 + 0.85 * t));
      const alpha = (1 - t) * 0.42 * boost;
      const step = Math.min(STEPS, Math.max(0, Math.round(alpha * STEPS)));
      const halo = Math.min(STEPS, Math.max(0, Math.round(alpha * 0.35 * STEPS)));
      // A faint outer ring softens the leading edge of each ripple.
      ctx.strokeStyle = SWATCH[2][halo];
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, rad * 1.14, rad * 1.14 * ratio, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = SWATCH[2][step];
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, rad, rad * ratio, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    // Floating leaves.
    ctx.save();
    for (const leaf of pondLeaves) {
      const x = leaf.x + Math.sin(time * 0.18 + leaf.ph) * 9 + Math.cos(time * 0.07 + leaf.ph) * 5;
      const y = leaf.y + Math.cos(time * 0.22 + leaf.ph) * 1.6;
      ctx.fillStyle = SWATCH[leaf.c][Math.min(STEPS, Math.max(0, Math.round(leaf.a * STEPS)))];
      ctx.fillRect(x, y, leaf.s * 1.6, leaf.s);
    }
    ctx.restore();
  }

  function drawUnderstory(time) {
    ctx.save();
    for (const f of flowers) {
      const sway = Math.sin(time * 0.7 + f.ph) * f.sway;
      const alpha = f.a * (0.85 + 0.15 * Math.sin(time * 1.1 + f.ph));
      ctx.fillStyle = SWATCH[f.c][Math.min(STEPS, Math.max(0, Math.round(alpha * STEPS)))];
      ctx.fillRect(f.x + sway, f.y, f.s, f.s);
    }
    for (const frond of ferns) {
      const sway = Math.sin(time * 0.5 + frond.ph) * frond.sway;
      const alpha = frond.a * (0.8 + 0.2 * Math.sin(time * 0.8 + frond.ph));
      ctx.fillStyle = SWATCH[frond.c][Math.min(STEPS, Math.max(0, Math.round(alpha * STEPS)))];
      ctx.fillRect(frond.x + sway, frond.y, frond.s * 1.5, frond.s);
    }
    ctx.restore();
  }

  function drawGrass(time, progress) {
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
    drawBank();
    drawPond(time);
    drawUnderstory(time);
    drawDrifters(time);
    drawBursts(time, progress);
    drawGrass(time, progress);

    ctx.restore();
  }

  function loop(now) {
    if (!state.running) return;
    const seconds = now / 1000;
    state.time = seconds;
    draw(seconds);
    state.frame = requestAnimationFrame(loop);
  }

  function start() {
    if (reduced || state.running) return;
    state.running = true;
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

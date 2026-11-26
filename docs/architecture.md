# CG Portfolio — architecture (as built)

This file describes what the repository **actually runs**. Intent and recommendations live in [`dossier.md`](dossier.md).

## Stack

| Layer | Choice |
|---|---|
| Build | Vite 6, plain ES modules (`"type": "module"`) |
| UI | Hand-written HTML in `index.html`, no framework |
| Styling | `src/styles.css`, custom properties, no framework |
| Rendering | 2D `<canvas>` particle renderer written from scratch |
| Scroll | GSAP + ScrollTrigger (hero pinning/scrubbing), Lenis (smooth scroll) |
| Audio | Single `Audio()` element, user-gated |
| Video | Native `<video>` with self-hosted mp4 |
| Assets | WebP stills, OGG/MP3 audio, MP4 reels |
| Hosting | Vercel (auto-deploy from `main`) |

No Three.js, React, TypeScript, WebGL or GLSL. The dossier recommends them; that recommendation is not implemented.

## Modules

| File | Responsibility |
|---|---|
| `src/main.js` | Bootstrap: Lenis + ScrollTrigger, intro handoff, masthead state, anchor scrolling, reveal observer, act rail, audio library, film reels, booking form (JSON POST to `VITE_BOOKING_ENDPOINT` with honeypot and cooldown, `mailto:` fallback) |
| `src/audio-level.js` | Analyser tap that turns the ambience and music output into one smoothed 0–1 energy value |
| `src/intro.js` | Loading overlay: procedural peacock feathers carried left→right on a breeze, progress bar, skip |
| `src/hero.js` | `initHero` (ScrollTrigger pin over `+=135%`, scrubbed progress, copy fade) and `initOutro` |
| `src/scene.js` | `createScene(canvas, {mode, audio})`: procedural particle forest, bansuri, grass, motes, scroll disassociation, note burst and audio-reactive sway |

## Scene model

`createScene` is self-contained per canvas and exposes `setProgress(0..1)`, `stop()`, `start()`.

- **Modes:** `hero` (tree + branch + vines + grass + flute) and `outro` (same environment, no flute, calmer grass).
- **Layout:** particle positions are computed once per resize from deterministic Halton/random streams into plain arrays (`field`, `fluteField`, `grass`, `motes`, `drifters`, `bursts`).
- **Palette:** nine cached rgba swatches (`PALETTE`/`SWATCH`) so the frame loop never builds colour strings.
- **Scroll:** `setProgress` runs the dossier's five flute states as pure functions of progress — assembled (0–0.16, idle), loosening (0.16–0.36, per-particle peel along the barrel normal, foot end first), drifting (0.32–0.64, bezier flight with mid-path turbulence), integrated (0.64–0.92, settle and fade into the dust), and reverse (the same curves played backwards when scrolling up). It also drives (a) the musical-note burst that lifts off the finger holes as drifting starts, (b) grass/field loosening, and (c) a small camera zoom.
- **Motion:** idle sway is time-based, so the scene keeps moving when scrolling stops.
- **Audio:** ambience and music are each tapped by an `AnalyserNode` (`src/audio-level.js`); the loudest low-band level, smoothed with a fast attack and slow release, scales grass/flower sway, mote drift, pond shimmer, understory and the flute glow. Silent or reduced-motion pages read zero and look exactly as before.
- **Reduced motion:** `prefers-reduced-motion` renders a single static frame and disables the intro/scroll animation.
- **No per-frame allocation:** draws are `fillRect` calls over precomputed arrays.

## Content architecture

Single long page, seven acts plus intro and outro:

`intro → 01 hero → I artist → II listen → III film → IV sightings → V instrument → VI live → VII book → outro`

- Act rail (`.act-rail`) tracks the current act via IntersectionObserver.
- Masthead anchors smooth-scroll through Lenis.
- All reveal animation is an IntersectionObserver adding `.is-in` to `[data-reveal]`.

## Asset pipeline

- `Resources/` — material supplied by the artist (full size, not web-optimised).
- `public/assets/*.webp` — web stills.
- `public/audio/` — licensed audio (see licence line in the listen act).
- `public/video/*.mp4` — reels encoded from licensed audio + stills.
- `sharp` (dev dependency) is available for image resizing/conversion scripts.

## Performance

Measured in headless Chromium through the preview build (real rAF sampling, ~2.5 s windows):

| Scene | Viewport | FPS | Mean frame | p95 |
|---|---|---|---|---|
| Hero, scroll 0 | 1440×900 | 59.6 | 16.78 ms | 16.8 ms |
| Hero, mid-disintegration | 1440×900 | 60.0 | 16.67 ms | 16.8 ms |
| Hero, mobile tier | 390×844 @2x | 60.0 | 16.67 ms | 16.8 ms |
| Outro | 1440×900 | 60.0 | 16.67 ms | 17.0 ms |

Every scene locks to vsync with no dropped frames. Particle counts scale by a `small` tier (`w < 720`) and the renderer does no per-frame allocation: draws are `fillRect`/`stroke` over precomputed arrays with cached colour swatches and cached gradients.

To re-measure, serve `dist/` with `npm run preview` and run this in the console:

```js
(async (ms = 2500) => {
  const gaps = [];
  let last = performance.now();
  const t0 = last;
  await new Promise((done) => {
    const tick = (now) => {
      gaps.push(now - last);
      last = now;
      if (now - t0 < ms) requestAnimationFrame(tick);
      else done();
    };
    requestAnimationFrame(tick);
  });
  gaps.shift();
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  gaps.sort((a, b) => a - b);
  console.log({ fps: +(1000 / avg).toFixed(1), ms: +avg.toFixed(2), p95: +gaps[Math.floor(gaps.length * 0.95)].toFixed(1) });
})();

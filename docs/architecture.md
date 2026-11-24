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
| `src/main.js` | Bootstrap: Lenis + ScrollTrigger, intro handoff, masthead state, anchor scrolling, reveal observer, act rail, audio library, film reels, booking form |
| `src/intro.js` | Loading overlay: procedural peacock feathers carried left→right on a breeze, progress bar, skip |
| `src/hero.js` | `initHero` (ScrollTrigger pin over `+=135%`, scrubbed progress, copy fade) and `initOutro` |
| `src/scene.js` | `createScene(canvas, {mode})`: procedural particle forest, bansuri, grass, motes, scroll disassociation and note burst |

## Scene model

`createScene` is self-contained per canvas and exposes `setProgress(0..1)`, `stop()`, `start()`.

- **Modes:** `hero` (tree + branch + vines + grass + flute) and `outro` (same environment, no flute, calmer grass).
- **Layout:** particle positions are computed once per resize from deterministic Halton/random streams into plain arrays (`field`, `fluteField`, `grass`, `motes`, `drifters`, `bursts`).
- **Palette:** nine cached rgba swatches (`PALETTE`/`SWATCH`) so the frame loop never builds colour strings.
- **Scroll:** `setProgress` drives (a) the flute's disassociation along bezier paths toward sampled glyph targets, (b) the musical-note burst that lifts off the finger holes, (c) grass/field loosening, (d) a small camera zoom.
- **Motion:** idle sway is time-based, so the scene keeps moving when scrolling stops.
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

## Known gaps versus the dossier

1. The dossier's five flute states (assembled → loosening → drifting → integrated → reverse) are approximated by one scrubbed morph, not separated into distinct phases.
2. Forest ambience exists as a user-started, synthesised wind-and-water bed (`src/ambience.js`) that ducks under recordings and reels; there is no audio-reactive visual response yet.
3. Booking form composes a `mailto:` — there is no server-side submission, validation or spam protection yet. `VITE_BOOKING_EMAIL` is unset, so the form shows its "not configured" note.
4. Content (biography, qualifications, venues, dates) is placeholder copy pending verified artist material.
5. Performance work on the target integrated-GPU machine has not been measured.

## Verification

- `npm run build` must pass.
- Check at 1440×900 and 390×844: intro, hero at progress 0 / mid / full, each act, outro.
- Verify audio playback, reel playback, form validation states, keyboard focus, and reduced motion.

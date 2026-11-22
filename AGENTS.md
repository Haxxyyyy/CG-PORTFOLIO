# CG Portfolio — Project Instructions

## Project identity

Build and maintain an immersive, premium, nature-inspired portfolio for flute artist **Chinmay Goud** (bansuri — North Indian classical; also weddings, clubs and orchestras). The experience should feel like entering a living forest, not browsing a conventional musician template.

The authoritative intent document is [`docs/dossier.md`](docs/dossier.md) (imported from the project dossier PDF). This file describes the repository as it actually is.

## Visual direction

- Deep forest green, botanical green, moss, sage and warm natural highlights.
- No cyberpunk, purple neon, excessive bloom or generic AI-template styling.
- The forest structures are **made of particles**, not decorated with an overlay.
- Keep the bamboo flute recognisable and naturally integrated.
- Preserve negative space for navigation and typography.
- Wind is shown through leaves, grass and drifting particles — not glowing ribbons.

## Technical direction (actual stack)

- **Vite** build, plain ES modules, no framework.
- **2D canvas particle renderer** written by hand (`src/scene.js`, `src/intro.js`) — no Three.js.
- **GSAP + ScrollTrigger** for scroll choreography (`src/hero.js`), **Lenis** for smooth scrolling.
- **Web Audio** via a single `Audio()` element for the music library; no autoplay anywhere.
- Vanilla CSS in `src/styles.css`; no CSS framework.
- `sharp` is a dev dependency for image pipeline scripts.

Do not introduce React, TypeScript, Three.js or R3F without an explicit request — the dossier recommends them, but they are not what this repository runs.

## Engineering rules

1. Inspect the codebase before changing it.
2. Do not rewrite working systems without a clear reason.
3. Keep rendering separate from content and UI.
4. Optimise for integrated graphics and mobile: adaptive particle counts, `prefers-reduced-motion` support, no unbounded per-frame allocation.
5. Respect reduced-motion preferences; never autoplay audio or video.
6. Never fabricate artist facts, qualifications, venues or testimonials — placeholders stay marked.
7. Never commit secrets or credentials.
8. Do not deploy publicly without approval.
9. One agent edits application code at a time; no concurrent writers on the same files.
10. Keep asset provenance and licensing notes with the asset.

## Workflow

- Work in small, verifiable increments; build and browser-check before committing.
- Run `npm run build`; check the page at desktop and mobile widths.
- Report changed files, commands, test results and remaining risks.
- Branch, commit and open a PR; do not push directly to `main`.
- Do not delete or overwrite source assets without approval.

## Content rules

- All biography, training, qualification, venue and performance claims are **unverified placeholders** until the artist supplies material.
- Audio and images currently in `public/` are openly licensed stand-ins; keep their licence notes in the page copy.
- Video reels in `public/video/` are cuts of licensed audio over licensed stills, not the artist's own performance footage. Label them honestly.

## Hardware

Windows 11; Intel Core i5 (generation unrecorded); Intel integrated graphics; 16 GB RAM. Prefer cloud-backed AI reasoning; avoid local model inference.

## Key paths

| Path | Purpose |
|---|---|
| `index.html` | Single-page structure: intro, hero, seven acts, outro |
| `src/scene.js` | Procedural particle forest + bansuri (hero and outro scenes) |
| `src/intro.js` | Peacock-feather loading intro |
| `src/hero.js` | ScrollTrigger pinning, hero/outro scene wiring |
| `src/main.js` | Smooth scroll, reveals, act rail, audio player, reels, booking form |
| `src/styles.css` | All styling |
| `public/audio/` | Licensed audio tracks |
| `public/video/` | Reels (mp4) |
| `public/assets/` | Images (webp) |
| `docs/` | Dossier, architecture, this project's documentation |
| `Resources/` | Source material supplied by the artist (not web-optimised) |

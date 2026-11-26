# CG Portfolio

A cinematic, particle-native forest portfolio for bansuri artist **Chinmay Goud** — built with Vite, hand-written canvas particles, GSAP ScrollTrigger and Lenis.

Live: <https://cg-portfolio-dusky.vercel.app/>

## What it is

A single-page experience: a peacock-feather loading intro, an immersive particle forest with a floating bamboo bansuri, then seven acts — artist, listen, film, sightings, instrument, live, book — closing on a calm outro that repeats the forest without the flute.

The forest is drawn from particles, not images: mossy boughs, hanging vines, a grass bank, drifting motes, and a bansuri that reads as a real instrument (bore shading, bamboo nodes, thread bindings, seven finger holes, embouchure) before it disintegrates into a burst of musical notes as you scroll.

## Stack

Vite · vanilla ES modules · 2D canvas particle renderer · GSAP + ScrollTrigger · Lenis · Web Audio. No framework, no WebGL, no build-time content generation.

See [`docs/architecture.md`](docs/architecture.md) for the real architecture and [`docs/dossier.md`](docs/dossier.md) for the full project dossier and roadmap.

## Commands

```bash
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # serve the production build
```

## Structure

```
index.html          page structure (intro, hero, seven acts, outro)
src/main.js         bootstrap, scroll, reveals, audio, reels, form
src/scene.js        procedural particle forest + bansuri
src/intro.js        peacock-feather loader
src/hero.js         hero/outro ScrollTrigger wiring
src/styles.css      all styling
public/assets/      web stills (webp)
public/audio/       licensed audio tracks
public/video/       film reels (mp4)
Resources/          artist-supplied source material
docs/               dossier, architecture
```

## Content and licensing

- Biography, training, qualifications, venues and dates are **placeholders** until the artist supplies verified material. Do not invent them.
- Audio and stills in `public/` are openly licensed stand-ins; licence notes appear in the page copy.
- Reels in `public/video/` are cuts of licensed audio over licensed stills, not the artist's own performance footage.
- [`docs/artist-brief.md`](docs/artist-brief.md) lists every placeholder claim, where it appears, and the format specs for the real material.

## Contributing

Read [`AGENTS.md`](AGENTS.md) first. Branch, commit, open a PR; do not push to `main`. Build and browser-check (desktop + mobile) before committing.

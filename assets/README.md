# Assets

Curated asset library imported from the artist's `Resources/` folder on 2026-11-22.

- `source/` — usable material (flute photography, forest and branch stills, peacock feather, alpha cut-outs), renamed to stable slugs, byte-identical copies.
- `reference/` — inspiration and reference screenshots (particle foliage, point clouds, peacock loading screens, wallpapers, web pages). **Not licensed for page use.**
- `manifest.md` — every file with its original name, dimensions, alpha status and intended use.

Web derivatives are generated into `public/assets/` (WebP, long edge ≤ 1600 px, quality ≈ 80). `public/` is what ships; `assets/` is the tracked library.

`Resources/` itself stays gitignored — it is the raw dump and should not be committed.

## Rules

1. Do not commit or ship anything from `reference/`.
2. Do not ship stock material to a paid client or public campaign until licences are confirmed; replace with the artist's own photography.
3. Keep new imports in `assets/source/` with a slug name, and record them in `manifest.md`.
4. Generate web derivatives rather than copying full-size originals into `public/`.
5. Alpha cut-outs stay WebP-with-alpha or PNG; never flatten transparency.

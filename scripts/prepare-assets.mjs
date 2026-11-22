import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'Resources', 'online');
const out = path.join(root, 'public', 'assets');

await fs.mkdir(out, { recursive: true });

const photos = [
  {
    file: 'portrait-study.webp',
    from: 'flute-sheet-music.jpg',
    width: 1500,
    quality: 82,
    adjust: (image) => image.grayscale().linear(1.06, -8).modulate({ brightness: 1.02 }),
  },
  {
    file: 'field-notes.webp',
    from: 'flute-man-unsplash.jpg',
    width: 1400,
    quality: 80,
    adjust: (image) => image.modulate({ saturation: 0.9, brightness: 0.94 }),
  },
  {
    file: 'player-study.webp',
    from: 'pexels-flute-player.jpg',
    width: 1400,
    quality: 80,
    adjust: (image) => image.modulate({ saturation: 0.86, brightness: 0.96 }),
  },
  {
    file: 'woodland.webp',
    from: 'mossy-forest.jpg',
    width: 1800,
    quality: 68,
    adjust: (image) => image.modulate({ saturation: 0.82, brightness: 0.86 }),
  },
];

for (const photo of photos) {
  const pipeline = sharp(path.join(source, photo.from)).rotate().resize({
    width: photo.width,
    withoutEnlargement: true,
    kernel: 'lanczos3',
  });
  const adjusted = photo.adjust ? photo.adjust(pipeline) : pipeline;
  await adjusted.webp({ quality: photo.quality, effort: 6 }).toFile(path.join(out, photo.file));
}

for (const file of await fs.readdir(out)) {
  const stat = await fs.stat(path.join(out, file));
  console.log(file, `${(stat.size / 1024).toFixed(1)} kB`);
}

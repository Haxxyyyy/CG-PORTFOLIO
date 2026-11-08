import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = resolve(projectDirectory, 'plain-html');
const outputDirectory = resolve(projectDirectory, 'dist');

await mkdir(outputDirectory, { recursive: true });
await Promise.all(['index.html', 'styles.css', 'loader.js', 'sound-motion.js'].map((file) =>
  copyFile(resolve(sourceDirectory, file), resolve(outputDirectory, file)),
));

console.log(`Standalone site copied to ${outputDirectory}`);

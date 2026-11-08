import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { build } from 'esbuild';

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = resolve(projectDirectory, 'plain-html');
const outputDirectory = resolve(projectDirectory, 'dist');

await mkdir(outputDirectory, { recursive: true });
await Promise.all(['styles.css', 'sound-motion.js'].map((file) =>
  copyFile(resolve(sourceDirectory, file), resolve(outputDirectory, file)),
));

const sourceHtml = await readFile(resolve(sourceDirectory, 'index.html'), 'utf8');
const moduleScript = '<script type="module" src="./loader.js"></script>';
if (!sourceHtml.includes(moduleScript)) {
  throw new Error('The standalone loader module script was not found in plain-html/index.html.');
}
await writeFile(
  resolve(outputDirectory, 'index.html'),
  sourceHtml.replace(moduleScript, '<script src="loader.js"></script>'),
);

await build({
  entryPoints: [resolve(sourceDirectory, 'loader.js')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  legalComments: 'none',
  outfile: resolve(outputDirectory, 'loader.js'),
});

console.log(`Standalone site built at ${outputDirectory}`);

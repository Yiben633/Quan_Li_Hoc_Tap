import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(backendRoot, 'src/package.json');
const target = resolve(backendRoot, 'dist/src/package.json');

await mkdir(dirname(target), { recursive: true });
await copyFile(source, target);

if (process.env.VERCEL === '1') {
  const backendNodeModules = resolve(backendRoot, 'node_modules');
  const rootNodeModules = resolve(backendRoot, '..', 'node_modules');

  await cp(backendNodeModules, rootNodeModules, { recursive: true, force: true });
  await rm(backendNodeModules, { recursive: true, force: true });
}

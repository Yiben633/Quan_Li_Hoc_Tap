import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(backendRoot, 'src/package.json');
const target = resolve(backendRoot, 'dist/src/package.json');

await mkdir(dirname(target), { recursive: true });
await copyFile(source, target);

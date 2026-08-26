import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDirectory = resolve(backendRoot, 'dist-vercel');

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(join(outputDirectory, 'package.json'), '{"private":true,"type":"commonjs"}\n');

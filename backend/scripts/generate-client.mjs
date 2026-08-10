import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const schemaPath = resolve(backendRoot, '../database/prisma/schema.prisma');
const prismaCli = join(backendRoot, 'node_modules', 'prisma', 'build', 'index.js');

// Vercel's Neon integration supplies DATABASE_URL by default. Prisma still
// resolves directUrl while generating, so use the runtime URL during builds
// when a migration-only DIRECT_URL has not been injected into that service.
process.env.DIRECT_URL ||= process.env.DATABASE_URL;

execFileSync(process.execPath, [prismaCli, 'generate', '--schema', schemaPath], { stdio: 'inherit', cwd: backendRoot });

const generatedTarget = join(backendRoot, 'node_modules/.prisma/client');
const generatedSources = [resolve(backendRoot, '../database/node_modules/.prisma/client'), generatedTarget];
const generatedSource = generatedSources.find((candidate) => existsSync(candidate));
if (!generatedSource) throw new Error(`Prisma client output not found: ${generatedSources.join(', ')}`);
if (generatedSource !== generatedTarget) {
  mkdirSync(join(backendRoot, 'node_modules/.prisma'), { recursive: true });
  // The native engine is locked while the Windows dev server is running. Merge the
  // generated client without replacing that binary so type generation stays safe.
  cpSync(generatedSource, generatedTarget, { recursive: true, force: true, filter: (sourcePath) => !sourcePath.endsWith('.dll.node') });
}

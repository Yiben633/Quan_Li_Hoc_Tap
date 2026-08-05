import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const schemaPath = resolve(backendRoot, '../database/prisma/schema.prisma');
const prismaCli = join(backendRoot, 'node_modules', 'prisma', 'build', 'index.js');

execFileSync(process.execPath, [prismaCli, 'generate', '--schema', schemaPath], { stdio: 'inherit', cwd: backendRoot });

const generatedSource = resolve(backendRoot, '../database/node_modules/.prisma/client');
const generatedTarget = join(backendRoot, 'node_modules/.prisma/client');
if (!existsSync(generatedSource)) throw new Error(`Prisma client output not found: ${generatedSource}`);
mkdirSync(join(backendRoot, 'node_modules/.prisma'), { recursive: true });
rmSync(generatedTarget, { recursive: true, force: true });
cpSync(generatedSource, generatedTarget, { recursive: true });

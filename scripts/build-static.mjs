import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
const excluded = new Set(['.git', '.vercel', 'dist', 'node_modules', 'scripts']);

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  cpSync(resolve(root, entry.name), resolve(output, entry.name), { recursive: true });
}

console.log('Publication statique préparée dans dist/.');

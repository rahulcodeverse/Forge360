import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../apps/web/', import.meta.url));
const nextBin = join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const port = process.env.PORT ?? '3001';

const child = spawn(process.execPath, [nextBin, 'start', '-p', port], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

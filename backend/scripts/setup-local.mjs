import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const db = spawn(process.execPath, [path.join(backendDir, 'scripts/local-db.mjs')], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

const timeout = setTimeout(() => {
  console.error('❌ Timed out waiting for local DB');
  db.kill('SIGTERM');
  process.exit(1);
}, 30000);

db.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  if (text.includes('listening')) {
    clearTimeout(timeout);
    try {
      execSync('npx.cmd prisma db push --skip-generate', { cwd: backendDir, stdio: 'inherit' });
      execSync('npx.cmd tsx prisma/seed.ts', { cwd: backendDir, stdio: 'inherit' });
      db.kill('SIGTERM');
      process.exit(0);
    } catch (err) {
      console.error(err);
      db.kill('SIGTERM');
      process.exit(1);
    }
  }
});

db.stderr.on('data', (d) => process.stderr.write(d));

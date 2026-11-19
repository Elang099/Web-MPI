import { spawn, exec } from 'node:child_process';

console.log('🚀 Starting FUTURE ENGLISH CENTER (Database + API + Web)...');

// Automatically open default browser after servers initialize
setTimeout(() => {
  const url = 'http://localhost:5173';
  console.log(`\n🌐 Opening browser at ${url} ...`);
  if (process.platform === 'win32') {
    exec(`start ${url}`);
  } else if (process.platform === 'darwin') {
    exec(`open ${url}`);
  } else {
    exec(`xdg-open ${url}`);
  }
}, 3000);

const child =
  process.platform === 'win32'
    ? spawn('cmd.exe', ['/d', '/s', '/c', 'npm.cmd run dev:all'], { stdio: 'inherit' })
    : spawn('npm', ['run', 'dev:all'], { stdio: 'inherit' });

child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));

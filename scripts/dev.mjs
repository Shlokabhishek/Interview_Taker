import { spawn } from 'node:child_process';

const children = [];
let shuttingDown = false;

const runProcess = (name, command, args, options = {}) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: options.shell ?? false,
    env: process.env,
  });

  child.on('exit', (code) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n[${name}] process exited with code ${code ?? 0}. Shutting down remaining services...`);
    for (const other of children) {
      if (other !== child && !other.killed) {
        other.kill('SIGINT');
      }
    }
    process.exit(code ?? 0);
  });

  children.push(child);
  return child;
};

const shutdownAll = () => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log('\nStopping development stack (backend + frontend)...');
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }
  setTimeout(() => process.exit(0), 400);
};

process.on('SIGINT', shutdownAll);
process.on('SIGTERM', shutdownAll);

console.log('🚀 Starting AI Interview Platform (Backend + Frontend)...');
console.log(' - Backend Server: Node.js + MySQL 3NF Database (http://localhost:8787)');
console.log(' - Frontend Application: React + Vite');

// 1. Start Backend Server automatically
runProcess('Backend', process.execPath, ['server/server.js']);

// 2. Start Frontend Vite Server
const viteArgs = process.argv.slice(2).filter((arg) => `${arg}`.toLowerCase() !== 'all');
runProcess('Frontend', process.execPath, ['node_modules/vite/bin/vite.js', ...viteArgs]);

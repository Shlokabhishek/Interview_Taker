import { spawn } from 'node:child_process';
import net from 'node:net';

const children = [];
let shuttingDown = false;
const npmExecPath = process.env.npm_execpath;
const requestedBackendPort = Number(process.env.PORT || 8787);
const requestedFrontendPort = Number(process.env.FRONTEND_PORT || 3001);

const isPortInUse = (port) => new Promise((resolve) => {
  const socket = net.createConnection({ port, host: '127.0.0.1' });

  socket.once('connect', () => {
    socket.end();
    resolve(true);
  });

  socket.once('error', () => {
    resolve(false);
  });

  socket.setTimeout(500, () => {
    socket.destroy();
    resolve(false);
  });
});

const findAvailablePort = async (startPort, maxAttempts = 20) => {
  let port = startPort;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const busy = await isPortInUse(port);
    if (!busy) return port;
    port += 1;
  }

  throw new Error(`Unable to find open port after ${maxAttempts} attempts from ${startPort}`);
};

const run = (name, command, args, extraEnv = {}) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  child.on('exit', (code) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n[${name}] exited with code ${code ?? 0}. Stopping remaining process...`);
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

const runNpmScript = (name, scriptName, extraEnv = {}) => {
  if (npmExecPath) {
    return run(name, process.execPath, [npmExecPath, 'run', scriptName], extraEnv);
  }

  return run(name, 'npm', ['run', scriptName], extraEnv);
};

const shutdownAll = () => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log('\nShutting down LAN stack...');
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }

  setTimeout(() => process.exit(0), 400);
};

process.on('SIGINT', shutdownAll);
process.on('SIGTERM', shutdownAll);

console.log('Starting LAN stack: backend + LAN frontend');
console.log('- Backend: npm run dev:backend');
console.log('- Frontend: npm run dev:lan');

const backendPort = await findAvailablePort(requestedBackendPort);
const frontendPort = await findAvailablePort(requestedFrontendPort);

if (backendPort !== requestedBackendPort) {
  console.log(`- Backend port ${requestedBackendPort} in use. Switching to ${backendPort}.`);
}

if (frontendPort !== requestedFrontendPort) {
  console.log(`- Frontend port ${requestedFrontendPort} in use. Switching to ${frontendPort}.`);
}

runNpmScript('backend', 'dev:backend', {
  PORT: String(backendPort),
});

runNpmScript('frontend', 'dev:lan', {
  PORT: String(backendPort),
  FRONTEND_PORT: String(frontendPort),
});

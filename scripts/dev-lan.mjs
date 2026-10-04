import os from 'node:os';
import { spawn } from 'node:child_process';

const isPrivateIpv4 = (ip) => {
  if (!ip) return false;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;

  const match = ip.match(/^172\.(\d{1,3})\./);
  if (!match) return false;

  const second = Number(match[1]);
  return second >= 16 && second <= 31;
};

const getLanIp = () => {
  const interfaces = os.networkInterfaces();
  const ipv4Candidates = [];

  for (const records of Object.values(interfaces)) {
    for (const record of records || []) {
      if (!record || record.family !== 'IPv4' || record.internal) continue;
      ipv4Candidates.push(record.address);
    }
  }

  const privateIp = ipv4Candidates.find(isPrivateIpv4);
  return privateIp || ipv4Candidates[0] || '127.0.0.1';
};

const lanIp = getLanIp();
const frontendPort = process.env.FRONTEND_PORT || '3001';
const backendPort = process.env.PORT || '8787';
const frontendProtocol = process.env.VITE_LAN_PROTOCOL || 'http';

const env = {
  ...process.env,
  VITE_API_BASE_URL: `http://${lanIp}:${backendPort}`,
  VITE_PUBLIC_BASE_URL: `${frontendProtocol}://${lanIp}:${frontendPort}`,
  // LAN mode defaults to plain HTTP to avoid certificate trust issues on mobile devices.
  VITE_USE_MKCERT: process.env.VITE_USE_MKCERT || 'false',
};

console.log('LAN mode configuration');
console.log(`- Detected IP: ${lanIp}`);
console.log(`- API base URL: ${env.VITE_API_BASE_URL}`);
console.log(`- Public base URL: ${env.VITE_PUBLIC_BASE_URL}`);
console.log('- Starting Vite dev server on 0.0.0.0');
console.log(`- Open locally: http://localhost:${frontendPort}`);
console.log(`- Open on LAN: http://${lanIp}:${frontendPort}`);

const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0', '--port', frontendPort, '--strictPort'], {
  stdio: 'inherit',
  env,
  shell: false,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

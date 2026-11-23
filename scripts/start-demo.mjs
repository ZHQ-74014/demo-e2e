import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const e2eDir = path.resolve(scriptsDir, '..');
const workspace = path.resolve(e2eDir, '..');
const apiDir = path.join(workspace, 'demo-api');
const webDir = path.join(workspace, 'demo-web');
const tempDir = path.join(e2eDir, '.tmp');
const dataDir = path.join(tempDir, 'data');
const apiBinary = path.join(tempDir, 'demo-api');

rmSync(tempDir, { recursive: true, force: true });
mkdirSync(dataDir, { recursive: true });

const build = spawnSync('go', ['build', '-o', apiBinary, '.'], {
  cwd: apiDir,
  encoding: 'utf8',
});
if (build.status !== 0) {
  process.stderr.write(build.stdout || '');
  process.stderr.write(build.stderr || '');
  process.exit(build.status || 1);
}

const children = [];
let shuttingDown = false;

function start(name, executable, args, options) {
  const child = spawn(executable, args, {
    ...options,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on('data', chunk => process.stderr.write(`[${name}] ${chunk}`));
  child.on('exit', code => {
    if (!shuttingDown) {
      process.stderr.write(`${name} exited unexpectedly with code ${code}\n`);
      shutdown(code || 1);
    }
  });
  children.push(child);
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) child.kill('SIGKILL');
    }
    process.exit(code);
  }, 800).unref();
}

start('api', apiBinary, [], {
  cwd: apiDir,
  env: { ...process.env, PORT: '8080', DEMO_DATA_DIR: dataDir },
});
start('web', process.execPath, ['server.mjs'], {
  cwd: webDir,
  env: { ...process.env, PORT: '4173' },
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

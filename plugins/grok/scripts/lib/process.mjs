import { spawn, spawnSync } from 'node:child_process';

export function commandExists(command) {
  const result = spawnSync('sh', ['-c', `command -v ${shellQuote(command)}`], {
    encoding: 'utf8',
    env: process.env
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

export function run(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    input: options.input,
    encoding: 'utf8',
    timeout: options.timeout ?? 30_000,
    maxBuffer: options.maxBuffer ?? 10 * 1024 * 1024,
    env: { ...process.env, ...options.env }
  });

  return {
    ok: result.status === 0,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error
  };
}

export function spawnDetached(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, ...options.env }
  });
  // Make the child the leader of a new process group so cancel can SIGTERM the group.
  child.unref();
  return child.pid;
}

export function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

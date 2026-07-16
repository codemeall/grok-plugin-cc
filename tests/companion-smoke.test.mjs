import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPANION = join(__dirname, '..', 'plugins', 'grok', 'scripts', 'grok-companion.mjs');
const FAKE_GROK_SRC = join(__dirname, 'fixtures', 'fake-grok.mjs');

function installFakeGrok(binDir) {
  const dest = join(binDir, 'grok');
  writeFileSync(dest, `#!/usr/bin/env sh\nexec node "${FAKE_GROK_SRC}" "$@"\n`, 'utf8');
  chmodSync(dest, 0o755);
  return dest;
}

function companionEnv(overrides = {}) {
  const env = { ...process.env, ...overrides };
  delete env.GROK_CLI;
  delete env.GROK_PLUGIN_GROK_COMMAND;
  return env;
}

function runCompanion(args, env, input) {
  return spawnSync(process.execPath, [COMPANION, ...args], {
    encoding: 'utf8',
    cwd: join(__dirname, '..'),
    env,
    input
  });
}

test('companion setup reports OK with fake Grok Build on PATH', () => {
  const binDir = mkdtempSync(join(tmpdir(), 'grok-plugin-bin-'));
  installFakeGrok(binDir);

  const result = runCompanion(
    ['setup'],
    companionEnv({
      PATH: `${binDir}:${process.env.PATH}`,
      XAI_API_KEY: 'test-key-for-setup'
    })
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Grok Plugin Setup/);
  assert.match(result.stdout, /OK Grok Build CLI/);
  assert.match(result.stdout, /OK Grok auth/);
  assert.match(result.stdout, /curl -fsSL https:\/\/x\.ai\/cli\/install\.sh/);
  assert.match(result.stdout, /XAI_API_KEY/);
});

test('companion setup marks unknown auth without key or cache', () => {
  const binDir = mkdtempSync(join(tmpdir(), 'grok-plugin-bin-'));
  installFakeGrok(binDir);
  const home = mkdtempSync(join(tmpdir(), 'grok-plugin-home-'));

  const result = runCompanion(
    ['setup'],
    companionEnv({
      PATH: `${binDir}:${process.env.PATH}`,
      HOME: home,
      XAI_API_KEY: ''
    })
  );

  // Empty string should not count as set — detectAuth checks truthiness of XAI_API_KEY
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /UNKNOWN Grok auth/);
});

test('companion review runs through fake grok', () => {
  const binDir = mkdtempSync(join(tmpdir(), 'grok-plugin-bin-'));
  installFakeGrok(binDir);

  const result = runCompanion(
    ['review', '--base', 'main'],
    companionEnv({
      PATH: `${binDir}:${process.env.PATH}`,
      XAI_API_KEY: 'test'
    })
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Grok Output|Fake Grok response/);
});

test('a failed Grok run exits 2 and reports Succeeded: no', () => {
  const binDir = mkdtempSync(join(tmpdir(), 'grok-plugin-bin-'));
  installFakeGrok(binDir);

  const result = runCompanion(
    ['rescue', 'break', 'on', 'purpose'],
    companionEnv({
      PATH: `${binDir}:${process.env.PATH}`,
      XAI_API_KEY: 'test',
      FAKE_GROK_BEHAVIOR: 'fail'
    })
  );

  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stdout, /Succeeded: no/);
});

test('rescue receives its task through --stdin-args', () => {
  // Regression: the stdin-args flag key mismatch made slash commands drop $ARGUMENTS.
  const binDir = mkdtempSync(join(tmpdir(), 'grok-plugin-bin-'));
  installFakeGrok(binDir);

  const result = runCompanion(
    ['rescue', '--stdin-args'],
    companionEnv({
      PATH: `${binDir}:${process.env.PATH}`,
      XAI_API_KEY: 'test'
    }),
    'fix the failing login tests\n'
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Grok Output|Fake Grok response/);
  assert.doesNotMatch(result.stderr, /rescue requires a task/);
});

test('task text after -- may contain flag-like tokens', () => {
  const binDir = mkdtempSync(join(tmpdir(), 'grok-plugin-bin-'));
  installFakeGrok(binDir);

  const result = runCompanion(
    ['rescue', '--', 'explain', 'the', '--force', 'flag'],
    companionEnv({
      PATH: `${binDir}:${process.env.PATH}`,
      XAI_API_KEY: 'test'
    })
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Succeeded: yes/);
});

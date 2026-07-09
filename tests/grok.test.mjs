import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ARG_MAX_SAFE,
  buildHeadlessArgs,
  detectGrok,
  runGrokPrompt,
  runGrokPromptAsync
} from '../plugins/grok/scripts/lib/grok.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FAKE_GROK_SRC = join(__dirname, 'fixtures', 'fake-grok.mjs');

function installFakeGrok(binDir) {
  const dest = join(binDir, 'grok');
  // Wrapper so PATH resolution finds an executable named `grok`.
  writeFileSync(
    dest,
    `#!/usr/bin/env sh\nexec node "${FAKE_GROK_SRC}" "$@"\n`,
    'utf8'
  );
  chmodSync(dest, 0o755);
  return dest;
}

test('buildHeadlessArgs uses -p for short prompts', () => {
  const args = buildHeadlessArgs('hello', {});
  assert.deepEqual(args.slice(0, 1), ['--no-auto-update']);
  assert.ok(args.includes('-p'));
  assert.ok(args.includes('hello'));
  assert.equal(args.includes('--prompt-file'), false);
});

test('buildHeadlessArgs uses --prompt-file when provided', () => {
  const args = buildHeadlessArgs('ignored', { promptFile: '/tmp/prompt.md', cwd: '/repo' });
  assert.ok(args.includes('--prompt-file'));
  assert.ok(args.includes('/tmp/prompt.md'));
  assert.ok(args.includes('--cwd'));
  assert.ok(args.includes('/repo'));
  assert.equal(args.includes('-p'), false);
});

test('buildHeadlessArgs maps resume to -c and sessionId to -r', () => {
  assert.ok(buildHeadlessArgs('x', { resume: true }).includes('-c'));
  assert.equal(buildHeadlessArgs('x', { resume: true, fresh: true }).includes('-c'), false);
  const withSession = buildHeadlessArgs('x', { sessionId: 'abc' });
  assert.ok(withSession.includes('-r'));
  assert.ok(withSession.includes('abc'));
});

test('detectGrok and runGrokPrompt work with fake Grok Build CLI', async () => {
  const binDir = mkdtempSync(join(tmpdir(), 'grok-plugin-bin-'));
  const logPath = join(binDir, 'args.log');
  const fakePath = installFakeGrok(binDir);

  const previousCli = process.env.GROK_CLI;
  const previousLog = process.env.FAKE_GROK_LOG;
  process.env.GROK_CLI = fakePath;
  process.env.FAKE_GROK_LOG = logPath;

  try {
    const detected = detectGrok();
    assert.equal(detected.ok, true);
    assert.match(detected.version, /fake|0\.0\.0/);

    const response = runGrokPrompt('short review prompt', { cwd: binDir });
    assert.equal(response.ok, true);
    assert.match(response.output, /Fake Grok response/);
    assert.ok(response.args.includes('--no-auto-update'));
    assert.ok(response.args.includes('-p'));

    const logged = readFileSync(logPath, 'utf8').trim().split('\n').pop();
    const parsed = JSON.parse(logged);
    assert.ok(parsed.includes('-p'));
  } finally {
    if (previousCli === undefined) delete process.env.GROK_CLI;
    else process.env.GROK_CLI = previousCli;
    if (previousLog === undefined) delete process.env.FAKE_GROK_LOG;
    else process.env.FAKE_GROK_LOG = previousLog;
  }
});

test('runGrokPromptAsync uses --prompt-file for oversized prompts', async () => {
  const binDir = mkdtempSync(join(tmpdir(), 'grok-plugin-bin-'));
  const logPath = join(binDir, 'args.log');
  const fakePath = installFakeGrok(binDir);

  const previousCli = process.env.GROK_CLI;
  const previousLog = process.env.FAKE_GROK_LOG;
  process.env.GROK_CLI = fakePath;
  process.env.FAKE_GROK_LOG = logPath;

  try {
    const huge = 'x'.repeat(ARG_MAX_SAFE + 100);
    const response = await runGrokPromptAsync(huge, { cwd: binDir });
    assert.equal(response.ok, true);
    assert.ok(response.args.includes('--prompt-file'));
    assert.equal(response.args.includes('-p'), false);
  } finally {
    if (previousCli === undefined) delete process.env.GROK_CLI;
    else process.env.GROK_CLI = previousCli;
    if (previousLog === undefined) delete process.env.FAKE_GROK_LOG;
    else process.env.FAKE_GROK_LOG = previousLog;
  }
});

test('runGrokPrompt rejects oversized inline prompts without promptFile', () => {
  const huge = 'y'.repeat(ARG_MAX_SAFE + 10);
  assert.throws(() => runGrokPrompt(huge, {}), /promptFile|runGrokPromptAsync/);
});

test('buildHeadlessArgs includes --tools when provided', () => {
  const args = buildHeadlessArgs('x', { tools: 'read_file,grep,list_dir' });
  assert.ok(args.includes('--tools'));
  assert.ok(args.includes('read_file,grep,list_dir'));
});

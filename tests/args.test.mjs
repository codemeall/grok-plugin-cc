import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, tokenizeArguments } from '../plugins/grok/scripts/lib/args.mjs';

test('parseArgs handles mode, value flags, boolean flags, and task text', () => {
  const parsed = parseArgs([
    'rescue',
    'fix',
    'failing',
    'tests',
    '--background',
    '--base',
    'develop',
    '--wait',
    '--effort',
    'high'
  ]);

  assert.equal(parsed.command, 'rescue');
  assert.equal(parsed.task, 'fix failing tests');
  assert.deepEqual(parsed.flags, {
    background: true,
    base: 'develop',
    wait: true,
    effort: 'high'
  });
});

test('parseArgs accepts adversarial focus text as task', () => {
  const parsed = parseArgs([
    'adversarial-review',
    '--base',
    'main',
    'challenge',
    'caching'
  ]);
  assert.equal(parsed.task, 'challenge caching');
  assert.equal(parsed.flags.base, 'main');
});

test('parseArgs accepts --readonly for rescue', () => {
  const parsed = parseArgs(['rescue', 'diagnose', 'only', '--readonly', '--effort', 'low']);
  assert.equal(parsed.task, 'diagnose only');
  assert.equal(parsed.flags.readonly, true);
  assert.equal(parsed.flags.effort, 'low');
});

test('parseArgs rejects missing value flags', () => {
  assert.throws(() => parseArgs(['review', '--base']), /requires a value/);
});

test('parseArgs rejects unknown flags', () => {
  assert.throws(() => parseArgs(['review', '--surprise']), /Unknown flag/);
});

test('tokenizeArguments preserves quoted task fragments', () => {
  assert.deepEqual(
    tokenizeArguments('fix "failing login" --background --base develop'),
    ['fix', 'failing login', '--background', '--base', 'develop']
  );
});

test('tokenizeArguments rejects unclosed quotes', () => {
  assert.throws(() => tokenizeArguments('fix "unterminated'), /Unclosed/);
});

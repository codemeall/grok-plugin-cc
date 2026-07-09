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
    '--wait'
  ]);

  assert.equal(parsed.command, 'rescue');
  assert.equal(parsed.task, 'fix failing tests');
  assert.deepEqual(parsed.flags, {
    background: true,
    base: 'develop',
    wait: true
  });
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

import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPatch, looksLikePatch } from '../plugins/grok/scripts/lib/parser.mjs';

test('extractPatch returns fenced diff blocks', () => {
  const output = [
    'notes',
    '```diff',
    'diff --git a/a.txt b/a.txt',
    '--- a/a.txt',
    '+++ b/a.txt',
    '@@ -1 +1 @@',
    '-old',
    '+new',
    '```'
  ].join('\n');

  assert.match(extractPatch(output), /diff --git a\/a\.txt b\/a\.txt/);
});

test('extractPatch returns empty string without a patch', () => {
  assert.equal(extractPatch('just markdown notes'), '');
});

test('looksLikePatch recognizes unified diff content', () => {
  assert.equal(looksLikePatch('--- a/file\n+++ b/file\n@@ -1 +1 @@'), true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { git, detectRepository } from '../plugins/grok/scripts/lib/git.mjs';

test('detectRepository labels repositories before the first commit as unborn', () => {
  const repo = mkdtempSync(join(tmpdir(), 'grok-plugin-git-'));
  const init = git(['init', '--initial-branch=main'], { cwd: repo });

  assert.equal(init.ok, true, init.stderr || init.stdout);

  const detected = detectRepository(repo);
  assert.equal(detected.ok, true);
  assert.equal(detected.branch, 'main');
  assert.equal(detected.head, '(unborn)');
});

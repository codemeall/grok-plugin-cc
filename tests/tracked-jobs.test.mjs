import test from 'node:test';
import assert from 'node:assert/strict';
import { formatElapsed } from '../plugins/grok/scripts/lib/tracked-jobs.mjs';

test('formatElapsed handles missing start time', () => {
  assert.equal(formatElapsed(null, null), 'not started');
});

test('formatElapsed renders minutes and seconds', () => {
  assert.equal(
    formatElapsed('2026-07-09T00:00:00.000Z', '2026-07-09T00:02:05.000Z'),
    '2m 5s'
  );
});

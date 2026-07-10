import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJob, listJobs, readJob, readJobOutput, startJob, updateJob } from '../plugins/grok/scripts/lib/jobs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPANION = join(__dirname, '..', 'plugins', 'grok', 'scripts', 'grok-companion.mjs');
const FAKE_GROK_SRC = join(__dirname, 'fixtures', 'fake-grok.mjs');

function installFakeGrok(binDir) {
  const dest = join(binDir, 'grok');
  writeFileSync(dest, `#!/usr/bin/env sh\nexec node "${FAKE_GROK_SRC}" "$@"\n`, 'utf8');
  chmodSync(dest, 0o755);
  return dest;
}

test('createJob persists effort flag', async () => {
  const jobsDir = mkdtempSync(join(tmpdir(), 'grok-plugin-jobs-'));
  const previous = process.env.GROK_PLUGIN_JOBS_DIR;
  process.env.GROK_PLUGIN_JOBS_DIR = jobsDir;

  try {
    const job = await createJob({
      mode: 'rescue',
      repo: { root: '/tmp/repo' },
      prompt: 'propose a fix',
      task: 'propose a fix',
      flags: { effort: 'medium', model: 'grok-4.5', readonly: true }
    });
    assert.equal(job.flags.effort, 'medium');
    assert.equal(job.flags.readonly, true);
    assert.equal((await readJob(job.id)).flags.effort, 'medium');
  } finally {
    if (previous === undefined) delete process.env.GROK_PLUGIN_JOBS_DIR;
    else process.env.GROK_PLUGIN_JOBS_DIR = previous;
  }
});

test('createJob persists flags and prompt file', async () => {
  const jobsDir = mkdtempSync(join(tmpdir(), 'grok-plugin-jobs-'));
  const previous = process.env.GROK_PLUGIN_JOBS_DIR;
  process.env.GROK_PLUGIN_JOBS_DIR = jobsDir;

  try {
    const job = await createJob({
      mode: 'review',
      repo: { root: '/tmp/repo' },
      prompt: 'review please',
      task: 'review please',
      flags: { base: 'develop', resume: true, model: 'grok-4.5' }
    });

    assert.match(job.id, /^grok-/);
    assert.equal(job.status, 'queued');
    assert.deepEqual(job.flags, {
      base: 'develop',
      resume: true,
      fresh: false,
      model: 'grok-4.5',
      effort: null,
      readonly: false
    });

    const loaded = await readJob(job.id);
    assert.equal(loaded.flags.resume, true);
    assert.equal(loaded.flags.model, 'grok-4.5');

    const listed = await listJobs();
    assert.equal(listed.some((item) => item.id === job.id), true);
  } finally {
    if (previous === undefined) delete process.env.GROK_PLUGIN_JOBS_DIR;
    else process.env.GROK_PLUGIN_JOBS_DIR = previous;
  }
});

test('background execute-job completes with fake grok', async () => {
  const jobsDir = mkdtempSync(join(tmpdir(), 'grok-plugin-jobs-'));
  const binDir = mkdtempSync(join(tmpdir(), 'grok-plugin-bin-'));
  const fakePath = installFakeGrok(binDir);

  const previousJobs = process.env.GROK_PLUGIN_JOBS_DIR;
  const previousCli = process.env.GROK_CLI;

  process.env.GROK_PLUGIN_JOBS_DIR = jobsDir;
  process.env.GROK_CLI = fakePath;

  try {
    const job = await createJob({
      mode: 'rescue',
      repo: { root: process.cwd() },
      prompt: 'fix the thing',
      task: 'fix the thing',
      flags: { fresh: true }
    });
    const started = await startJob(job, COMPANION);
    assert.equal(started.status, 'running');
    assert.ok(started.pid);

    const deadline = Date.now() + 15_000;
    let finalJob = started;
    while (Date.now() < deadline) {
      finalJob = await readJob(job.id);
      if (['completed', 'failed', 'cancelled'].includes(finalJob.status)) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    assert.equal(finalJob.status, 'completed');
    const output = await readJobOutput(job.id);
    assert.match(output, /Fake Grok response/);
    assert.match(output, /diff --git/);
  } finally {
    if (previousJobs === undefined) delete process.env.GROK_PLUGIN_JOBS_DIR;
    else process.env.GROK_PLUGIN_JOBS_DIR = previousJobs;
    if (previousCli === undefined) delete process.env.GROK_CLI;
    else process.env.GROK_CLI = previousCli;
  }
});

test('createJob rejects path-traversal via assertJobId', async () => {
  const { assertJobId } = await import('../plugins/grok/scripts/lib/jobs.mjs');
  assert.throws(() => assertJobId('../etc'), /Invalid job id/);
  assert.throws(() => assertJobId('not-a-job'), /Invalid job id/);
  assert.equal(assertJobId('grok-20260101120000-abc123'), 'grok-20260101120000-abc123');
});

test('updateJob can mark cancelled', async () => {
  const jobsDir = mkdtempSync(join(tmpdir(), 'grok-plugin-jobs-'));
  const previous = process.env.GROK_PLUGIN_JOBS_DIR;
  process.env.GROK_PLUGIN_JOBS_DIR = jobsDir;

  try {
    const job = await createJob({
      mode: 'review',
      repo: { root: '/tmp/repo' },
      prompt: 'x',
      task: 'x'
    });
    const updated = await updateJob(job.id, { status: 'cancelled', progress: 'cancelled by user' });
    assert.equal(updated.status, 'cancelled');
  } finally {
    if (previous === undefined) delete process.env.GROK_PLUGIN_JOBS_DIR;
    else process.env.GROK_PLUGIN_JOBS_DIR = previous;
  }
});

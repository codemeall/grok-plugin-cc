import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnDetached } from './process.mjs';
import { readJson, writeJson } from './state.mjs';

const JOB_ID_RE = /^grok-\d{14}-[a-z0-9]+$/;

export function jobsRoot() {
  return process.env.GROK_PLUGIN_JOBS_DIR || join(homedir(), '.grok-plugin', 'jobs');
}

export function assertJobId(jobId) {
  if (!JOB_ID_RE.test(jobId)) {
    throw new Error(`Invalid job id: ${jobId}`);
  }
  return jobId;
}

export function newJobId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `grok-${stamp}-${rand}`;
}

export function jobDir(jobId) {
  return join(jobsRoot(), assertJobId(jobId));
}

export function jobFile(jobId) {
  return join(jobDir(jobId), 'job.json');
}

export function outputFile(jobId) {
  return join(jobDir(jobId), 'output.md');
}

export function promptFile(jobId) {
  return join(jobDir(jobId), 'prompt.md');
}

export async function createJob({ mode, repo, prompt, task, flags = {} }) {
  const id = newJobId();
  await mkdir(jobDir(id), { recursive: true });
  const now = new Date().toISOString();
  const job = {
    id,
    mode,
    repository: repo?.root || null,
    prompt: task || '',
    status: 'queued',
    startedAt: null,
    finishedAt: null,
    pid: null,
    outputFile: outputFile(id),
    promptFile: promptFile(id),
    sessionId: null,
    flags: {
      base: flags.base || null,
      resume: Boolean(flags.resume),
      fresh: Boolean(flags.fresh),
      model: flags.model || null
    },
    progress: 'queued',
    logs: []
  };
  await writeJson(jobFile(id), job);
  await writeText(promptFile(id), prompt);
  job.logs.push({ at: now, message: 'Job created.' });
  await writeJson(jobFile(id), job);
  return job;
}

export async function startJob(job, scriptPath) {
  const pid = spawnDetached(process.execPath, [scriptPath, 'execute-job', '--job', job.id]);
  const updated = {
    ...job,
    pid,
    status: 'running',
    startedAt: new Date().toISOString(),
    progress: 'started',
    logs: [...job.logs, { at: new Date().toISOString(), message: `Spawned pid ${pid}.` }]
  };
  await writeJson(jobFile(job.id), updated);
  return updated;
}

export async function updateJob(jobId, patch) {
  const current = await readJob(jobId);
  const next = { ...current, ...patch };
  await writeJson(jobFile(jobId), next);
  return next;
}

export async function readJob(jobId) {
  const job = await readJson(jobFile(jobId));
  if (!job) throw new Error(`Job not found: ${jobId}`);
  return job;
}

export async function listJobs() {
  const root = jobsRoot();
  if (!existsSync(root)) return [];
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(root, { withFileTypes: true });
  const jobs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const job = await readJson(join(root, entry.name, 'job.json'));
    if (job) jobs.push(job);
  }
  return jobs.sort((a, b) => String(b.startedAt || b.id).localeCompare(String(a.startedAt || a.id)));
}

export async function readJobOutput(jobId) {
  try {
    return await readFile(outputFile(jobId), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}

async function writeText(filePath, value) {
  const { writeFile } = await import('node:fs/promises');
  await writeFile(filePath, value, 'utf8');
}

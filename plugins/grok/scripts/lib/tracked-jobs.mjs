import { listJobs, updateJob } from './jobs.mjs';

export async function renderStatus() {
  const jobs = await listJobs();
  if (jobs.length === 0) return 'No Grok jobs found.';

  const reconciled = [];
  for (const job of jobs) {
    reconciled.push(await reconcileRunningJob(job));
  }

  const rows = reconciled.map((job) => {
    const elapsed = formatElapsed(job.startedAt, job.finishedAt);
    return `- ${job.id} | ${job.status} | ${elapsed} | ${job.progress || ''} | ${job.repository || ''}`;
  });

  return ['# Grok Jobs', '', ...rows].join('\n');
}

async function reconcileRunningJob(job) {
  if (job.status !== 'running' || !job.pid) return job;
  if (isPidAlive(job.pid)) return job;

  return updateJob(job.id, {
    status: 'failed',
    finishedAt: new Date().toISOString(),
    progress: 'worker process exited without updating status'
  });
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function formatElapsed(startedAt, finishedAt) {
  if (!startedAt) return 'not started';
  const end = finishedAt ? Date.parse(finishedAt) : Date.now();
  const seconds = Math.max(0, Math.round((end - Date.parse(startedAt)) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return `${minutes}m ${rest}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

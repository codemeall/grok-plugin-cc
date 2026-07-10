#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, tokenizeArguments, usage } from './lib/args.mjs';
import { gatherRepositoryContext } from './lib/context.mjs';
import { detectRepository } from './lib/git.mjs';
import { detectGrok, headlessModeOptions, runGrokPromptAsync } from './lib/grok.mjs';
import { commandExists } from './lib/process.mjs';
import { buildPrompt } from './lib/prompts.mjs';
import { extractPatch } from './lib/parser.mjs';
import {
  createJob,
  outputFile,
  promptFile,
  readJob,
  readJobOutput,
  startJob,
  updateJob
} from './lib/jobs.mjs';
import { renderStatus } from './lib/tracked-jobs.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PLUGIN_ROOT = resolve(dirname(SCRIPT_PATH), '..');
const MARKETPLACE_ROOT = resolve(PLUGIN_ROOT, '..', '..');

async function main() {
  let parsed = parseArgs(process.argv.slice(2));
  if (parsed.flags.stdinArgs) {
    const raw = await readStdin();
    const reparsed = parseArgs([parsed.command, ...tokenizeArguments(raw)]);
    parsed = {
      ...reparsed,
      flags: { ...reparsed.flags, stdinArgs: true }
    };
  }
  if (!parsed.command || parsed.flags.help) {
    console.log(usage());
    return;
  }

  switch (parsed.command) {
    case 'setup':
      console.log(await setup());
      return;
    case 'review':
    case 'adversarial-review':
    case 'rescue':
      console.log(await runMode(parsed.command, parsed));
      return;
    case 'status':
      console.log(await renderStatus());
      return;
    case 'result':
      console.log(await result(parsed.positionals[0]));
      return;
    case 'cancel':
      console.log(await cancel(parsed.positionals[0]));
      return;
    case 'execute-job':
      await executeJob(parsed.flags.job);
      return;
    default:
      throw new Error(`Unknown command: ${parsed.command}\n\n${usage()}`);
  }
}

async function setup() {
  const node = process.version;
  const git = commandExists('git');
  const repo = detectRepository();
  const grok = detectGrok();
  const authLabel = authStatusLabel(grok.auth.ok);

  const lines = [
    '# Grok Plugin Setup',
    '',
    statusLine('Node.js', Boolean(node), node),
    statusLine('Git', Boolean(git), git || 'not found on PATH'),
    statusLine('Repository', repo.ok, repo.ok ? `${repo.root} (${formatRepoRef(repo)})` : repo.error),
    statusLine(
      'Grok Build CLI',
      grok.ok,
      grok.ok
        ? `${grok.command} -> ${grok.path} (${grok.version})`
        : `${grok.command} not found or not Grok Build${grok.fingerprint?.detail ? `: ${grok.fingerprint.detail}` : ''}`
    ),
    statusLine('Grok auth', authLabel.ok, grok.auth.detail),
    '',
    '## Install/setup notes',
    '',
    '- Install Grok Build: `curl -fsSL https://x.ai/cli/install.sh | bash` (Windows: `irm https://x.ai/cli/install.ps1 | iex`).',
    '- Authenticate with `grok login`, or set `XAI_API_KEY` for non-interactive environments.',
    '- Headless runs use `grok --prompt-file <path>` (long prompts) or `grok -p "..."` (short prompts).',
    '- Reviews are read-only (`--tools read_file,grep,list_dir --sandbox read-only`).',
    '- Rescue is write-capable by default (`--sandbox workspace --always-approve`); use `--readonly` to propose only.',
    `- If PATH \`grok\` is not Grok Build, set \`GROK_CLI=/absolute/path/to/grok\` (often \`~/.grok/bin/grok\`).`,
    `- Test this plugin locally with: \`claude --plugin-dir ${PLUGIN_ROOT}\``,
    `- Add this local marketplace with: \`/plugin marketplace add ${MARKETPLACE_ROOT}\``,
    '- Install from that marketplace with: `/plugin install grok@grok-plugin-cc`'
  ];

  return lines.join('\n');
}

async function runMode(mode, parsed) {
  if (mode === 'rescue' && !parsed.task) {
    throw new Error('rescue requires a task, for example: rescue fix failing tests');
  }

  const base = parsed.flags.base || 'main';
  const context = gatherRepositoryContext({ base });
  if (!context.repo.ok) {
    return [
      '# Grok execution unavailable',
      '',
      'This command must run inside a Git repository.',
      '',
      context.repo.error
    ].join('\n');
  }
  const write = mode !== 'rescue' ? false : !parsed.flags.readonly;
  const prompt = buildPrompt(mode, context, {
    task: parsed.task,
    base,
    resume: parsed.flags.resume,
    fresh: parsed.flags.fresh,
    write
  });

  if (parsed.flags.background) {
    const grok = detectGrok();
    if (!grok.ok) {
      return [
        '# Grok execution unavailable',
        '',
        `Grok Build CLI not available as \`${grok.command}\`.`,
        grok.fingerprint?.detail || 'Run `/grok:setup` for setup details.'
      ].join('\n');
    }

    const job = await createJob({
      mode,
      repo: context.repo.ok ? context.repo : null,
      prompt,
      task: parsed.task,
      flags: {
        base,
        resume: Boolean(parsed.flags.resume),
        fresh: Boolean(parsed.flags.fresh),
        model: parsed.flags.model || null,
        effort: parsed.flags.effort || null,
        readonly: Boolean(parsed.flags.readonly)
      }
    });
    const started = await startJob(job, SCRIPT_PATH);
    if (parsed.flags.wait) {
      return await waitForJob(started.id);
    }
    return [
      `Started Grok job: ${started.id}`,
      `Status: ${started.status}`,
      `PID: ${started.pid}`,
      write ? 'Mode: write-capable (Grok may edit the repo)' : 'Mode: read-only / proposal-only',
      '',
      `Use /grok:status to monitor it.`,
      `Use /grok:result ${started.id} to inspect the output.`
    ].join('\n');
  }

  const grok = detectGrok();
  if (!grok.ok) {
    return [
      '# Grok execution unavailable',
      '',
      `Grok Build CLI not available as \`${grok.command}\`.`,
      grok.fingerprint?.detail || 'Run `/grok:setup` for setup details.'
    ].join('\n');
  }

  const response = await runGrokPromptAsync(prompt, {
    cwd: context.repo.root,
    resume: parsed.flags.resume,
    fresh: parsed.flags.fresh,
    model: parsed.flags.model,
    effort: parsed.flags.effort,
    ...headlessModeOptions(mode, { write })
  });
  const patch = extractPatch(response.output);
  return renderExecutionResult(response.output, patch, response);
}

async function executeJob(jobId) {
  if (!jobId) throw new Error('execute-job requires --job <job-id>');
  const job = await readJob(jobId);

  try {
    await updateJob(jobId, {
      status: 'running',
      startedAt: job.startedAt || new Date().toISOString(),
      progress: 'reading prompt'
    });
    const prompt = await readFile(promptFile(jobId), 'utf8');
    await updateJob(jobId, { progress: 'running grok' });
    const flags = job.flags || {};
    const write = job.mode === 'rescue' && !flags.readonly;
    const current = await readJob(jobId);
    if (current.status === 'cancelled') {
      return;
    }

    const response = await runGrokPromptAsync(prompt, {
      cwd: job.repository || process.cwd(),
      promptFile: promptFile(jobId),
      resume: flags.resume,
      fresh: flags.fresh,
      model: flags.model,
      effort: flags.effort,
      sessionId: job.sessionId || undefined,
      ...headlessModeOptions(job.mode, { write })
    });

    const after = await readJob(jobId);
    if (after.status === 'cancelled') {
      return;
    }

    const patch = extractPatch(response.output);
    await writeFile(outputFile(jobId), renderExecutionResult(response.output, patch, response), 'utf8');
    await updateJob(jobId, {
      status: response.ok ? 'completed' : 'failed',
      finishedAt: new Date().toISOString(),
      progress: response.ok ? 'completed' : `grok exited with ${response.status}`
    });
  } catch (error) {
    const after = await readJob(jobId).catch(() => null);
    if (after?.status === 'cancelled') {
      return;
    }
    await writeFile(outputFile(jobId), `# Grok job failed\n\n${error.stack || error.message}\n`, 'utf8');
    await updateJob(jobId, {
      status: 'failed',
      finishedAt: new Date().toISOString(),
      progress: error.message
    });
  }
}

async function result(jobId) {
  if (!jobId) throw new Error('result requires <job-id>');
  const job = await readJob(jobId);
  const output = await readJobOutput(jobId);
  return [
    '# Grok Job Result',
    '',
    `Job ID: ${job.id}`,
    `Status: ${job.status}`,
    `Repository: ${job.repository || '(unknown)'}`,
    `Started: ${job.startedAt || '(not started)'}`,
    `Finished: ${job.finishedAt || '(not finished)'}`,
    `PID: ${job.pid || '(none)'}`,
    `Output file: ${job.outputFile}`,
    `Prompt file: ${job.promptFile}`,
    '',
    output || '(No output yet.)'
  ].join('\n');
}

async function cancel(jobId) {
  if (!jobId) throw new Error('cancel requires <job-id>');
  const job = await readJob(jobId);
  if (job.status !== 'running') {
    return `Job ${jobId} is not running. Current status: ${job.status}.`;
  }

  if (job.pid) {
    killJobProcess(job.pid);
  }

  await updateJob(jobId, {
    status: 'cancelled',
    finishedAt: new Date().toISOString(),
    progress: 'cancelled by user'
  });
  return `Cancelled Grok job ${jobId}.`;
}

function killJobProcess(pid) {
  try {
    // Detached workers are process-group leaders; kill the group when possible.
    process.kill(-pid, 'SIGTERM');
  } catch (error) {
    if (error.code !== 'ESRCH') {
      try {
        process.kill(pid, 'SIGTERM');
      } catch (inner) {
        if (inner.code !== 'ESRCH') throw inner;
      }
    }
  }
}

async function waitForJob(jobId) {
  const deadline = Date.now() + 30 * 60_000;
  while (Date.now() < deadline) {
    const job = await readJob(jobId);
    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      return await result(jobId);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return `Timed out waiting for ${jobId}. Use /grok:status and /grok:result ${jobId}.`;
}

function renderExecutionResult(output, patch, response) {
  return [
    '# Grok Output',
    '',
    output || '(empty output)',
    '',
    '# Patch',
    '',
    patch ? `\`\`\`diff\n${patch}\n\`\`\`` : '(No patch detected.)',
    '',
    '# Session Metadata',
    '',
    `Exit status: ${response.status ?? 'unknown'}`,
    `Signal: ${response.signal ?? 'none'}`,
    `Succeeded: ${response.ok ? 'yes' : 'no'}`
  ].join('\n');
}

function statusLine(label, ok, detail) {
  const mark = ok === true ? 'OK' : ok === null ? 'UNKNOWN' : 'MISSING';
  return `- ${mark} ${label}: ${detail}`;
}

function formatRepoRef(repo) {
  return repo.head === '(unborn)' ? `${repo.branch} ${repo.head}` : `${repo.branch}@${repo.head}`;
}

function authStatusLabel(ok) {
  if (ok === true) return { ok: true };
  if (ok === null) return { ok: null };
  return { ok: false };
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

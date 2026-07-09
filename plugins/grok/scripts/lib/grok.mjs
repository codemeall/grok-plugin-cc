import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { commandExists, run } from './process.mjs';

/** Soft argv budget before switching to --prompt-file (bytes). */
export const ARG_MAX_SAFE = 80_000;

export function configuredGrokCommand() {
  return process.env.GROK_PLUGIN_GROK_COMMAND || process.env.GROK_CLI || 'grok';
}

export function detectGrok() {
  const configured = configuredGrokCommand();
  const resolved = configured.includes('/') || configured.includes('\\')
    ? (existsSync(configured) ? configured : null)
    : commandExists(configured);

  if (!resolved) {
    return {
      ok: false,
      command: configured,
      path: null,
      version: null,
      fingerprint: null,
      auth: {
        ok: false,
        detail: 'Grok Build CLI not found.'
      }
    };
  }

  const fingerprint = detectFingerprint(resolved);
  const looksLikeGrokBuild = fingerprint.ok;
  const auth = looksLikeGrokBuild
    ? detectAuth()
    : {
        ok: false,
        detail: fingerprint.detail
      };

  return {
    ok: looksLikeGrokBuild,
    command: configured,
    path: resolved,
    version: detectVersion(resolved),
    fingerprint,
    auth
  };
}

/**
 * Build argv for official Grok Build headless mode.
 * Prefer `--prompt-file` for long prompts; use `-p` for short ones.
 * @see https://docs.x.ai/build/cli/headless-scripting
 */
export function buildHeadlessArgs(prompt, options = {}) {
  const args = ['--no-auto-update'];

  if (options.cwd) {
    args.push('--cwd', options.cwd);
  }

  if (options.model) {
    args.push('-m', options.model);
  }

  if (options.sessionId) {
    args.push('-r', options.sessionId);
  } else if (options.resume && !options.fresh) {
    args.push('-c');
  }

  if (options.tools) {
    args.push('--tools', options.tools);
  }

  if (options.disallowedTools) {
    args.push('--disallowed-tools', options.disallowedTools);
  }

  if (options.alwaysApprove) {
    args.push('--always-approve');
  }

  if (options.promptFile) {
    args.push('--prompt-file', options.promptFile);
  } else {
    args.push('-p', prompt);
  }

  return args;
}

/**
 * Run a headless Grok Build prompt (sync). Prefer runGrokPromptAsync for large prompts.
 */
export function runGrokPrompt(prompt, options = {}) {
  const command = configuredGrokCommand();
  const useFile = Boolean(options.promptFile) || Buffer.byteLength(prompt, 'utf8') > ARG_MAX_SAFE;

  if (useFile && !options.promptFile) {
    throw new Error(
      'Prompt exceeds safe argv length. Pass options.promptFile or use runGrokPromptAsync().'
    );
  }

  const args = buildHeadlessArgs(prompt, options);
  const result = run(command, args, {
    cwd: options.cwd,
    timeout: options.timeout ?? 30 * 60_000,
    maxBuffer: 50 * 1024 * 1024
  });

  if (result.error) {
    throw new Error(`Failed to run ${command}: ${result.error.message}`);
  }

  return {
    ok: result.ok,
    output: `${result.stdout}${result.stderr ? `\n\n[stderr]\n${result.stderr}` : ''}`.trim(),
    status: result.status,
    signal: result.signal,
    args
  };
}

/** Async runner that writes oversized prompts to a temp --prompt-file. */
export async function runGrokPromptAsync(prompt, options = {}) {
  if (options.promptFile || Buffer.byteLength(prompt, 'utf8') <= ARG_MAX_SAFE) {
    return runGrokPrompt(prompt, options);
  }

  const tempDir = await mkdtemp(join(tmpdir(), 'grok-plugin-'));
  const promptFile = join(tempDir, 'prompt.md');
  await writeFile(promptFile, prompt, 'utf8');

  try {
    return runGrokPrompt(prompt, { ...options, promptFile });
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function detectVersion(command) {
  for (const args of [['--version'], ['-V'], ['version']]) {
    const result = run(command, args, { timeout: 5_000 });
    if (result.ok && (result.stdout || result.stderr)) {
      return (result.stdout || result.stderr).trim().split('\n')[0];
    }
  }
  return 'unknown';
}

function detectFingerprint(command) {
  const result = run(command, ['--help'], { timeout: 8_000 });
  const output = `${result.stdout}\n${result.stderr}`;
  const hasPromptFile = /--prompt-file/.test(output);
  const hasSingle = /--single|\s-p,\s*--single/.test(output);
  const looksLikeCursorAgent = /Start the Cursor Agent|CURSOR_API_KEY/.test(output);

  if (looksLikeCursorAgent) {
    return {
      ok: false,
      detail:
        'PATH `grok` looks like Cursor Agent, not Grok Build. Install with `curl -fsSL https://x.ai/cli/install.sh | bash` or set GROK_CLI to the Grok Build binary (often ~/.grok/bin/grok).'
    };
  }

  if (hasPromptFile || hasSingle) {
    return { ok: true, detail: 'Grok Build headless flags detected.' };
  }

  return {
    ok: false,
    detail:
      'Binary does not expose Grok Build headless flags (`--prompt-file` / `-p --single`). Set GROK_CLI to the official Grok Build CLI.'
  };
}

function detectAuth() {
  if (process.env.XAI_API_KEY?.trim()) {
    return {
      ok: true,
      detail: 'XAI_API_KEY is set.'
    };
  }

  const authPath = join(homedir(), '.grok', 'auth.json');
  if (existsSync(authPath)) {
    try {
      const parsed = JSON.parse(readFileSync(authPath, 'utf8'));
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return {
          ok: true,
          detail: `Cached Grok auth found at ${authPath}.`
        };
      }
    } catch {
      // fall through
    }
  }

  return {
    ok: null,
    detail:
      'Could not verify authentication non-interactively. Run `grok login` or set XAI_API_KEY, then rerun /grok:setup.'
  };
}

#!/usr/bin/env node
/**
 * Minimal Grok Build stand-in for unit tests.
 * Records argv to FAKE_GROK_LOG and prints a deterministic response.
 */
import { appendFileSync, writeFileSync } from 'node:fs';

const logPath = process.env.FAKE_GROK_LOG;
const args = process.argv.slice(2);

if (logPath) {
  appendFileSync(logPath, `${JSON.stringify(args)}\n`, 'utf8');
}

if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(
    [
      'Grok Build TUI',
      '',
      'Usage: grok [OPTIONS] [PROMPT]',
      '',
      '  -p, --single <PROMPT>   Single-turn prompt',
      '      --prompt-file <PATH> Prompt from a file',
      '  -c, --continue          Continue most recent session',
      '  -r, --resume [ID]       Resume a session',
      '      --no-auto-update    Disable update checks',
      ''
    ].join('\n')
  );
  process.exit(0);
}

if (args.includes('--version') || args.includes('-V')) {
  process.stdout.write('grok 0.0.0-fake\n');
  process.exit(0);
}

const promptFileIdx = args.indexOf('--prompt-file');
const pIdx = args.indexOf('-p');
let prompt = '';

if (promptFileIdx !== -1 && args[promptFileIdx + 1]) {
  const { readFileSync } = await import('node:fs');
  prompt = readFileSync(args[promptFileIdx + 1], 'utf8');
} else if (pIdx !== -1 && args[pIdx + 1]) {
  prompt = args[pIdx + 1];
}

const behavior = process.env.FAKE_GROK_BEHAVIOR || 'ok';

if (behavior === 'fail') {
  process.stderr.write('fake grok failed\n');
  process.exit(1);
}

const patch = [
  '```diff',
  'diff --git a/example.txt b/example.txt',
  '--- a/example.txt',
  '+++ b/example.txt',
  '@@ -1 +1 @@',
  '-old',
  '+new',
  '```'
].join('\n');

process.stdout.write(
  [
    '# Fake Grok response',
    '',
    `Prompt length: ${prompt.length}`,
    `Args: ${args.join(' ')}`,
    '',
    patch,
    ''
  ].join('\n')
);

if (process.env.FAKE_GROK_STATE) {
  writeFileSync(
    process.env.FAKE_GROK_STATE,
    JSON.stringify({ lastArgs: args, promptLength: prompt.length }, null, 2),
    'utf8'
  );
}

process.exit(0);

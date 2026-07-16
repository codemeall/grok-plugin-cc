const VALUE_FLAGS = new Set(['--base', '--job', '--model', '--effort']);
const BOOLEAN_FLAGS = new Set([
  '--background',
  '--wait',
  '--resume',
  '--fresh',
  '--readonly',
  '--help',
  '--stdin-args'
]);

export const VALID_EFFORTS = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

// `--stdin-args` must become `flags.stdinArgs`, matching the companion's lookup.
const flagKey = (token) =>
  token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  const positionals = [];

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];

    if (token === '--') {
      // End of flags: everything after a literal `--` is task text.
      positionals.push(...rest.slice(index + 1));
      break;
    }

    if (VALUE_FLAGS.has(token)) {
      const value = rest[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${token} requires a value`);
      }
      flags[flagKey(token)] = value;
      index += 1;
      continue;
    }

    if (BOOLEAN_FLAGS.has(token)) {
      flags[flagKey(token)] = true;
      continue;
    }

    if (token.startsWith('--')) {
      throw new Error(
        `Unknown flag: ${token}. If this token is part of the task text, put it after a literal -- separator.`
      );
    }

    positionals.push(token);
  }

  if (flags.effort && !VALID_EFFORTS.includes(flags.effort)) {
    throw new Error(`Unsupported --effort "${flags.effort}". Use one of: ${VALID_EFFORTS.join(', ')}.`);
  }

  return {
    command,
    flags,
    positionals,
    task: positionals.join(' ').trim()
  };
}

export function usage() {
  return [
    'Usage:',
    '  grok-companion.mjs setup',
    '  grok-companion.mjs review [--base main] [--background] [--wait] [--model <id>] [--effort <level>]',
    '  grok-companion.mjs adversarial-review [--base main] [--background] [--wait] [--model <id>] [--effort <level>] [focus text]',
    '  grok-companion.mjs rescue <task> [--background] [--resume] [--fresh] [--wait] [--readonly] [--model <id>] [--effort <level>]',
    '  grok-companion.mjs status',
    '  grok-companion.mjs result <job-id>',
    '  grok-companion.mjs cancel <job-id>',
    '',
    'A literal -- ends flag parsing; everything after it is task text.',
    `Efforts: ${VALID_EFFORTS.join(', ')}.`,
    'Exit codes: 0 success, 1 usage/internal error, 2 the Grok run failed, was unavailable, or timed out.'
  ].join('\n');
}

export function tokenizeArguments(input) {
  const tokens = [];
  let current = '';
  let quote = null;
  let escaping = false;

  for (const char of input.trim()) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (escaping) current += '\\';
  if (quote) throw new Error(`Unclosed ${quote} quote in arguments`);
  if (current) tokens.push(current);
  return tokens;
}

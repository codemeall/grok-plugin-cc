import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderRepositoryContext } from './context.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const promptRoot = join(__dirname, '..', '..', 'prompts');

const PROMPT_BY_MODE = {
  review: 'review.md',
  'adversarial-review': 'adversarial.md',
  rescue: 'implementation.md'
};

export function buildPrompt(mode, context, options = {}) {
  const promptFile = PROMPT_BY_MODE[mode];
  if (!promptFile) throw new Error(`No prompt template for mode: ${mode}`);

  const template = readFileSync(join(promptRoot, promptFile), 'utf8');
  const testing = readFileSync(join(promptRoot, 'testing.md'), 'utf8');
  const task = options.task || defaultTask(mode);
  const flags = [
    options.base ? `Base branch: ${options.base}` : null,
    options.resume ? 'Resume requested: yes' : null,
    options.fresh ? 'Fresh session requested: yes' : null
  ].filter(Boolean).join('\n');

  return [
    template.trim(),
    '',
    testing.trim(),
    '',
    '# User Task',
    task,
    '',
    flags ? `# Options\n${flags}\n` : '',
    '# Repository Context',
    renderRepositoryContext(context)
  ].join('\n');
}

function defaultTask(mode) {
  if (mode === 'review') return 'Review the supplied repository diffs.';
  if (mode === 'adversarial-review') return 'Challenge the supplied repository state and diffs.';
  return 'Investigate and propose the next implementation steps.';
}

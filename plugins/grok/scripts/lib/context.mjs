import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { detectRepository, gatherDiffs, listTrackedFiles } from './git.mjs';

const CONTEXT_FILES = [
  'README.md',
  'CLAUDE.md',
  'AGENTS.md',
  'package.json',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'Makefile'
];

export function gatherRepositoryContext(options = {}) {
  const repo = detectRepository(options.cwd);
  if (!repo.ok) return { repo, files: [], snippets: [], diffs: null };

  const snippets = [];
  for (const file of CONTEXT_FILES) {
    const path = join(repo.root, file);
    if (!existsSync(path) || !statSync(path).isFile()) continue;
    snippets.push({
      file,
      content: truncate(readFileSync(path, 'utf8'), 12_000)
    });
  }

  return {
    repo,
    files: listTrackedFiles(repo.root),
    snippets,
    diffs: gatherDiffs(repo.root, options.base)
  };
}

export function renderRepositoryContext(context) {
  if (!context.repo.ok) {
    return `Repository: unavailable\nError: ${context.repo.error}`;
  }

  const snippets = context.snippets
    .map((entry) => `## ${entry.file}\n\n${entry.content}`)
    .join('\n\n');

  return [
    `Repository root: ${context.repo.root}`,
    `Branch: ${context.repo.branch}`,
    `HEAD: ${context.repo.head}`,
    '',
    'Tracked files sample:',
    context.files.map((file) => `- ${file}`).join('\n') || '(none)',
    '',
    'Git status:',
    context.diffs.status || '(clean)',
    '',
    'Branch diff stat:',
    context.diffs.branchStat || '(no branch diff)',
    '',
    'Current staged/unstaged diff:',
    fenced(context.diffs.currentDiff || '(no current diff)', 'diff'),
    '',
    'Branch diff:',
    fenced(context.diffs.branchDiff || '(no branch diff)', 'diff'),
    '',
    snippets ? `Repository files:\n\n${snippets}` : 'Repository files: no known context files found'
  ].join('\n');
}

function truncate(value, limit) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}\n\n[truncated ${value.length - limit} characters]`;
}

function fenced(value, language = '') {
  return `\`\`\`${language}\n${value}\n\`\`\``;
}

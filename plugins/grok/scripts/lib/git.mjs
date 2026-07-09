import { run } from './process.mjs';

export function git(args, options = {}) {
  return run('git', args, options);
}

export function detectRepository(cwd = process.cwd()) {
  const root = git(['rev-parse', '--show-toplevel'], { cwd });
  if (!root.ok) {
    return {
      ok: false,
      cwd,
      error: (root.stderr || root.stdout || 'Not a git repository').trim()
    };
  }

  const branch = git(['branch', '--show-current'], { cwd: root.stdout.trim() });
  const head = git(['rev-parse', '--short', 'HEAD'], { cwd: root.stdout.trim() });

  return {
    ok: true,
    root: root.stdout.trim(),
    branch: branch.stdout.trim() || '(detached)',
    head: head.ok ? head.stdout.trim() : '(unborn)'
  };
}

export function gatherDiffs(repoRoot, base = 'main') {
  const staged = git(['diff', '--cached', '--stat'], { cwd: repoRoot }).stdout;
  const unstaged = git(['diff', '--stat'], { cwd: repoRoot }).stdout;
  const status = git(['status', '--short'], { cwd: repoRoot }).stdout;
  const currentDiff = git(['diff', '--cached'], { cwd: repoRoot }).stdout
    + '\n'
    + git(['diff'], { cwd: repoRoot }).stdout;

  const mergeBase = git(['merge-base', base, 'HEAD'], { cwd: repoRoot });
  const branchDiffArgs = mergeBase.ok
    ? ['diff', `${mergeBase.stdout.trim()}..HEAD`]
    : ['diff', `${base}...HEAD`];
  const branchDiff = git(branchDiffArgs, { cwd: repoRoot }).stdout;
  const branchStat = git([...branchDiffArgs, '--stat'], { cwd: repoRoot }).stdout;

  return {
    base,
    status,
    stagedStat: staged,
    unstagedStat: unstaged,
    currentDiff: currentDiff.trim(),
    branchDiff: branchDiff.trim(),
    branchStat: branchStat.trim(),
    mergeBase: mergeBase.ok ? mergeBase.stdout.trim() : null
  };
}

export function listTrackedFiles(repoRoot, limit = 200) {
  const result = git(['ls-files'], { cwd: repoRoot });
  if (!result.ok) return [];
  return result.stdout
    .split('\n')
    .filter(Boolean)
    .slice(0, limit);
}

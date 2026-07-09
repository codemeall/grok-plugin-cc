export function extractPatch(output) {
  const fencedDiffs = [];
  const fencePattern = /```(?:diff|patch)\n([\s\S]*?)```/gi;
  let match;
  while ((match = fencePattern.exec(output))) {
    if (looksLikePatch(match[1])) fencedDiffs.push(match[1].trim());
  }

  if (fencedDiffs.length > 0) return fencedDiffs.join('\n\n');

  const lines = output.split('\n');
  const start = lines.findIndex((line) =>
    line.startsWith('diff --git ')
    || line.startsWith('--- ')
    || line.startsWith('Index: ')
  );

  if (start === -1) return '';
  const patch = lines.slice(start).join('\n').trim();
  return looksLikePatch(patch) ? patch : '';
}

export function looksLikePatch(value) {
  return /(^diff --git |^--- |\n\+\+\+ |\n@@ )/m.test(value);
}

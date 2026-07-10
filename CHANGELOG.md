# Changelog

## 0.2.2

- Rescue is write-capable by default (`--sandbox workspace --always-approve`), matching Codex rescue `--write`.
- Add `--readonly` for proposal-only rescue; reviews remain read-only.
- Split write vs proposal rescue prompts.

## 0.2.1

- Make all modes proposal/read-only: `--tools read_file,grep,list_dir` plus `--sandbox read-only` (including rescue).
- Add `--effort` passthrough to Grok headless runs; persist it on background jobs.
- Point slash commands at `${CLAUDE_PLUGIN_ROOT}/bin/grok-companion`; document adversarial focus text.

## 0.2.0

- Invoke official Grok Build headless mode via `--prompt-file` / `-p` (with `--no-auto-update`).
- Detect Cursor Agent masquerading as `grok` and require a real Grok Build binary.
- Treat unverified auth as UNKNOWN (not OK); document `curl …/install.sh` and `XAI_API_KEY`.
- Persist job flags; wire `--resume`/`--fresh` to Grok `-c` / fresh session; add `--model`.
- Keep rescue proposal-only (no `--always-approve`); reviews use `--tools read_file,grep,list_dir`.
- Cancel kills the process group and refuses completion overwrite; validate job IDs; reconcile stale running PIDs.
- Remove unused `--json` flag and unused `docs.md` prompt.
- Add fake-grok fixture tests, `.gitignore`, CI validate workflow, and `engines.node`.

## 0.1.0

- Initial Grok Claude Code plugin scaffold.
- Added setup, review, adversarial review, rescue, status, result, and cancel commands.
- Added persistent background jobs under `~/.grok-plugin/jobs/`.
- Added repository-aware prompt generation and Grok CLI detection.

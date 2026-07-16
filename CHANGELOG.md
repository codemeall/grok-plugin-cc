# Changelog

## 0.3.0

- **Fix critical `--stdin-args` regression:** the flag was stored under the raw key `stdin-args` while the companion checked `stdinArgs`, so every slash command silently dropped `$ARGUMENTS` (e.g. `/grok:rescue <task>` failed with "rescue requires a task"). Flag keys are now camelCased, matching the cursor-plugin-cc 0.1.1 fix.
- **Changed exit-code contract:** the companion now exits `2` when the Grok run itself fails, is unavailable, or a `--wait` times out (previously always `0`; `1` remains usage/internal error). Orchestrators can rely on exit status instead of scraping `Succeeded:` from stdout. Background dispatch, `status`, and `result` still exit `0`.
- Validate `--effort` early against the documented levels (`none, minimal, low, medium, high, xhigh, max`) instead of failing late inside the Grok CLI.
- Add `--` end-of-flags separator: task text containing `--`-prefixed tokens no longer crashes the parser; the unknown-flag error suggests it.

## 0.2.3

- Fix Claude Code auto-mode denials by replacing blanket Bash grants with narrow permissions for each `grok-companion` subcommand.
- Run the companion as a plugin-provided `bin/` command after slash-command expansion instead of using the obsolete executable code-fence form.

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

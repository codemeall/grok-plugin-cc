# Changelog

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

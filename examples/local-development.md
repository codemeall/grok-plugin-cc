# Local Development Example

Start Claude Code with the local plugin:

```bash
claude --plugin-dir ./plugins/grok
```

Ensure Grok Build is on PATH (or set `GROK_CLI`):

```bash
curl -fsSL https://x.ai/cli/install.sh | bash
export GROK_CLI="$HOME/.grok/bin/grok"   # if PATH grok is not Grok Build
```

Run:

```text
/grok:setup
/grok:review --base main --effort medium
/grok:adversarial-review --base main challenge caching design
/grok:rescue fix failing login test --background
/grok:rescue diagnose flaky test --readonly
/grok:status
/grok:result grok-...
```

- Reviews are read-only.
- Rescue writes by default (`--sandbox workspace --always-approve`); pass `--readonly` to propose only.

For marketplace testing from a local clone:

```text
/plugin marketplace add ./grok-plugin-cc
/plugin install grok@grok-plugin-cc
```

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
/grok:review --base main
/grok:rescue investigate failing login test --background
/grok:status
/grok:result grok-...
```

For marketplace testing from a local clone:

```text
/plugin marketplace add ./grok-plugin-cc
/plugin install grok@grok-plugin-cc
```

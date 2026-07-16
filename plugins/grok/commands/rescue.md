---
description: Delegate investigation or a fix to Grok. By default Grok may edit the repo (like Codex rescue --write). Use --readonly to propose only.
argument-hint: "<task> [--background] [--resume] [--fresh] [--wait] [--readonly] [--model <id>] [--effort <level>]"
disable-model-invocation: true
allowed-tools: Bash(grok-companion rescue:*) Read Grep Glob
---

# Grok Rescue

Hand the user's task to Grok. By default this is write-capable: Grok may edit files and run commands under `--sandbox workspace --always-approve`, same role as Codex `/codex:rescue` with `--write`.

Pass `--readonly` if you only want a proposed patch without edits. The user explicitly invoked this plugin command, so run the bundled `grok-companion rescue` command once through Bash with their raw arguments:

```bash
grok-companion rescue --stdin-args <<'GROK_PLUGIN_ARGS'
$ARGUMENTS
GROK_PLUGIN_ARGS
```

After Grok returns, review what changed (or the proposed patch) before presenting it as final. Preserve unrelated user changes. If the task text itself contains `--`-prefixed tokens, put it after a literal `--` separator (for example `rescue -- explain the --force flag`).

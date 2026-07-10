---
description: Delegate investigation or a fix to Grok. By default Grok may edit the repo (like Codex rescue --write). Use --readonly to propose only.
argument-hint: "<task> [--background] [--resume] [--fresh] [--wait] [--readonly] [--model <id>] [--effort <level>]"
disable-model-invocation: true
allowed-tools: Bash Read Grep Glob
---

# Grok Rescue

Hand the user's task to Grok. By default this is write-capable: Grok may edit files and run commands under `--sandbox workspace --always-approve`, same role as Codex `/codex:rescue` with `--write`.

Pass `--readonly` if you only want a proposed patch without edits.

```!
"${CLAUDE_PLUGIN_ROOT}/bin/grok-companion" rescue --stdin-args <<'GROK_PLUGIN_ARGS'
$ARGUMENTS
GROK_PLUGIN_ARGS
```

After Grok returns, review what changed (or the proposed patch) before presenting it as final. Preserve unrelated user changes.

---
description: Delegate investigation or implementation work to Grok with repository context and optional background execution.
argument-hint: "<task> [--background] [--resume] [--fresh] [--wait] [--model <id>]"
disable-model-invocation: true
allowed-tools: Bash Read Grep Glob
---

# Grok Rescue

Run the companion with the user's task. Grok may propose patches, but Claude must inspect the result before applying or presenting it.

```!
grok-companion rescue --stdin-args <<'GROK_PLUGIN_ARGS'
$ARGUMENTS
GROK_PLUGIN_ARGS
```

If Grok returns a patch, inspect it before applying. Preserve unrelated user changes.

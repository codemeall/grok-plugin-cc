---
description: Ask Grok for a read-only code review of current and branch diffs.
argument-hint: "[--base main] [--background] [--wait] [--model <id>]"
disable-model-invocation: true
allowed-tools: Bash Read Grep Glob
---

# Grok Review

Run the companion in read-only review mode. Do not modify files based on Grok output unless the user explicitly asks for follow-up implementation.

```!
grok-companion review --stdin-args <<'GROK_PLUGIN_ARGS'
$ARGUMENTS
GROK_PLUGIN_ARGS
```

After the command returns, review Grok's findings before presenting them. Prioritize concrete bugs and risks over style comments.

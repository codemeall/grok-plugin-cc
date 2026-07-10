---
description: Ask Grok to challenge architecture, tradeoffs, reliability, scalability, security, and hidden assumptions.
argument-hint: "[--base main] [--background] [--wait] [--model <id>] [--effort <level>] [focus text]"
disable-model-invocation: true
allowed-tools: Bash Read Grep Glob
---

# Grok Adversarial Review

Run the companion in read-only adversarial review mode. Do not modify files. Optional focus text after flags steers the critique (for example: `challenge caching and retry design`).

```!
"${CLAUDE_PLUGIN_ROOT}/bin/grok-companion" adversarial-review --stdin-args <<'GROK_PLUGIN_ARGS'
$ARGUMENTS
GROK_PLUGIN_ARGS
```

After the command returns, filter the critique for actionable issues, weak assumptions, and user-relevant tradeoffs.

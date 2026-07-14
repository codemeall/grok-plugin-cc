---
description: Ask Grok to challenge architecture, tradeoffs, reliability, scalability, security, and hidden assumptions.
argument-hint: "[--base main] [--background] [--wait] [--model <id>] [--effort <level>] [focus text]"
disable-model-invocation: true
allowed-tools: Bash(grok-companion adversarial-review:*) Read Grep Glob
---

# Grok Adversarial Review

Run the companion in read-only adversarial review mode. Do not modify files. Optional focus text after flags steers the critique (for example: `challenge caching and retry design`). The user explicitly invoked this plugin command, so run the bundled `grok-companion adversarial-review` command once through Bash with their raw arguments:

```bash
grok-companion adversarial-review --stdin-args <<'GROK_PLUGIN_ARGS'
$ARGUMENTS
GROK_PLUGIN_ARGS
```

After the command returns, filter the critique for actionable issues, weak assumptions, and user-relevant tradeoffs.

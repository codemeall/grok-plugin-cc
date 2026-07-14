---
description: Ask Grok for a read-only code review of current and branch diffs.
argument-hint: "[--base main] [--background] [--wait] [--model <id>] [--effort <level>]"
disable-model-invocation: true
allowed-tools: Bash(grok-companion review:*) Read Grep Glob
---

# Grok Review

Run the companion in read-only review mode. Do not modify files based on Grok output unless the user explicitly asks for follow-up implementation. The user explicitly invoked this plugin command, so run the bundled `grok-companion review` command once through Bash with their raw arguments:

```bash
grok-companion review --stdin-args <<'GROK_PLUGIN_ARGS'
$ARGUMENTS
GROK_PLUGIN_ARGS
```

After the command returns, review Grok's findings before presenting them. Prioritize concrete bugs and risks over style comments.

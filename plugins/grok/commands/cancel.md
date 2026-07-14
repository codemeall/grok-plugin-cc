---
description: Cancel a running Grok background job.
argument-hint: "<job-id>"
disable-model-invocation: true
allowed-tools: Bash(grok-companion cancel:*)
---

# Grok Cancel

The user explicitly invoked this plugin command, so run the bundled `grok-companion cancel` command once through Bash with their raw arguments:

```bash
grok-companion cancel --stdin-args <<'GROK_PLUGIN_ARGS'
$ARGUMENTS
GROK_PLUGIN_ARGS
```

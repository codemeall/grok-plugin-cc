---
description: Cancel a running Grok background job.
argument-hint: "<job-id>"
disable-model-invocation: true
allowed-tools: Bash
---

# Grok Cancel

```!
"${CLAUDE_PLUGIN_ROOT}/bin/grok-companion" cancel --stdin-args <<'GROK_PLUGIN_ARGS'
$ARGUMENTS
GROK_PLUGIN_ARGS
```

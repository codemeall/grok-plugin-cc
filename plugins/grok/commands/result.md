---
description: Show a Grok background job result, patch-like output, metadata, and log location.
argument-hint: "<job-id>"
disable-model-invocation: true
allowed-tools: Bash Read
---

# Grok Result

```!
"${CLAUDE_PLUGIN_ROOT}/bin/grok-companion" result --stdin-args <<'GROK_PLUGIN_ARGS'
$ARGUMENTS
GROK_PLUGIN_ARGS
```

Claude must review the result before presenting it as final or applying any patch.

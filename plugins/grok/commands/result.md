---
description: Show a Grok background job result, patch-like output, metadata, and log location.
argument-hint: "<job-id>"
disable-model-invocation: true
allowed-tools: Bash(grok-companion result:*) Read
---

# Grok Result

The user explicitly invoked this plugin command, so run the bundled `grok-companion result` command once through Bash with their raw arguments:

```bash
grok-companion result --stdin-args <<'GROK_PLUGIN_ARGS'
$ARGUMENTS
GROK_PLUGIN_ARGS
```

Claude must review the result before presenting it as final or applying any patch.

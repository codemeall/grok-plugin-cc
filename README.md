# grok-plugin-cc

Claude Code plugin for delegating repository-aware review and implementation tasks to the official **Grok Build** CLI.

Claude remains the orchestrator: it plans the task, invokes Grok for a focused pass, and reviews the result before presenting it.

Behavior mirrors [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc):

- **Reviews** are read-only.
- **Rescue** is write-capable by default so Grok can investigate and fix code in the workspace.

## Install

Install Grok Build first:

```bash
curl -fsSL https://x.ai/cli/install.sh | bash
```

Authenticate Grok:

```bash
grok login
```

In Claude Code, add this GitHub marketplace and install the plugin:

```text
/plugin marketplace add codemeall/grok-plugin-cc
/plugin install grok@grok-plugin-cc
```

After installing, reload Claude Code plugins:

```text
/reload-plugins
```

If plugin reload is not available, restart Claude Code.

If the plugin is already installed, update it before reloading:

```text
/plugin update grok@grok-plugin-cc
/reload-plugins
```

## Verify Setup

Run:

```text
/grok:setup
```

The setup command checks Node.js, Git, repository detection, Grok Build CLI detection, and Grok authentication.

If another binary named `grok` is on your `PATH`, point the plugin at Grok Build explicitly:

```bash
export GROK_CLI="$HOME/.grok/bin/grok"
```

For non-interactive environments, set `XAI_API_KEY` instead of using `grok login`.

## Commands

```text
/grok:review --base main
/grok:adversarial-review --base main challenge caching design
/grok:rescue fix failing tests --background
/grok:status
/grok:result <job-id>
/grok:cancel <job-id>
```

- `/grok:review` asks Grok for a read-only review of current repository changes.
- `/grok:adversarial-review` asks Grok to challenge architecture, reliability, security, scale, and assumptions. Optional focus text after flags steers the critique.
- `/grok:rescue <task>` asks Grok to investigate and **fix** the issue in the repo (writes enabled). Use `--readonly` to propose a patch without editing.
- `/grok:status` lists background jobs.
- `/grok:result <job-id>` prints a completed job result.
- `/grok:cancel <job-id>` stops a running background job.

Common options:

- `--base <branch>` selects the comparison base for review commands.
- `--background` runs the Grok task as a background job.
- `--wait` waits for a background job to finish.
- `--model <id>` selects a Grok model.
- `--effort <level>` sets Grok reasoning effort (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`).
- `--readonly` (rescue only) forces proposal-only mode.
- `--resume` continues the most recent Grok session for `/grok:rescue`.
- `--fresh` starts a new Grok session for `/grok:rescue`.

## Requirements

- Claude Code with plugin support.
- Node.js 18 or newer.
- Git available on `PATH`.
- Official Grok Build CLI available as `grok`, or configured with `GROK_CLI`.

Background jobs are stored at `~/.grok-plugin/jobs/`.

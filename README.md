# grok-plugin-cc

Claude Code plugin that delegates repository-aware execution to the official **Grok Build** CLI while Claude stays in control of planning, review, and final presentation.

The repository is laid out as a marketplace-style plugin repo:

```text
grok-plugin-cc/
  .claude-plugin/marketplace.json
  plugins/grok/
    .claude-plugin/plugin.json
    commands/
    agents/
    scripts/
    prompts/
```

The `plugins/grok` plugin name creates commands like `/grok:setup`, `/grok:review`, and `/grok:rescue`.

## Local development

From this repository:

```bash
claude --plugin-dir ./plugins/grok
```

Inside Claude Code:

```text
/grok:setup
/grok:review --base main
/grok:rescue fix failing tests --background
/grok:status
/grok:result <job-id>
```

## Marketplace install

When this repo is cloned locally, add it as a marketplace and install the plugin.

From the repository root:

```text
/plugin marketplace add .
/plugin install grok@grok-plugin-cc
```

From the parent directory:

```text
/plugin marketplace add ./grok-plugin-cc
/plugin install grok@grok-plugin-cc
```

If the repository lives somewhere else, pass the absolute or relative path to the repository root, not `plugins/grok`. `/grok:setup` prints the absolute local paths it detects.

## Requirements

- Claude Code with plugin support.
- Node.js 18 or newer.
- Git available on `PATH`.
- Official [Grok Build](https://docs.x.ai/build/overview) CLI available as `grok`, or set `GROK_CLI=/absolute/path/to/grok`.

### Install Grok Build

```bash
curl -fsSL https://x.ai/cli/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://x.ai/cli/install.ps1 | iex
```

Authenticate with `grok login`, or set `XAI_API_KEY` for non-interactive environments.

If `which grok` resolves to Cursor Agent (or another unrelated binary), point this plugin at Grok Build explicitly:

```bash
export GROK_CLI="$HOME/.grok/bin/grok"
```

Headless runs use `grok --prompt-file <path>` for long prompts and `grok -p "..."` for short ones (`--no-auto-update` is always passed).

## Commands

- `/grok:setup` checks Node.js, Git, repository state, Grok Build CLI detection, and likely authentication status.
- `/grok:review [--base main] [--background] [--wait] [--model <id>]` asks Grok for a read-only code review of current and branch diffs.
- `/grok:adversarial-review [--base main] [--background] [--wait] [--model <id>]` asks Grok to challenge architecture, tradeoffs, scale, reliability, security, and assumptions.
- `/grok:rescue <task> [--background] [--resume] [--fresh] [--wait] [--model <id>]` delegates implementation or investigation to Grok. `--resume` continues the most recent Grok session in the repo (`-c`); `--fresh` starts a new one.
- `/grok:status` lists persisted jobs.
- `/grok:result <job-id>` prints final output, patch-like content, and paths to the job `output.md` / `prompt.md` files.
- `/grok:cancel <job-id>` terminates a running background job.

Background jobs are stored at `~/.grok-plugin/jobs/`.

## Notes

Claude should review Grok output before presenting or applying it. Review and adversarial-review commands run with a read-only tool allowlist (`read_file,grep,list_dir`). Rescue is proposal-only: it does **not** pass `--always-approve`, so Grok should not silently mutate the tree; Claude inspects any patch suggestions before applying them.

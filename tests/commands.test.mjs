import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = join(__dirname, '..', 'plugins', 'grok', 'commands');

const COMMANDS = [
  ['setup', 'setup', false],
  ['review', 'review', true],
  ['adversarial-review', 'adversarial-review', true],
  ['rescue', 'rescue', true],
  ['status', 'status', false],
  ['result', 'result', true],
  ['cancel', 'cancel', true]
];

test('slash commands narrowly authorize their companion subcommand', () => {
  for (const [fileName, subcommand] of COMMANDS) {
    const source = readFileSync(join(COMMANDS_DIR, `${fileName}.md`), 'utf8');
    const suffix = ['setup', 'status'].includes(subcommand) ? '' : ':*';

    assert.match(
      source,
      new RegExp(`allowed-tools: .*Bash\\(grok-companion ${subcommand}${suffix.replace('*', '\\*')}\\)`),
      `${fileName} must authorize only its own companion invocation`
    );
    assert.doesNotMatch(source, /allowed-tools:\s+Bash(?:\s|$)/m, `${fileName} must not grant blanket Bash`);
  }
});

test('slash commands use the plugin bin command without executable fences', () => {
  for (const [fileName, subcommand, acceptsArguments] of COMMANDS) {
    const source = readFileSync(join(COMMANDS_DIR, `${fileName}.md`), 'utf8');

    assert.doesNotMatch(source, /```!/, `${fileName} must not use the obsolete executable fence`);
    assert.doesNotMatch(source, /CLAUDE_PLUGIN_ROOT/, `${fileName} should use the plugin bin PATH`);
    assert.match(source, new RegExp(`grok-companion ${subcommand}(?:\\s|\`)`));

    if (acceptsArguments) {
      assert.match(source, /\$ARGUMENTS/, `${fileName} must forward slash-command arguments`);
    }
  }
});

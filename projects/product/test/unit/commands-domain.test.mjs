import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { registerDomainsCommands } from '../../tools/cli/domains/commands.mjs';

function runtime() {
  return {
    normalizeRelativePathForBuildr(value) {
      if (value.includes('..')) throw new Error('outside commands');
      return value.replaceAll('\\', '/').replace(/^\.\//, '');
    },
    isValidAssetId: (value) => typeof value === 'string' && /^[A-Za-z0-9._-]+$/.test(value),
    toPosixRelative: (root, value) => path.relative(root, value).replaceAll(path.sep, '/'),
  };
}

test('Commands domain collection normalization 保持在 commands 子树', () => {
  const commands = registerDomainsCommands(runtime());
  assert.equal(commands.normalizeCommandCollection('commands/team/manifest.yml'), 'team');
  assert.equal(commands.normalizeCommandCollection('team'), 'team');
  assert.equal(commands.normalizeCommandCollection(null), null);
  assert.throws(() => commands.normalizeCommandCollection('manifest.yml'), /must name a nested collection/);
  assert.throws(() => commands.normalizeCommandCollection('../outside'), /outside commands/);
  assert.equal(commands.commandsManifestPath('/workspace', 'team'), path.join('/workspace', 'commands', 'team', 'manifest.yml'));
});

test('Commands manifest validator 直接覆盖 schema、重复 id 和 executable 错误', () => {
  const commands = registerDomainsCommands(runtime());
  assert.deepEqual(commands.validateCommandsManifest({ schemaVersion: 'buildr.commands/v1', commands: [] }), []);
  const errors = commands.validateCommandsManifest({
    schemaVersion: 'buildr.commands/v0',
    commands: [
      { id: 'tool', executable: 'tool', purpose: 'first' },
      { id: 'tool', executable: '../tool', purpose: '', extra: true },
    ],
  });
  assert.ok(errors.some((error) => error.includes('schemaVersion')));
  assert.ok(errors.some((error) => error.includes('Duplicate command id')));
  assert.ok(errors.some((error) => error.includes('executable')));
  assert.ok(errors.some((error) => error.includes('purpose')));
  assert.ok(errors.some((error) => error.includes('extra')));
});

test('Commands version parser 和 constraint comparator 处理边界', () => {
  const commands = registerDomainsCommands(runtime());
  assert.deepEqual(commands.parseVersion('tool version 2.3.4'), [2, 3, 4]);
  assert.deepEqual(commands.parseVersionConstraint('>=2.1.0'), { operator: '>=', version: [2, 1, 0], rawVersion: '2.1.0' });
  assert.equal(commands.versionSatisfies([2, 3, 4], commands.parseVersionConstraint('>=2.1.0')), true);
  assert.equal(commands.versionSatisfies([1, 9, 9], commands.parseVersionConstraint('>=2.1.0')), false);
  assert.equal(commands.parseVersionConstraint('not-a-version'), null);
});

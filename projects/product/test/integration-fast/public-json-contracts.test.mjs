import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { PUBLIC_JSON_SCHEMAS, withJsonSchema } from '../../tools/cli/shared/json-contracts.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const buildr = path.join(productRoot, 'tools', 'buildr');

function run(args, options = {}) {
  const result = spawnSync(process.execPath, [buildr, ...args], { cwd: productRoot, encoding: 'utf8' });
  assert.equal(result.status, options.expectedStatus ?? 0, `${args.join(' ')}: ${result.stderr || result.stdout}`);
  return options.json === false || !result.stdout.trim() ? result.stdout : JSON.parse(result.stdout);
}

test('JSON helper 只接受登记 schema 和对象 payload', () => {
  assert.deepEqual(withJsonSchema(PUBLIC_JSON_SCHEMAS.doctor, { ok: true }), {
    schemaVersion: 'buildr.doctor/v1',
    ok: true,
  });
  assert.throws(() => withJsonSchema('buildr.unknown/v1', {}), /Unknown public JSON schema/);
  assert.throws(() => withJsonSchema(PUBLIC_JSON_SCHEMAS.doctor, []), /must be an object/);
});

test('全部 workspace JSON command family 输出登记的 schemaVersion', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-json-contracts-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  run(['init', '--target', root, '--name', 'json-contracts', '--profile', 'team'], { json: false });

  const cases = [
    [['version', '--json'], PUBLIC_JSON_SCHEMAS.version],
    [['unknown-command', '--json'], PUBLIC_JSON_SCHEMAS.cliError, 2],
    [['runtime', 'list', '--json'], PUBLIC_JSON_SCHEMAS.runtimeList],
    [['doctor', '--target', root, '--json'], PUBLIC_JSON_SCHEMAS.doctor],
    [['commands', 'check', '--target', root, '--json'], PUBLIC_JSON_SCHEMAS.commandsCheck],
    [['component', 'list', '--target', root, '--json'], PUBLIC_JSON_SCHEMAS.componentList],
    [['component', 'check', 'openspec', '--target', root, '--json'], PUBLIC_JSON_SCHEMAS.componentCheck],
    [['builtin', 'list', '--target', root, '--json'], PUBLIC_JSON_SCHEMAS.builtinList],
  ];
  for (const [args, expected, expectedStatus = 0] of cases) {
    assert.equal(run(args, { expectedStatus }).schemaVersion, expected, args.join(' '));
  }
});

test('schema registry 覆盖全部当前公开 JSON family', () => {
  assert.deepEqual(Object.keys(PUBLIC_JSON_SCHEMAS).sort(), [
    'builtinList',
    'cliError',
    'commandsCheck',
    'componentCheck',
    'componentList',
    'doctor',
    'openspecBaseline',
    'openspecCheck',
    'runtimeList',
    'update',
    'updateCheck',
    'version',
  ]);
});

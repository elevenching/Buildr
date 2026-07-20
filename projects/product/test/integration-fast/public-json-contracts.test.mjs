import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { describe, test } from 'node:test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { PUBLIC_JSON_SCHEMAS, withJsonSchema } from '../../tools/cli/shared/json-contracts.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const buildr = path.join(productRoot, 'tools', 'buildr');

function run(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [buildr, ...args], { cwd: productRoot });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (status) => {
      try {
        assert.equal(status, options.expectedStatus ?? 0, `${args.join(' ')}: ${stderr || stdout}`);
        resolve(options.json === false || !stdout.trim() ? stdout : JSON.parse(stdout));
      } catch (error) {
        reject(error);
      }
    });
  });
}

describe('public JSON contracts', { concurrency: 2 }, () => {

test('JSON helper 只接受登记 schema 和对象 payload', () => {
  assert.deepEqual(withJsonSchema(PUBLIC_JSON_SCHEMAS.doctor, { ok: true }), {
    schemaVersion: 'buildr.doctor/v1',
    ok: true,
  });
  assert.throws(() => withJsonSchema('buildr.unknown/v1', {}), /Unknown public JSON schema/);
  assert.throws(() => withJsonSchema(PUBLIC_JSON_SCHEMAS.doctor, []), /must be an object/);
});

test('全部 workspace JSON command family 输出登记的 schemaVersion', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-json-contracts-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  await run(['init', '--target', root, '--name', 'json-contracts', '--profile', 'team'], { json: false });

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
    assert.equal((await run(args, { expectedStatus })).schemaVersion, expected, args.join(' '));
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

test('doctor 严格报告 workspace identity 与独立 readiness', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-doctor-identity-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  await run(['init', '--target', root, '--name', 'doctor-identity', '--profile', 'team'], { json: false });

  const initialized = await run(['doctor', '--target', root, '--json']);
  assert.equal(initialized.workspace.identity.state, 'valid');
  assert.equal(initialized.workspace.initialized, true);
  assert.equal(initialized.health.workspaceValid, true);
  assert.equal(typeof initialized.health.ready, 'boolean');
  assert.deepEqual(Object.keys(initialized.diagnosticProfile).sort(), ['conditional', 'core', 'id', 'specialty']);

  fs.rmSync(path.join(root, '.buildr', 'workspace.yml'));
  const incomplete = await run(['doctor', '--target', root, '--json'], { expectedStatus: 1 });
  assert.equal(incomplete.ok, false);
  assert.equal(incomplete.workspace.initialized, false);
  assert.equal(incomplete.workspace.identity.state, 'incomplete');
  assert.deepEqual(incomplete.workspace.identity.missing, ['.buildr/workspace.yml']);
  assert.equal(incomplete.health.workspaceValid, false);
  assert.equal(incomplete.health.ready, false);
  assert.equal(incomplete.health.actionRequired, true);
  assert.ok(incomplete.findings.some((finding) => finding.code === 'workspace.identity_incomplete'));

  fs.rmSync(path.join(root, 'AGENTS.md'));
  fs.rmSync(path.join(root, 'projects'), { recursive: true, force: true });
  const absent = await run(['doctor', '--target', root, '--json'], { expectedStatus: 1 });
  assert.equal(absent.workspace.identity.state, 'absent');
  assert.deepEqual(absent.workspace.identity.missing, ['AGENTS.md', '.buildr/workspace.yml', 'projects']);
  assert.ok(absent.findings.some((finding) => finding.code === 'workspace.not_initialized'));
});

test('Codex partial inventory warning 保持可见但不降低 doctor readiness', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-doctor-partial-inventory-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  await run(['init', '--agent', 'codex', '--target', root, '--name', 'doctor-partial-inventory', '--profile', 'team'], { json: false });

  const report = await run(['doctor', '--agent', 'codex', '--target', root, '--json']);
  const warning = report.findings.find((finding) => finding.code === 'runtime.codex_warning');
  assert.ok(warning);
  assert.equal(warning.userActionRequired, false);
  assert.deepEqual(warning.runtimeFindingCodes, ['runtime.skill_visibility_incomplete']);
  assert.equal(warning.evidence, 'partial');
  assert.deepEqual(warning.opaqueSources, ['admin', 'system', 'plugin']);
  assert.equal(report.summary.warning, 1);
  assert.equal(report.health.ready, true);
  assert.equal(report.health.actionRequired, false);
  assert.equal(report.health.actionableCount, 0);
  assert.deepEqual(report.repairPlan, []);
  assert.deepEqual(report.nextSteps, []);
});

test('doctor 对未登记 Project 只报告登记根因并输出去重 repair plan', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-doctor-orphan-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  await run(['init', '--target', root, '--name', 'doctor-orphan', '--profile', 'team'], { json: false });
  fs.mkdirSync(path.join(root, 'projects', 'orphan'), { recursive: true });

  const report = await run(['doctor', '--target', root, '--json']);
  const orphanCodes = report.findings
    .filter((finding) => finding.path === 'projects/orphan')
    .map((finding) => finding.code);
  assert.deepEqual(orphanCodes, ['projects.unregistered']);
  assert.equal(report.health.workspaceValid, true);
  assert.equal(report.health.ready, false);
  assert.equal(report.health.actionRequired, true);
  assert.equal(report.repairPlan.filter((step) => step.codes.includes('projects.unregistered')).length, 1);
  assert.equal(report.nextSteps.filter((step) => step.codes.includes('projects.unregistered')).length, 1);

  const textReport = await run(['doctor', '--target', root], { json: false });
  assert.match(textReport, /Health: workspaceValid=true ready=false actionRequired=true/);
  assert.match(textReport, /Repair plan:/);
});

});

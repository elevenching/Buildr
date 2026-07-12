#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const buildr = path.join(productRoot, 'tools', 'buildr');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-managed-integrity-'));
const workspace = path.join(fixtureRoot, 'workspace');

function run(args, options = {}) {
  const result = spawnSync(process.execPath, [buildr, ...args], {
    cwd: productRoot,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env || {}) },
  });
  if (options.expectFailure ? result.status === 0 : result.status !== 0) {
    throw new Error(`Unexpected command result (${result.status}): buildr ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

function git(args, cwd = fixtureRoot) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
}

try {
  run(['init', '--target', workspace, '--name', 'integrity-fixture']);

  for (const id of ['.', '..']) {
    const before = fs.readFileSync(path.join(workspace, 'projects', 'manifest.yml'), 'utf8');
    run(['project', 'create', id, '--target', workspace], { expectFailure: true });
    if (fs.readFileSync(path.join(workspace, 'projects', 'manifest.yml'), 'utf8') !== before) throw new Error(`Invalid Project id mutated registry: ${id}`);
  }

  const ruleFile = path.join(workspace, 'rules', 'fixture.md');
  fs.writeFileSync(ruleFile, '# Fixture\n');
  run(['rules', 'add', 'fixture', '--description', 'fixture rule', '--target', workspace]);
  run(['rules', 'remove', 'fixture', '--target', workspace]);
  if (fs.existsSync(ruleFile)) throw new Error('Normal Rule member deletion was blocked.');

  const escapedDescription = 'line one\nline "two"';
  run(['commands', 'add', 'fixture-tool', '--purpose', 'fixture', '--description', escapedDescription, '--install-hint', 'https://example.com/tool', '--target', workspace]);
  const commands = YAML.parse(fs.readFileSync(path.join(workspace, 'commands', 'manifest.yml'), 'utf8'));
  if (commands.commands.find((item) => item.id === 'fixture-tool')?.description !== escapedDescription) throw new Error('YAML escaped scalar did not round-trip.');

  const output = path.join(fixtureRoot, 'package-output');
  run(['package', 'build', '--out', output]);
  run(['package', 'build', '--out', output]);
  if (!fs.existsSync(path.join(output, '.buildr-package-output.json'))) throw new Error('Package output receipt is missing.');
  fs.appendFileSync(path.join(output, 'README.md'), '\nmodified\n');
  run(['package', 'build', '--out', output], { expectFailure: true });
  if (!fs.readFileSync(path.join(output, 'README.md'), 'utf8').includes('modified')) throw new Error('Modified package output was overwritten.');
  const unowned = path.join(fixtureRoot, 'unowned');
  fs.mkdirSync(unowned);
  fs.writeFileSync(path.join(unowned, 'keep.txt'), 'keep');
  run(['package', 'build', '--out', unowned], { expectFailure: true });
  if (fs.readFileSync(path.join(unowned, 'keep.txt'), 'utf8') !== 'keep') throw new Error('Unowned package output was modified.');
  run(['package', 'build', '--out', productRoot], { expectFailure: true });

  const projectRemoteA = path.join(fixtureRoot, 'project-a.git');
  const projectRemoteB = path.join(fixtureRoot, 'project-b.git');
  git(['init', '--bare', projectRemoteA]);
  git(['init', '--bare', projectRemoteB]);
  run(['project', 'create', 'git-project', '--repo', `file://${projectRemoteA}`, '--target', workspace]);
  run(['project', 'create', 'git-project', '--repo', `file://${projectRemoteA}`, '--target', workspace]);
  const projectRegistryBefore = fs.readFileSync(path.join(workspace, 'projects', 'manifest.yml'), 'utf8');
  run(['project', 'create', 'git-project', '--repo', `file://${projectRemoteB}`, '--target', workspace], { expectFailure: true });
  if (fs.readFileSync(path.join(workspace, 'projects', 'manifest.yml'), 'utf8') !== projectRegistryBefore) throw new Error('Project identity conflict mutated registry.');

  const serviceRemoteA = path.join(fixtureRoot, 'service-a.git');
  const serviceRemoteB = path.join(fixtureRoot, 'service-b.git');
  git(['init', '--bare', serviceRemoteA]);
  git(['init', '--bare', serviceRemoteB]);
  run(['service', 'create', 'git-project/api', `file://${serviceRemoteA}`, '--target', workspace]);
  run(['service', 'create', 'git-project/api', `file://${serviceRemoteA}`, '--target', workspace]);
  const serviceManifest = path.join(workspace, 'projects', 'git-project', 'services', 'manifest.yml');
  const serviceRegistryBefore = fs.readFileSync(serviceManifest, 'utf8');
  run(['service', 'create', 'git-project/api', `file://${serviceRemoteB}`, '--target', workspace], { expectFailure: true });
  if (fs.readFileSync(serviceManifest, 'utf8') !== serviceRegistryBefore) throw new Error('Service identity conflict mutated metadata.');

  run(['component', 'uninstall', 'openspec', '--agent', 'codex', '--target', workspace], { expectFailure: true, env: { BUILDR_FAULT_AFTER_MUTATION_WRITE: '1' } });
  run(['component', 'check', 'openspec', '--target', workspace, '--json']);
  if (!fs.existsSync(path.join(workspace, 'components', 'buildr', 'openspec', 'component.yml'))) throw new Error('Component rollback lost installed definition.');

  const transactionId = 'fixture-transaction';
  const transactionRoot = path.join(workspace, '.buildr', 'mutations', transactionId);
  fs.mkdirSync(path.join(transactionRoot, 'backup'), { recursive: true });
  const journal = { schemaVersion: 'buildr.mutation/v1', transactionId, operation: 'fixture', phase: 'rollback-failed', affectedPaths: [], snapshots: [] };
  fs.writeFileSync(path.join(transactionRoot, 'journal.json'), `${JSON.stringify(journal)}\n`);
  fs.writeFileSync(path.join(workspace, '.buildr', 'mutations', 'lock.json'), `${JSON.stringify(journal)}\n`);
  const doctor = run(['doctor', '--agent', 'codex', '--target', workspace, '--json'], { expectFailure: true });
  const doctorJson = JSON.parse(doctor.stdout);
  if (!doctorJson.findings.some((item) => item.code === 'mutation.transaction_incomplete')) throw new Error('Doctor did not report incomplete transaction.');
  run(['commands', 'remove', 'fixture-tool', '--target', workspace], { expectFailure: true });
  run(['mutation', 'recover', transactionId, '--target', workspace]);
  if (fs.existsSync(path.join(workspace, '.buildr', 'mutations', 'lock.json'))) throw new Error('Mutation recovery did not remove matching lock.');

  console.log('Managed data integrity verification passed.');
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

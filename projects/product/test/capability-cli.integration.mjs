import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import YAML from 'yaml';

const buildr = path.resolve('tools/buildr');

function run(args, expected = 0) {
  const result = spawnSync(process.execPath, [buildr, ...args], { encoding: 'utf8' });
  assert.equal(result.status, expected, `buildr ${args.join(' ')}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  return result;
}

function writeSkill(root, id) {
  const directory = path.join(root, `${id}-source`);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'SKILL.md'), `---\nname: ${id}\ndescription: ${id} fixture\n---\n\n# ${id}\n`);
  return directory;
}

function manifest(root, scope = '.') {
  const scopeRoot = scope === '.' ? root : path.join(root, scope);
  return YAML.parse(fs.readFileSync(path.join(scopeRoot, 'skills', 'manifest.yml'), 'utf8'));
}

function doctor(root, scope = '.', expected = 0) {
  const result = run(['doctor', '--target', root, '--scope', scope, '--json'], expected);
  return JSON.parse(result.stdout);
}

function consumer(result, scope, id) {
  const graph = result.capabilities.graphs.find((item) => item.scope === scope);
  return graph?.consumers.find((item) => item.consumer === id);
}

test('CLI 集成验证 provider 替换、卸载影响披露、optional 降级、歧义和 Project override', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-capability-cli-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  run(['init', '--target', root, '--name', 'capability-cli', '--profile', 'personal']);

  run([
    'skills', 'add', 'invalid-provider', '--remote-source', 'https://example.com/invalid-provider', '--scope', '.', '--target', root,
    '--provides', 'example.unknown@1',
  ], 1);
  assert.equal(manifest(root).skills.some((item) => item.id === 'invalid-provider'), false, 'unknown contract declaration must fail before write');

  const internalSource = writeSkill(root, 'internal-git');
  run([
    'skills', 'add', '--source', internalSource, '--scope', '.', '--target', root,
    '--provides', 'buildr.git-single-operation@1',
    '--provides', 'buildr.git-task-integration@1',
    '--provides', 'buildr.git-workspace-update@1',
  ]);
  let workspaceManifest = manifest(root);
  assert.equal(workspaceManifest.schemaVersion, 'buildr.skills/v2');
  assert.equal(workspaceManifest.bindings.find((item) => item.capability === 'buildr.git-task-integration').provider, 'git-ops', 'provider install must not silently change binding');

  for (const capability of ['buildr.git-single-operation@1', 'buildr.git-task-integration@1', 'buildr.git-workspace-update@1']) {
    run(['skills', 'bind', capability, '--provider', 'internal-git', '--scope', '.', '--target', root]);
  }
  const internalWorktreeSource = writeSkill(root, 'internal-worktree');
  run([
    'skills', 'add', '--source', internalWorktreeSource, '--scope', '.', '--target', root,
    '--provides', 'buildr.task-worktree-lifecycle@1',
  ]);
  assert.equal(manifest(root).bindings.find((item) => item.capability === 'buildr.task-worktree-lifecycle').provider, 'task-worktree');
  run(['skills', 'bind', 'buildr.task-worktree-lifecycle@1', '--provider', 'internal-worktree', '--scope', '.', '--target', root]);
  run(['builtin', 'uninstall', 'task-worktree', '--target', root, '--reason', 'internal replacement']);
  const uninstallGit = run(['builtin', 'uninstall', 'git-ops', '--target', root, '--reason', 'internal replacement']);
  assert.doesNotMatch(uninstallGit.stdout, /Capability dependency impact（写入前）/, 'unselected builtin must not report a false dependency impact');
  workspaceManifest = manifest(root);
  assert.equal(workspaceManifest.skills.find((item) => item.id === 'git-ops').state, 'uninstalled');
  const readyDoctor = doctor(root);
  assert.equal(consumer(readyDoctor, '.', 'task-finish').readiness, 'ready');
  assert.doesNotMatch(JSON.stringify(readyDoctor.capabilities), /sourceFile|absolutePath|skillContributions/);
  const humanDoctor = run(['doctor', '--target', root, '--scope', '.']);
  assert.match(humanDoctor.stdout, /Capability readiness（ready 只表示结构可路由）：/);
  assert.match(humanDoctor.stdout, /buildr\.git-task-integration@1 mode=required readiness=ready reason=none selected=internal-git/);

  const uninstallReview = run(['builtin', 'uninstall', 'task-asset-review', '--target', root, '--reason', 'optional fixture']);
  assert.match(uninstallReview.stdout, /\[optional\].*task-finish.*buildr\.task-asset-review@1/);
  assert.equal(consumer(doctor(root), '.', 'task-finish').readiness, 'degraded');

  run(['builtin', 'restore', 'git-ops', '--target', root]);
  const unbind = run(['skills', 'unbind', 'buildr.git-task-integration@1', '--scope', '.', '--target', root]);
  assert.match(unbind.stdout, /\[required\].*task-finish.*buildr\.git-task-integration@1/);
  const ambiguous = consumer(doctor(root, '.', 1), '.', 'task-finish');
  assert.equal(ambiguous.readiness, 'blocked');
  assert.equal(ambiguous.dependencies.find((item) => item.capability === 'buildr.git-task-integration').reason, 'ambiguous_provider');

  run(['project', 'create', 'demo', '--target', root]);
  const projectManifestPath = path.join(root, 'projects', 'demo', 'skills', 'manifest.yml');
  fs.writeFileSync(projectManifestPath, 'schemaVersion: buildr.skills/v1\nskills: []\n');
  assert.ok(doctor(root, 'projects/demo', 1).findings.some((finding) => finding.code === 'skills.schema_version_legacy'));
  const projectSource = writeSkill(root, 'project-git');
  run([
    'skills', 'add', '--source', projectSource, '--scope', 'projects/demo', '--target', root,
    '--provides', 'buildr.git-task-integration@1',
  ]);
  assert.equal(manifest(root, 'projects/demo').schemaVersion, 'buildr.skills/v2', 'v1 manifest must migrate on transactional write');
  run(['skills', 'bind', 'buildr.git-task-integration@1', '--provider', 'project-git', '--scope', 'projects/demo', '--target', root]);
  const projectFinish = consumer(doctor(root, 'projects/demo', 1), 'projects/demo', 'task-finish');
  assert.equal(projectFinish.readiness, 'degraded', 'required provider is ready while optional review remains unavailable');
  assert.equal(projectFinish.dependencies.find((item) => item.capability === 'buildr.git-task-integration').selectedProvider.id, 'project-git');

  const projectDocument = manifest(root, 'projects/demo');
  const projectContract = path.join(root, 'projects', 'demo', 'skills', 'contracts', 'buildr', 'git-task-integration', 'v1.md');
  fs.mkdirSync(path.dirname(projectContract), { recursive: true });
  fs.copyFileSync(path.join(root, 'skills', 'contracts', 'buildr', 'git-task-integration', 'v1.md'), projectContract);
  projectDocument.contracts = [{ id: 'buildr.git-task-integration', version: 1, path: 'contracts/buildr/git-task-integration/v1.md', description: 'conflicting project registration' }];
  fs.writeFileSync(projectManifestPath, YAML.stringify(projectDocument, { lineWidth: 0 }));
  const conflicted = doctor(root, 'projects/demo', 1);
  assert.ok(conflicted.findings.some((finding) => finding.code === 'capability.graph_invalid' && finding.path === 'projects/demo'));
});

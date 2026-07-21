import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

// Candidate-only owner: release history bridge idempotency and remote races.

import { bridgeMainToDev } from '../../scripts/release/bridge-main-to-dev.mjs';

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
}

function commit(cwd, message, content) {
  fs.writeFileSync(path.join(cwd, 'candidate.txt'), `${content}\n`);
  fs.mkdirSync(path.join(cwd, 'projects', 'product'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'projects', 'product', 'package.json'), '{"name":"@buildr-ai/buildr","version":"0.1.0-rc.5"}\n');
  git(cwd, 'add', 'candidate.txt', 'projects/product/package.json');
  git(cwd, 'commit', '-m', message);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-release-bridge-'));
  const remote = path.join(root, 'remote.git');
  const seed = path.join(root, 'seed');
  const work = path.join(root, 'work');
  git(root, 'init', '--bare', remote);
  fs.mkdirSync(seed);
  git(seed, 'init', '-b', 'dev');
  git(seed, 'config', 'user.name', 'Buildr Test');
  git(seed, 'config', 'user.email', 'buildr@example.com');
  commit(seed, 'base', 'base');
  git(seed, 'branch', 'main');
  commit(seed, 'candidate', 'candidate');
  const candidateTree = git(seed, 'rev-parse', 'HEAD^{tree}');
  git(seed, 'remote', 'add', 'origin', remote);
  git(seed, 'push', 'origin', 'dev');
  git(seed, 'checkout', 'main');
  commit(seed, 'squash candidate', 'candidate');
  git(seed, 'push', 'origin', 'main');
  git(root, 'clone', '--branch', 'dev', remote, work);
  git(work, 'config', 'user.name', 'Buildr Test');
  git(work, 'config', 'user.email', 'buildr@example.com');
  return { root, remote, seed, work, candidateTree };
}

test('tree-identical squash main is bridged to dev without changing the candidate tree', (t) => {
  const data = fixture();
  t.after(() => fs.rmSync(data.root, { recursive: true, force: true }));
  const result = bridgeMainToDev({ repo: data.work, candidateTree: data.candidateTree, version: '0.1.0-rc.5' });
  assert.equal(result.action, 'bridged');
  assert.equal(git(data.work, 'rev-parse', 'HEAD^{tree}'), data.candidateTree);
  assert.equal(git(data.work, 'merge-base', '--is-ancestor', 'origin/main', 'origin/dev'), '');
});

test('already-bridged main/dev history is an idempotent no-op', (t) => {
  const data = fixture();
  t.after(() => fs.rmSync(data.root, { recursive: true, force: true }));
  bridgeMainToDev({ repo: data.work, candidateTree: data.candidateTree, version: '0.1.0-rc.5' });
  const head = git(data.work, 'rev-parse', 'HEAD');
  const result = bridgeMainToDev({ repo: data.work, candidateTree: data.candidateTree, version: '0.1.0-rc.5' });
  assert.equal(result.action, 'already-bridged');
  assert.equal(git(data.work, 'rev-parse', 'HEAD'), head);
});

test('tree mismatch fails closed before creating a history bridge', (t) => {
  const data = fixture();
  t.after(() => fs.rmSync(data.root, { recursive: true, force: true }));
  const head = git(data.work, 'rev-parse', 'HEAD');
  assert.throws(
    () => bridgeMainToDev({ repo: data.work, candidateTree: `${data.candidateTree.slice(0, -1)}0`, version: '0.1.0-rc.5' }),
    /does not match the verified candidate tree/,
  );
  assert.equal(git(data.work, 'rev-parse', 'HEAD'), head);
});

test('remote ref race fails closed and preserves the local candidate', (t) => {
  const data = fixture();
  t.after(() => fs.rmSync(data.root, { recursive: true, force: true }));
  const head = git(data.work, 'rev-parse', 'HEAD');
  assert.throws(() => bridgeMainToDev({
    repo: data.work,
    candidateTree: data.candidateTree,
    version: '0.1.0-rc.5',
    beforeRemoteRecheck: () => {
      git(data.seed, 'checkout', 'dev');
      commit(data.seed, 'concurrent update', 'concurrent');
      git(data.seed, 'push', 'origin', 'dev');
    },
  }), /Remote refs changed/);
  assert.equal(git(data.work, 'rev-parse', 'HEAD'), head);
});

test('package version mismatch fails closed before creating a history bridge', (t) => {
  const data = fixture();
  t.after(() => fs.rmSync(data.root, { recursive: true, force: true }));
  const head = git(data.work, 'rev-parse', 'HEAD');
  assert.throws(
    () => bridgeMainToDev({ repo: data.work, candidateTree: data.candidateTree, version: '0.1.0-rc.6' }),
    /package version does not match/,
  );
  assert.equal(git(data.work, 'rev-parse', 'HEAD'), head);
});

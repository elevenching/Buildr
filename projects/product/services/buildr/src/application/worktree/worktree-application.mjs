import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

import { PUBLIC_JSON_SCHEMAS, withJsonSchema } from '../json-contracts.mjs';

const TASK_ID_PATTERN = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;

export function parseWorktreeList(text) {
  return text.trim().split(/\n\n+/).filter(Boolean).map((block) => {
    const entry = { path: null, head: null, branchRef: null, branch: null };
    for (const line of block.split('\n')) {
      if (line.startsWith('worktree ')) entry.path = line.slice('worktree '.length);
      else if (line.startsWith('HEAD ')) entry.head = line.slice('HEAD '.length);
      else if (line.startsWith('branch ')) {
        entry.branchRef = line.slice('branch '.length);
        entry.branch = entry.branchRef.replace(/^refs\/heads\//, '');
      }
    }
    return entry;
  });
}

export function isSafeRuntimeStaleOnly({ report, agent, identity, expectedBranch, expectedHead }) {
  const actionable = (report?.findings || []).filter((finding) => finding.userActionRequired === true);
  const staleCode = `runtime.${agent.replaceAll('-', '_')}_stale`;
  return report?.ok === true
    && report.health?.workspaceValid === true
    && report.mutations?.blocked !== true
    && actionable.length > 0
    && actionable.every((finding) => finding.code === staleCode)
    && identity?.clean === true
    && identity.branch === expectedBranch
    && identity.head === expectedHead;
}

function doctorSummary(report) {
  if (!report) return null;
  return {
    ok: report.ok,
    health: report.health,
    findings: (report.findings || []).filter((finding) => finding.userActionRequired === true).map((finding) => ({
      status: finding.status,
      code: finding.code,
      message: finding.message,
      path: finding.path || null,
    })),
  };
}

export function registerWorktreeApplication(runtime) {
  const optionValue = (...args) => runtime.optionValue(...args);
  const positionalArgs = (...args) => runtime.positionalArgs(...args);
  const assertNoUnknownOptions = (...args) => runtime.assertNoUnknownOptions(...args);
  const isSupportedAgent = (...args) => runtime.isSupportedAgent(...args);
  const getRuntimeAdapter = (...args) => runtime.getRuntimeAdapter(...args);
  const productRoot = (...args) => runtime.productRoot(...args);

  function git(cwd, args, options = {}) {
    return spawnSync('git', ['-C', cwd, ...args], {
      encoding: 'utf8',
      ...options,
    });
  }

  function buildr(args, options = {}) {
    return spawnSync(process.execPath, [path.join(productRoot(), 'bin', 'buildr.mjs'), ...args], {
      cwd: productRoot(),
      encoding: 'utf8',
      ...options,
    });
  }

  function readDoctor(agent, targetRoot) {
    const result = buildr(['doctor', '--agent', agent, '--target', targetRoot, '--json']);
    let report = null;
    try { report = JSON.parse(result.stdout); } catch { /* reported below */ }
    return { result, report };
  }

  function worktreeIdentity(targetRoot) {
    const root = git(targetRoot, ['rev-parse', '--show-toplevel']);
    const branch = git(targetRoot, ['symbolic-ref', '--quiet', '--short', 'HEAD']);
    const head = git(targetRoot, ['rev-parse', 'HEAD']);
    const status = git(targetRoot, ['status', '--porcelain']);
    if ([root, branch, head, status].some((item) => item.status !== 0)) return null;
    return {
      repository: path.resolve(root.stdout.trim()),
      branch: branch.stdout.trim(),
      head: head.stdout.trim(),
      clean: status.stdout.trim() === '',
    };
  }

  function printResult(result, json) {
    const payload = withJsonSchema(PUBLIC_JSON_SCHEMAS.worktreeCreate, result);
    if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    else {
      console.log(`Task worktree ${result.state}: ${result.worktree.path}`);
      console.log(`Branch: ${result.worktree.branch}`);
      console.log(`Bootstrap: doctor=${result.bootstrap.doctorBefore ? 'checked' : 'skipped'} sync=${result.bootstrap.sync.status} ready=${result.ready}`);
      for (const action of result.nextActions) console.log(`Next: ${action}`);
    }
    if (!result.ready) process.exitCode = 1;
    return payload;
  }

  function blocked(base, code, message, nextActions = []) {
    return {
      ...base,
      state: 'blocked',
      ready: false,
      blocked: { code, message },
      nextActions,
    };
  }

  function createTaskWorktree(args) {
    const json = args.includes('--json');
    const allowed = new Set(['--agent', '--branch', '--start-point', '--target', '--json']);
    const baseBootstrap = { doctorBefore: null, sync: { status: 'skipped', reason: 'not-created' }, doctorAfter: null };
    const requestedWorkspaceRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    let base = {
      workspaceRoot: fs.existsSync(requestedWorkspaceRoot) ? fs.realpathSync(requestedWorkspaceRoot) : requestedWorkspaceRoot,
      repository: null,
      taskId: null,
      worktree: { path: null, branch: optionValue(args, '--branch', null), head: null },
      state: 'blocked',
      treeChanged: false,
      ready: false,
      bootstrap: baseBootstrap,
      blocked: null,
      nextActions: [],
    };
    try {
      assertNoUnknownOptions(args, allowed, new Set(['--json']));
      const positions = positionalArgs(args);
      if (positions.length !== 1) throw new Error('worktree create requires exactly one <task-id>.');
      const taskId = positions[0];
      const agent = optionValue(args, '--agent', null);
      const branch = optionValue(args, '--branch', null);
      const startPoint = optionValue(args, '--start-point', 'HEAD');
      base = { ...base, taskId, agent, startPoint, worktree: { ...base.worktree, branch } };
      if (!TASK_ID_PATTERN.test(taskId)) throw new Error('Task id must use lowercase letters, numbers, dots, underscores, or hyphens without path separators.');
      if (!agent || !isSupportedAgent(agent)) throw new Error(`Unsupported or missing Agent runtime: ${agent || '(missing)'}.`);
      if (!branch) throw new Error('Missing value for --branch');
      if (!fs.existsSync(path.join(base.workspaceRoot, '.buildr', 'workspace.yml'))) throw new Error(`Buildr workspace is not initialized: ${base.workspaceRoot}`);

      const repo = git(base.workspaceRoot, ['rev-parse', '--show-toplevel']);
      if (repo.status !== 0) throw new Error(`Workspace is not a Git repository: ${base.workspaceRoot}`);
      base.repository = path.resolve(repo.stdout.trim());
      if (base.repository !== base.workspaceRoot) throw new Error('worktree create currently requires --target to be the Git repository root.');
      const branchCheck = git(base.repository, ['check-ref-format', `refs/heads/${branch}`]);
      if (branchCheck.status !== 0) throw new Error(`Invalid task branch: ${branch}`);
      const startCheck = git(base.repository, ['rev-parse', '--verify', `${startPoint}^{commit}`]);
      if (startCheck.status !== 0) throw new Error(`Invalid start point: ${startPoint}`);

      const canonicalRoot = path.join(base.workspaceRoot, '.worktrees');
      const targetRoot = path.join(canonicalRoot, taskId);
      base.worktree.path = targetRoot;
      const listed = git(base.repository, ['worktree', 'list', '--porcelain']);
      if (listed.status !== 0) throw new Error('Unable to inspect Git worktrees.');
      const worktrees = parseWorktreeList(listed.stdout);
      const atTarget = worktrees.find((item) => path.resolve(item.path) === targetRoot);
      const branchOwner = worktrees.find((item) => item.branch === branch);

      if (atTarget) {
        if (atTarget.branch !== branch) throw new Error(`Canonical worktree path is registered to branch ${atTarget.branch || '(detached)'}.`);
        const identity = worktreeIdentity(targetRoot);
        if (!identity || identity.repository !== targetRoot || identity.branch !== branch) throw new Error('Existing canonical worktree identity does not match the requested repository and branch.');
        return printResult({
          ...base,
          state: 'reused',
          treeChanged: false,
          ready: true,
          worktree: { path: targetRoot, branch, head: identity.head },
          bootstrap: { doctorBefore: null, sync: { status: 'skipped', reason: 'reused-without-tree-transition' }, doctorAfter: null },
        }, json);
      }
      if (fs.existsSync(targetRoot)) throw new Error(`Canonical worktree path is occupied but not registered: ${targetRoot}`);
      if (branchOwner) throw new Error(`Task branch is already checked out at ${branchOwner.path}`);

      fs.mkdirSync(canonicalRoot, { recursive: true });
      const branchExists = git(base.repository, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]).status === 0;
      const addArgs = branchExists
        ? ['worktree', 'add', targetRoot, branch]
        : ['worktree', 'add', '-b', branch, targetRoot, startPoint];
      const added = git(base.repository, addArgs);
      if (added.status !== 0) throw new Error((added.stderr || added.stdout || 'git worktree add failed').trim());

      let identity = worktreeIdentity(targetRoot);
      base = {
        ...base,
        state: 'created',
        treeChanged: true,
        worktree: { path: targetRoot, branch, head: identity?.head || null },
        bootstrap: { doctorBefore: null, sync: { status: 'skipped', reason: 'doctor-pending' }, doctorAfter: null },
      };
      if (!identity || identity.branch !== branch || !identity.clean) {
        return printResult(blocked(base, 'worktree.identity_changed', 'Created worktree identity is invalid or dirty; automatic sync was not attempted.', [`Inspect ${targetRoot}`]), json);
      }

      const before = readDoctor(agent, targetRoot);
      base.bootstrap.doctorBefore = doctorSummary(before.report);
      if (!before.report) {
        return printResult(blocked(base, 'worktree.doctor_failed', (before.result.stderr || 'Doctor did not return valid JSON.').trim(), [`buildr doctor --agent ${agent} --target ${targetRoot} --json`]), json);
      }
      if (before.report.health?.ready === true) {
        base.bootstrap.sync = { status: 'skipped', reason: 'doctor-ready' };
        base.bootstrap.doctorAfter = doctorSummary(before.report);
        return printResult({ ...base, ready: true, blocked: null }, json);
      }

      identity = worktreeIdentity(targetRoot);
      const safeRuntimeOnly = isSafeRuntimeStaleOnly({
        report: before.report,
        agent,
        identity,
        expectedBranch: branch,
        expectedHead: base.worktree.head,
      });
      if (!safeRuntimeOnly) {
        base.bootstrap.sync = { status: 'blocked', reason: 'doctor-findings-not-safe-for-automatic-sync' };
        return printResult(blocked(base, 'worktree.auto_sync_unsafe', 'Doctor findings are not limited to the selected Agent runtime stale allowlist.', before.report.nextSteps?.flatMap((step) => step.commands || step.command || []) || []), json);
      }

      const synced = buildr(['sync', agent, '--target', targetRoot]);
      if (synced.status !== 0) {
        base.bootstrap.sync = { status: 'blocked', reason: 'sync-failed' };
        return printResult(blocked(base, 'worktree.sync_failed', (synced.stderr || synced.stdout || 'buildr sync failed').trim(), [`Inspect ${targetRoot}`, `buildr doctor --agent ${agent} --target ${targetRoot} --json`]), json);
      }
      base.bootstrap.sync = { status: 'applied', reason: 'runtime-stale-only' };
      identity = worktreeIdentity(targetRoot);
      if (!identity || !identity.clean || identity.branch !== branch || identity.head !== base.worktree.head) {
        return printResult(blocked(base, 'worktree.post_sync_identity_changed', 'Workspace sync changed Git identity or left tracked changes; worktree was retained.', [`Inspect ${targetRoot}`]), json);
      }
      const after = readDoctor(agent, targetRoot);
      base.bootstrap.doctorAfter = doctorSummary(after.report);
      if (!after.report || after.report.health?.ready !== true) {
        return printResult(blocked(base, 'worktree.post_sync_doctor_failed', 'Final doctor did not report a ready workspace; worktree was retained.', [`buildr doctor --agent ${agent} --target ${targetRoot} --json`]), json);
      }
      return printResult({ ...base, ready: true, blocked: null }, json);
    } catch (error) {
      return printResult(blocked(base, 'worktree.preflight_failed', error.message), json);
    }
  }

  Object.assign(runtime, { createTaskWorktree, parseWorktreeList });
  return runtime;
}

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

import { PUBLIC_JSON_SCHEMAS, withJsonSchema } from '../json-contracts.mjs';

const TASK_ID_PATTERN = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;
const RECEIPT_SCHEMA = 'buildr.task-environment-receipt/v1';

function inside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function optionValues(args, option) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== option) continue;
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${option}`);
    values.push(value);
    index += 1;
  }
  return values;
}

function stablePlan(plan) {
  return plan.map((item) => ({
    selector: item.selector,
    sourcePath: item.sourcePath,
    sourceRepository: item.sourceRepository,
    checkoutPath: item.checkoutPath,
    branch: item.branch,
    startPoint: item.startPoint,
    remote: item.remote || null,
    remoteUrl: item.remoteUrl || null,
  }));
}

function planDigest(plan) {
  return `sha256-${crypto.createHash('sha256').update(JSON.stringify(stablePlan(plan))).digest('hex')}`;
}

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

export function isSafeRuntimeStaleOnly({ report, agent, identity, expectedBranch, expectedHead, allowedCodes = [] }) {
  const actionable = (report?.findings || []).filter((finding) => finding.userActionRequired === true);
  const staleCode = `runtime.${agent.replaceAll('-', '_')}_stale`;
  const disallowedErrors = (report?.findings || []).filter((finding) => finding.status === 'error' && finding.code !== staleCode && !allowedCodes.includes(finding.code));
  return (report?.ok === true || (allowedCodes.length > 0 && disallowedErrors.length === 0))
    && report.health?.workspaceValid === true
    && report.mutations?.blocked !== true
    && actionable.length > 0
    && actionable.every((finding) => finding.code === staleCode || allowedCodes.includes(finding.code))
    && identity?.clean === true
    && identity.branch === expectedBranch
    && identity.head === expectedHead;
}

function doctorSummary(report) {
  if (!report) return null;
  return {
    ok: report.ok,
    health: report.health,
    findings: (report.findings || []).map((finding) => ({
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
  const productRoot = (...args) => runtime.productRoot(...args);

  function git(cwd, args, options = {}) {
    return spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8', ...options });
  }

  function gitText(cwd, args) {
    const result = git(cwd, args);
    return result.status === 0 ? result.stdout.trim() : null;
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
    try { report = JSON.parse(result.stdout); } catch { /* reported by caller */ }
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

  function sharedGitDir(repository) {
    const value = gitText(repository, ['rev-parse', '--git-common-dir']);
    if (!value) throw new Error(`Unable to resolve shared Git metadata: ${repository}`);
    return path.resolve(repository, value);
  }

  function receiptsDir(workspaceRoot) {
    return path.join(sharedGitDir(workspaceRoot), 'buildr', 'task-environments');
  }

  function receiptPath(workspaceRoot, taskId) {
    return path.join(receiptsDir(workspaceRoot), `${taskId}.json`);
  }

  function readReceipt(workspaceRoot, taskId) {
    const file = receiptPath(workspaceRoot, taskId);
    if (!fs.existsSync(file)) return null;
    const receipt = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (receipt.schemaVersion !== RECEIPT_SCHEMA || receipt.taskId !== taskId) throw new Error(`Invalid task environment receipt: ${file}`);
    return receipt;
  }

  function writeReceipt(workspaceRoot, receipt) {
    const directory = receiptsDir(workspaceRoot);
    fs.mkdirSync(directory, { recursive: true });
    const file = receiptPath(workspaceRoot, receipt.taskId);
    const temporary = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(receipt, null, 2)}\n`);
    fs.renameSync(temporary, file);
    return file;
  }

  function isolation() {
    return {
      source: 'isolated',
      gitMetadata: 'shared',
      localRuntime: 'namespaced-or-declared',
      externalSystems: 'project-owned',
      notes: [
        'Git working trees and indexes are isolated; objects, refs, and worktree metadata are shared by each repository.',
        'External dependencies keep their Project-defined environment; only shared mutable state needs an existing tenant, account, data prefix, serialization, or explicit authorization boundary.',
      ],
    };
  }

  function sourceDescriptor({ selector, entityType, sourcePath, source, workspaceRoot, environmentRoot, branch, startPoint }) {
    const sourceRepository = fs.realpathSync(path.resolve(workspaceRoot, sourcePath));
    const actualRoot = gitText(sourceRepository, ['rev-parse', '--show-toplevel']);
    if (!actualRoot || path.resolve(actualRoot) !== sourceRepository) throw new Error(`${selector} source is not an independent Git repository: ${sourcePath}`);
    const remote = source.git?.remote || null;
    const remoteUrl = remote ? gitText(sourceRepository, ['remote', 'get-url', remote]) : null;
    if (remote && !remoteUrl) throw new Error(`${selector} declared remote is missing: ${remote}`);
    if (source.git?.url && !runtime.sameGitIdentity(source.git.url, remoteUrl)) {
      throw new Error(`${selector} remote identity conflicts with its registry declaration.`);
    }
    let resolvedStart = startPoint || source.git?.integrationBranch || 'HEAD';
    if (git(sourceRepository, ['rev-parse', '--verify', `${resolvedStart}^{commit}`]).status !== 0 && remote) {
      const remoteStart = `${remote}/${resolvedStart}`;
      if (git(sourceRepository, ['rev-parse', '--verify', `${remoteStart}^{commit}`]).status === 0) resolvedStart = remoteStart;
    }
    if (git(sourceRepository, ['rev-parse', '--verify', `${resolvedStart}^{commit}`]).status !== 0) {
      throw new Error(`${selector} start point is unavailable: ${resolvedStart}`);
    }
    return {
      selector,
      entityType,
      sourcePath: sourcePath.split(path.sep).join('/'),
      sourceRepository,
      checkoutPath: path.resolve(environmentRoot, sourcePath),
      branch,
      startPoint: resolvedStart,
      remote,
      remoteUrl,
    };
  }

  function resolvePlan({ workspaceRoot, taskId, agent, branch, rootStartPoint, includes }) {
    const environmentRoot = path.join(workspaceRoot, '.worktrees', taskId);
    const root = sourceDescriptor({
      selector: 'workspace', entityType: 'workspace', sourcePath: '.',
      source: { type: 'git' }, workspaceRoot, environmentRoot, branch, startPoint: rootStartPoint,
    });
    const plan = [root];
    const seen = new Set(['workspace']);
    const projects = runtime.readProjectRegistryRecord(workspaceRoot);
    if (projects.registry.migrationRequired) throw new Error('Project registry migration is required before creating a task environment.');
    for (const selector of includes) {
      if (seen.has(selector)) continue;
      seen.add(selector);
      if (selector.startsWith('project:')) {
        const code = selector.slice('project:'.length);
        const project = projects.projects[code];
        if (!project) throw new Error(`Unknown task environment selector: ${selector}`);
        if (project.source.type !== 'git') throw new Error(`${selector} is not an independent Git Project.`);
        plan.push(sourceDescriptor({
          selector, entityType: 'project', sourcePath: project.source.path, source: project.source,
          workspaceRoot, environmentRoot, branch,
        }));
        continue;
      }
      if (selector.startsWith('service:')) {
        const ref = selector.slice('service:'.length);
        const [projectCode, serviceCode, ...extra] = ref.split('/');
        if (!projectCode || !serviceCode || extra.length) throw new Error(`Invalid Service selector: ${selector}`);
        const project = projects.projects[projectCode];
        if (!project) throw new Error(`Unknown Project in selector: ${selector}`);
        if (project.source.type === 'git' && !seen.has(`project:${projectCode}`)) {
          throw new Error(`${selector} requires explicit selector project:${projectCode} because its Project is an independent Git repository.`);
        }
        const services = runtime.readServiceRegistryRecord(workspaceRoot, projectCode);
        if (services.registry.migrationRequired) throw new Error(`Service registry migration is required: ${projectCode}`);
        const service = services.services[serviceCode];
        if (!service) throw new Error(`Unknown task environment selector: ${selector}`);
        if (service.source.type !== 'git') throw new Error(`${selector} is not an independent Git Service.`);
        plan.push(sourceDescriptor({
          selector, entityType: 'service', sourcePath: service.source.path, source: service.source,
          workspaceRoot, environmentRoot, branch,
        }));
        continue;
      }
      throw new Error(`Unsupported task environment selector: ${selector}`);
    }
    plan.sort((left, right) => left.sourcePath.split('/').length - right.sourcePath.split('/').length || left.sourcePath.localeCompare(right.sourcePath));
    for (const item of plan) {
      if (!inside(workspaceRoot, item.sourceRepository)) throw new Error(`${item.selector} source escapes the Workspace.`);
      if (!inside(environmentRoot, item.checkoutPath)) throw new Error(`${item.selector} checkout escapes the task environment.`);
      const parent = [...plan]
        .filter((candidate) => candidate !== item && inside(candidate.checkoutPath, item.checkoutPath))
        .sort((left, right) => right.checkoutPath.length - left.checkoutPath.length)[0];
      if (!parent) continue;
      const relative = path.relative(parent.checkoutPath, item.checkoutPath).split(path.sep).join('/');
      if (git(parent.sourceRepository, ['ls-files', '--error-unmatch', '--', relative]).status === 0) {
        throw new Error(`${item.selector} target is tracked by parent repository ${parent.selector}: ${relative}`);
      }
    }
    return { workspaceRoot, taskId, agent, branch, environmentRoot, repositories: plan, digest: planDigest(plan) };
  }

  function preflightPlan(plan) {
    const branchCheck = git(plan.workspaceRoot, ['check-ref-format', `refs/heads/${plan.branch}`]);
    if (branchCheck.status !== 0) throw new Error(`Invalid task branch: ${plan.branch}`);
    for (const item of plan.repositories) {
      const listed = git(item.sourceRepository, ['worktree', 'list', '--porcelain']);
      if (listed.status !== 0) throw new Error(`Unable to inspect Git worktrees: ${item.selector}`);
      const worktrees = parseWorktreeList(listed.stdout);
      const atTarget = worktrees.find((entry) => path.resolve(entry.path) === item.checkoutPath);
      const branchOwner = worktrees.find((entry) => entry.branch === item.branch);
      if (atTarget && atTarget.branch !== item.branch) throw new Error(`${item.selector} target is registered to branch ${atTarget.branch || '(detached)'}.`);
      if (!atTarget && branchOwner) throw new Error(`${item.selector} task branch is already checked out at ${branchOwner.path}`);
      if (!atTarget && fs.existsSync(item.checkoutPath)) throw new Error(`${item.selector} target is occupied but not registered: ${item.checkoutPath}`);
      item.preflightState = atTarget ? 'reused' : 'create';
    }
    const existing = readReceipt(plan.workspaceRoot, plan.taskId);
    if (existing && existing.planDigest !== plan.digest) throw new Error('Task environment exists with a different repository plan.');
    return existing;
  }

  function publicRepository(item, state, identity = null, blocked = null) {
    return {
      selector: item.selector,
      entityType: item.entityType,
      sourcePath: item.sourcePath,
      sourceRepository: item.sourceRepository,
      checkoutPath: item.checkoutPath,
      branch: item.branch,
      startPoint: item.startPoint,
      head: identity?.head || null,
      clean: identity?.clean ?? null,
      remote: item.remote,
      remoteUrl: item.remoteUrl,
      state,
      blocked,
    };
  }

  function baseResult({ workspaceRoot, taskId = null, agent = null, branch = null, environmentRoot = null }) {
    return {
      workspaceRoot,
      repository: null,
      taskId,
      agent,
      environment: { root: environmentRoot, owner: agent, state: 'blocked', isolation: isolation() },
      repositories: [],
      worktree: { path: environmentRoot, branch, head: null },
      state: 'blocked',
      treeChanged: false,
      ready: false,
      bootstrap: { doctorBefore: null, sync: { status: 'skipped', reason: 'not-created' }, doctorAfter: null },
      blocked: null,
      nextActions: [],
    };
  }

  function blockedResult(base, code, message, nextActions = []) {
    return {
      ...base,
      state: 'blocked',
      ready: false,
      environment: { ...base.environment, state: 'blocked' },
      blocked: { code, message },
      nextActions,
    };
  }

  function printCreateResult(result, json) {
    const payload = withJsonSchema(PUBLIC_JSON_SCHEMAS.worktreeCreate, result);
    if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    else {
      console.log(`Task environment ${result.state}: ${result.environment.root}`);
      console.log(`Branch: ${result.worktree.branch}`);
      console.log(`Repositories: ${result.repositories.map((item) => `${item.selector}=${item.state}`).join(', ') || 'none'}`);
      console.log(`Bootstrap: doctor=${result.bootstrap.doctorBefore ? 'checked' : 'skipped'} sync=${result.bootstrap.sync.status} ready=${result.ready}`);
      for (const action of result.nextActions) console.log(`Next: ${action}`);
    }
    if (!result.ready) process.exitCode = 1;
    return payload;
  }

  function bootstrapRoot(base, plan, rootIdentity) {
    const before = readDoctor(plan.agent, plan.environmentRoot);
    base.bootstrap.doctorBefore = doctorSummary(before.report);
    if (!before.report) return blockedResult(base, 'worktree.doctor_failed', (before.result.stderr || 'Doctor did not return valid JSON.').trim(), [`Inspect ${plan.environmentRoot}`]);
    if (before.report.health?.ready === true) {
      base.bootstrap.sync = { status: 'skipped', reason: 'doctor-ready' };
      base.bootstrap.doctorAfter = doctorSummary(before.report);
      return base;
    }
    const expectedTaskDrift = new Set(['project.git_branch_drift', 'service.branch_mismatch']);
    const actionable = before.report.findings || [];
    if (plan.repositories.length > 1 && actionable.length > 0 && actionable.every((finding) => expectedTaskDrift.has(finding.code)) && !(before.report.findings || []).some((finding) => finding.status === 'error')) {
      base.bootstrap.sync = { status: 'skipped', reason: 'task-environment-branch-drift' };
      base.bootstrap.doctorAfter = doctorSummary(before.report);
      return base;
    }
    const identity = worktreeIdentity(plan.environmentRoot);
    if (!isSafeRuntimeStaleOnly({
      report: before.report,
      agent: plan.agent,
      identity,
      expectedBranch: plan.branch,
      expectedHead: rootIdentity.head,
      allowedCodes: plan.repositories.length > 1 ? [...expectedTaskDrift] : [],
    })) {
      base.bootstrap.sync = { status: 'blocked', reason: 'doctor-findings-not-safe-for-automatic-sync' };
      return blockedResult(base, 'worktree.auto_sync_unsafe', 'Doctor findings are not limited to the selected Agent runtime stale allowlist.', before.report.nextSteps?.flatMap((step) => step.commands || step.command || []) || []);
    }
    const synced = buildr(['sync', plan.agent, '--target', plan.environmentRoot]);
    if (synced.status !== 0) {
      base.bootstrap.sync = { status: 'blocked', reason: 'sync-failed' };
      return blockedResult(base, 'worktree.sync_failed', (synced.stderr || synced.stdout || 'buildr sync failed').trim(), [`Inspect ${plan.environmentRoot}`]);
    }
    base.bootstrap.sync = { status: 'applied', reason: 'runtime-stale-only' };
    const finalIdentity = worktreeIdentity(plan.environmentRoot);
    if (!finalIdentity || !finalIdentity.clean || finalIdentity.branch !== plan.branch || finalIdentity.head !== rootIdentity.head) {
      return blockedResult(base, 'worktree.post_sync_identity_changed', 'Workspace sync changed Git identity or left tracked changes; task environment was retained.', [`Inspect ${plan.environmentRoot}`]);
    }
    const after = readDoctor(plan.agent, plan.environmentRoot);
    base.bootstrap.doctorAfter = doctorSummary(after.report);
    if (!after.report || after.report.health?.ready !== true) return blockedResult(base, 'worktree.post_sync_doctor_failed', 'Final doctor did not report a ready Workspace; task environment was retained.', [`Inspect ${plan.environmentRoot}`]);
    return base;
  }

  function createTaskWorktree(args) {
    const json = args.includes('--json');
    const allowed = new Set(['--agent', '--branch', '--start-point', '--include', '--target', '--json']);
    const requested = path.resolve(optionValue(args, '--target', process.cwd()));
    const workspaceRoot = fs.existsSync(requested) ? fs.realpathSync(requested) : requested;
    let base = baseResult({ workspaceRoot });
    let receipt = null;
    try {
      assertNoUnknownOptions(args, allowed, new Set(['--json']));
      const positions = positionalArgs(args);
      if (positions.length !== 1) throw new Error('worktree create requires exactly one <task-id>.');
      const taskId = positions[0];
      const agent = optionValue(args, '--agent', null);
      const branch = optionValue(args, '--branch', null);
      const rootStartPoint = optionValue(args, '--start-point', 'HEAD');
      const includes = optionValues(args, '--include');
      const environmentRoot = path.join(workspaceRoot, '.worktrees', taskId);
      base = baseResult({ workspaceRoot, taskId, agent, branch, environmentRoot });
      if (!TASK_ID_PATTERN.test(taskId)) throw new Error('Task id must use lowercase letters, numbers, dots, underscores, or hyphens without path separators.');
      if (!agent || !isSupportedAgent(agent)) throw new Error(`Unsupported or missing Agent runtime: ${agent || '(missing)'}.`);
      if (!branch) throw new Error('Missing value for --branch');
      if (!fs.existsSync(path.join(workspaceRoot, '.buildr', 'workspace.yml'))) throw new Error(`Buildr Workspace is not initialized: ${workspaceRoot}`);
      const repository = gitText(workspaceRoot, ['rev-parse', '--show-toplevel']);
      if (!repository || path.resolve(repository) !== workspaceRoot) throw new Error('worktree create currently requires --target to be the Workspace root Git repository.');
      const plan = resolvePlan({ workspaceRoot, taskId, agent, branch, rootStartPoint, includes });
      base.repository = workspaceRoot;
      receipt = preflightPlan(plan);
      let treeChanged = false;
      const repositoryResults = [];
      for (const item of plan.repositories) {
        let state = item.preflightState;
        if (state === 'create') {
          fs.mkdirSync(path.dirname(item.checkoutPath), { recursive: true });
          const branchExists = git(item.sourceRepository, ['show-ref', '--verify', '--quiet', `refs/heads/${item.branch}`]).status === 0;
          const addArgs = branchExists
            ? ['worktree', 'add', item.checkoutPath, item.branch]
            : ['worktree', 'add', '-b', item.branch, item.checkoutPath, item.startPoint];
          const added = process.env.BUILDR_FAULT_WORKTREE_ADD_SELECTOR === item.selector
            ? { status: 1, stdout: '', stderr: `Injected worktree add failure: ${item.selector}` }
            : git(item.sourceRepository, addArgs);
          if (added.status !== 0) {
            const message = (added.stderr || added.stdout || 'git worktree add failed').trim();
            repositoryResults.push(publicRepository(item, 'blocked', null, { code: 'worktree.add_failed', message }));
            base = blockedResult({ ...base, treeChanged, repositories: repositoryResults }, 'worktree.partial_create_failed', message, [`Inspect ${item.checkoutPath}`]);
            receipt = {
              schemaVersion: RECEIPT_SCHEMA, taskId, agent, workspaceRoot, environmentRoot,
              planDigest: plan.digest, state: 'blocked', repositories: repositoryResults, isolation: isolation(), updatedAt: new Date().toISOString(),
            };
            writeReceipt(workspaceRoot, receipt);
            return printCreateResult(base, json);
          }
          treeChanged = true;
          state = 'created';
        }
        const identity = worktreeIdentity(item.checkoutPath);
        if (!identity || identity.repository !== item.checkoutPath || identity.branch !== item.branch) {
          repositoryResults.push(publicRepository(item, 'blocked', identity, { code: 'worktree.identity_changed', message: 'Checkout identity does not match the repository plan.' }));
          base = blockedResult({ ...base, treeChanged, repositories: repositoryResults }, 'worktree.identity_changed', `${item.selector} checkout identity is invalid.`, [`Inspect ${item.checkoutPath}`]);
          writeReceipt(workspaceRoot, {
            schemaVersion: RECEIPT_SCHEMA, taskId, agent, workspaceRoot, environmentRoot,
            planDigest: plan.digest, state: 'blocked', repositories: repositoryResults, isolation: isolation(), updatedAt: new Date().toISOString(),
          });
          return printCreateResult(base, json);
        }
        if (item.entityType === 'project') {
          for (const relative of ['openspec/specs', 'openspec/knowledge', 'openspec/changes', 'services']) {
            fs.mkdirSync(path.join(item.checkoutPath, relative), { recursive: true });
          }
        }
        repositoryResults.push(publicRepository(item, state, identity));
        if (item.selector === 'workspace') {
          base = { ...base, treeChanged, repositories: repositoryResults, worktree: { path: environmentRoot, branch, head: identity.head } };
        }
      }
      const rootIdentity = repositoryResults[0];
      base = plan.repositories[0].preflightState === 'create'
        ? bootstrapRoot({ ...base, repositories: repositoryResults }, plan, worktreeIdentity(environmentRoot))
        : { ...base, repositories: repositoryResults, bootstrap: { doctorBefore: null, sync: { status: 'skipped', reason: 'reused-without-tree-transition' }, doctorAfter: null } };
      if (base.blocked) {
        writeReceipt(workspaceRoot, {
          schemaVersion: RECEIPT_SCHEMA, taskId, agent, workspaceRoot, environmentRoot,
          planDigest: plan.digest, state: 'blocked', repositories: repositoryResults, isolation: isolation(), updatedAt: new Date().toISOString(),
        });
        return printCreateResult(base, json);
      }
      receipt = {
        schemaVersion: RECEIPT_SCHEMA,
        taskId,
        agent,
        workspaceRoot,
        environmentRoot,
        planDigest: plan.digest,
        state: 'ready',
        repositories: repositoryResults,
        isolation: isolation(),
        updatedAt: new Date().toISOString(),
      };
      writeReceipt(workspaceRoot, receipt);
      return printCreateResult({
        ...base,
        repository: workspaceRoot,
        repositories: repositoryResults,
        worktree: { path: environmentRoot, branch, head: rootIdentity.head },
        environment: { root: environmentRoot, owner: agent, state: 'ready', isolation: isolation() },
        state: treeChanged ? 'created' : 'reused',
        treeChanged,
        ready: true,
        blocked: null,
        nextActions: [],
      }, json);
    } catch (error) {
      return printCreateResult(blockedResult(base, 'worktree.preflight_failed', error.message), json);
    }
  }

  function findEnvironmentReceipt(requestedPath) {
    const start = fs.realpathSync(requestedPath);
    let cursor = fs.statSync(start).isDirectory() ? start : path.dirname(start);
    while (true) {
      if (fs.existsSync(path.join(cursor, '.buildr', 'workspace.yml'))) {
        const common = gitText(cursor, ['rev-parse', '--git-common-dir']);
        if (common) {
          const directory = path.join(path.resolve(cursor, common), 'buildr', 'task-environments');
          if (fs.existsSync(directory)) {
            for (const name of fs.readdirSync(directory).filter((entry) => entry.endsWith('.json')).sort()) {
              try {
                const receipt = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
                if (receipt.schemaVersion === RECEIPT_SCHEMA && path.resolve(receipt.environmentRoot) === cursor) return receipt;
              } catch { /* ignore unrelated invalid local state */ }
            }
          }
        }
      }
      const parent = path.dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
    return null;
  }

  function contextFromReceipt(receipt, requestedPath = receipt.environmentRoot) {
    const requestPath = fs.realpathSync(requestedPath);
    const repositories = receipt.repositories.map((record) => {
      const identity = fs.existsSync(record.checkoutPath) ? worktreeIdentity(record.checkoutPath) : null;
      return { ...record, head: identity?.head || null, clean: identity?.clean ?? null, currentBranch: identity?.branch || null, identityMatches: Boolean(identity && identity.repository === record.checkoutPath && identity.branch === record.branch) };
    });
    const membership = [...repositories]
      .filter((item) => inside(item.checkoutPath, requestPath))
      .sort((left, right) => right.checkoutPath.length - left.checkoutPath.length)[0] || null;
    const ready = receipt.state === 'ready' && repositories.every((item) => item.identityMatches) && Boolean(membership);
    return {
      taskId: receipt.taskId,
      owner: receipt.agent,
      workspaceRoot: receipt.workspaceRoot,
      environmentRoot: receipt.environmentRoot,
      requestedPath: requestPath,
      membership: membership ? { selector: membership.selector, checkoutPath: membership.checkoutPath } : null,
      repositories,
      allowedExecutionRoots: repositories.map((item) => item.checkoutPath),
      cliSource: path.join(productRoot(), 'bin', 'buildr.mjs'),
      cliWithinEnvironment: inside(receipt.environmentRoot, productRoot()),
      state: ready ? 'ready' : 'blocked',
      ready,
      isolation: receipt.isolation || isolation(),
      blocked: ready ? null : { code: membership ? 'worktree.context_identity_mismatch' : 'worktree.context_path_mismatch', message: membership ? 'One or more task environment repository identities do not match the receipt.' : 'Requested path is outside the task environment repository set.' },
      nextActions: ready ? [] : [`Run buildr worktree inspect ${receipt.taskId} --target ${receipt.workspaceRoot} --json`],
    };
  }

  function printContext(result, json) {
    const payload = withJsonSchema(PUBLIC_JSON_SCHEMAS.taskEnvironmentContext, result);
    if (json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    else {
      console.log(`Task environment ${result.state}: ${result.environmentRoot}`);
      console.log(`Task: ${result.taskId}; owner: ${result.owner}`);
      console.log(`Current repository: ${result.membership?.selector || 'outside environment'}`);
      console.log(`Repositories: ${result.repositories.map((item) => `${item.selector}:${item.identityMatches ? 'ready' : 'mismatch'}`).join(', ')}`);
    }
    if (!result.ready) process.exitCode = 1;
    return payload;
  }

  function inspectTaskEnvironment(args) {
    const json = args.includes('--json');
    assertNoUnknownOptions(args, new Set(['--target', '--json']), new Set(['--json']));
    const positions = positionalArgs(args);
    if (positions.length !== 1) throw new Error('worktree inspect requires exactly one <task-id>.');
    const workspaceRoot = fs.realpathSync(path.resolve(optionValue(args, '--target', process.cwd())));
    const receipt = readReceipt(workspaceRoot, positions[0]);
    if (!receipt) return printContext({
      taskId: positions[0], owner: null, workspaceRoot, environmentRoot: null, requestedPath: workspaceRoot,
      membership: null, repositories: [], allowedExecutionRoots: [], cliSource: path.join(productRoot(), 'bin', 'buildr.mjs'), cliWithinEnvironment: false,
      state: 'blocked', ready: false, isolation: isolation(), blocked: { code: 'worktree.receipt_missing', message: 'Task environment receipt was not found.' }, nextActions: [],
    }, json);
    return printContext(contextFromReceipt(receipt), json);
  }

  function taskEnvironmentContext(args) {
    const json = args.includes('--json');
    assertNoUnknownOptions(args, new Set(['--target', '--json']), new Set(['--json']));
    if (positionalArgs(args).length) throw new Error('worktree context does not accept positional arguments.');
    const requestedPath = path.resolve(optionValue(args, '--target', process.cwd()));
    if (!fs.existsSync(requestedPath)) throw new Error(`Context target does not exist: ${requestedPath}`);
    const receipt = findEnvironmentReceipt(requestedPath);
    if (!receipt) return printContext({
      taskId: null, owner: null, workspaceRoot: null, environmentRoot: null, requestedPath,
      membership: null, repositories: [], allowedExecutionRoots: [], cliSource: path.join(productRoot(), 'bin', 'buildr.mjs'), cliWithinEnvironment: false,
      state: 'blocked', ready: false, isolation: isolation(), blocked: { code: 'worktree.not_task_environment', message: 'Requested path is not owned by a task environment receipt.' }, nextActions: [],
    }, json);
    return printContext(contextFromReceipt(receipt, requestedPath), json);
  }

  Object.assign(runtime, {
    createTaskWorktree,
    inspectTaskEnvironment,
    taskEnvironmentContext,
    parseWorktreeList,
  });
  return runtime;
}

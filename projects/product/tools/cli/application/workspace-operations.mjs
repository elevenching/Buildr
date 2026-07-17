import {
  fs,
  path,
  process,
  RUNTIME_ADAPTERS,
  SUPPORTED_AGENT_IDS,
  UNSUPPORTED_AGENT_GUIDANCE,
  isSupportedAgent,
} from '../shared/platform.mjs';
import { PUBLIC_JSON_SCHEMAS, withJsonSchema } from '../shared/json-contracts.mjs';

export function registerApplicationWorkspaceOperations(runtime) {
  const discoverDoctorScopes = (...args) => runtime.discoverDoctorScopes(...args);
  const diagnoseProjectRegistry = (...args) => runtime.diagnoseProjectRegistry(...args);
  const diagnoseWorkspace = (...args) => runtime.diagnoseWorkspace(...args);
  const diagnoseLegacyPractices = (...args) => runtime.diagnoseLegacyPractices(...args);
  const diagnoseHierarchy = (...args) => runtime.diagnoseHierarchy(...args);
  const diagnoseServices = (...args) => runtime.diagnoseServices(...args);
  const diagnoseRuntime = (...args) => runtime.diagnoseRuntime(...args);
  const diagnoseCommands = (...args) => runtime.diagnoseCommands(...args);
  const diagnoseComponents = (...args) => runtime.diagnoseComponents(...args);
  const diagnoseSkillsManifestSchemas = (...args) => runtime.diagnoseSkillsManifestSchemas(...args);
  const diagnoseSkillCapabilities = (...args) => runtime.diagnoseSkillCapabilities(...args);
  const syncPackageBuiltins = (...args) => runtime.syncPackageBuiltins(...args);
  const finalizeDoctorResult = (...args) => runtime.finalizeDoctorResult(...args);
  const printDoctorReport = (...args) => runtime.printDoctorReport(...args);
  const positionalArgs = (...args) => runtime.positionalArgs(...args);
  const syncPackageComponents = (...args) => runtime.syncPackageComponents(...args);
  const readPackageManifest = (...args) => runtime.readPackageManifest(...args);
  const parseManifestFileEntry = (...args) => runtime.parseManifestFileEntry(...args);
  const diagnoseRules = (...args) => runtime.diagnoseRules(...args);
  const assertName = (...args) => runtime.assertName(...args);
  const assertAgentId = (...args) => runtime.assertAgentId(...args);
  const renderSkillsManifestYaml = (...args) => runtime.renderSkillsManifestYaml(...args);
  const trackWrite = (...args) => runtime.trackWrite(...args);
  const printResult = (...args) => runtime.printResult(...args);
  const optionValue = (...args) => runtime.optionValue(...args);
  const ensureDirectory = (...args) => runtime.ensureDirectory(...args);
  const atomicWriteJson = (...args) => runtime.atomicWriteJson(...args);
  const mutationStateRoot = (...args) => runtime.mutationStateRoot(...args);
  const mutationLockPath = (...args) => runtime.mutationLockPath(...args);
  const mutationRecoveryReceiptPath = (...args) => runtime.mutationRecoveryReceiptPath(...args);
  const restoreMutationSnapshot = (...args) => runtime.restoreMutationSnapshot(...args);
  const removeMutationRestoreTarget = (...args) => runtime.removeMutationRestoreTarget(...args);
  const withWorkspaceMutation = (...args) => runtime.withWorkspaceMutation(...args);
  const packageRoot = (...args) => runtime.packageRoot(...args);
  const writeMappedFileIfMissing = (...args) => runtime.writeMappedFileIfMissing(...args);
  const appendGitignoreEntries = (...args) => runtime.appendGitignoreEntries(...args);
  const hasFlag = (...args) => runtime.hasFlag(...args);
  const toPosixRelative = (...args) => runtime.toPosixRelative(...args);
  const existsDirectory = (...args) => runtime.existsDirectory(...args);
  const existsFile = (...args) => runtime.existsFile(...args);
  const ensureRootRequiredBlock = (...args) => runtime.ensureRootRequiredBlock(...args);
  const assertInitializedBuildrWorkspace = (...args) => runtime.assertInitializedBuildrWorkspace(...args);
  const addDoctorFinding = (...args) => runtime.addDoctorFinding(...args);

  function bootstrapGuide() {
    const guidePath = path.join(packageRoot(), 'bootstrap', 'guide.md');
    if (!existsFile(guidePath)) {
      throw new Error(`Bootstrap guide not found: ${guidePath}`);
    }
    process.stdout.write(fs.readFileSync(guidePath, 'utf8'));
  }

  function mutationTransactions(targetRoot) {
    const stateRoot = mutationStateRoot(targetRoot);
    if (!existsDirectory(stateRoot)) return [];
    return fs.readdirSync(stateRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const transactionRoot = path.join(stateRoot, entry.name);
        const journalFile = path.join(transactionRoot, 'journal.json');
        let journal = null;
        let parseError = null;
        try { journal = JSON.parse(fs.readFileSync(journalFile, 'utf8')); } catch (error) { parseError = error.message; }
        return { id: entry.name, transactionRoot, journalFile, journal, parseError };
      });
  }

  function diagnoseMutations(result, targetRoot) {
    const lockFile = mutationLockPath(targetRoot);
    let lock = null;
    if (existsFile(lockFile)) {
      try { lock = JSON.parse(fs.readFileSync(lockFile, 'utf8')); } catch { lock = { invalid: true }; }
    }
    const transactions = mutationTransactions(targetRoot);
    result.mutations = { blocked: Boolean(lock || transactions.length), lock, transactions: transactions.map((item) => ({ id: item.id, operation: item.journal?.operation || null, phase: item.journal?.phase || null, affectedPaths: item.journal?.affectedPaths || [], parseError: item.parseError })) };
    for (const transaction of transactions) {
      addDoctorFinding(result, 'error', 'mutation.transaction_incomplete', `检测到未完成 Buildr source mutation：${transaction.id}`, {
        path: toPosixRelative(targetRoot, transaction.transactionRoot),
        transactionId: transaction.id,
        operation: transaction.journal?.operation || lock?.operation || null,
        phase: transaction.journal?.phase || lock?.phase || 'unknown',
        affectedPaths: transaction.journal?.affectedPaths || lock?.affectedPaths || [],
        suggestion: transaction.parseError ? '保留 transaction 目录并人工检查损坏 journal。' : '运行 mutation recover 恢复操作前源资产；恢复前不要删除 backup。',
        command: transaction.parseError ? undefined : `buildr mutation recover ${transaction.id} --target ${targetRoot}`,
        userActionRequired: true,
      });
    }
    if (lock && transactions.length === 0) {
      addDoctorFinding(result, 'error', 'mutation.lock_orphaned', '检测到没有 transaction journal 的 mutation lock。', {
        path: toPosixRelative(targetRoot, lockFile),
        operation: lock.operation || null,
        suggestion: '保留 lock 并检查 workspace；无法证明状态前不要继续 source mutation。',
        userActionRequired: true,
      });
    }
  }

  function mutationRecover(args) {
    const [id] = positionalArgs(args);
    if (!id) throw new Error('Missing mutation transaction id.');
    assertName(id, 'Mutation transaction id');
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const transactionRoot = path.join(mutationStateRoot(targetRoot), id);
    const journalFile = path.join(transactionRoot, 'journal.json');
    const recoveryReceipt = mutationRecoveryReceiptPath(targetRoot, id);
    if (!existsFile(journalFile)) {
      if (!existsFile(recoveryReceipt)) throw new Error(`Mutation transaction journal not found: ${id}`);
      const recovered = JSON.parse(fs.readFileSync(recoveryReceipt, 'utf8'));
      if (recovered.schemaVersion !== 'buildr.mutation-recovery/v1' || recovered.transactionId !== id) throw new Error(`Mutation recovery receipt is invalid: ${id}`);
      console.log(`Buildr source mutation 已经恢复：${id}`);
      return;
    }
    const journal = JSON.parse(fs.readFileSync(journalFile, 'utf8'));
    if (journal.schemaVersion !== 'buildr.mutation/v1' || journal.transactionId !== id || !Array.isArray(journal.snapshots)) throw new Error(`Mutation transaction journal is invalid: ${id}`);
    const lockFile = mutationLockPath(targetRoot);
    let lock = null;
    if (existsFile(lockFile)) {
      lock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
      if (lock.transactionId !== id) throw new Error(`Mutation lock belongs to another transaction: ${lock.transactionId}`);
    }
    const restorePlan = [...journal.snapshots].reverse().map((snapshot) => {
      const target = path.resolve(snapshot.target);
      const relative = path.relative(targetRoot, target);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || relative.startsWith(`.buildr${path.sep}mutations`)) throw new Error(`Mutation recovery target is unsafe: ${snapshot.target}`);
      const backup = path.join(transactionRoot, 'backup', String(snapshot.index));
      if (snapshot.existed && !fs.existsSync(backup)) throw new Error(`Mutation backup is missing for ${snapshot.relative}`);
      return { ...snapshot, target, backup };
    });
    for (const snapshot of restorePlan) restoreMutationSnapshot(snapshot);
    atomicWriteJson(recoveryReceipt, {
      schemaVersion: 'buildr.mutation-recovery/v1',
      transactionId: id,
      operation: journal.operation || null,
      recoveredAt: new Date().toISOString(),
      affectedPaths: journal.affectedPaths || [],
    });
    removeMutationRestoreTarget(transactionRoot);
    if (lock) {
      fs.rmSync(lockFile, { force: true });
      if (fs.existsSync(lockFile)) throw new Error(`Mutation recovery could not remove matching lock: ${id}`);
    }
    console.log(`已恢复 Buildr source mutation：${id}`);
  }

  function doctor(args, internalOptions = {}) {
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const requestedScope = optionValue(args, '--scope', null);
    const requestedAgent = optionValue(args, '--agent', null);
    if (requestedAgent !== null) assertAgentId(requestedAgent);
    const json = hasFlag(args, '--json');
    const includeInfo = hasFlag(args, '--include-info') || hasFlag(args, '--verbose');
    const result = {
      targetRoot,
      scope: requestedScope || null,
      agentRuntime: requestedAgent
        ? {
          requested: requestedAgent,
          supported: isSupportedAgent(requestedAgent),
          selected: isSupportedAgent(requestedAgent) ? requestedAgent : null,
          supportedAgents: SUPPORTED_AGENT_IDS,
          mustNotUseFallbackAdapter: !isSupportedAgent(requestedAgent) || undefined,
        }
        : {
          requested: null,
          supported: null,
          selected: null,
          supportedAgents: SUPPORTED_AGENT_IDS,
          compatibilityMode: true,
        },
      ok: true,
      summary: { ok: 0, info: 0, warning: 0, error: 0 },
      workspace: null,
      projectRegistry: null,
      organizations: [],
      projects: [],
      services: [],
      components: { items: [], ownership: {}, findings: [] },
      capabilities: { structurallyRoutableOnly: true, graphs: [], items: [] },
      builtins: { items: [] },
      commandLineTools: null,
      runtime: Object.fromEntries(SUPPORTED_AGENT_IDS.map((agent) => [RUNTIME_ADAPTERS[agent].traits.checker.resultKey ?? agent.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase()), []])),
      mutations: { blocked: false, lock: null, transactions: [] },
      findings: [],
      nextSteps: [],
    };

    diagnoseWorkspace(result, targetRoot);
    diagnoseMutations(result, targetRoot);
    if (result.workspace?.initialized) diagnoseRules(result, targetRoot);
    const registry = diagnoseProjectRegistry(result, targetRoot);
    const scopes = discoverDoctorScopes(targetRoot, requestedScope, registry);
    if (result.workspace?.initialized && scopes.length === 0) {
      addDoctorFinding(result, 'warning', 'workspace.empty', 'Buildr root 尚未创建项目。', {
        path: targetRoot,
        suggestion: '按需创建项目；共享或基础服务也应放入某个项目，例如 foundation。',
      });
    }
    diagnoseLegacyPractices(result, targetRoot, scopes, includeInfo);
    diagnoseHierarchy(result, targetRoot, scopes, registry);
    diagnoseServices(result, targetRoot, scopes);
    diagnoseSkillsManifestSchemas(result, targetRoot, scopes);
    if (result.workspace?.initialized) diagnoseSkillCapabilities(result, targetRoot, scopes, requestedAgent);
    if (result.workspace?.initialized) {
      try {
        const builtinStatus = syncPackageBuiltins(targetRoot, { checkOnly: true });
        result.builtins.items = builtinStatus.findings;
        for (const finding of builtinStatus.findings.filter((item) => !item.component)) {
          if (finding.status === 'installed' || (finding.status === 'uninstalled' && !includeInfo)) continue;
          const status = finding.status === 'uninstalled' ? 'info' : 'warning';
          addDoctorFinding(result, status, `builtin.${finding.status}`, `Buildr builtin ${finding.type}:${finding.id} 状态为 ${finding.status}。`, {
            path: finding.path,
            suggestion: finding.status === 'uninstalled' ? '这是显式卸载状态；需要恢复时运行 builtin restore。' : `检查差异；确认放弃本地内容时运行 buildr builtin restore ${finding.id} --target ${targetRoot}。`,
            command: finding.status === 'uninstalled' ? `buildr builtin restore ${finding.id} --target ${targetRoot}` : undefined,
            userActionRequired: finding.status !== 'uninstalled',
          });
        }
      } catch (error) {
        addDoctorFinding(result, 'error', 'builtin.receipt_invalid', `Builtin 安装回执无效：${error.message}`, {
          path: '.buildr/builtin-receipts.json',
          suggestion: '保留回执与 live 资产并检查损坏；无法证明安装状态前不要继续 sync。',
          userActionRequired: true,
        });
      }
    }
    diagnoseComponents(result, targetRoot, includeInfo, requestedAgent);
    diagnoseCommands(result, targetRoot);
    if (internalOptions.skipRuntime !== true) diagnoseRuntime(result, targetRoot, scopes, { includeInfo, agent: requestedAgent });
    finalizeDoctorResult(result);

    if (json) {
      process.stdout.write(`${JSON.stringify(withJsonSchema(PUBLIC_JSON_SCHEMAS.doctor, result), null, 2)}\n`);
    } else {
      printDoctorReport(result);
    }
    process.exitCode = result.ok ? 0 : 1;
  }

  function initBuildr(args) {
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const name = optionValue(args, '--name', path.basename(targetRoot));
    const profile = optionValue(args, '--profile', 'team');
    const agent = optionValue(args, '--agent', null);
    assertName(name, 'Workspace name');
    assertName(profile, 'Workspace profile');
    if (agent !== null) {
      assertAgentId(agent);
      if (!isSupportedAgent(agent)) {
        throw new Error(`Unsupported Agent runtime: ${agent}. Supported Agent runtime adapters: ${SUPPORTED_AGENT_IDS.join(', ')}. ${UNSUPPORTED_AGENT_GUIDANCE.message}${UNSUPPORTED_AGENT_GUIDANCE.nextStep}`);
      }
    }
    const manifest = readPackageManifest();
    const created = [];
    const changed = [];

    ensureDirectory(targetRoot);
    for (const relativeDir of manifest.workspaceDirectories) {
      ensureDirectory(path.join(targetRoot, relativeDir));
    }

    const variables = { name, profile };
    for (const rawEntry of manifest.workspaceFiles) {
      const entry = parseManifestFileEntry(rawEntry, 'workspaceFiles');
      writeMappedFileIfMissing(targetRoot, targetRoot, entry, variables, created);
    }
    ensureRootRequiredBlock(targetRoot, changed);
    trackWrite(targetRoot, path.join(targetRoot, 'skills', 'manifest.yml'), renderSkillsManifestYaml([]), created);
    const componentResult = syncPackageComponents(targetRoot);
    if (componentResult.errors.length) throw new Error(componentResult.errors.map((item) => item.error).join('\n'));
    changed.push(...componentResult.changed);

    const gitignoreChanged = appendGitignoreEntries(path.join(targetRoot, '.gitignore'), [
      '# Agent runtime directories generated by Buildr',
      'CLAUDE.md',
      '.claude/',
      '.agents/',
      '.trae/',
      '.cursor/',
      '.qoder/',
      '# Buildr transaction state',
      '/.buildr/mutations/',
      '# Task worktrees',
      '/.worktrees/',
    ]);
    if (gitignoreChanged) changed.push('.gitignore');

    console.log(`Initialized Buildr root organization context at ${targetRoot}`);
    console.log(`Name: ${name}`);
    console.log(`Profile: ${profile}`);
    printResult('Workspace assets initialized', targetRoot, created, changed);
    if (agent !== null) {
      console.log('');
      console.log(`正在准备 ${agent} runtime；该步骤复用 buildr sync ${agent} 并执行最终 doctor。`);
      try {
        runtime.syncRuntime(agent, ['--target', targetRoot]);
      } catch (error) {
        throw new Error(`Workspace 源资产已初始化，但 ${agent} onboarding 未完成。\n修复问题后运行：buildr sync ${agent} --target ${targetRoot}\n原因：${error.message}`);
      }
      console.log(`Buildr onboarding 已完成：${agent}（包含 sync 与最终 doctor）。`);
      console.log(`下一步可按需创建 Project：buildr project create <project> --target ${targetRoot}`);
      return;
    }
    console.log('');
    console.log('仅初始化源资产的后续步骤：');
    console.log('  buildr runtime list --json');
    console.log(`  buildr sync <agent> --target ${targetRoot}`);
    console.log(`  buildr project create <project> --target ${targetRoot}`);
    console.log('');
    console.log('Agent runtime:');
    console.log('  先用 runtime list 确认当前 Agent 是否受支持；不支持时停止当前 Buildr 操作，请联系 Buildr 作者反馈该 Agent。');
    console.log(`  当前命令未写入 Agent runtime；受支持时，用 buildr sync <agent> --target ${targetRoot} 完成 runtime 与最终 doctor。`);
    console.log('  完整 Agent onboarding guidance：buildr bootstrap guide');
  }

  Object.assign(runtime, { bootstrapGuide, mutationTransactions, diagnoseMutations, mutationRecover, doctor, initBuildr });
  return runtime;
}

import {
  fs,
  crypto,
  os,
  path,
  process,
  execFileSync,
  spawnSync,
  checkClaudeCodeRuntime,
  buildRuleDiscoveryPlan,
  hasManagedRulesMarker,
  renderClaudeCodeRules,
  resolveRuleScope,
  checkCodexRuntime,
  PACKAGE_WORKSPACE_TARGET,
  PACKAGE_RUNTIME_TARGET,
  LEGACY_PACKAGE_PATHS,
  BUILDR_REQUIRED_BLOCK_START,
  SUPPORTED_AGENT_IDS,
} from '../shared/platform.mjs';
import { PUBLIC_JSON_SCHEMAS, withJsonSchema } from '../shared/json-contracts.mjs';
import { createPackageOutput } from './package-maintenance/output.mjs';
import { createPackageSmokeChecks } from './package-maintenance/smoke-checks.mjs';
import { createPackageStaticValidator } from './package-maintenance/static-validation.mjs';
import { createBuiltinReceipts } from './package-maintenance/builtin-receipts.mjs';

export function registerApplicationPackageMaintenance(runtime) {
  const parseCommandsManifestYaml = (...args) => runtime.parseCommandsManifestYaml(...args);
  const isPlainObject = (...args) => runtime.isPlainObject(...args);
  const validateCommandsManifest = (...args) => runtime.validateCommandsManifest(...args);
  const readCommandsManifestForWrite = (...args) => runtime.readCommandsManifestForWrite(...args);
  const writeCommandsManifest = (...args) => runtime.writeCommandsManifest(...args);
  const assertNoUnknownOptions = (...args) => runtime.assertNoUnknownOptions(...args);
  const positionalArgs = (...args) => runtime.positionalArgs(...args);
  const commandsCheck = (...args) => runtime.commandsCheck(...args);
  const componentMemberPaths = (...args) => runtime.componentMemberPaths(...args);
  const packageComponentDefinition = (...args) => runtime.packageComponentDefinition(...args);
  const packageComponentSourcePath = (...args) => runtime.packageComponentSourcePath(...args);
  const validatePackageComponentMembers = (...args) => runtime.validatePackageComponentMembers(...args);
  const packageComponentsStatus = (...args) => runtime.packageComponentsStatus(...args);
  const readPackageManifest = (...args) => runtime.readPackageManifest(...args);
  const parseManifestFileEntry = (...args) => runtime.parseManifestFileEntry(...args);
  const collectFiles = (...args) => runtime.collectFiles(...args);
  const validateBootstrapContract = (...args) => runtime.validateBootstrapContract(...args);
  const builtinRuleEntry = (...args) => runtime.builtinRuleEntry(...args);
  const builtinSkillEntry = (...args) => runtime.builtinSkillEntry(...args);
  const builtinCommandEntry = (...args) => runtime.builtinCommandEntry(...args);
  const sourcePathFromBuiltin = (...args) => runtime.sourcePathFromBuiltin(...args);
  const targetPathFromBuiltin = (...args) => runtime.targetPathFromBuiltin(...args);
  const convergeRegistryManifests = (...args) => runtime.convergeRegistryManifests(...args);
  const parseRulesManifestYaml = (...args) => runtime.parseRulesManifestYaml(...args);
  const readRulesManifestForWrite = (...args) => runtime.readRulesManifestForWrite(...args);
  const writeRulesManifest = (...args) => runtime.writeRulesManifest(...args);
  const readSkillManifest = (...args) => runtime.readSkillManifest(...args);
  const validateSkillManifestEntries = (...args) => runtime.validateSkillManifestEntries(...args);
  const isManifestSourceLabel = (...args) => runtime.isManifestSourceLabel(...args);
  const normalizeRelativePathForBuildr = (...args) => runtime.normalizeRelativePathForBuildr(...args);
  const parseSkillSourceRef = (...args) => runtime.parseSkillSourceRef(...args);
  const readSkillsManifestForWrite = (...args) => runtime.readSkillsManifestForWrite(...args);
  const writeSkillsManifest = (...args) => runtime.writeSkillsManifest(...args);
  const parseSkillFrontmatter = (...args) => runtime.parseSkillFrontmatter(...args);
  const parseProjectsYaml = (...args) => runtime.parseProjectsYaml(...args);
  const validateProjectsRegistry = (...args) => runtime.validateProjectsRegistry(...args);
  const writeServicesManifest = (...args) => runtime.writeServicesManifest(...args);
  const optionValue = (...args) => runtime.optionValue(...args);
  const ensureDirectory = (...args) => runtime.ensureDirectory(...args);
  const atomicWriteJson = (...args) => runtime.atomicWriteJson(...args);
  const assertSafeAssetTarget = (...args) => runtime.assertSafeAssetTarget(...args);
  const withWorkspaceMutation = (...args) => runtime.withWorkspaceMutation(...args);
  const productRoot = (...args) => runtime.productRoot(...args);
  const packageRoot = (...args) => runtime.packageRoot(...args);
  const packageWorkspaceTargetRoot = (...args) => runtime.packageWorkspaceTargetRoot(...args);
  const developmentWorkspaceRoot = (...args) => runtime.developmentWorkspaceRoot(...args);
  const appendGitignoreEntries = (...args) => runtime.appendGitignoreEntries(...args);
  const hasFlag = (...args) => runtime.hasFlag(...args);
  const toPosixRelative = (...args) => runtime.toPosixRelative(...args);
  const existsDirectory = (...args) => runtime.existsDirectory(...args);
  const existsFile = (...args) => runtime.existsFile(...args);
  const ensureRootRequiredBlock = (...args) => runtime.ensureRootRequiredBlock(...args);
  const copyFileIfChanged = (...args) => runtime.copyFileIfChanged(...args);
  const copyDirectoryIfChanged = (...args) => runtime.copyDirectoryIfChanged(...args);
  const assertInitializedBuildrWorkspace = (...args) => runtime.assertInitializedBuildrWorkspace(...args);

  const {
    key: builtinReceiptKey,
    snapshot: builtinSnapshot,
    read: readBuiltinReceipts,
    write: writeBuiltinReceipts,
    fromSnapshot: receiptFromSnapshot,
    resolveState: resolveBuiltinState,
  } = createBuiltinReceipts({ atomicWriteJson, collectFiles, crypto, ensureDirectory, existsDirectory, existsFile, fs, isPlainObject, path, toPosixRelative });

  function syncPackageBuiltins(targetRoot, options = {}) {
    const manifest = readPackageManifest();
    const changed = [];
    const findings = [];
    const restoreId = options.restoreId || null;
    const checkOnly = options.checkOnly === true;
    const componentStatusById = new Map(packageComponentsStatus(targetRoot, manifest).components.map((item) => [item.id, item.status]));
    const receipts = readBuiltinReceipts(targetRoot);
    const receiptByKey = new Map(receipts.builtins.map((item) => [builtinReceiptKey(item.type, item.id), item]));
    let receiptsChanged = false;

    const updateReceipt = (type, builtin, snapshot) => {
      const key = builtinReceiptKey(type, builtin.id);
      const next = receiptFromSnapshot(type, builtin, snapshot);
      const existing = receiptByKey.get(key);
      if (JSON.stringify(existing) === JSON.stringify(next)) return;
      if (existing) receipts.builtins[receipts.builtins.indexOf(existing)] = next;
      else receipts.builtins.push(next);
      receiptByKey.set(key, next);
      receiptsChanged = true;
    };

    const removeReceipt = (type, builtin) => {
      const key = builtinReceiptKey(type, builtin.id);
      const existing = receiptByKey.get(key);
      if (!existing) return;
      receipts.builtins.splice(receipts.builtins.indexOf(existing), 1);
      receiptByKey.delete(key);
      receiptsChanged = true;
    };

    if (!checkOnly) {
      ensureRootRequiredBlock(targetRoot, changed);
      changed.push(...convergeRegistryManifests(targetRoot));
      if (appendGitignoreEntries(path.join(targetRoot, '.gitignore'), [
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
      ])) {
        changed.push('.gitignore');
      }
    }

    const rulesManifest = readRulesManifestForWrite(targetRoot);
    const rulesById = new Map(rulesManifest.rules.map((rule, index) => [rule.id, { rule, index }]));
    for (const builtin of manifest.builtins.rules) {
      if (builtin.component) {
        findings.push({ type: 'rule', id: builtin.id, required: builtin.required === true, status: componentStatusById.get(builtin.component) || 'missing', path: builtin.target, component: builtin.component, lifecycle: `buildr component check ${builtin.component} --target ${targetRoot} --json` });
        continue;
      }
      const sourceFile = sourcePathFromBuiltin(builtin);
      const targetFile = targetPathFromBuiltin(targetRoot, builtin);
      const existing = rulesById.get(builtin.id)?.rule || null;
      const isRestore = restoreId === builtin.id;
      const isNew = !existing;
      const isUninstalled = existing?.state === 'uninstalled' || existing?.enabled === false;
      const desired = builtinRuleEntry(builtin);
      const newSnapshot = builtinSnapshot(sourceFile, 'rule');
      const liveSnapshot = builtinSnapshot(targetFile, 'rule');
      const state = resolveBuiltinState({ type: 'rule', builtin, liveSnapshot, newSnapshot, oldReceipt: receiptByKey.get(builtinReceiptKey('rule', builtin.id)), isRestore, required: builtin.required === true });
      const status = isUninstalled && !isRestore ? 'uninstalled' : state.status;
      findings.push({ type: 'rule', id: builtin.id, required: builtin.required === true, status, path: builtin.target });

      if (checkOnly) continue;
      if (isUninstalled && !isRestore && !builtin.required) {
        removeReceipt('rule', builtin);
        continue;
      }
      if (!builtin.required && !isNew && !isRestore && status === 'modified') {
        const updated = { ...existing, state: 'modified' };
        rulesManifest.rules[rulesById.get(builtin.id).index] = updated;
        continue;
      }
      if (!builtin.required && !isNew && !isRestore && status === 'missing') {
        const updated = { ...existing, state: 'missing' };
        rulesManifest.rules[rulesById.get(builtin.id).index] = updated;
        continue;
      }
      if (builtin.required || isNew || isRestore || state.converge || state.adopt) {
        if (copyFileIfChanged(sourceFile, targetFile)) changed.push(builtin.target);
        if (rulesById.has(builtin.id)) {
          rulesManifest.rules[rulesById.get(builtin.id).index] = desired;
        } else {
          rulesManifest.rules.push(desired);
        }
        updateReceipt('rule', builtin, newSnapshot);
      }
    }
    if (!checkOnly) {
      const rulesPath = writeRulesManifest(targetRoot, rulesManifest);
      changed.push(toPosixRelative(targetRoot, rulesPath));
    }

    const skillsManifest = readSkillsManifestForWrite(targetRoot);
    const skillsById = new Map(skillsManifest.map((skill, index) => [skill.id, { skill, index }]));
    for (const builtin of manifest.builtins.skills) {
      if (builtin.component) {
        findings.push({ type: 'skill', id: builtin.id, required: builtin.required === true, status: componentStatusById.get(builtin.component) || 'missing', path: builtin.target, component: builtin.component, lifecycle: `buildr component check ${builtin.component} --target ${targetRoot} --json` });
        continue;
      }
      const sourceDir = sourcePathFromBuiltin(builtin);
      const targetDir = targetPathFromBuiltin(targetRoot, builtin);
      const existing = skillsById.get(builtin.id)?.skill || null;
      const isRestore = restoreId === builtin.id;
      const isNew = !existing;
      const isUninstalled = existing?.state === 'uninstalled' || existing?.enabled === false;
      const desired = builtinSkillEntry(builtin);
      const newSnapshot = builtinSnapshot(sourceDir, 'skill');
      const liveSnapshot = builtinSnapshot(targetDir, 'skill');
      const state = resolveBuiltinState({ type: 'skill', builtin, liveSnapshot, newSnapshot, oldReceipt: receiptByKey.get(builtinReceiptKey('skill', builtin.id)), isRestore, required: builtin.required === true });
      const status = isUninstalled && !isRestore ? 'uninstalled' : state.status;
      findings.push({ type: 'skill', id: builtin.id, required: builtin.required === true, status, path: builtin.target });

      if (checkOnly) continue;
      if (isUninstalled && !isRestore && !builtin.required) {
        removeReceipt('skill', builtin);
        continue;
      }
      if (!builtin.required && !isNew && !isRestore && status === 'modified') {
        skillsManifest[skillsById.get(builtin.id).index] = { ...existing, state: 'modified' };
        continue;
      }
      if (!builtin.required && !isNew && !isRestore && status === 'missing') {
        skillsManifest[skillsById.get(builtin.id).index] = { ...existing, state: 'missing' };
        continue;
      }
      if (builtin.required || isNew || isRestore || state.converge || state.adopt) {
        if (state.converge && existsDirectory(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
        if (copyDirectoryIfChanged(sourceDir, targetDir)) changed.push(builtin.target);
        if (skillsById.has(builtin.id)) {
          skillsManifest[skillsById.get(builtin.id).index] = desired;
        } else {
          skillsManifest.push(desired);
        }
        updateReceipt('skill', builtin, newSnapshot);
      }
    }
    if (!checkOnly) {
      const skillsPath = writeSkillsManifest(targetRoot, skillsManifest);
      changed.push(toPosixRelative(targetRoot, skillsPath));
    }

    const commandsManifest = readCommandsManifestForWrite(targetRoot);
    const commandsById = new Map(commandsManifest.commands.map((command, index) => [command.id, { command, index }]));
    for (const builtin of manifest.builtins.commands) {
      if (builtin.component) {
        findings.push({ type: 'command', id: builtin.id, required: builtin.required === true, status: componentStatusById.get(builtin.component) || 'missing', path: 'commands/manifest.yml', component: builtin.component, lifecycle: `buildr component check ${builtin.component} --target ${targetRoot} --json` });
        continue;
      }
      const existing = commandsById.get(builtin.id)?.command || null;
      const isRestore = restoreId === builtin.id;
      const isNew = !existing;
      const isUninstalled = existing?.state === 'uninstalled' || existing?.enabled === false;
      const desired = builtinCommandEntry(builtin);
      const newSnapshot = builtinSnapshot(desired, 'command');
      const liveSnapshot = existing ? builtinSnapshot(existing, 'command') : null;
      const state = resolveBuiltinState({ type: 'command', builtin, liveSnapshot, newSnapshot, oldReceipt: receiptByKey.get(builtinReceiptKey('command', builtin.id)), isRestore, required: builtin.required === true });
      const status = isUninstalled && !isRestore ? 'uninstalled' : state.status;
      findings.push({ type: 'command', id: builtin.id, required: builtin.required === true, status, path: 'commands/manifest.yml' });
      if (checkOnly) continue;
      if (isUninstalled && !isRestore && !builtin.required) {
        removeReceipt('command', builtin);
        continue;
      }
      if (commandsById.has(builtin.id) && (builtin.required || isRestore || state.converge || state.adopt)) {
        commandsManifest.commands[commandsById.get(builtin.id).index] = desired;
      } else if (isNew || isRestore || builtin.required) {
        commandsManifest.commands.push(desired);
      }
      if (builtin.required || isNew || isRestore || state.converge || state.adopt) updateReceipt('command', builtin, newSnapshot);
    }
    if (!checkOnly) {
      const commandsPath = writeCommandsManifest(targetRoot, commandsManifest);
      changed.push(toPosixRelative(targetRoot, commandsPath));
      if (receiptsChanged) changed.push(writeBuiltinReceipts(targetRoot, receipts));
    }

    return { targetRoot, changed: [...new Set(changed)], findings };
  }

  function builtinList(args) {
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const json = hasFlag(args, '--json');
    const result = syncPackageBuiltins(targetRoot, { checkOnly: true });
    if (json) {
      console.log(JSON.stringify(withJsonSchema(PUBLIC_JSON_SCHEMAS.builtinList, result), null, 2));
    } else {
      console.log(`Buildr builtins for ${targetRoot}`);
      for (const finding of result.findings) {
        console.log(`[${finding.status}] ${finding.type}:${finding.id} ${finding.path}${finding.component ? ` component=${finding.component}` : ''}`);
        if (finding.lifecycle) console.log(`  lifecycle: ${finding.lifecycle}`);
      }
    }
  }

  function packageBuiltinComponent(id) {
    const manifest = readPackageManifest();
    for (const kind of ['rules', 'skills', 'commands']) {
      const builtin = manifest.builtins[kind].find((item) => item.id === id);
      if (builtin?.component) return builtin.component;
    }
    return null;
  }

  function findBuiltinManifestEntry(targetRoot, id) {
    const rulesManifest = readRulesManifestForWrite(targetRoot);
    const ruleIndex = rulesManifest.rules.findIndex((rule) => rule.id === id && rule.source === 'buildr');
    if (ruleIndex !== -1) return { type: 'rule', manifest: rulesManifest, index: ruleIndex, entry: rulesManifest.rules[ruleIndex] };

    const skillsManifest = readSkillsManifestForWrite(targetRoot);
    const skillIndex = skillsManifest.findIndex((skill) => skill.id === id && skill.source === 'buildr');
    if (skillIndex !== -1) return { type: 'skill', manifest: skillsManifest, index: skillIndex, entry: skillsManifest[skillIndex] };

    const commandsManifest = readCommandsManifestForWrite(targetRoot);
    const commandIndex = commandsManifest.commands.findIndex((command) => command.id === id && command.source === 'buildr');
    if (commandIndex !== -1) return { type: 'command', manifest: commandsManifest, index: commandIndex, entry: commandsManifest.commands[commandIndex] };

    throw new Error(`Buildr builtin not found: ${id}`);
  }

  function builtinUninstallUnsafe(args) {
    const allowedFlags = new Set(['--target', '--reason']);
    assertNoUnknownOptions(args, allowedFlags);
    const [id] = positionalArgs(args);
    if (!id) throw new Error('Missing builtin id');
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const reason = optionValue(args, '--reason', null);
    assertInitializedBuildrWorkspace(targetRoot);
    const component = packageBuiltinComponent(id);
    if (component) throw new Error(`Buildr builtin ${id} is managed by Component ${component}. Use buildr component uninstall ${component} --agent <agent> --target ${targetRoot}.`);
    const found = findBuiltinManifestEntry(targetRoot, id);
    if (found.entry.required === true) throw new Error(`Required Buildr builtin cannot be uninstalled: ${id}`);

    const updated = { ...found.entry, enabled: false, state: 'uninstalled' };
    if (reason) updated.reason = reason;
    const changed = [];
    const receipts = readBuiltinReceipts(targetRoot);
    const receiptIndex = receipts.builtins.findIndex((item) => item.type === found.type && item.id === id);
    if (receiptIndex !== -1) {
      receipts.builtins.splice(receiptIndex, 1);
      changed.push(writeBuiltinReceipts(targetRoot, receipts));
    }
    if (found.type === 'rule') {
      found.manifest.rules[found.index] = updated;
      if (found.entry.path && existsFile(path.join(targetRoot, found.entry.path))) {
        fs.rmSync(path.join(targetRoot, found.entry.path), { force: true });
        changed.push(found.entry.path);
      }
      changed.push(toPosixRelative(targetRoot, writeRulesManifest(targetRoot, found.manifest)));
    } else if (found.type === 'skill') {
      found.manifest[found.index] = updated;
      const skillDir = path.join(targetRoot, 'skills', found.entry.path || id);
      if (existsDirectory(skillDir)) {
        fs.rmSync(skillDir, { recursive: true, force: true });
        changed.push(toPosixRelative(targetRoot, skillDir));
      }
      for (const runtimeRoot of ['.claude', '.agents']) {
        const runtimeDir = path.join(targetRoot, runtimeRoot, 'skills', found.entry.runtimePath || id);
        if (existsDirectory(runtimeDir)) {
          fs.rmSync(runtimeDir, { recursive: true, force: true });
          changed.push(toPosixRelative(targetRoot, runtimeDir));
        }
      }
      changed.push(toPosixRelative(targetRoot, writeSkillsManifest(targetRoot, found.manifest)));
    } else {
      found.manifest.commands[found.index] = updated;
      changed.push(toPosixRelative(targetRoot, writeCommandsManifest(targetRoot, found.manifest)));
    }
    console.log(`已卸载 Buildr builtin：${id}`);
    for (const file of [...new Set(changed)]) console.log(`  ${file}`);
  }

  function builtinUninstall(args) {
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    return withWorkspaceMutation(targetRoot, 'builtin.uninstall', [
      path.join(targetRoot, 'rules'),
      path.join(targetRoot, 'skills'),
      path.join(targetRoot, 'commands'),
      path.join(targetRoot, '.claude', 'skills'),
      path.join(targetRoot, '.agents', 'skills'),
      path.join(targetRoot, '.buildr', 'builtin-receipts.json'),
    ], () => builtinUninstallUnsafe(args));
  }

  function builtinRestoreUnsafe(args) {
    const allowedFlags = new Set(['--target']);
    assertNoUnknownOptions(args, allowedFlags);
    const [id] = positionalArgs(args);
    if (!id) throw new Error('Missing builtin id');
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    assertInitializedBuildrWorkspace(targetRoot);
    const component = packageBuiltinComponent(id);
    if (component) throw new Error(`Buildr builtin ${id} is managed by Component ${component}. Use buildr component install ${component} --agent <agent> --target ${targetRoot}.`);
    const result = syncPackageBuiltins(targetRoot, { restoreId: id });
    if (!result.findings.some((finding) => finding.id === id)) throw new Error(`Buildr builtin not found in package: ${id}`);
    console.log(`已恢复 Buildr builtin：${id}`);
    for (const file of result.changed) console.log(`  ${file}`);
  }

  function builtinRestore(args) {
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    return withWorkspaceMutation(targetRoot, 'builtin.restore', [path.join(targetRoot, 'rules'), path.join(targetRoot, 'skills'), path.join(targetRoot, 'commands'), path.join(targetRoot, 'components'), path.join(targetRoot, '.buildr', 'builtin-receipts.json')], () => builtinRestoreUnsafe(args));
  }

  const {
    validateWorkspaceSkillsBaseline,
    validateWorkspaceRulesBaseline,
    validatePackageStatic,
  } = createPackageStaticValidator({
    LEGACY_PACKAGE_PATHS,
    PACKAGE_RUNTIME_TARGET,
    PACKAGE_WORKSPACE_TARGET,
    SUPPORTED_AGENT_IDS,
    collectFiles,
    componentMemberPaths,
    existsDirectory,
    existsFile,
    fs,
    isManifestSourceLabel,
    isPlainObject,
    normalizeRelativePathForBuildr,
    packageComponentDefinition,
    packageComponentSourcePath,
    packageWorkspaceTargetRoot,
    parseCommandsManifestYaml,
    parseManifestFileEntry,
    parseProjectsYaml,
    parseSkillFrontmatter,
    parseSkillSourceRef,
    path,
    readPackageManifest,
    readSkillManifest,
    toPosixRelative,
    validateBootstrapContract,
    validateCommandsManifest,
    validatePackageComponentMembers,
    validateProjectsRegistry,
    validateSkillManifestEntries,
  });
  const {
    runPackageSmokeChecks,
  } = createPackageSmokeChecks({
    BUILDR_REQUIRED_BLOCK_START,
    buildRuleDiscoveryPlan,
    checkClaudeCodeRuntime,
    checkCodexRuntime,
    collectFiles,
    commandsCheck,
    ensureDirectory,
    execFileSync,
    existsDirectory,
    existsFile,
    fs,
    hasManagedRulesMarker,
    os,
    parseCommandsManifestYaml,
    parseManifestFileEntry,
    parseProjectsYaml,
    parseRulesManifestYaml,
    path,
    process,
    readSkillManifest,
    renderClaudeCodeRules,
    resolveRuleScope,
    spawnSync,
    toPosixRelative,
    writeServicesManifest,
  });

  function packageCheck() {
    const root = productRoot();
    const workspaceRoot = developmentWorkspaceRoot();
    const manifestPath = path.join(packageRoot(), 'manifest.yml');
    const manifest = readPackageManifest();
    const allowedVariables = new Set(manifest.templateVariables);
    const files = [];
    const problems = [];
    const mappedEntries = [];

    const context = { root, workspaceRoot, manifestPath, manifest, allowedVariables, files, problems, mappedEntries };
    const { bootstrapContract, parseJsonOutput } = validatePackageStatic(context);
    runPackageSmokeChecks({ ...context, bootstrapContract, parseJsonOutput });

    if (problems.length > 0) {
      console.error('Buildr package check failed:');
      for (const problem of problems) console.error(`- ${problem}`);
      process.exit(1);
    }

    console.log(`Buildr package check passed. Checked ${manifest.include.length} include entries and ${files.length} files.`);
  }

  const {
    packageOutputInventory,
    packageOutputIntegrity,
    readPackageOutputReceipt,
    assertSafePackageOutput,
    validateReplaceablePackageOutput,
    buildPackageOutput,
    packageBuild,
  } = createPackageOutput({
    assertSafeAssetTarget,
    atomicWriteJson,
    collectFiles,
    crypto,
    ensureDirectory,
    existsDirectory,
    existsFile,
    fs,
    optionValue,
    packageRoot,
    parseManifestFileEntry,
    path,
    productRoot,
    readPackageManifest,
    toPosixRelative,
  });

  Object.assign(runtime, {
    syncPackageBuiltins,
    builtinList,
    packageBuiltinComponent,
    findBuiltinManifestEntry,
    builtinUninstallUnsafe,
    builtinUninstall,
    builtinRestoreUnsafe,
    builtinRestore,
    validateWorkspaceSkillsBaseline,
    validateWorkspaceRulesBaseline,
    packageCheck,
    packageOutputInventory,
    packageOutputIntegrity,
    readPackageOutputReceipt,
    assertSafePackageOutput,
    validateReplaceablePackageOutput,
    buildPackageOutput,
    packageBuild,
  });
  return runtime;
}

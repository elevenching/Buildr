import { selectedProviderImpacts } from '../../../runtime/skills/capabilities.mjs';
import { REQUIRED_RENDER_CAPABILITIES, createRuntimePlan, reconcileRuntimePlan } from '../../../runtime/adapter-contract.mjs';

export function createBuiltinLifecycle(deps) {
  const {
    assertInitializedBuildrWorkspace,
    assertNoUnknownOptions,
    buildRuntimeOrphanRemovalPlan,
    doctor,
    existsDirectory,
    existsFile,
    fs,
    getRuntimeAdapter,
    optionValue,
    path,
    positionalArgs,
    process,
    readBuiltinReceipts,
    readCommandsManifestForWrite,
    readPackageManifest,
    readRulesManifestForWrite,
    readSkillsManifestForWrite,
    SUPPORTED_AGENT_IDS,
    syncPackageBuiltins,
    toPosixRelative,
    withWorkspaceMutation,
    writeBuiltinReceipts,
    writeCommandsManifest,
    writeRulesManifest,
    writeSkillsManifest,
  } = deps;

  function runMutationDoctor(targetRoot) {
    const previousExitCode = process.exitCode;
    doctor(['--target', targetRoot, '--scope', '.', '--json']);
    process.exitCode = previousExitCode;
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

  function discloseBuiltinSkillImpact(targetRoot, id) {
    const impacts = selectedProviderImpacts(targetRoot, id, { scope: '.' });
    if (impacts.length === 0) return;
    console.log(`Capability dependency impact（写入前）：卸载 selected provider ${id}`);
    for (const impact of impacts) {
      const next = impact.mode === 'required' ? 'blocked' : 'degraded';
      console.log(`  [${impact.mode}] ${impact.scope}:${impact.consumer} -> ${impact.capability}@${impact.version}; 写入后可能 ${next}`);
    }
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
    if (found.type === 'skill') discloseBuiltinSkillImpact(targetRoot, id);

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
      changed.push(toPosixRelative(targetRoot, writeSkillsManifest(targetRoot, found.manifest)));
      const runtimePath = found.entry.runtimePath || id;
      const agentsByRuntimeRoot = new Map();
      for (const agent of SUPPORTED_AGENT_IDS) {
        const runtimeRoot = getRuntimeAdapter(agent).traits.skills.root;
        if (!agentsByRuntimeRoot.has(runtimeRoot)) agentsByRuntimeRoot.set(runtimeRoot, []);
        agentsByRuntimeRoot.get(runtimeRoot).push(agent);
      }
      for (const [runtimeRoot, agents] of agentsByRuntimeRoot) {
        const receiptAgents = agents.filter((agent) => existsFile(path.join(
          targetRoot,
          runtimeRoot,
          'buildr',
          'skill-projection-receipts',
          agent,
          `${runtimePath}.json`,
        )));
        // A shared filesystem Skills root can retain receipts for more than one
        // adapter. Consume those receipts before considering the legacy
        // SKILL.md-only fallback, so valid vendor files are never mislabeled as
        // unknown user content by a sibling adapter.
        for (const agent of receiptAgents.length > 0 ? receiptAgents : [agents[0]]) {
          const removals = buildRuntimeOrphanRemovalPlan(targetRoot, agent, '.', { runtimePath }).map((item) => ({ ...item, targetFile: item.path }));
          if (removals.length === 0) continue;
          const result = reconcileRuntimePlan(createRuntimePlan({
            adapterId: agent,
            targetRoot,
            scope: '.',
            writes: [],
            removals,
            capabilityEvidence: REQUIRED_RENDER_CAPABILITIES.map((capability) => ({ capability, supported: true, adapterId: agent })),
          }));
          changed.push(...result.removed.map((file) => toPosixRelative(targetRoot, file)));
        }
      }
    } else {
      found.manifest.commands[found.index] = updated;
      changed.push(toPosixRelative(targetRoot, writeCommandsManifest(targetRoot, found.manifest)));
    }
    console.log(`已卸载 Buildr builtin：${id}`);
    for (const file of [...new Set(changed)]) console.log(`  ${file}`);
  }

  function builtinUninstall(args) {
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const runtimeRoots = [...new Set(SUPPORTED_AGENT_IDS.map((agent) => getRuntimeAdapter(agent).traits.skills.root))];
    const result = withWorkspaceMutation(targetRoot, 'builtin.uninstall', [
      path.join(targetRoot, 'rules'),
      path.join(targetRoot, 'skills'),
      path.join(targetRoot, 'commands'),
      ...runtimeRoots.map((root) => path.join(targetRoot, root)),
      path.join(targetRoot, '.buildr', 'builtin-receipts.json'),
    ], () => builtinUninstallUnsafe(args));
    runMutationDoctor(targetRoot);
    return result;
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
    const result = withWorkspaceMutation(targetRoot, 'builtin.restore', [path.join(targetRoot, 'rules'), path.join(targetRoot, 'skills'), path.join(targetRoot, 'commands'), path.join(targetRoot, 'components'), path.join(targetRoot, '.buildr', 'builtin-receipts.json')], () => builtinRestoreUnsafe(args));
    runMutationDoctor(targetRoot);
    return result;
  }

  return { packageBuiltinComponent, findBuiltinManifestEntry, builtinUninstallUnsafe, builtinUninstall, builtinRestoreUnsafe, builtinRestore };
}

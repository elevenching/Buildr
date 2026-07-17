import { selectedProviderImpacts } from '../../../runtime/skills/capabilities.mjs';

export function createBuiltinLifecycle(deps) {
  const {
    assertInitializedBuildrWorkspace,
    assertNoUnknownOptions,
    doctor,
    existsDirectory,
    existsFile,
    fs,
    optionValue,
    path,
    positionalArgs,
    process,
    readBuiltinReceipts,
    readCommandsManifestForWrite,
    readPackageManifest,
    readRulesManifestForWrite,
    readSkillsManifestForWrite,
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
    const result = withWorkspaceMutation(targetRoot, 'builtin.uninstall', [
      path.join(targetRoot, 'rules'),
      path.join(targetRoot, 'skills'),
      path.join(targetRoot, 'commands'),
      path.join(targetRoot, '.claude', 'skills'),
      path.join(targetRoot, '.agents', 'skills'),
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

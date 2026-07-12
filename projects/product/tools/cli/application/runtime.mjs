import {
  path,
  process,
  spawnSync,
  resolveRuleScope,
  assembleRuntimeProjection,
  getRuntimeAdapter,
  reconcileRuntimePlan,
} from '../shared/platform.mjs';

export function registerApplicationRuntime(runtime) {
  const syncPackageBuiltins = (...args) => runtime.syncPackageBuiltins(...args);
  const doctor = (...args) => runtime.doctor(...args);
  const syncPackageComponents = (...args) => runtime.syncPackageComponents(...args);
  const buildRuntimeOrphanRemovalPlan = (...args) => runtime.buildRuntimeOrphanRemovalPlan(...args);
  const optionValue = (...args) => runtime.optionValue(...args);
  const withResolvedTarget = (...args) => runtime.withResolvedTarget(...args);
  const skillScopeForRuleScope = (...args) => runtime.skillScopeForRuleScope(...args);
  const withWorkspaceMutation = (...args) => runtime.withWorkspaceMutation(...args);
  const productRoot = (...args) => runtime.productRoot(...args);
  const toPosixRelative = (...args) => runtime.toPosixRelative(...args);
  const assertInitializedBuildrWorkspace = (...args) => runtime.assertInitializedBuildrWorkspace(...args);

  function renderRuntime(agent, args, options = {}) {
    const renderArgs = [...args];
    if (!renderArgs.includes('--scope')) {
      renderArgs.push('--scope', '.');
    }
    const renderCommand = withResolvedTarget(renderArgs);
    const { targetRoot } = renderCommand;
    const requestedScope = optionValue(renderCommand.args, '--scope', '.');
    const scopeInfo = resolveRuleScope(targetRoot, requestedScope);
    const skillScope = skillScopeForRuleScope(scopeInfo.scope);
    const removals = buildRuntimeOrphanRemovalPlan(targetRoot, agent, skillScope).map((item) => ({ ...item, targetFile: item.path }));
    const { plan } = assembleRuntimeProjection({ repoRoot: targetRoot, targetRoot, scope: scopeInfo.scope, adapterId: agent, selection: { productSkill: options.productSkill === true, rules: true, workspaceSkills: true }, removals });
    reconcileRuntimePlan(plan);
    return { targetRoot, files: [...plan.writes.map((item) => item.targetFile), ...plan.removals.map((item) => item.targetFile)], rulesActions: plan.ruleActions, warnings: plan.warnings, scope: scopeInfo.scope };
  }

  function renderSkillsRuntime(agent, args) {
    const renderCommand = withResolvedTarget(args);
    const skillScope = optionValue(renderCommand.args, '--scope', '.');
    const orphanPlan = buildRuntimeOrphanRemovalPlan(renderCommand.targetRoot, agent, skillScope).map((item) => ({ ...item, targetFile: item.path }));
    const { plan } = assembleRuntimeProjection({ repoRoot: renderCommand.targetRoot, targetRoot: renderCommand.targetRoot, scope: skillScope, adapterId: agent, selection: { workspaceSkills: true }, removals: orphanPlan });
    reconcileRuntimePlan(plan);
    const files = [...plan.writes.map((item) => item.targetFile), ...plan.removals.map((item) => item.targetFile)];
    const remaining = buildRuntimeOrphanRemovalPlan(renderCommand.targetRoot, agent, skillScope);
    if (remaining.length) throw new Error(`运行时同步未完成，请重新运行 buildr skills render ${agent}。`);
    return { targetRoot: renderCommand.targetRoot, files, plan: plan.writes };
  }

  function renderRulesRuntime(agent, args) {
    const renderCommand = withResolvedTarget(args);
    const scope = optionValue(renderCommand.args, '--scope', '.');
    const { plan } = assembleRuntimeProjection({ repoRoot: renderCommand.targetRoot, targetRoot: renderCommand.targetRoot, scope, adapterId: agent, selection: { rules: true } });
    reconcileRuntimePlan(plan);
    return { targetRoot: renderCommand.targetRoot, files: plan.writes.map((item) => item.targetFile), actions: plan.ruleActions, warnings: plan.warnings };
  }

  function syncRuntime(agent, args) {
    const adapter = getRuntimeAdapter(agent);
    const syncArgs = [...args];
    if (!syncArgs.includes('--scope')) syncArgs.push('--scope', '.');
    const targetRoot = path.resolve(optionValue(syncArgs, '--target', process.cwd()));
    assertInitializedBuildrWorkspace(targetRoot);
    const updated = withWorkspaceMutation(targetRoot, `buildr.sync:${agent}`, [
      path.join(targetRoot, 'AGENTS.md'),
      path.join(targetRoot, '.gitignore'),
      path.join(targetRoot, 'projects'),
      path.join(targetRoot, 'rules'),
      path.join(targetRoot, 'skills'),
      path.join(targetRoot, 'commands'),
      path.join(targetRoot, 'components'),
      path.join(targetRoot, '.buildr', 'builtin-receipts.json'),
    ], () => {
      const sourceUpdate = syncPackageBuiltins(targetRoot);
      const components = syncPackageComponents(targetRoot);
      if (components.errors.length) {
        throw new Error(`sync 暂停：Component 源资产存在冲突。\n- ${components.errors.map((item) => item.error).join('\n- ')}`);
      }
      const needsDecision = sourceUpdate.findings.filter((finding) => !finding.component && !finding.required && ['modified', 'missing'].includes(finding.status));
      if (needsDecision.length) {
        throw new Error(`sync 暂停：以下 optional Buildr 内置能力需要用户决策。\n- ${needsDecision.map((item) => `${item.type}:${item.id} (${item.status})`).join('\n- ')}`);
      }
      sourceUpdate.changed.push(...components.changed);
      return sourceUpdate;
    });
    const rendered = renderRuntime(agent, syncArgs, { productSkill: true });
    const doctorResult = spawnSync(process.execPath, [path.join(productRoot(), 'tools', 'buildr'), 'doctor', '--agent', agent, '--target', targetRoot, '--json'], {
      cwd: productRoot(),
      encoding: 'utf8',
    });
    console.log(`已同步 Buildr 到 ${agent}：${targetRoot}`);
    if (updated.changed.length > 0) {
      console.log('产品能力变更：');
      for (const file of updated.changed) console.log(`  ${file}`);
    }
    if (rendered.files.length > 0) {
      console.log('runtime 渲染：');
      const ruleTargets = new Set(rendered.rulesActions.map((item) => item.targetFile));
      for (const item of rendered.rulesActions) console.log(`  [${item.action}] ${toPosixRelative(targetRoot, item.targetFile)}`);
      for (const file of rendered.files) {
        if (!ruleTargets.has(file)) console.log(`  ${toPosixRelative(targetRoot, file)}`);
      }
    }
    for (const warning of rendered.warnings) console.error(`Warning: ${warning}`);
    if (doctorResult.status !== 0) {
      console.log('doctor 仍有需要处理的问题：');
      process.stdout.write(doctorResult.stdout || '');
      process.stderr.write(doctorResult.stderr || '');
      throw new Error(`${agent} sync 未完成：最终 doctor 未通过。`);
    }
    console.log('doctor 通过。');
  }

  Object.assign(runtime, { renderRuntime, renderSkillsRuntime, renderRulesRuntime, syncRuntime });
  return runtime;
}

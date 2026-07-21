import {
  fs,
  path,
  execFileSync,
  SUPPORTED_AGENT_IDS,
  UNSUPPORTED_AGENT_GUIDANCE,
  getRuntimeAdapter,
  isSupportedAgent,
  RUNTIME_CHECKERS,
  assembleRuntimeProjection,
} from '../shared/platform.mjs';
import { createRuntimeDiagnostics } from './doctor/runtime-diagnostics.mjs';
import { createScopeDiagnostics } from './doctor/scope-diagnostics.mjs';
import { createServiceDiagnostics } from './doctor/service-diagnostics.mjs';
import { createCapabilityDiagnostics } from './doctor/capability-diagnostics.mjs';
import { buildDoctorHealth, buildDoctorRepairPlan } from './doctor/result-model.mjs';

export function registerApplicationDoctor(runtime) {
  const runCommandsCheck = (...args) => runtime.runCommandsCheck(...args);
  const componentRegistryPath = (...args) => runtime.componentRegistryPath(...args);
  const packageComponentsStatus = (...args) => runtime.packageComponentsStatus(...args);
  const managedRuntimeSkillOrphans = (...args) => runtime.managedRuntimeSkillOrphans(...args);
  const listManagedDirectories = (...args) => runtime.listManagedDirectories(...args);
  const runtimeImplementation = (...args) => runtime.runtimeImplementation(...args);
  const readSkillManifestSchemaVersion = (...args) => runtime.readSkillManifestSchemaVersion(...args);
  const skillsManifestPath = (...args) => runtime.skillsManifestPath(...args);
  const parseYamlValue = (...args) => runtime.parseYamlValue(...args);
  const parseServicesManifestYaml = (...args) => runtime.parseServicesManifestYaml(...args);
  const parseProjectsYaml = (...args) => runtime.parseProjectsYaml(...args);
  const validateProjectsRegistry = (...args) => runtime.validateProjectsRegistry(...args);
  const validateServicesManifest = (...args) => runtime.validateServicesManifest(...args);
  const projectsManifestPath = (...args) => runtime.projectsManifestPath(...args);
  const servicesManifestPath = (...args) => runtime.servicesManifestPath(...args);
  const gitOutput = (...args) => runtime.gitOutput(...args);
  const gitCurrentBranch = (...args) => runtime.gitCurrentBranch(...args);
  const gitBoundaryFor = (...args) => runtime.gitBoundaryFor(...args);
  const gitBoundaryIgnored = (...args) => runtime.gitBoundaryIgnored(...args);
  const toPosixRelative = (...args) => runtime.toPosixRelative(...args);
  const existsDirectory = (...args) => runtime.existsDirectory(...args);
  const existsFile = (...args) => runtime.existsFile(...args);
  const addDoctorFinding = (...args) => runtime.addDoctorFinding(...args);
  const buildrWorkspaceIdentity = (...args) => runtime.buildrWorkspaceIdentity(...args);

  const {
    scopeParts,
    workspaceName,
    readProjectsRegistryIfExists,
    discoverDoctorScopes,
    resolveRepoPath,
    readGitRemote,
    gitignoreLines,
    isIgnoredByWorkspace,
    projectDoctorContextFor,
    projectBaselineStatus,
    missingProjectBaselineAssets,
    diagnoseProjectRegistry,
    diagnoseWorkspace,
    diagnoseLegacyPractices,
    diagnoseHierarchy,
  } = createScopeDiagnostics({
    addDoctorFinding,
    execFileSync,
    existsDirectory,
    existsFile,
    fs,
    gitBoundaryFor,
    gitBoundaryIgnored,
    gitOutput,
    parseProjectsYaml,
    parseYamlValue,
    path,
    projectsManifestPath,
    servicesManifestPath,
    toPosixRelative,
    validateProjectsRegistry,
    buildrWorkspaceIdentity,
  });
  const {
    diagnoseServicesMetadata,
    diagnoseServices,
  } = createServiceDiagnostics({
    addDoctorFinding,
    existsDirectory,
    existsFile,
    fs,
    gitBoundaryFor,
    gitBoundaryIgnored,
    gitCurrentBranch,
    gitignoreLines,
    listManagedDirectories,
    parseServicesManifestYaml,
    path,
    projectDoctorContextFor,
    readGitRemote,
    toPosixRelative,
    validateServicesManifest,
  });
  const {
    runtimeFindingsForDoctor,
    summarizeRuntimeFindings,
    addUnsupportedAgentFinding,
    detectManagedRuntimeAgents,
    diagnoseRuntime,
    diagnoseCommands,
    diagnoseComponents,
  } = createRuntimeDiagnostics({
    RUNTIME_CHECKERS,
    SUPPORTED_AGENT_IDS,
    UNSUPPORTED_AGENT_GUIDANCE,
    addDoctorFinding,
    assembleRuntimeProjection,
    componentRegistryPath,
    existsFile,
    fs,
    getRuntimeAdapter,
    isSupportedAgent,
    managedRuntimeSkillOrphans,
    packageComponentsStatus,
    path,
    runCommandsCheck,
    runtimeImplementation,
    toPosixRelative,
  });
  const { diagnoseSkillCapabilities, printCapabilityReport } = createCapabilityDiagnostics({ addDoctorFinding, isSupportedAgent, path });

  function diagnoseSkillsManifestSchemas(result, targetRoot, scopes) {
    const checked = new Set();
    const scopeRoots = [targetRoot];
    for (const scope of scopes) {
      if (scope.project) scopeRoots.push(path.join(targetRoot, 'projects', scope.project));
    }
    for (const scopeRoot of scopeRoots) {
      const manifestPath = skillsManifestPath(scopeRoot);
      const relative = toPosixRelative(targetRoot, manifestPath);
      if (checked.has(relative) || !existsFile(manifestPath)) continue;
      checked.add(relative);
      const schemaVersion = readSkillManifestSchemaVersion(manifestPath);
      const isWorkspace = scopeRoot === targetRoot;
      if (isWorkspace && schemaVersion === 'buildr.skills/v3') continue;
      const manifestText = fs.readFileSync(manifestPath, 'utf8');
      const hasV2OnlyKeys = /^(?:contracts|bindings):/m.test(manifestText);
      const supportedLegacy = ['buildr.skills/v1', 'buildr.skills/v2'].includes(schemaVersion) || (schemaVersion === null && !hasV2OnlyKeys);
      const projectLegacy = !isWorkspace && supportedLegacy;
      addDoctorFinding(result, supportedLegacy ? 'warning' : 'error', projectLegacy ? 'skills.project_assets_legacy' : supportedLegacy ? 'skills.schema_version_legacy' : 'skills.schema_version_invalid', `${projectLegacy ? 'Legacy Project Skill source 等待显式迁移' : supportedLegacy ? 'Skills manifest 等待事务化升级' : 'Skills manifest schemaVersion 不支持'}：${relative}`, {
          path: relative,
          supportedVersions: ['buildr.skills/v1', 'buildr.skills/v2', 'buildr.skills/v3'],
          suggestion: projectLegacy ? '运行 buildr skills migrate-project-assets --check，审阅后再 --apply。' : supportedLegacy ? '运行 buildr update 或 buildr sync 迁移 workspace manifest 到 schemaVersion: buildr.skills/v3。' : '先更新 Buildr CLI；不要用当前版本重写该 manifest。',
          userActionRequired: true,
        });
    }
  }

  function finalizeDoctorResult(result) {
    const counts = { ok: 0, info: 0, warning: 0, error: 0 };
    for (const finding of result.findings) {
      counts[finding.status] = (counts[finding.status] ?? 0) + 1;
    }
    result.summary = counts;
    result.ok = counts.error === 0;
    result.repairPlan = buildDoctorRepairPlan(result.findings);
    result.health = buildDoctorHealth(result);
    result.nextSteps = result.repairPlan.slice(0, 10).map((step) => ({
      code: step.codes[0],
      codes: step.codes,
      suggestion: step.suggestion,
      ...(step.commands?.length === 1 ? { command: step.commands[0] } : {}),
      ...(step.commands?.length > 1 ? { commands: step.commands } : {}),
    }));
  }

  function printDoctorReport(result) {
    console.log(`Buildr doctor for ${result.targetRoot}`);
    console.log(`Status: ok=${result.summary.ok} info=${result.summary.info} warning=${result.summary.warning} error=${result.summary.error}`);
    console.log(`Health: workspaceValid=${result.health.workspaceValid} ready=${result.health.ready} actionRequired=${result.health.actionRequired} actionable=${result.health.actionableCount}`);
    console.log('');

    if (result.findings.length === 0) {
      console.log('[ok] 未发现问题。');
    } else {
      for (const finding of result.findings) {
        const location = finding.path ? ` (${finding.path})` : '';
        console.log(`[${finding.status}] ${finding.code}${location} - ${finding.message}`);
      }
    }

    if (result.repairPlan.length > 0) {
      console.log('');
      console.log('Repair plan:');
      for (const step of result.repairPlan) {
        console.log(`${step.id} [${step.priority}] ${step.codes.join(', ')}`);
        if (step.suggestion) console.log(`  建议：${step.suggestion}`);
        for (const command of step.commands || []) console.log(`  命令：${command}`);
      }
    }

    printCapabilityReport(result);
  }

  Object.assign(runtime, {
    scopeParts,
    workspaceName,
    readProjectsRegistryIfExists,
    discoverDoctorScopes,
    resolveRepoPath,
    readGitRemote,
    gitignoreLines,
    isIgnoredByWorkspace,
    projectDoctorContextFor,
    projectBaselineStatus,
    missingProjectBaselineAssets,
    diagnoseProjectRegistry,
    diagnoseWorkspace,
    diagnoseLegacyPractices,
    diagnoseHierarchy,
    diagnoseServicesMetadata,
    diagnoseServices,
    runtimeFindingsForDoctor,
    summarizeRuntimeFindings,
    addUnsupportedAgentFinding,
    detectManagedRuntimeAgents,
    diagnoseRuntime,
    diagnoseCommands,
    diagnoseComponents,
    diagnoseSkillsManifestSchemas,
    diagnoseSkillCapabilities,
    finalizeDoctorResult,
    printDoctorReport,
  });
  return runtime;
}

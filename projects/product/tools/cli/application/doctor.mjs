import {
  fs,
  path,
  execFileSync,
  SUPPORTED_AGENT_IDS,
  UNSUPPORTED_AGENT_GUIDANCE,
  getRuntimeAdapter,
  isSupportedAgent,
  RUNTIME_CHECKERS,
} from '../shared/platform.mjs';
import { createRuntimeDiagnostics } from './doctor/runtime-diagnostics.mjs';
import { createScopeDiagnostics } from './doctor/scope-diagnostics.mjs';
import { createServiceDiagnostics } from './doctor/service-diagnostics.mjs';

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
    diagnoseRuntime,
    diagnoseCommands,
    diagnoseComponents,
  } = createRuntimeDiagnostics({
    RUNTIME_CHECKERS,
    SUPPORTED_AGENT_IDS,
    UNSUPPORTED_AGENT_GUIDANCE,
    addDoctorFinding,
    componentRegistryPath,
    existsFile,
    getRuntimeAdapter,
    isSupportedAgent,
    managedRuntimeSkillOrphans,
    packageComponentsStatus,
    path,
    runCommandsCheck,
    runtimeImplementation,
    toPosixRelative,
  });

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
      if (schemaVersion !== 'buildr.skills/v1') {
        addDoctorFinding(result, 'warning', 'skills.schema_version_invalid', `Skills manifest schemaVersion 缺失或不支持：${relative}`, {
          path: relative,
          suggestion: '运行 buildr update 或 buildr sync 补齐 schemaVersion: buildr.skills/v1。',
        });
      }
    }
  }

  function finalizeDoctorResult(result) {
    const counts = { ok: 0, info: 0, warning: 0, error: 0 };
    for (const finding of result.findings) {
      counts[finding.status] = (counts[finding.status] ?? 0) + 1;
    }
    result.summary = counts;
    result.ok = counts.error === 0;
    result.nextSteps = result.findings
      .filter((finding) => finding.suggestion && finding.userActionRequired !== false)
      .map((finding) => ({ code: finding.code, suggestion: finding.suggestion, command: finding.command, commands: finding.commands }))
      .slice(0, 10);
  }

  function printDoctorReport(result) {
    console.log(`Buildr doctor for ${result.targetRoot}`);
    console.log(`Status: ok=${result.summary.ok} info=${result.summary.info} warning=${result.summary.warning} error=${result.summary.error}`);
    console.log('');

    if (result.findings.length === 0) {
      console.log('[ok] 未发现问题。');
      return;
    }

    for (const finding of result.findings) {
      const location = finding.path ? ` (${finding.path})` : '';
      console.log(`[${finding.status}] ${finding.code}${location} - ${finding.message}`);
      if (finding.suggestion) console.log(`  建议：${finding.suggestion}`);
      if (finding.command) console.log(`  命令：${finding.command}`);
      if (finding.commands) {
        for (const command of finding.commands) console.log(`  命令：${command}`);
      }
    }
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
    diagnoseRuntime,
    diagnoseCommands,
    diagnoseComponents,
    diagnoseSkillsManifestSchemas,
    finalizeDoctorResult,
    printDoctorReport,
  });
  return runtime;
}

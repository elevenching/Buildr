import {
  fs,
  crypto,
  path,
  process,
  execFileSync,
  spawnSync,
  YAML,
} from '../shared/platform.mjs';

export function registerDomainsWorkspace(runtime) {
  const readGitRemote = (...args) => runtime.readGitRemote(...args);
  const gitignoreLines = (...args) => runtime.gitignoreLines(...args);
  const isPlainObject = (...args) => runtime.isPlainObject(...args);
  const assertNoUnknownOptions = (...args) => runtime.assertNoUnknownOptions(...args);
  const positionalArgs = (...args) => runtime.positionalArgs(...args);
  const readPackageManifest = (...args) => runtime.readPackageManifest(...args);
  const parseManifestFileEntry = (...args) => runtime.parseManifestFileEntry(...args);
  const isValidAssetId = (...args) => runtime.isValidAssetId(...args);
  const assertName = (...args) => runtime.assertName(...args);
  const renderSkillsManifestYaml = (...args) => runtime.renderSkillsManifestYaml(...args);
  const optionValue = (...args) => runtime.optionValue(...args);
  const ensureDirectory = (...args) => runtime.ensureDirectory(...args);
  const atomicWriteFile = (...args) => runtime.atomicWriteFile(...args);
  const parseYamlDocument = (...args) => runtime.parseYamlDocument(...args);
  const sameGitIdentity = (...args) => runtime.sameGitIdentity(...args);
  const withWorkspaceMutation = (...args) => runtime.withWorkspaceMutation(...args);
  const writeIfMissing = (...args) => runtime.writeIfMissing(...args);
  const writeMappedFileIfMissing = (...args) => runtime.writeMappedFileIfMissing(...args);
  const appendGitignoreEntries = (...args) => runtime.appendGitignoreEntries(...args);
  const toPosixRelative = (...args) => runtime.toPosixRelative(...args);
  const existsDirectory = (...args) => runtime.existsDirectory(...args);
  const existsFile = (...args) => runtime.existsFile(...args);

  function parseProjectRef(ref) {
    const parts = ref.split('/').filter(Boolean);
    if (parts.length === 1) {
      assertName(parts[0], 'Project');
      return { project: parts[0] };
    }
    throw new Error(`Project ref must be <project>. Organization-prefixed refs are not supported: ${ref}`);
  }

  function parseServiceRef(ref) {
    const parts = ref.split('/').filter(Boolean);
    if (parts.length === 2) {
      assertName(parts[0], 'Project');
      assertName(parts[1], 'Service');
      return { project: parts[0], service: parts[1] };
    }
    throw new Error(`Service ref must be <project>/<service>. Organization-prefixed refs are not supported: ${ref}`);
  }

  function isGitUrl(value) {
    return /^(https?:\/\/|ssh:\/\/|git@)/.test(value) || /\.git$/.test(value);
  }

  function isProjectGitUrl(value) {
    return /^(https?:\/\/|ssh:\/\/|git@|file:\/\/)/.test(value);
  }

  function quoteYaml(value) {
    if (Array.isArray(value)) return JSON.stringify(value.map((item) => String(item)));
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return JSON.stringify(String(value));
  }

  function parseYamlValue(value) {
    const document = YAML.parseDocument(value, { uniqueKeys: true, prettyErrors: true });
    if (document.errors.length) throw new Error(`Invalid YAML value: ${value} (${document.errors.map((error) => error.message).join('; ')})`);
    return document.toJS();
  }

  function parseServicesYaml(content) {
    const parsed = parseYamlDocument(content, 'legacy services.yml');
    return isPlainObject(parsed.services) ? parsed.services : parsed;
  }

  function parseServicesManifestYaml(content) {
    const manifest = parseYamlDocument(content, 'services/manifest.yml');
    if (!isPlainObject(manifest.services)) manifest.services = {};
    return manifest;
  }

  function parseProjectsYaml(content) {
    const registry = parseYamlDocument(content, 'projects/manifest.yml');
    if (!isPlainObject(registry.projects)) registry.projects = {};
    return registry;
  }

  function renderProjectsYaml(registry) {
    const projects = registry.projects || {};
    const names = Object.keys(projects).sort();
    const lines = ['schemaVersion: buildr.projects/v1'];
    if (names.length === 0) {
      lines.push('projects: {}');
      return `${lines.join('\n')}\n`;
    }

    lines.push('projects:');
    for (const name of names) {
      const project = projects[name];
      lines.push(`  ${name}:`);
      for (const key of ['title', 'description', 'path']) {
        if (project[key] !== undefined) lines.push(`    ${key}: ${quoteYaml(project[key])}`);
      }
      if (project.repo) {
        lines.push('    repo:');
        for (const key of ['kind', 'url', 'remote', 'defaultBranch']) {
          if (project.repo[key] !== undefined) lines.push(`      ${key}: ${quoteYaml(project.repo[key])}`);
        }
      }
    }
    return `${lines.join('\n')}\n`;
  }

  function validateProjectsRegistry(registry) {
    const errors = [];
    if (String(registry.schemaVersion) !== 'buildr.projects/v1') {
      errors.push('projects/manifest.yml schemaVersion must be buildr.projects/v1.');
    }
    if (!isPlainObject(registry.projects)) {
      errors.push('projects/manifest.yml projects must be an object.');
      return errors;
    }

    for (const [projectName, project] of Object.entries(registry.projects)) {
      const label = `projects.${projectName}`;
      if (!isValidAssetId(projectName)) {
        errors.push(`${label} key must contain only letters, digits, dots, underscores, or dashes.`);
      }
      if (!isPlainObject(project)) {
        errors.push(`${label} must be an object.`);
        continue;
      }
      const allowedKeys = new Set(['title', 'description', 'path', 'repo']);
      for (const key of Object.keys(project)) {
        if (!allowedKeys.has(key)) errors.push(`${label}.${key} is not a supported projects/manifest.yml field.`);
      }
      if (!project.title || typeof project.title !== 'string') {
        errors.push(`${label}.title is required.`);
      }
      if (!project.description || typeof project.description !== 'string') {
        errors.push(`${label}.description is required.`);
      }
      if (project.path !== `projects/${projectName}`) {
        errors.push(`${label}.path must be projects/${projectName}.`);
      }
      if (!isPlainObject(project.repo)) {
        errors.push(`${label}.repo is required.`);
        continue;
      }
      const allowedRepoKeys = new Set(['kind', 'url', 'remote', 'defaultBranch']);
      for (const key of Object.keys(project.repo)) {
        if (!allowedRepoKeys.has(key)) errors.push(`${label}.repo.${key} is not a supported repo field.`);
      }
      if (!['workspace', 'git'].includes(project.repo.kind)) {
        errors.push(`${label}.repo.kind must be workspace or git.`);
      }
      if (project.repo.kind === 'workspace') {
        for (const key of ['url', 'remote', 'defaultBranch']) {
          if (project.repo[key] !== undefined) errors.push(`${label}.repo.${key} is only supported for git-managed Projects.`);
        }
      }
      if (project.repo.kind === 'git') {
        if (project.repo.url !== undefined && typeof project.repo.url !== 'string') errors.push(`${label}.repo.url must be a string when provided.`);
        if (project.repo.remote !== undefined && typeof project.repo.remote !== 'string') errors.push(`${label}.repo.remote must be a string when provided.`);
        if (project.repo.defaultBranch !== undefined && typeof project.repo.defaultBranch !== 'string') errors.push(`${label}.repo.defaultBranch must be a string when provided.`);
      }
    }

    return errors;
  }

  function renderServicesManifestYaml(manifest) {
    const services = manifest.services || {};
    const names = Object.keys(services).sort();
    const lines = ['schemaVersion: buildr.services/v1', `project: ${quoteYaml(manifest.project)}`];
    if (names.length === 0) {
      lines.push('services: {}');
      return `${lines.join('\n')}\n`;
    }

    lines.push('services:');
    for (const name of names) {
      const service = services[name];
      lines.push(`  ${name}:`);
      for (const key of ['title', 'description', 'type', 'path']) {
        if (service[key] !== undefined) lines.push(`    ${key}: ${quoteYaml(service[key])}`);
      }
      if (service.repo) {
        lines.push('    repo:');
        for (const key of ['kind', 'url', 'remote', 'defaultBranch', 'branch']) {
          if (service.repo[key] !== undefined) lines.push(`      ${key}: ${quoteYaml(service.repo[key])}`);
        }
      }
    }
    return `${lines.join('\n')}\n`;
  }

  function validateServicesManifest(manifest, expectedProject) {
    const errors = [];
    if (manifest.schemaVersion !== 'buildr.services/v1') {
      errors.push('services/manifest.yml schemaVersion must be buildr.services/v1.');
    }
    if (manifest.project !== expectedProject) {
      errors.push(`services/manifest.yml project must be ${expectedProject}.`);
    }
    if (!isPlainObject(manifest.services)) {
      errors.push('services/manifest.yml services must be an object.');
      return errors;
    }
    for (const [serviceName, service] of Object.entries(manifest.services)) {
      const label = `services.${serviceName}`;
      if (!isValidAssetId(serviceName)) {
        errors.push(`${label} key must contain only letters, digits, dots, underscores, or dashes.`);
      }
      if (!isPlainObject(service)) {
        errors.push(`${label} must be an object.`);
        continue;
      }
      const allowedKeys = new Set(['title', 'description', 'type', 'path', 'repo']);
      for (const key of Object.keys(service)) {
        if (!allowedKeys.has(key)) errors.push(`${label}.${key} is not a supported services/manifest.yml field.`);
      }
      if (!service.title || typeof service.title !== 'string') errors.push(`${label}.title is required.`);
      if (!service.description || typeof service.description !== 'string') errors.push(`${label}.description is required.`);
      if (!service.type || typeof service.type !== 'string') errors.push(`${label}.type is required.`);
      if (service.path !== `services/${serviceName}`) errors.push(`${label}.path must be services/${serviceName}.`);
      if (!isPlainObject(service.repo)) {
        errors.push(`${label}.repo is required.`);
        continue;
      }
      const allowedRepoKeys = new Set(['kind', 'url', 'remote', 'defaultBranch', 'branch']);
      for (const key of Object.keys(service.repo)) {
        if (!allowedRepoKeys.has(key)) errors.push(`${label}.repo.${key} is not a supported repo field.`);
      }
      if (!['workspace', 'git'].includes(service.repo.kind)) errors.push(`${label}.repo.kind must be workspace or git.`);
      if (service.repo.kind === 'workspace') {
        for (const key of ['url', 'remote', 'defaultBranch', 'branch']) {
          if (service.repo[key] !== undefined) errors.push(`${label}.repo.${key} is only supported for git-managed Services.`);
        }
      }
      if (service.repo.kind === 'git') {
        if (service.repo.url !== undefined && typeof service.repo.url !== 'string') errors.push(`${label}.repo.url must be a string when provided.`);
        if (service.repo.remote !== undefined && typeof service.repo.remote !== 'string') errors.push(`${label}.repo.remote must be a string when provided.`);
        if (service.repo.defaultBranch !== undefined && typeof service.repo.defaultBranch !== 'string') errors.push(`${label}.repo.defaultBranch must be a string when provided.`);
        if (service.repo.branch !== undefined && (typeof service.repo.branch !== 'string' || !service.repo.branch)) errors.push(`${label}.repo.branch must be a non-empty string when provided.`);
      }
    }
    return errors;
  }

  function readProjectsRegistryForWrite(targetRoot) {
    const file = projectsManifestPath(targetRoot);
    if (!existsFile(file)) return { schemaVersion: 'buildr.projects/v1', projects: {} };
    const registry = parseProjectsYaml(fs.readFileSync(file, 'utf8'));
    const errors = validateProjectsRegistry(registry)
      .filter((message) => !message.endsWith('.title is required.'))
      .filter((message) => !message.endsWith('.description is required.'));
    if (errors.length > 0) {
      throw new Error(`projects/manifest.yml is invalid:\n- ${errors.join('\n- ')}`);
    }
    return registry;
  }

  function writeProjectsRegistry(targetRoot, registry) {
    const file = projectsManifestPath(targetRoot);
    atomicWriteFile(file, renderProjectsYaml(registry));
    return file;
  }

  function projectsManifestPath(targetRoot) {
    return path.join(targetRoot, 'projects', 'manifest.yml');
  }

  function servicesManifestPath(projectRoot) {
    return path.join(projectRoot, 'services', 'manifest.yml');
  }

  function readServicesManifestForWrite(projectRoot, projectName) {
    const file = servicesManifestPath(projectRoot);
    if (!existsFile(file)) return { schemaVersion: 'buildr.services/v1', project: projectName, services: {} };
    const manifest = parseServicesManifestYaml(fs.readFileSync(file, 'utf8'));
    const errors = validateServicesManifest(manifest, projectName)
      .filter((message) => !message.endsWith('.title is required.'))
      .filter((message) => !message.endsWith('.description is required.'))
      .filter((message) => !message.endsWith('.type is required.'));
    if (errors.length > 0) {
      throw new Error(`services/manifest.yml is invalid:\n- ${errors.join('\n- ')}`);
    }
    return manifest;
  }

  function writeServicesManifest(projectRoot, manifest) {
    const file = servicesManifestPath(projectRoot);
    atomicWriteFile(file, renderServicesManifestYaml(manifest));
    return file;
  }

  function updateServicesManifest(projectRoot, projectName, serviceName, metadata) {
    const manifest = readServicesManifestForWrite(projectRoot, projectName);
    manifest.schemaVersion = 'buildr.services/v1';
    manifest.project = projectName;
    manifest.services[serviceName] = metadata;
    return writeServicesManifest(projectRoot, manifest);
  }

  function gitOutput(args, cwd) {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  }

  function gitCurrentBranch(repoPath) {
    try {
      const branch = gitOutput(['symbolic-ref', '--short', 'HEAD'], repoPath);
      return branch || 'HEAD';
    } catch {
      return 'HEAD';
    }
  }

  function gitDefaultBranch(repoPath, remote = 'origin') {
    const remoteUrl = readGitRemote(repoPath, remote);
    if (remoteUrl) {
      const result = spawnSync('git', ['ls-remote', '--symref', remoteUrl, 'HEAD'], {
        cwd: repoPath,
        encoding: 'utf8',
        timeout: 30000,
      });
      if (result.status === 0) {
        const match = result.stdout.match(/^ref:\s+refs\/heads\/(.+)\s+HEAD$/m);
        if (match) return match[1];
      }
    }
    try {
      const reference = gitOutput(['symbolic-ref', '--short', `refs/remotes/${remote}/HEAD`], repoPath);
      return reference.startsWith(`${remote}/`) ? reference.slice(remote.length + 1) : reference;
    } catch {
      return gitCurrentBranch(repoPath);
    }
  }

  function assertGitBranch(value) {
    if (!value) return;
    const result = spawnSync('git', ['check-ref-format', '--branch', value], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`Invalid Git branch: ${value}`);
  }

  function defaultAssetDescription(kind, id) {
    return `TODO: 补充 ${kind} ${id} 的用途说明。`;
  }

  function inferRepoKind(assetRoot) {
    return existsDirectory(path.join(assetRoot, '.git')) ? 'git' : 'workspace';
  }

  function ensureIgnoreEntry(repoRoot, pattern) {
    const changed = appendGitignoreEntries(path.join(repoRoot, '.gitignore'), [pattern]);
    return changed ? toPosixRelative(process.cwd(), path.join(repoRoot, '.gitignore')) : null;
  }

  function gitBoundaryFor(targetRoot, item) {
    if (!existsDirectory(path.join(item.assetRoot, '.git'))) return null;
    const projectRoot = path.join(targetRoot, 'projects', item.project);
    if (item.type === 'project') {
      if (existsDirectory(path.join(targetRoot, '.git'))) {
        return { repoRoot: targetRoot, pattern: `/projects/${item.project}/` };
      }
      return null;
    }
    if (existsDirectory(path.join(projectRoot, '.git'))) {
      return { repoRoot: projectRoot, pattern: `/services/${item.service}/` };
    }
    if (existsDirectory(path.join(targetRoot, '.git'))) {
      return { repoRoot: targetRoot, pattern: `/projects/${item.project}/services/${item.service}/` };
    }
    return null;
  }

  function ensureGitBoundaries(targetRoot, items) {
    const changed = [];
    for (const item of items) {
      const boundary = gitBoundaryFor(targetRoot, item);
      if (!boundary) continue;
      const updated = ensureIgnoreEntry(boundary.repoRoot, boundary.pattern);
      if (updated) changed.push(toPosixRelative(targetRoot, path.join(boundary.repoRoot, '.gitignore')));
    }
    return [...new Set(changed)];
  }

  function gitBoundaryIgnored(boundary) {
    if (!boundary) return true;
    const lines = gitignoreLines(boundary.repoRoot);
    return lines.includes(boundary.pattern);
  }

  function trackWrite(targetRoot, file, content, created) {
    if (writeIfMissing(file, content)) {
      created.push(path.relative(targetRoot, file).split(path.sep).join('/'));
    }
  }

  function printResult(title, targetRoot, created, changed = []) {
    console.log(title);
    if (created.length > 0) {
      console.log('Created:');
      for (const file of created) console.log(`  ${file}`);
    }
    if (changed.length > 0) {
      console.log('Updated:');
      for (const file of changed) console.log(`  ${file}`);
    }
  }

  function displayScope(scope) {
    return scope === '.' ? 'root (.)' : scope;
  }

  function createProject(args) {
    const allowedFlags = new Set(['--target', '--repo', '--title', '--description']);
    assertNoUnknownOptions(args, allowedFlags);
    const ref = positionalArgs(args)[0];
    if (!ref) throw new Error('Missing project ref');
    const { project } = parseProjectRef(ref);
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const repoRef = optionValue(args, '--repo', null);
    const titleOption = optionValue(args, '--title', null);
    const descriptionOption = optionValue(args, '--description', null);
    const projectRoot = path.join(targetRoot, 'projects', project);
    const created = [];
    const changed = [];
    const manifest = readPackageManifest();
    const registry = readProjectsRegistryForWrite(targetRoot);
    const existingEntry = registry.projects[project] || null;
    const title = titleOption ?? existingEntry?.title ?? project;
    const description = descriptionOption ?? existingEntry?.description ?? defaultAssetDescription('Project', project);

    if (repoRef && !isProjectGitUrl(repoRef)) {
      throw new Error(`Project --repo only supports Git URLs. Project assets must be materialized under projects/${project}; external local Project links are not supported.`);
    }
    if (repoRef && existsDirectory(projectRoot) && !existsDirectory(path.join(projectRoot, '.git'))) {
      throw new Error(`Project repo target exists but is not a Git repository: projects/${project}`);
    }
    if (repoRef && existsDirectory(projectRoot)) {
      const actualUrl = readGitRemote(projectRoot, 'origin');
      if (!actualUrl || !sameGitIdentity(actualUrl, repoRef)) {
        throw new Error(`Project repo identity conflicts for ${project}: expected ${repoRef}, actual ${actualUrl || '<missing origin>'}. Buildr will not relink an existing Project.`);
      }
      if (existingEntry?.repo?.kind && existingEntry.repo.kind !== 'git') {
        throw new Error(`Project registry identity conflicts for ${project}: existing repo.kind is ${existingEntry.repo.kind}, requested git.`);
      }
      if (existingEntry?.repo?.url && !sameGitIdentity(existingEntry.repo.url, repoRef)) {
        throw new Error(`Project registry URL conflicts for ${project}: expected ${repoRef}, recorded ${existingEntry.repo.url}.`);
      }
    }
    if (!repoRef && existingEntry?.repo?.kind === 'git' && !existsDirectory(path.join(projectRoot, '.git'))) {
      throw new Error(`Project registry expects a Git repo but materialized Project is not Git-managed: ${project}`);
    }

    const affected = [projectRoot, projectsManifestPath(targetRoot), path.join(targetRoot, '.gitignore')];
    return withWorkspaceMutation(targetRoot, `project.create:${project}`, affected, () => {
      const staging = path.join(path.dirname(projectRoot), `.${project}.buildr-stage-${crypto.randomUUID()}`);
      try {
        if (repoRef && !existsDirectory(projectRoot)) {
          execFileSync('git', ['clone', repoRef, staging], { stdio: 'inherit' });
          fs.renameSync(staging, projectRoot);
        }
        ensureDirectory(projectRoot);
        for (const relativeDir of manifest.projectDirectories) ensureDirectory(path.join(projectRoot, relativeDir));
        const variables = { project };
        for (const rawEntry of manifest.projectFiles) {
          const entry = parseManifestFileEntry(rawEntry, 'projectFiles');
          writeMappedFileIfMissing(targetRoot, projectRoot, entry, variables, created);
        }
        trackWrite(targetRoot, path.join(projectRoot, 'skills', 'manifest.yml'), renderSkillsManifestYaml([]), created);
        trackWrite(targetRoot, servicesManifestPath(projectRoot), renderServicesManifestYaml({ schemaVersion: 'buildr.services/v1', project, services: {} }), created);

        const repoMetadata = repoRef ? { kind: 'git', url: repoRef, remote: 'origin', defaultBranch: gitDefaultBranch(projectRoot) }
          : existingEntry?.repo?.kind === 'git' ? existingEntry.repo : { kind: 'workspace' };
        registry.projects[project] = { title, description, path: `projects/${project}`, repo: repoMetadata };
        const registryPath = writeProjectsRegistry(targetRoot, registry);
        changed.push(toPosixRelative(targetRoot, registryPath));
        changed.push(...ensureGitBoundaries(targetRoot, [{ type: 'project', project, assetRoot: projectRoot }]));
        printResult(`Created project ${project}`, targetRoot, created, changed);
      } finally {
        if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
      }
    });
  }

  function createService(args) {
    assertNoUnknownOptions(args, new Set(['--target', '--type', '--rules', '--branch']));
    const ref = args[0];
    const repoRef = args[1];
    if (!ref) throw new Error('Missing service ref');
    if (!repoRef) throw new Error('Missing repo ref');

    const { project, service } = parseServiceRef(ref);
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const serviceType = optionValue(args, '--type', null);
    const rulesSource = optionValue(args, '--rules', null);
    const branchInput = optionValue(args, '--branch', null);
    assertGitBranch(branchInput);
    const projectRoot = path.join(targetRoot, 'projects', project);
    const servicesRoot = path.join(projectRoot, 'services');
    const servicePath = path.join(servicesRoot, service);
    const changed = [];

    if (!fs.existsSync(projectRoot)) {
      createProject([project, '--target', targetRoot]);
    }

    const gitSource = isGitUrl(repoRef);
    const existingManifest = readServicesManifestForWrite(projectRoot, project);
    const existingEntry = existingManifest.services[service] || null;
    if (branchInput && !gitSource) throw new Error('--branch is only supported for Git Service sources.');
    if (branchInput && existingEntry?.repo?.branch && existingEntry.repo.branch !== branchInput) {
      throw new Error(`Service branch intent conflicts for ${project}/${service}: requested ${branchInput}, recorded ${existingEntry.repo.branch}.`);
    }
    const requestedBranch = branchInput || existingEntry?.repo?.branch || null;
    if (gitSource && existsDirectory(servicePath)) {
      if (!existsDirectory(path.join(servicePath, '.git'))) throw new Error(`Service Git target exists but is not a Git repository: projects/${project}/services/${service}`);
      const actualUrl = readGitRemote(servicePath, 'origin');
      if (!actualUrl || !sameGitIdentity(actualUrl, repoRef)) throw new Error(`Service repo identity conflicts for ${project}/${service}: expected ${repoRef}, actual ${actualUrl || '<missing origin>'}.`);
      if (existingEntry?.repo?.kind && existingEntry.repo.kind !== 'git') throw new Error(`Service metadata identity conflicts for ${project}/${service}: existing repo.kind is ${existingEntry.repo.kind}, requested git.`);
      if (existingEntry?.repo?.url && !sameGitIdentity(existingEntry.repo.url, repoRef)) throw new Error(`Service metadata URL conflicts for ${project}/${service}: expected ${repoRef}, recorded ${existingEntry.repo.url}.`);
      const actualBranch = gitCurrentBranch(servicePath);
      if (requestedBranch && actualBranch !== requestedBranch) throw new Error(`Service branch conflicts for ${project}/${service}: expected ${requestedBranch}, actual ${actualBranch}.`);
    }
    const localPath = gitSource ? null : path.resolve(repoRef);
    if (!gitSource && !fs.existsSync(localPath)) throw new Error(`Local service source path does not exist: ${repoRef}`);
    if (!gitSource && fs.existsSync(servicePath)) throw new Error(`Service target already exists: projects/${project}/services/${service}`);

    const affected = [servicePath, servicesManifestPath(projectRoot), path.join(projectRoot, '.gitignore'), path.join(targetRoot, '.gitignore')];
    return withWorkspaceMutation(targetRoot, `service.create:${project}/${service}`, affected, () => {
      ensureDirectory(servicesRoot);
      const staging = path.join(servicesRoot, `.${service}.buildr-stage-${crypto.randomUUID()}`);
      try {
        if (!fs.existsSync(servicePath)) {
          if (gitSource) {
            const cloneArgs = ['clone'];
            if (requestedBranch) cloneArgs.push('--branch', requestedBranch, '--single-branch');
            cloneArgs.push(repoRef, staging);
            execFileSync('git', cloneArgs, { stdio: 'inherit' });
          }
          else fs.cpSync(localPath, staging, { recursive: true });
          fs.renameSync(staging, servicePath);
        }
        const repo = gitSource ? { kind: 'git', url: repoRef, remote: 'origin', defaultBranch: gitDefaultBranch(servicePath) } : { kind: inferRepoKind(servicePath) };
        if (gitSource && requestedBranch) repo.branch = requestedBranch;
        if (repo.kind === 'git' && !gitSource) {
          repo.remote = 'origin';
          repo.defaultBranch = gitDefaultBranch(servicePath);
          const url = readGitRemote(servicePath, 'origin');
          if (url) repo.url = url;
        }
        const metadata = { title: service, description: defaultAssetDescription('Service', service), type: serviceType || 'service', path: `services/${service}`, repo };
        if (rulesSource) console.error('Warning: --rules is deprecated. Service AGENTS.md is treated as the service rule asset and is not recorded in services/manifest.yml.');
        const metadataPath = updateServicesManifest(projectRoot, project, service, metadata);
        changed.push(path.relative(targetRoot, metadataPath).split(path.sep).join('/'));
        for (const file of ensureGitBoundaries(targetRoot, [{ type: 'service', project, service, assetRoot: servicePath }])) changed.push(file);
        printResult(`Created service ${project}/${service}`, targetRoot, [], changed);
      } finally {
        if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
      }
    });
  }

  Object.assign(runtime, { parseProjectRef, parseServiceRef, isGitUrl, isProjectGitUrl, quoteYaml, parseYamlValue, parseServicesYaml, parseServicesManifestYaml, parseProjectsYaml, renderProjectsYaml, validateProjectsRegistry, renderServicesManifestYaml, validateServicesManifest, readProjectsRegistryForWrite, writeProjectsRegistry, projectsManifestPath, servicesManifestPath, readServicesManifestForWrite, writeServicesManifest, updateServicesManifest, gitOutput, gitCurrentBranch, gitDefaultBranch, assertGitBranch, defaultAssetDescription, inferRepoKind, ensureIgnoreEntry, gitBoundaryFor, ensureGitBoundaries, gitBoundaryIgnored, trackWrite, printResult, displayScope, createProject, createService });
  return runtime;
}

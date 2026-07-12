import { fs, path, process, YAML } from '../shared/platform.mjs';

export function registerDomainsSkills(runtime) {
  const doctor = (...args) => runtime.doctor(...args);
  const isPlainObject = (...args) => runtime.isPlainObject(...args);
  const assertNoUnknownOptions = (...args) => runtime.assertNoUnknownOptions(...args);
  const positionalArgs = (...args) => runtime.positionalArgs(...args);
  const componentOwnerForMember = (...args) => runtime.componentOwnerForMember(...args);
  const readPackageManifest = (...args) => runtime.readPackageManifest(...args);
  const isValidAssetId = (...args) => runtime.isValidAssetId(...args);
  const assertName = (...args) => runtime.assertName(...args);
  const quoteYaml = (...args) => runtime.quoteYaml(...args);
  const parseYamlValue = (...args) => runtime.parseYamlValue(...args);
  const optionValue = (...args) => runtime.optionValue(...args);
  const ensureDirectory = (...args) => runtime.ensureDirectory(...args);
  const atomicWriteFile = (...args) => runtime.atomicWriteFile(...args);
  const parseYamlDocument = (...args) => runtime.parseYamlDocument(...args);
  const assertSafeAssetTarget = (...args) => runtime.assertSafeAssetTarget(...args);
  const withWorkspaceMutation = (...args) => runtime.withWorkspaceMutation(...args);
  const productRoot = (...args) => runtime.productRoot(...args);
  const hasFlag = (...args) => runtime.hasFlag(...args);
  const toPosixRelative = (...args) => runtime.toPosixRelative(...args);
  const existsDirectory = (...args) => runtime.existsDirectory(...args);
  const existsFile = (...args) => runtime.existsFile(...args);
  const assertInitializedBuildrWorkspace = (...args) => runtime.assertInitializedBuildrWorkspace(...args);

  function readSkillManifest(file) {
    {
      const parsed = parseYamlDocument(fs.readFileSync(file, 'utf8'), toPosixRelative(process.cwd(), file));
      return Array.isArray(parsed.skills) ? parsed.skills : [];
    }
    const skills = [];
    let currentSkill = null;
    let currentObject = null;

    function finishSkill() {
      if (!currentSkill) return;
      skills.push(currentSkill);
      currentSkill = null;
      currentObject = null;
    }

    for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const idMatch = trimmed.match(/^-\s+id:\s*(.+)$/);
      if (idMatch) {
        finishSkill();
        currentSkill = { id: parseYamlValue(idMatch[1].trim()) };
        currentObject = null;
        continue;
      }

      if (!currentSkill) continue;

      const objectStartMatch = trimmed.match(/^(source|resolved|install):\s*$/);
      if (objectStartMatch) {
        currentObject = objectStartMatch[1];
        currentSkill[currentObject] = {};
        continue;
      }

      const nestedMatch = rawLine.match(/^\s{6}([A-Za-z][A-Za-z0-9_-]*):\s*(.+)$/);
      if (nestedMatch && currentObject) {
        currentSkill[currentObject][nestedMatch[1]] = parseYamlValue(nestedMatch[2].trim());
        continue;
      }

      currentObject = null;

      const pathMatch = trimmed.match(/^path:\s*(.+)$/);
      if (pathMatch) {
        currentSkill.path = parseYamlValue(pathMatch[1].trim());
        continue;
      }
      const sourceMatch = trimmed.match(/^source:\s*(.+)$/);
      if (sourceMatch) {
        currentSkill.source = parseYamlValue(sourceMatch[1].trim());
        continue;
      }
      const resolvedMatch = trimmed.match(/^resolved:\s*(.+)$/);
      if (resolvedMatch) {
        currentSkill.resolved = parseYamlValue(resolvedMatch[1].trim());
        continue;
      }
      const installMatch = trimmed.match(/^install:\s*(.+)$/);
      if (installMatch) {
        currentSkill.install = parseYamlValue(installMatch[1].trim());
        continue;
      }
      const descriptionMatch = trimmed.match(/^description:\s*(.+)$/);
      if (descriptionMatch) {
        currentSkill.description = parseYamlValue(descriptionMatch[1].trim());
        continue;
      }
      const enabledMatch = trimmed.match(/^enabled:\s*(.+)$/);
      if (enabledMatch) {
        currentSkill.enabled = parseYamlValue(enabledMatch[1].trim());
        continue;
      }
      const requiredMatch = trimmed.match(/^required:\s*(.+)$/);
      if (requiredMatch) {
        currentSkill.required = parseYamlValue(requiredMatch[1].trim());
        continue;
      }
      const stateMatch = trimmed.match(/^state:\s*(.+)$/);
      if (stateMatch) {
        currentSkill.state = parseYamlValue(stateMatch[1].trim());
        continue;
      }
      const runtimesMatch = trimmed.match(/^runtimes:\s*(.+)$/);
      if (runtimesMatch) {
        currentSkill.runtimes = parseYamlValue(runtimesMatch[1].trim());
        continue;
      }
      const runtimePathMatch = trimmed.match(/^runtimePath:\s*(.+)$/);
      if (runtimePathMatch) {
        currentSkill.runtimePath = parseYamlValue(runtimePathMatch[1].trim());
        continue;
      }
    }

    finishSkill();
    return skills;
  }

  function readSkillManifestSchemaVersion(file) {
    if (!existsFile(file)) return null;
    return parseYamlDocument(fs.readFileSync(file, 'utf8'), toPosixRelative(process.cwd(), file)).schemaVersion || null;
  }

  function renderYamlObject(lines, indent, key, value) {
    if (value === undefined) return;
    if (isPlainObject(value)) {
      lines.push(`${indent}${key}:`);
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (nestedValue !== undefined) lines.push(`${indent}  ${nestedKey}: ${quoteYaml(nestedValue)}`);
      }
    } else {
      lines.push(`${indent}${key}: ${quoteYaml(value)}`);
    }
  }

  function renderSkillsManifestYaml(skills) {
    const lines = ['schemaVersion: buildr.skills/v1'];
    if (!skills || skills.length === 0) {
      lines.push('skills: []');
      return `${lines.join('\n')}\n`;
    }
    lines.push('skills:');
    for (const skill of skills) {
      lines.push(`  - id: ${quoteYaml(skill.id)}`);
      if (skill.source !== undefined && skill.path !== undefined && typeof skill.source === 'string' && isManifestSourceLabel(skill.source)) {
        lines.push(`    source: ${quoteYaml(skill.source)}`);
      }
      if (skill.path !== undefined) {
        lines.push(`    path: ${quoteYaml(skill.path)}`);
      } else {
        renderYamlObject(lines, '    ', 'source', skill.source);
        renderYamlObject(lines, '    ', 'resolved', skill.resolved);
        renderYamlObject(lines, '    ', 'install', skill.install);
      }
      if (skill.description !== undefined) {
        lines.push(`    description: ${quoteYaml(skill.description)}`);
      }
      if (skill.enabled !== undefined) lines.push(`    enabled: ${quoteYaml(Boolean(skill.enabled))}`);
      if (skill.required !== undefined) lines.push(`    required: ${quoteYaml(Boolean(skill.required))}`);
      if (skill.state !== undefined) lines.push(`    state: ${quoteYaml(skill.state)}`);
      if (skill.runtimes !== undefined) lines.push(`    runtimes: ${quoteYaml(skill.runtimes)}`);
      if (skill.runtimePath !== undefined) lines.push(`    runtimePath: ${quoteYaml(skill.runtimePath)}`);
    }
    return `${lines.join('\n')}\n`;
  }

  function validateSkillManifestEntries(skills, manifestPath) {
    const ids = new Set();
    for (const [index, skill] of skills.entries()) {
      const label = `skills[${index}]`;
      if (!isValidAssetId(skill.id)) {
        throw new Error(`${label}.id must contain only letters, digits, dots, underscores, or dashes in ${manifestPath}`);
      }
      if (ids.has(skill.id)) {
        throw new Error(`Duplicate skill id in ${manifestPath}: ${skill.id}`);
      }
      ids.add(skill.id);
      const hasPath = skill.path !== undefined;
      const hasSource = skill.source !== undefined;
      const hasResolved = skill.resolved !== undefined;
      const hasSourceLabel = hasPath && typeof skill.source === 'string' && isManifestSourceLabel(skill.source);
      if (hasPath && ((hasSource && !hasSourceLabel) || hasResolved)) {
        throw new Error(`${label} must not combine path with source or resolved in ${manifestPath}`);
      }
      if (!hasPath && !hasSource && !hasResolved) {
        throw new Error(`${label} must include path, source, or resolved in ${manifestPath}`);
      }
      if (hasPath) {
        if (!skill.path || typeof skill.path !== 'string') {
          throw new Error(`${label}.path must be a string in ${manifestPath}`);
        }
        normalizeRelativePathForBuildr(skill.path, `Skill path must stay inside skills root: ${skill.path}`);
      }
      if (hasSource && !hasSourceLabel) {
        if (typeof skill.source === 'string') {
          parseSkillSourceRef(skill.source);
        } else if (isPlainObject(skill.source)) {
          validateSkillUrlObject(skill.source, `${label}.source`, manifestPath);
        } else {
          throw new Error(`${label}.source must be a string or object in ${manifestPath}`);
        }
      }
      if (hasResolved) {
        if (!isPlainObject(skill.resolved)) {
          throw new Error(`${label}.resolved must be an object in ${manifestPath}`);
        }
        validateResolvedSkillSource(skill.resolved, `${label}.resolved`, manifestPath);
      }
      if (skill.install !== undefined) {
        if (!isPlainObject(skill.install)) {
          throw new Error(`${label}.install must be an object in ${manifestPath}`);
        }
        if (skill.install.mode !== undefined && !['agent', 'buildr'].includes(skill.install.mode)) {
          throw new Error(`${label}.install.mode must be agent or buildr in ${manifestPath}`);
        }
      }
      if (skill.description !== undefined && typeof skill.description !== 'string') {
        throw new Error(`${label}.description must be a string in ${manifestPath}`);
      }
      if (skill.enabled !== undefined && typeof skill.enabled !== 'boolean') {
        throw new Error(`${label}.enabled must be a boolean in ${manifestPath}`);
      }
      if (skill.required !== undefined && typeof skill.required !== 'boolean') {
        throw new Error(`${label}.required must be a boolean in ${manifestPath}`);
      }
      if (skill.state !== undefined && !['installed', 'modified', 'uninstalled', 'missing'].includes(skill.state)) {
        throw new Error(`${label}.state must be installed, modified, uninstalled, or missing in ${manifestPath}`);
      }
      if (skill.runtimes !== undefined && (!Array.isArray(skill.runtimes) || !skill.runtimes.every((runtime) => typeof runtime === 'string'))) {
        throw new Error(`${label}.runtimes must be an array of strings in ${manifestPath}`);
      }
    }
  }

  function isManifestSourceLabel(value) {
    return ['buildr', 'openspec', 'workspace', 'project', 'service'].includes(value);
  }

  function validateSkillUrlObject(value, label, manifestPath) {
    if (!value.kind || typeof value.kind !== 'string') {
      throw new Error(`${label}.kind must be a string in ${manifestPath}`);
    }
    if (!value.url || typeof value.url !== 'string') {
      throw new Error(`${label}.url must be a string in ${manifestPath}`);
    }
  }

  function validateResolvedSkillSource(value, label, manifestPath) {
    validateSkillUrlObject(value, label, manifestPath);
    if (value.kind !== 'skill-url') {
      throw new Error(`${label}.kind is not supported by this CLI: ${value.kind}`);
    }
    if (value.version !== undefined && typeof value.version !== 'string') {
      throw new Error(`${label}.version must be a string in ${manifestPath}`);
    }
    if (value.integrity !== undefined && typeof value.integrity !== 'string') {
      throw new Error(`${label}.integrity must be a string in ${manifestPath}`);
    }
  }

  function normalizeRelativePathForBuildr(input, message) {
    const normalized = path.normalize(input).replace(/^\.[\\/]/, '');
    if (!normalized || path.isAbsolute(normalized) || normalized === '..' || normalized.startsWith(`..${path.sep}`)) {
      throw new Error(message);
    }
    return normalized.split(path.sep).join('/');
  }

  function parseSkillSourceRef(sourceRef) {
    if (!sourceRef || typeof sourceRef !== 'string') {
      throw new Error(`Skill source reference must be a string: ${sourceRef || ''}`);
    }
    const match = sourceRef.match(/^package:([A-Za-z0-9._-]+)$/);
    if (!match) {
      throw new Error(`Unsupported Skill source reference: ${sourceRef}. Supported format: package:<source-id>`);
    }
    return { type: 'package', id: match[1] };
  }

  function assertHttpUrl(value, label) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error(`${label} must be a valid URL: ${value}`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`${label} must use http or https: ${value}`);
    }
  }

  function resolvePackageSkillSourceRef(sourceRef, options = {}) {
    const parsed = parseSkillSourceRef(sourceRef);
    const manifest = readPackageManifest();
    const source = manifest.skillSources.find((entry) => entry.id === parsed.id);
    if (!source) {
      throw new Error(`Package Skill source not found: ${sourceRef}`);
    }
    if (!source.path || typeof source.path !== 'string') {
      throw new Error(`Package Skill source must include path: ${source.id}`);
    }
    if (!Array.isArray(source.runtimes) || source.runtimes.length === 0) {
      throw new Error(`Package Skill source must declare at least one runtime: ${source.id}`);
    }
    if (options.runtime && !source.runtimes.includes(options.runtime)) {
      throw new Error(`Package Skill source ${sourceRef} does not support runtime: ${options.runtime}`);
    }
    if (path.isAbsolute(source.path) || source.path.startsWith('..')) {
      throw new Error(`Package Skill source path must stay inside product root: ${source.path}`);
    }
    if (source.runtimePath !== undefined) {
      normalizeRelativePathForBuildr(source.runtimePath, `Package Skill source runtimePath must stay relative: ${source.runtimePath}`);
    }
    const sourceDir = path.resolve(productRoot(), source.path);
    const skillFile = path.join(sourceDir, 'SKILL.md');
    if (!existsFile(skillFile)) {
      throw new Error(`Package Skill source SKILL.md does not exist: ${source.path}/SKILL.md`);
    }
    const metadata = parseSkillFrontmatter(skillFile);
    return { ...parsed, entry: source, sourceDir, skillFile, metadata };
  }

  function scopeRootForSkills(targetRoot, scope) {
    const normalizedScope = scope === '.' ? '.' : normalizeRelativePathForBuildr(scope, `Unsupported skills scope: ${scope}`);
    const parts = normalizedScope === '.' ? ['.'] : normalizedScope.split(path.sep);
    if (parts[0] === '.') return { scope: '.', scopeRoot: targetRoot };
    if (parts[0] === 'projects' && parts.length === 2) {
      const scopeRoot = path.join(targetRoot, 'projects', parts[1]);
      if (!existsDirectory(scopeRoot)) throw new Error(`Project scope does not exist: ${normalizedScope}`);
      return { scope: normalizedScope.split(path.sep).join('/'), scopeRoot };
    }
    throw new Error(`Unsupported skills scope. Use . or projects/<project>: ${scope}`);
  }

  function skillsManifestPath(scopeRoot) {
    return path.join(scopeRoot, 'skills', 'manifest.yml');
  }

  function readSkillsManifestForWrite(scopeRoot) {
    const manifestPath = skillsManifestPath(scopeRoot);
    if (!existsFile(manifestPath)) return [];
    const skills = readSkillManifest(manifestPath);
    validateSkillManifestEntries(skills, manifestPath);
    return skills;
  }

  function writeSkillsManifest(scopeRoot, skills) {
    const manifestPath = skillsManifestPath(scopeRoot);
    atomicWriteFile(manifestPath, renderSkillsManifestYaml(skills));
    return manifestPath;
  }

  function parseSkillFrontmatter(skillFile) {
    const content = fs.readFileSync(skillFile, 'utf8');
    const lines = content.split(/\r?\n/);
    if (lines[0] !== '---') {
      throw new Error(`SKILL.md must start with YAML frontmatter: ${skillFile}`);
    }
    const endIndex = lines.findIndex((line, index) => index > 0 && line === '---');
    if (endIndex === -1) {
      throw new Error(`SKILL.md frontmatter is not closed: ${skillFile}`);
    }
    const metadata = parseYamlDocument(lines.slice(1, endIndex).join('\n'), `SKILL.md frontmatter: ${skillFile}`);
    if (!metadata.name || typeof metadata.name !== 'string') {
      throw new Error(`SKILL.md frontmatter must declare name: ${skillFile}`);
    }
    assertName(metadata.name, 'Skill name');
    if (metadata.description !== undefined && typeof metadata.description !== 'string') {
      throw new Error(`SKILL.md frontmatter description must be a string: ${skillFile}`);
    }
    return metadata;
  }

  function supportedSkillSourceEntries() {
    return new Set(['SKILL.md', 'scripts', 'templates', 'assets', 'examples', 'references']);
  }

  function inspectSkillSource(sourceDir) {
    if (!existsDirectory(sourceDir)) throw new Error(`Skill source directory does not exist: ${sourceDir}`);
    const skillFile = path.join(sourceDir, 'SKILL.md');
    if (!existsFile(skillFile)) throw new Error(`Skill source must contain SKILL.md: ${sourceDir}`);
    const metadata = parseSkillFrontmatter(skillFile);
    const supported = supportedSkillSourceEntries();
    const entries = fs.readdirSync(sourceDir).sort();
    const unknownEntries = entries.filter((entry) => !supported.has(entry));
    return { skillFile, metadata, entries, unknownEntries };
  }

  function samePath(left, right) {
    const leftResolved = path.resolve(left);
    const rightResolved = path.resolve(right);
    try {
      return fs.realpathSync(leftResolved) === fs.realpathSync(rightResolved);
    } catch {
      return leftResolved === rightResolved;
    }
  }

  function copySupportedSkillSource(sourceDir, targetDir, entries, options = {}) {
    if (samePath(sourceDir, targetDir)) return;
    if (existsDirectory(targetDir)) {
      if (!options.replace) {
        throw new Error(`Skill target directory already exists: ${targetDir}. Use --replace to replace the whole directory.`);
      }
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    ensureDirectory(targetDir);
    const supported = supportedSkillSourceEntries();
    for (const entry of entries) {
      if (!supported.has(entry)) continue;
      const sourcePath = path.join(sourceDir, entry);
      const targetPath = path.join(targetDir, entry);
      if (existsDirectory(sourcePath)) {
        fs.cpSync(sourcePath, targetPath, { recursive: true });
      } else if (existsFile(sourcePath)) {
        ensureDirectory(path.dirname(targetPath));
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  function printSkillsMutationReceipt(action, targetRoot, id, updatedPaths, skippedEntries, nextAction, assetLabel = 'Skill 源资产') {
    console.log(`已${action} ${assetLabel}：${id}`);
    console.log('已更新 Buildr 源资产：');
    for (const file of updatedPaths) console.log(`  ${toPosixRelative(targetRoot, file)}`);
    if (skippedEntries.length > 0) {
      console.log('未装载的顶层内容：');
      for (const entry of skippedEntries) console.log(`  ${entry}`);
    }
    console.log('下一步：');
    console.log(`  ${nextAction}`);
  }

  function skillsAddUnsafe(args) {
    const allowedFlags = new Set([
      '--target',
      '--scope',
      '--source',
      '--remote-source',
      '--source-kind',
      '--resolved-source',
      '--resolved-kind',
      '--version',
      '--integrity',
      '--description',
      '--replace',
      '--ignore-unsupported',
    ]);
    assertNoUnknownOptions(args, allowedFlags, new Set(['--replace', '--ignore-unsupported']));
    const [explicitId] = positionalArgs(args);
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const scopeInput = optionValue(args, '--scope', null);
    const sourceInput = optionValue(args, '--source', null);
    const remoteSourceInput = optionValue(args, '--remote-source', null);
    const sourceKindInput = optionValue(args, '--source-kind', 'url');
    const resolvedSourceInput = optionValue(args, '--resolved-source', null);
    const resolvedKindInput = optionValue(args, '--resolved-kind', 'skill-url');
    const versionInput = optionValue(args, '--version', null);
    const integrityInput = optionValue(args, '--integrity', null);
    const descriptionInput = optionValue(args, '--description', null);
    if (!scopeInput) throw new Error('Missing required option: --scope');
    if (sourceInput && (remoteSourceInput || resolvedSourceInput)) {
      throw new Error('--source cannot be combined with --remote-source or --resolved-source.');
    }
    if (!sourceInput && !remoteSourceInput && !resolvedSourceInput) {
      throw new Error('Specify one of --source, --remote-source, or --resolved-source.');
    }
    assertInitializedBuildrWorkspace(targetRoot);

    const { scopeRoot } = scopeRootForSkills(targetRoot, scopeInput);
    const manifest = readSkillsManifestForWrite(scopeRoot);
    const replace = hasFlag(args, '--replace');
    const ignoreUnsupported = hasFlag(args, '--ignore-unsupported');

    if (remoteSourceInput || resolvedSourceInput) {
      if (!explicitId) throw new Error('Missing skill id for remote Skill registration.');
      assertName(explicitId, 'Skill id');
      if (ignoreUnsupported) throw new Error('--ignore-unsupported can only be used with --source.');
      if (resolvedSourceInput && resolvedKindInput !== 'skill-url') {
        throw new Error(`Unsupported resolved kind: ${resolvedKindInput}. Supported kind: skill-url`);
      }
      if (remoteSourceInput) assertHttpUrl(remoteSourceInput, '--remote-source');
      if (resolvedSourceInput) assertHttpUrl(resolvedSourceInput, '--resolved-source');
      const existingIndex = manifest.findIndex((skill) => skill.id === explicitId);
      if (existingIndex !== -1 && !replace) {
        throw new Error(`Skill already exists in skills/manifest.yml: ${explicitId}. Use --replace to replace the whole entry.`);
      }
      const manifestEntry = { id: explicitId };
      if (remoteSourceInput) {
        manifestEntry.source = { kind: sourceKindInput, url: remoteSourceInput };
      }
      if (resolvedSourceInput) {
        manifestEntry.resolved = { kind: resolvedKindInput, url: resolvedSourceInput };
        if (versionInput) manifestEntry.resolved.version = versionInput;
        if (integrityInput) manifestEntry.resolved.integrity = integrityInput;
        manifestEntry.install = { mode: 'buildr' };
      } else {
        manifestEntry.install = { mode: 'agent' };
      }
      if (descriptionInput) manifestEntry.description = descriptionInput;
      if (existingIndex === -1) {
        manifest.push(manifestEntry);
      } else {
        manifest[existingIndex] = manifestEntry;
      }
      const manifestPath = writeSkillsManifest(scopeRoot, manifest);
      printSkillsMutationReceipt(
        existingIndex === -1 ? '添加' : '替换',
        targetRoot,
        explicitId,
        [manifestPath],
        [],
        '如果当前 Agent 需要 Skills runtime 渲染，按当前 Agent runtime 能力执行 Skills render、runtime check 或 doctor。',
        resolvedSourceInput ? 'Skill 已解析远端资产' : 'Skill 远端信息源'
      );
      return;
    }

    if (sourceKindInput !== 'url' || resolvedKindInput !== 'skill-url' || versionInput || integrityInput || descriptionInput) {
      throw new Error('--source-kind, --resolved-kind, --version, --integrity, and --description for remote registration cannot be used with --source.');
    }
    const sourceDir = path.resolve(sourceInput);
    const source = inspectSkillSource(sourceDir);
    const skillId = source.metadata.name;
    if (explicitId && explicitId !== skillId) {
      throw new Error(`Explicit skill id does not match SKILL.md frontmatter name: ${explicitId} != ${skillId}`);
    }
    if (source.unknownEntries.length > 0 && !ignoreUnsupported) {
      throw new Error(`Skill source contains unsupported top-level entries: ${source.unknownEntries.join(', ')}. Use --ignore-unsupported to skip them.`);
    }

    const skillsRoot = path.join(scopeRoot, 'skills');
    const targetDir = path.join(skillsRoot, skillId);
    const existingIndex = manifest.findIndex((skill) => skill.id === skillId);
    if (existingIndex !== -1 && !replace) {
      throw new Error(`Skill already exists in skills/manifest.yml: ${skillId}. Use --replace to replace the whole entry.`);
    }

    copySupportedSkillSource(sourceDir, targetDir, source.entries, { replace });
    const manifestEntry = { id: skillId, path: skillId };
    if (source.metadata.description) manifestEntry.description = source.metadata.description;
    if (existingIndex === -1) {
      manifest.push(manifestEntry);
    } else {
      manifest[existingIndex] = manifestEntry;
    }
    const manifestPath = writeSkillsManifest(scopeRoot, manifest);
    const updatedPaths = samePath(sourceDir, targetDir) ? [manifestPath] : [manifestPath, targetDir];
    printSkillsMutationReceipt(
      existingIndex === -1 ? '添加' : '替换',
      targetRoot,
      skillId,
      updatedPaths,
      ignoreUnsupported ? source.unknownEntries : [],
      '如果当前 Agent 需要 Skills runtime 渲染，按当前 Agent runtime 能力执行 Skills render、runtime check 或 doctor。'
    );
  }

  function skillsAdd(args) {
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const scopeInput = optionValue(args, '--scope', '.');
    const { scopeRoot } = scopeRootForSkills(targetRoot, scopeInput);
    return withWorkspaceMutation(targetRoot, 'skills.add', [path.join(scopeRoot, 'skills')], () => skillsAddUnsafe(args));
  }

  function safeSkillSourceDir(scopeRoot, skillPath) {
    const normalized = normalizeRelativePathForBuildr(skillPath, `Skill path must stay inside skills root: ${skillPath}`);
    const skillsRoot = path.join(scopeRoot, 'skills');
    const sourceDir = path.resolve(skillsRoot, normalized);
    const relative = path.relative(skillsRoot, sourceDir);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Refusing to delete unsafe Skill path: ${skillPath}`);
    }
    return assertSafeAssetTarget(scopeRoot, sourceDir, skillsRoot, 'Skill delete target');
  }

  function skillsRemoveUnsafe(args) {
    const allowedFlags = new Set(['--target', '--scope']);
    assertNoUnknownOptions(args, allowedFlags);
    const [id] = positionalArgs(args);
    if (!id) throw new Error('Missing skill id');
    assertName(id, 'Skill id');
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const scopeInput = optionValue(args, '--scope', null);
    if (!scopeInput) throw new Error('Missing required option: --scope');
    assertInitializedBuildrWorkspace(targetRoot);

    const { scopeRoot } = scopeRootForSkills(targetRoot, scopeInput);
    const manifest = readSkillsManifestForWrite(scopeRoot);
    const existingIndex = manifest.findIndex((skill) => skill.id === id);
    if (existingIndex === -1) {
      throw new Error(`Skill not found in skills/manifest.yml: ${id}`);
    }
    const removed = manifest[existingIndex];
    if (scopeRoot === targetRoot && removed.path) {
      const owner = componentOwnerForMember(targetRoot, `skills/${removed.path}`);
      if (owner) throw new Error(`Skill is managed by Component ${owner}: skills/${removed.path}. Use buildr component lifecycle commands.`);
    }
    manifest.splice(existingIndex, 1);
    const updatedPaths = [];
    let assetLabel = 'Skill 源资产';
    if (removed.path) {
      const sharedReference = manifest.find((skill) => skill.path === removed.path);
      if (sharedReference) {
        throw new Error(`Refusing to remove Skill source shared by another manifest entry: ${removed.path}`);
      }
      const sourceDir = safeSkillSourceDir(scopeRoot, removed.path);
      const manifestPath = writeSkillsManifest(scopeRoot, manifest);
      updatedPaths.push(manifestPath);
      if (existsDirectory(sourceDir)) fs.rmSync(sourceDir, { recursive: true, force: true });
      updatedPaths.push(sourceDir);
    } else {
      const manifestPath = writeSkillsManifest(scopeRoot, manifest);
      updatedPaths.push(manifestPath);
      assetLabel = 'Skill 远端资产';
    }
    printSkillsMutationReceipt(
      '删除',
      targetRoot,
      id,
      updatedPaths,
      [],
      '如果当前 Agent runtime 已渲染该 Skill，按当前 Agent runtime 能力执行 Skills render、runtime check 或 doctor。',
      assetLabel
    );
  }

  function skillsRemove(args) {
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const scopeInput = optionValue(args, '--scope', '.');
    const { scopeRoot } = scopeRootForSkills(targetRoot, scopeInput);
    return withWorkspaceMutation(targetRoot, 'skills.remove', [path.join(scopeRoot, 'skills')], () => skillsRemoveUnsafe(args));
  }

  Object.assign(runtime, { readSkillManifest, readSkillManifestSchemaVersion, renderYamlObject, renderSkillsManifestYaml, validateSkillManifestEntries, isManifestSourceLabel, validateSkillUrlObject, validateResolvedSkillSource, normalizeRelativePathForBuildr, parseSkillSourceRef, assertHttpUrl, resolvePackageSkillSourceRef, scopeRootForSkills, skillsManifestPath, readSkillsManifestForWrite, writeSkillsManifest, parseSkillFrontmatter, supportedSkillSourceEntries, inspectSkillSource, samePath, copySupportedSkillSource, printSkillsMutationReceipt, skillsAddUnsafe, skillsAdd, safeSkillSourceDir, skillsRemoveUnsafe, skillsRemove });
  return runtime;
}

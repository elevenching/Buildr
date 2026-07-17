export function createPackageStaticValidator(deps) {
  const {
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
  } = deps;

  function validateWorkspaceSkillsBaseline(root, problems) {
    const workspaceSkillsRoot = path.join(root, 'skills');
    const workspaceManifest = path.join(workspaceSkillsRoot, 'manifest.yml');
    const baselineSkillsRoot = path.join(packageWorkspaceTargetRoot(), 'skills');
    const baselineManifest = path.join(baselineSkillsRoot, 'manifest.yml');
    const packageSkillSourceIds = new Set(readPackageManifest().skillSources.map((source) => source.id));

    if (!existsFile(workspaceManifest) || !existsFile(baselineManifest)) return;

    const workspaceSkills = new Map(readSkillManifest(workspaceManifest).map((skill) => [skill.id, skill]));
    for (const baselineSkill of readSkillManifest(baselineManifest)) {
      if (!baselineSkill.id || (baselineSkill.path === undefined && baselineSkill.source === undefined && baselineSkill.resolved === undefined)) {
        problems.push('Workspace skills baseline manifest entries must include id and path, source, or resolved.');
        continue;
      }

      const workspaceSkill = workspaceSkills.get(baselineSkill.id);
      if (!workspaceSkill) {
        problems.push(`Workspace skills baseline ${baselineSkill.id} is missing from root skills/manifest.yml.`);
        continue;
      }
      if (baselineSkill.path !== undefined && workspaceSkill.path !== baselineSkill.path) {
        problems.push(`Workspace skills baseline ${baselineSkill.id} path differs from root skills manifest: ${baselineSkill.path} != ${workspaceSkill.path}`);
        continue;
      }
      if (baselineSkill.source !== undefined && JSON.stringify(workspaceSkill.source) !== JSON.stringify(baselineSkill.source)) {
        problems.push(`Workspace skills baseline ${baselineSkill.id} source differs from root skills manifest.`);
        continue;
      }
      if (baselineSkill.resolved !== undefined && JSON.stringify(workspaceSkill.resolved) !== JSON.stringify(baselineSkill.resolved)) {
        problems.push(`Workspace skills baseline ${baselineSkill.id} resolved differs from root skills manifest.`);
        continue;
      }

      if ((baselineSkill.source !== undefined && !(baselineSkill.path !== undefined && isManifestSourceLabel(baselineSkill.source))) || baselineSkill.resolved !== undefined) {
        try {
          if (typeof baselineSkill.source === 'string' && !isManifestSourceLabel(baselineSkill.source)) {
            const parsed = parseSkillSourceRef(baselineSkill.source);
            if (parsed.type === 'package' && !packageSkillSourceIds.has(parsed.id)) {
              problems.push(`Workspace skills baseline ${baselineSkill.id} references unknown package Skill source: ${baselineSkill.source}`);
            }
          }
        } catch (error) {
          problems.push(error.message);
        }
        continue;
      }

      const baselineSkillFile = path.join(baselineSkillsRoot, baselineSkill.path, 'SKILL.md');
      const workspaceSkillFile = path.join(workspaceSkillsRoot, workspaceSkill.path, 'SKILL.md');
      if (!existsFile(baselineSkillFile)) {
        problems.push(`Workspace skills baseline SKILL.md does not exist: ${PACKAGE_WORKSPACE_TARGET}/skills/${baselineSkill.path}/SKILL.md`);
        continue;
      }
      if (!existsFile(workspaceSkillFile)) {
        problems.push(`Root workspace skill SKILL.md does not exist: skills/${workspaceSkill.path}/SKILL.md`);
        continue;
      }

      const baselineContent = fs.readFileSync(baselineSkillFile, 'utf8');
      const workspaceContent = fs.readFileSync(workspaceSkillFile, 'utf8');
      if (baselineContent !== workspaceContent) {
        problems.push(`Workspace skills baseline ${baselineSkill.id} differs from root skills/${workspaceSkill.path}/SKILL.md.`);
      }
    }
  }

  function validateWorkspaceRulesBaseline(root, problems) {
    const baselinePairs = [
      ['AGENTS.md', 'AGENTS.md'],
      ['rules/manifest.yml', 'rules/manifest.yml'],
      ['rules/buildr/core.md', 'rules/buildr/core.md'],
    ];

    for (const [rootRelative, packageRelative] of baselinePairs) {
      const rootFile = path.join(root, rootRelative);
      const packageFile = path.join(packageWorkspaceTargetRoot(), packageRelative);
      if (existsFile(rootFile) && existsFile(packageFile)) {
        const rootContent = fs.readFileSync(rootFile, 'utf8');
        const packageContent = fs.readFileSync(packageFile, 'utf8');
        if (rootContent !== packageContent) {
          problems.push(`Root ${rootRelative} differs from ${PACKAGE_WORKSPACE_TARGET}/${packageRelative}.`);
        }
      }
    }

    for (const legacyRule of ['rules/AGENTS.workspace.md', 'rules/AGENTS.project.md']) {
      if (existsFile(path.join(root, legacyRule))) {
        problems.push(`Legacy workspace rule source must not remain in root: ${legacyRule}`);
      }
    }
  }

  function validatePackageMetadata(context) {
    const { root, problems } = context;
    const packageMetadataPath = path.join(root, 'package.json');
    if (!existsFile(packageMetadataPath)) {
      problems.push('Public npm package metadata is missing: package.json');
    } else {
      let packageMetadata;
      try { packageMetadata = JSON.parse(fs.readFileSync(packageMetadataPath, 'utf8')); } catch (error) { problems.push(`package.json is invalid JSON: ${error.message}`); }
      if (packageMetadata) {
        if (packageMetadata.name !== '@buildr-ai/buildr') problems.push('package.json must declare the official @buildr-ai/buildr package identity.');
        if (!/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(packageMetadata.version || '') || packageMetadata.version === '0.0.0') problems.push('package.json must declare a non-placeholder semantic version.');
        if (packageMetadata.private === true) problems.push('package.json must not block public packaging with private: true.');
        if (packageMetadata.license !== 'MIT') problems.push('package.json must declare the MIT license.');
        if (packageMetadata.repository?.url !== 'git+https://github.com/elevenching/Buildr.git' || packageMetadata.repository?.directory !== 'projects/product') problems.push('package.json repository must identify the canonical GitHub product directory.');
        if (packageMetadata.homepage !== 'https://github.com/elevenching/Buildr#readme') problems.push('package.json homepage must identify the canonical GitHub README.');
        if (packageMetadata.bugs?.url !== 'https://github.com/elevenching/Buildr/issues') problems.push('package.json bugs URL must identify canonical GitHub Issues.');
        if (packageMetadata.publishConfig?.access !== 'public') problems.push('package.json publishConfig.access must be public.');
        for (const keyword of ['agent', 'agentic-coding', 'cli', 'developer-tools', 'workspace']) {
          if (!packageMetadata.keywords?.includes(keyword)) problems.push(`package.json keywords must include ${keyword}.`);
        }
        const packagedFiles = new Set(packageMetadata.files || []);
        for (const required of ['LICENSE', 'tools/buildr', 'tools/cli/', 'tools/shared/fetch-remote-text.mjs', 'docs/cli-reference.md', 'docs/cli-architecture.md', 'docs/known-limitations.md', 'package/']) {
          if (!packagedFiles.has(required)) problems.push(`package.json files must include ${required}.`);
        }
        for (const obsolete of ['tools/check-runtime-skills.mjs', 'tools/render-codex.mjs']) {
          if (packagedFiles.has(obsolete)) problems.push(`package.json files must not include unused standalone runtime entry: ${obsolete}.`);
        }
      }
    }
    for (const required of ['LICENSE', 'docs/cli-reference.md', 'docs/cli-architecture.md', 'docs/known-limitations.md']) {
      if (!fs.existsSync(path.join(root, required))) problems.push(`Open-source product baseline is missing: ${required}`);
    }
    if (existsFile(path.join(root, 'tools', 'install-buildr-cli'))) {
      for (const required of ['tools/verification/onboarding/repository.mjs', 'tools/verification/onboarding/init.mjs', 'tools/verification/onboarding/service-branch.mjs', 'tools/verification/network/remote-text.mjs', 'tools/verification/cli/architecture.mjs', 'tools/verification/cli/compatibility.mjs', 'tools/verification/cli/package-parity.mjs', 'tools/verification/release/open-source-candidate.mjs', 'tools/verification/release/release-contract.mjs']) {
        if (!existsFile(path.join(root, required))) problems.push(`Development checkout verification is missing: ${required}`);
      }
    }

    for (const legacyPath of LEGACY_PACKAGE_PATHS) {
      if (fs.existsSync(path.join(root, legacyPath))) {
        problems.push(`Legacy package path must not remain: ${legacyPath}`);
      }
    }
  }

  function parseJsonOutput(label, output) {
    try {
      return JSON.parse(output);
    } catch (error) {
      const match = error.message.match(/position (\d+)/);
      const position = match ? Number(match[1]) : 0;
      const excerpt = output.slice(Math.max(0, position - 240), position + 240);
      throw new Error(`${label} returned invalid JSON: ${error.message}\n${excerpt}`);
    }
  }

  function validateMappedEntries(context) {
    const { root, manifest, files, problems, mappedEntries } = context;
    for (const includePath of manifest.include) {
      const absolutePath = path.resolve(root, includePath);
      if (!fs.existsSync(absolutePath)) {
        problems.push(`Manifest include does not exist: ${includePath}`);
        continue;
      }
      files.push(...collectFiles(absolutePath));
    }

    for (const section of ['workspaceFiles', 'projectFiles']) {
      for (const rawEntry of manifest[section]) {
        let entry;
        try {
          entry = parseManifestFileEntry(rawEntry, section);
        } catch (error) {
          problems.push(error.message);
          continue;
        }
        mappedEntries.push(entry);
        if (LEGACY_PACKAGE_PATHS.some((legacyPath) => entry.source === legacyPath || entry.source.startsWith(`${legacyPath}/`))) {
          problems.push(`Package manifest must not reference legacy package source: ${entry.raw}`);
        }
        if (!entry.source.startsWith(`${PACKAGE_WORKSPACE_TARGET}/`)) {
          problems.push(`Package manifest ${section} source must be under ${PACKAGE_WORKSPACE_TARGET}/: ${entry.raw}`);
        }
        if (entry.source.includes('AGENTS.private')) {
          problems.push(`Package manifest must not publish private business rule: ${entry.raw}`);
        }
        if (entry.source.includes('package/workspace-rules/') || entry.source.includes('package/workspace-skills/') || entry.source.includes('package/baseline/')) {
          problems.push(`Package manifest must use ${PACKAGE_WORKSPACE_TARGET}/ as the source for workspace baseline assets: ${entry.raw}`);
        }
        if (entry.source.startsWith('rules/')) {
          problems.push(`Package manifest must use ${PACKAGE_WORKSPACE_TARGET}/rules/ as the source for published rule modules: ${entry.raw}`);
        }
        if (entry.target.startsWith('rules/') && !entry.source.startsWith(`${PACKAGE_WORKSPACE_TARGET}/rules/`)) {
          problems.push(`Package manifest rule targets must source from ${PACKAGE_WORKSPACE_TARGET}/rules/: ${entry.raw}`);
        }
        if (entry.source.startsWith('product/')) {
          problems.push(`Package manifest source must be relative to the product root, not product/ prefixed: ${entry.raw}`);
        }
        if (path.isAbsolute(entry.source) || entry.source.startsWith('..')) {
          problems.push(`Package manifest source must stay inside product root: ${entry.raw}`);
          continue;
        }
        if (path.isAbsolute(entry.target) || entry.target.startsWith('..')) {
          problems.push(`Package manifest target must stay inside generated workspace: ${entry.raw}`);
        }
        const sourceFile = path.resolve(root, entry.source);
        if (!existsFile(sourceFile)) {
          problems.push(`Package manifest source does not exist: ${entry.source}`);
          continue;
        }
        files.push(sourceFile);
      }
    }
  }

  function validatePackageComponents(context) {
    const { root, manifest, files, problems, mappedEntries } = context;
    const componentIds = new Set();
    const componentOwnedWorkspaceFiles = new Set();
    const componentMemberOwners = new Map();
    for (const entry of manifest.components) {
      const label = `components.${entry.id || '<missing>'}`;
      for (const key of Object.keys(entry)) if (!['id', 'path', 'defaultEnabled', 'required'].includes(key)) problems.push(`${label}.${key} is not supported.`);
      if (!entry.id || !entry.path || typeof entry.defaultEnabled !== 'boolean' || typeof entry.required !== 'boolean') {
        problems.push(`${label} must include id, path, defaultEnabled, and required.`);
        continue;
      }
      if (componentIds.has(entry.id)) problems.push(`Duplicate package Component id: ${entry.id}`);
      componentIds.add(entry.id);
      const expectedSuffix = `/components/`;
      const componentPathParts = entry.path.split('/');
      const exactComponentPath = entry.path.startsWith(`${PACKAGE_WORKSPACE_TARGET}${expectedSuffix}`)
        && componentPathParts.at(-1) === 'component.yml'
        && componentPathParts.at(-2) === entry.id
        && componentPathParts.length === PACKAGE_WORKSPACE_TARGET.split('/').length + 4;
      if (!exactComponentPath || path.isAbsolute(entry.path) || entry.path.startsWith('..')) {
        problems.push(`${label}.path must be ${PACKAGE_WORKSPACE_TARGET}/components/<source>/${entry.id}/component.yml.`);
        continue;
      }
      try {
        const record = packageComponentDefinition(entry);
        files.push(record.file);
        componentOwnedWorkspaceFiles.add(toPosixRelative(root, record.file));
        for (const message of validatePackageComponentMembers(manifest, record)) problems.push(message);
        for (const member of componentMemberPaths(record.definition)) {
          const previousOwner = componentMemberOwners.get(member);
          if (previousOwner && previousOwner !== entry.id) problems.push(`Package Component ownership conflict for ${member}: ${previousOwner}, ${entry.id}.`);
          componentMemberOwners.set(member, entry.id);
          const source = packageComponentSourcePath(member);
          for (const file of existsDirectory(source) ? collectFiles(source) : existsFile(source) ? [source] : []) {
            files.push(file);
            componentOwnedWorkspaceFiles.add(toPosixRelative(root, file));
          }
          if (member.endsWith('/manifest.yml') && member.startsWith('commands/')) {
            const commandManifest = parseCommandsManifestYaml(fs.readFileSync(source, 'utf8'));
            for (const message of validateCommandsManifest(commandManifest)) problems.push(`Package Component ${entry.id} command collection: ${message}`);
          }
          if (member.startsWith('skills/')) {
            const skillFile = path.join(source, 'SKILL.md');
            const content = fs.readFileSync(skillFile, 'utf8');
            if (member === 'skills/buildr/openspec-contract-guard') {
              if (!content.includes('author: buildr')) problems.push('OpenSpec contract guard Skill must declare Buildr as its author.');
              if (!content.includes(`supportedOpenSpec: "${record.definition.upstream.version}"`)) {
                problems.push(`OpenSpec contract guard Skill must declare supportedOpenSpec ${record.definition.upstream.version}.`);
              }
            } else {
              const expected = `generatedBy: "${record.definition.upstream.version}"`;
              if (!content.includes(expected)) problems.push(`Package Component ${entry.id} Skill generatedBy must match upstream version ${record.definition.upstream.version}: ${member}.`);
            }
          }
        }
      } catch (error) {
        problems.push(`${label} is invalid: ${error.message}`);
      }
    }

    const mappedSources = new Set(mappedEntries.map((entry) => entry.source));
    for (const entry of mappedEntries) {
      for (const member of componentMemberOwners.keys()) {
        if (entry.target === member || entry.target.startsWith(`${member}/`)) {
          problems.push(`Component member must not also be installed through workspaceFiles: ${entry.raw}`);
        }
      }
    }
    const workspaceSourceRoot = packageWorkspaceTargetRoot();
    for (const workspaceFile of collectFiles(workspaceSourceRoot)) {
      const relativeFile = toPosixRelative(root, workspaceFile);
      if (!mappedSources.has(relativeFile) && !componentOwnedWorkspaceFiles.has(relativeFile)) {
        problems.push(`Package workspace source file must be explicitly mapped in package/manifest.yml: ${relativeFile}`);
      }
    }
  }

  function validatePackageSkills(context) {
    const { root, manifest, files, problems } = context;
    const agentSkillIds = new Set();
    for (const skill of manifest.agentSkills) {
      if (!skill.id || !skill.path) {
        problems.push('Package manifest agentSkills entries must include id and path.');
        continue;
      }
      if (!skill.path.startsWith(`${PACKAGE_RUNTIME_TARGET}/skills/`)) {
        problems.push(`Package agentSkill path must be under ${PACKAGE_RUNTIME_TARGET}/skills/: ${skill.path}`);
      }
      if (agentSkillIds.has(skill.id)) {
        problems.push(`Duplicate package agentSkill id: ${skill.id}`);
      }
      agentSkillIds.add(skill.id);
      if (!Array.isArray(skill.runtimes) || skill.runtimes.length === 0) {
        problems.push(`Package agentSkill must declare at least one runtime: ${skill.id}`);
      }
      if (path.isAbsolute(skill.path) || skill.path.startsWith('..')) {
        problems.push(`Package agentSkill path must stay inside product root: ${skill.path}`);
        continue;
      }
      const skillDir = path.resolve(root, skill.path);
      const skillFile = path.join(skillDir, 'SKILL.md');
      if (!existsFile(skillFile)) {
        problems.push(`Package agentSkill SKILL.md does not exist: ${skill.path}/SKILL.md`);
        continue;
      }
      const skillContent = fs.readFileSync(skillFile, 'utf8');
      if (skill.id === 'buildr') {
        for (const requiredText of [
          '提交、拉取、合并、rebase、checkout/switch、reset、推送',
          'post-transition doctor',
          'Agent 是 Buildr 功能的默认操作入口',
          '询问用户是否由 Agent 立即同步',
          'buildr sync <agent> --target <workspace-root>',
          '手动同步命令作为备选',
          '当前 session 是否重新发现新资产由 Agent runtime 决定',
          '用户要求“更新 Buildr”或“同步 Buildr”时',
          'buildr skill install <agent> --target <dir>',
          '用户要求“更新 workspace”或“同步 workspace”时',
          '用户明确要求“只更新 CLI”时',
          '复用 Git Ops 检查当前分支、upstream 和工作区状态',
          '不自动 stash、rebase、覆盖，也不继续 sync',
          '无需再次询问 sync 授权',
          '非 Git workspace 直接执行 sync',
        ]) {
          if (!skillContent.includes(requiredText)) problems.push(`Buildr Agent Skill must include ${JSON.stringify(requiredText)}.`);
        }
        for (const [relativePath, requiredTexts] of [
          ['package/bootstrap/guide.md', ['复用 Git Ops 检查当前分支、upstream 和工作区状态', '不自动 stash、rebase、覆盖，也不继续 sync', '无需再次询问 sync 授权', '非 Git workspace 跳过 Git 步骤', '不是 `buildr sync` 的隐式行为']],
          ['docs/cli-reference.md', ['复用 Git Ops 检查当前分支、upstream 和工作区状态', 'Agent 不自动 stash、rebase 或覆盖', '无需再次询问 sync 授权', '非 Git workspace 直接 sync', '不隐式执行 Git 更新']],
          ['tools/runtime/skills/render-plan.mjs', ['Git 管理的 workspace 先复用 Git Ops 安全更新本地 checkout，再运行 sync', '非 Git workspace 直接运行 sync']],
        ]) {
          const contractPath = path.join(root, relativePath);
          if (!existsFile(contractPath)) {
            problems.push(`Workspace update intent contract file is missing: ${relativePath}`);
            continue;
          }
          const contractContent = fs.readFileSync(contractPath, 'utf8');
          for (const requiredText of requiredTexts) {
            if (!contractContent.includes(requiredText)) problems.push(`${relativePath} must include ${JSON.stringify(requiredText)}.`);
          }
        }
      }
      files.push(skillFile);
    }

    const skillSourceIds = new Set();
    for (const skill of manifest.skillSources) {
      if (!skill.id || !skill.path) {
        problems.push('Package manifest skillSources entries must include id and path.');
        continue;
      }
      if (skillSourceIds.has(skill.id)) {
        problems.push(`Duplicate package skillSource id: ${skill.id}`);
      }
      skillSourceIds.add(skill.id);
      if (!Array.isArray(skill.runtimes) || skill.runtimes.length === 0) {
        problems.push(`Package skillSource must declare at least one runtime: ${skill.id}`);
      }
      if (path.isAbsolute(skill.path) || skill.path.startsWith('..')) {
        problems.push(`Package skillSource path must stay inside product root: ${skill.path}`);
        continue;
      }
      if (skill.runtimePath !== undefined) {
        try {
          normalizeRelativePathForBuildr(skill.runtimePath, `Package skillSource runtimePath must stay relative: ${skill.runtimePath}`);
        } catch (error) {
          problems.push(error.message);
        }
      }
      const skillDir = path.resolve(root, skill.path);
      const skillFile = path.join(skillDir, 'SKILL.md');
      if (!existsFile(skillFile)) {
        problems.push(`Package skillSource SKILL.md does not exist: ${skill.path}/SKILL.md`);
        continue;
      }
      try {
        const metadata = parseSkillFrontmatter(skillFile);
        if (metadata.name !== skill.id) {
          problems.push(`Package skillSource id must match SKILL.md frontmatter name: ${skill.id} != ${metadata.name}`);
        }
      } catch (error) {
        problems.push(error.message);
      }
      files.push(...collectFiles(skillDir));
    }
    return skillSourceIds;
  }

  function validatePackageBuiltins(context, skillSourceIds) {
    const { root, manifest, files, problems } = context;
    const builtinIds = new Set();
    function validateLegacyIntegrities(builtin, label) {
      if (builtin.legacyIntegrities === undefined) return;
      if (!Array.isArray(builtin.legacyIntegrities)) {
        problems.push(`${label}.legacyIntegrities must be an array.`);
        return;
      }
      const seen = new Set();
      for (const integrity of builtin.legacyIntegrities) {
        if (!/^sha256-[a-f0-9]{64}$/.test(integrity || '')) problems.push(`${label}.legacyIntegrities contains an invalid SHA-256 integrity.`);
        if (seen.has(integrity)) problems.push(`${label}.legacyIntegrities contains a duplicate integrity: ${integrity}`);
        seen.add(integrity);
      }
    }
    for (const rule of manifest.builtins.rules) {
      const label = `builtins.rules.${rule.id || '<missing>'}`;
      validateLegacyIntegrities(rule, label);
      if (!rule.id || !rule.path || !rule.target || !rule.description || typeof rule.required !== 'boolean') {
        problems.push(`${label} must include id, path, target, description, and required.`);
        continue;
      }
      if (builtinIds.has(`rule:${rule.id}`)) problems.push(`Duplicate builtin rule id: ${rule.id}`);
      builtinIds.add(`rule:${rule.id}`);
      if (!rule.target.startsWith('rules/buildr/') || !rule.target.endsWith('.md')) {
        problems.push(`${label}.target must be rules/buildr/*.md.`);
      }
      if (!rule.path.startsWith(`${PACKAGE_WORKSPACE_TARGET}/rules/`)) {
        problems.push(`${label}.path must be under ${PACKAGE_WORKSPACE_TARGET}/rules/.`);
      }
      if (path.isAbsolute(rule.path) || rule.path.startsWith('..') || path.isAbsolute(rule.target) || rule.target.startsWith('..')) {
        problems.push(`${label} paths must stay relative.`);
        continue;
      }
      const sourceFile = path.resolve(root, rule.path);
      if (!existsFile(sourceFile)) {
        problems.push(`${label}.path does not exist: ${rule.path}`);
      } else {
        if (rule.id === 'buildr-core') {
          const coreContent = fs.readFileSync(sourceFile, 'utf8');
          for (const requiredText of [
            'Agent 是默认操作入口',
            '取得所需授权后直接执行',
            '不把命令或操作步骤作为默认结果要求用户代为执行',
            '才提供准确的手动操作作为兜底',
          ]) {
            if (!coreContent.includes(requiredText)) problems.push(`Buildr Core must include ${JSON.stringify(requiredText)}.`);
          }
        }
        files.push(sourceFile);
      }
    }
    if (!manifest.builtins.rules.some((rule) => rule.id === 'buildr-core' && rule.required === true && rule.target === 'rules/buildr/core.md')) {
      problems.push('builtins.rules must declare required buildr-core at rules/buildr/core.md.');
    }

    for (const skill of manifest.builtins.skills) {
      const label = `builtins.skills.${skill.id || '<missing>'}`;
      validateLegacyIntegrities(skill, label);
      if (!skill.id || !skill.path || !skill.target || !skill.description || typeof skill.required !== 'boolean') {
        problems.push(`${label} must include id, path, target, description, and required.`);
        continue;
      }
      if (builtinIds.has(`skill:${skill.id}`)) problems.push(`Duplicate builtin skill id: ${skill.id}`);
      builtinIds.add(`skill:${skill.id}`);
      const isOpenSpecUpstreamSkill = skill.component === 'openspec' && skill.id.startsWith('openspec-') && skill.id !== 'openspec-contract-guard';
      const expectedSkillRoot = isOpenSpecUpstreamSkill ? 'skills/openspec/' : 'skills/buildr/';
      if (!skill.target.startsWith(expectedSkillRoot)) {
        problems.push(`${label}.target must be under ${expectedSkillRoot}.`);
      }
      if (!skill.path.startsWith(`${PACKAGE_WORKSPACE_TARGET}/skills/`)) {
        problems.push(`${label}.path must be under ${PACKAGE_WORKSPACE_TARGET}/skills/.`);
      }
      const missingRuntimes = SUPPORTED_AGENT_IDS.filter((runtime) => !skill.runtimes?.includes(runtime));
      if (!Array.isArray(skill.runtimes) || missingRuntimes.length > 0) {
        problems.push(`${label}.runtimes must include all supported adapters: ${SUPPORTED_AGENT_IDS.join(', ')}.`);
      }
      if (path.isAbsolute(skill.path) || skill.path.startsWith('..') || path.isAbsolute(skill.target) || skill.target.startsWith('..')) {
        problems.push(`${label} paths must stay relative.`);
        continue;
      }
      const skillDir = path.resolve(root, skill.path);
      const skillFile = path.join(skillDir, 'SKILL.md');
      if (!existsFile(skillFile)) {
        problems.push(`${label}.path must contain SKILL.md: ${skill.path}`);
        continue;
      }
      try {
        const metadata = parseSkillFrontmatter(skillFile);
        if (metadata.name !== skill.id) problems.push(`${label}.id must match SKILL.md frontmatter name: ${skill.id} != ${metadata.name}`);
      } catch (error) {
        problems.push(error.message);
      }
      const skillContent = fs.readFileSync(skillFile, 'utf8');
      if (skill.id === 'task-worktree') {
        for (const requiredText of [
          '<workspace-root>/.worktrees/<task-id>',
          'canonical worktree 路径和任务分支',
          '不得静默回退到 `/tmp`',
          'propose 和创建 change artifacts 前',
          'artifacts、实现和合并前候选验证都只能写入该 worktree',
          '验证证据边界',
          '最终候选 Git tree',
          '三级验证门禁',
          '单任务最小反馈',
          '任务组受影响范围验证',
          '最终候选完整验证',
          '同一候选状态不机械重复该底层检查',
          '修复期间优先重跑失败项和受影响专项检查',
          'wait、poll 或 resume 继续同一进程',
          '暂时无输出不得触发相同命令重复启动',
          '不在主开发分支重复运行相同 E2E',
          '候选 tree 已改变时沿用旧验证结果',
          '不从未合并 task checkout 更新主自举 workspace',
          '新 worktree checkout 完成后',
          '复用 Git Ops 的“工作区转换后的 Buildr 环境检查”',
          '复用既有 worktree 且没有发生 tree 转换时，不重复运行该检查',
          '复用同步询问、Agent 执行和手动兜底边界',
          '用户确认前不执行 sync',
          '不把手动命令作为默认处理方式',
          '不沿用普通开发任务的保守保留策略',
          '远端 ref 与本地候选提交一致',
          '没有明确的后续本地构建、部署、修复或验证动作',
          '说明保留原因和下一项本地动作',
          '默认清理不授权删除远端发布分支',
        ]) {
          if (!skillContent.includes(requiredText)) problems.push(`task-worktree Skill must include ${JSON.stringify(requiredText)}.`);
        }
      }
      if (skill.id === 'git-ops') {
        for (const requiredText of [
          '最终候选 Git tree',
          'rebase 前后必须比较最终候选 Git tree',
          '改变已验证 tree 时，原验证结果失效',
          '相同 tree',
          '不因 checkout、commit hash 或分支名称改变而重复运行相同验证',
          '工作区转换后的 Buildr 环境检查',
          '`pull`、`merge`、`rebase`、`checkout`、`switch`、`reset`、`cherry-pick`、`revert`、`stash apply` 和 `stash pop`',
          '`fetch`、`push` 和普通 `commit`',
          '.buildr/workspace.yml',
          'buildr doctor --agent <agent> --target <workspace-root> --json',
          'doctor 无需用户处理时，不提醒用户执行 `render` 或 `sync`',
          'Rules、Skills、Commands、Components、Contributions 和 Agent runtime',
          '询问用户是否由 Agent 立即同步当前 workspace 和 Agent runtime',
          'buildr sync <agent> --target <workspace-root>',
          '把占位符替换为已解析的实际值并正确引用路径',
          '用户确认前不得执行 sync',
          '用户确认后，调用 Buildr Skill',
          '不得把手动命令作为默认处理方式',
          '按对应 Buildr 生命周期询问并在取得授权后由 Agent 执行可完成的动作',
          '只有用户选择手动方式，或 Agent 因工具不可用、权限、登录态、外部环境等原因无法完成时',
          '用户选择手动后不假设操作成功',
          '再次验证',
          '当前 session 是否重新发现新资产由 Agent runtime 决定',
          'Git hook、daemon、文件 watcher 或定时任务',
          '后续进入 Buildr 工作流时由基线 doctor 兜底',
        ]) {
          if (!skillContent.includes(requiredText)) problems.push(`git-ops Skill must include ${JSON.stringify(requiredText)}.`);
        }
        for (const routedIntent of ['pull', 'checkout', 'switch', 'reset', 'cherry-pick', 'revert', 'stash']) {
          if (!skill.description.includes(routedIntent)) problems.push(`git-ops builtin description must route ${routedIntent}.`);
        }
        if (skill.description.includes('收尾')) {
          problems.push('git-ops builtin description must not claim the complete task closeout intent.');
        }
        try {
          const metadata = parseSkillFrontmatter(skillFile);
          if (String(metadata.description || '').includes('收尾')) {
            problems.push('git-ops Skill description must not claim the complete task closeout intent.');
          }
          for (const routedIntent of ['pull', 'checkout', 'switch', 'reset', 'cherry-pick', 'revert', 'stash']) {
            if (!String(metadata.description || '').includes(routedIntent)) problems.push(`git-ops Skill description must route ${routedIntent}.`);
          }
        } catch {
          // Frontmatter errors are already reported above.
        }
      }
      if (skill.id === 'task-finish') {
        for (const requiredText of [
          '一次性授权',
          'openspec status --change <id> --json',
          '用户已经确认的目标、纠正和决策',
          '任务范围内仍有未记录语义、实现偏差或验证缺口时',
          'OpenSpec contract sidebar 只证明已记录契约',
          '任务资产审查门控',
          '不得调用工具、重新读取任务文件或加载完整 `task-asset-review`',
          '用户纠正过 Agent 的工作边界、资产职责、scope 或授权范围',
          '初始假设被代码、命令、测试或用户反馈推翻',
          '无效重复或明显 token 浪费',
          '静默跳过完整审查',
          '复用当前候选 tree 已有的有效审查结果',
          '审查成功不是 archive、commit、rebase、merge、push 或 cleanup 的新增前置条件',
          '“收尾”不构成 Rule 或 Skill 写入授权',
          'new blank line at EOF',
          '恰好以一个换行结束',
          'git rev-parse HEAD^{tree}',
          'fast-forward-only',
          '不删除远端任务分支',
          '工作目录切换到主 workspace',
          '修复期间已经优先重跑失败项和受影响专项检查',
          '候选重新稳定后完成一次新的最终完整验证',
          'wait、poll 或 resume 同一进程',
          '暂时无输出不得启动第二个相同验证',
          '停止尚未执行的 archive、commit、rebase、merge、push 或 cleanup',
          '成功 rebase 后若最终已检出内容实际变化',
          'fast-forward-only 集成完成后',
          '复用 Git Ops 的“工作区转换后的 Buildr 环境检查”',
          '复用同步询问、Agent 执行和手动兜底边界',
          '用户确认前不执行 sync',
          '确认后由 Agent 执行并验证',
          '手动命令只作备选',
          '<!-- buildr:skill-contributions pre-spec-sync -->',
          '<!-- buildr:skill-contributions post-spec-sync -->',
        ]) {
          if (!skillContent.includes(requiredText)) problems.push(`task-finish Skill must include ${JSON.stringify(requiredText)}.`);
        }
        if (skillContent.includes('buildr openspec')) problems.push('task-finish source must not hard-code OpenSpec contract guard commands; installed Components contribute them at render time.');
      }
      if (skill.id === 'task-asset-review') {
        for (const requiredText of [
          '用户明确要求复盘',
          '`task-finish` 只在自身轻量资格判断命中后调用本 Skill',
          '用户原始目标、纠正和明确决策',
          'subagent 的任务划分、证据和最终报告',
          '不得声称读取模型隐藏推理、chain-of-thought 或内部 deliberation',
          '不得为了审查采集或保存完整原始对话、完整工具日志、逐节点回放或完整任务轨迹',
          '重建简短执行轮廓',
          '目标一致性',
          '路径效率',
          '证据质量',
          '边界质量',
          '成本质量',
          '复用机会',
          '无效全量搜索、重复工具、重复完整验证、过度 subagent',
          '必要成本',
          '执行质量反馈',
          '资产沉淀建议',
          '与现有 OpenSpec、Rule、`AGENTS.md` 或 Skill 没有未解决的重复或冲突',
          '不得输出 Specs 候选',
          '普通 follow-up',
          '证据胶囊',
          '最终 commit / diff',
          '归档 OpenSpec change',
          '稳定文件或任务驾驶舱',
          '证据耐久性较弱',
          '“收尾”不授权写入 Rule、Skill 或其他组织资产',
        ]) {
          if (!skillContent.includes(requiredText)) problems.push(`task-asset-review Skill must include ${JSON.stringify(requiredText)}.`);
        }
        const metadataPath = path.join(skillDir, 'agents', 'openai.yaml');
        if (!existsFile(metadataPath)) problems.push('task-asset-review Skill must include agents/openai.yaml.');
        for (const forbiddenText of ['安装 runtime Hook', '启动 daemon', '启动 watcher', '接入事件总线']) {
          if (skillContent.includes(forbiddenText)) problems.push(`task-asset-review Skill must not instruct Agents to ${JSON.stringify(forbiddenText)}.`);
        }
      }
      if (skill.id === 'task-triage') {
        for (const requiredText of ['OpenSpec change 状态', 'artifact 或 task 进度', '下一步或阻塞原因', 'openspec status --change <id> --json', '文档正文使用中文', 'openspec-*` Skills', '实现型任务的验证编排', '有语义的任务组', '完整候选验证放在全部实现', '不得把 Buildr 产品仓的 package check', '<!-- buildr:skill-contributions change-ready -->']) {
          if (!skillContent.includes(requiredText)) problems.push(`task-triage Skill must include ${JSON.stringify(requiredText)}.`);
        }
        if (skillContent.includes('buildr openspec')) problems.push('task-triage source must not hard-code OpenSpec contract guard commands; installed Components contribute them at render time.');
      }
      if (skill.id === 'task-cockpit') {
        for (const requiredText of [
          'openspec/knowledge/task-cockpits/yyyy-MM-dd-<task-id>.html',
          'Agent 单向维护',
          '不是 OpenSpec change 的翻译',
          '首页',
          '推进',
          '方案',
          '技术细节',
          '不猜测百分比',
          '可点击入口',
          'assets/task-cockpit-template.html',
        ]) {
          if (!skillContent.includes(requiredText)) problems.push(`task-cockpit Skill must include ${JSON.stringify(requiredText)}.`);
        }
        const templatePath = path.join(skillDir, 'assets', 'task-cockpit-template.html');
        const metadataPath = path.join(skillDir, 'agents', 'openai.yaml');
        if (!existsFile(templatePath)) {
          problems.push('task-cockpit Skill must include assets/task-cockpit-template.html.');
        } else {
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          for (const requiredText of ['id="cockpit-data"', 'data-tab="overview"', 'data-tab="progress"', 'data-tab="solution"', 'data-tab="technical"', '由 Agent 单向维护 · 页面只读']) {
            if (!templateContent.includes(requiredText)) problems.push(`task-cockpit template must include ${JSON.stringify(requiredText)}.`);
          }
          if (/https?:\/\//.test(templateContent)) problems.push('task-cockpit template must not depend on external HTTP resources.');
        }
        if (!existsFile(metadataPath)) problems.push('task-cockpit Skill must include agents/openai.yaml.');
      }
      if (skill.id === 'openspec-contract-guard') {
        for (const requiredText of ['buildr openspec baseline create', '--stage pre-sync', '--stage post-sync', '不修改外部 `openspec-*` Skills']) {
          if (!skillContent.includes(requiredText)) problems.push(`openspec-contract-guard Skill must include ${JSON.stringify(requiredText)}.`);
        }
      }
      if (skill.id.startsWith('openspec-') && skill.id !== 'openspec-contract-guard' && skillContent.includes('buildr openspec')) {
        problems.push(`${label} must not embed Buildr contract guard commands; the sidebar Skill owns that workflow.`);
      }
      if (isOpenSpecUpstreamSkill && skill.target.startsWith('skills/buildr/')) problems.push(`${label} must preserve upstream ownership outside skills/buildr/.`);
      files.push(...collectFiles(skillDir));
    }
    if (!manifest.builtins.skills.some((skill) => skill.id === 'task-finish' && skill.required === false)) {
      problems.push('builtins.skills must declare optional task-finish.');
    }
    if (!manifest.builtins.skills.some((skill) => skill.id === 'task-cockpit' && skill.required === false)) {
      problems.push('builtins.skills must declare optional task-cockpit.');
    }
    if (!manifest.builtins.skills.some((skill) => skill.id === 'task-asset-review' && skill.required === false)) {
      problems.push('builtins.skills must declare optional task-asset-review.');
    }

    for (const command of manifest.builtins.commands) {
      validateLegacyIntegrities(command, `builtins.commands.${command.id || '<missing>'}`);
      if (!command.id || typeof command.required !== 'boolean' || !isPlainObject(command.manifestEntry)) {
        problems.push(`builtins.commands entries must include id, required, and manifestEntry.`);
      }
    }

    const productAgentsPath = path.join(root, 'AGENTS.md');
    if (existsFile(productAgentsPath)) {
      const productAgents = fs.readFileSync(productAgentsPath, 'utf8');
      files.push(productAgentsPath);
      for (const requiredText of [
        '合并前候选验证使用临时 workspace 或 task worktree 自身',
        '最终候选 Git tree',
        '不在主开发分支重复 E2E',
        '候选 tree 改变时',
        '单任务最小反馈、任务组受影响范围验证、最终候选完整验证',
        '不得在每个普通任务后运行产品总验证或临时 workspace E2E',
        '继续等待同一进程，不重复启动相同命令',
        '修复循环优先重跑失败项和受影响检查',
        '不作为相同 tree 后续 Git 动作的重复产品验证门禁',
        '使用 `task-finish` 编排',
        '不授权 force push、merge commit、远端任务分支删除',
        'Buildr 功能默认由 Agent 操作',
        '取得所需授权后直接执行',
        '不得把命令或操作步骤作为默认交付结果要求用户代为执行',
        '才提供准确的手动操作作为兜底',
      ]) {
        if (!productAgents.includes(requiredText)) problems.push(`Product AGENTS.md must include ${JSON.stringify(requiredText)}.`);
      }
    }

    const baselineSkillsManifest = path.join(packageWorkspaceTargetRoot(), 'skills', 'manifest.yml');
    if (existsFile(baselineSkillsManifest)) {
      try {
        const baselineSkills = readSkillManifest(baselineSkillsManifest);
        validateSkillManifestEntries(baselineSkills, baselineSkillsManifest);
        const taskFinish = baselineSkills.find((entry) => entry.id === 'task-finish');
        if (!taskFinish || taskFinish.source !== 'buildr' || taskFinish.state !== 'installed' || taskFinish.enabled !== true) {
          problems.push('Workspace skills baseline must declare enabled installed Buildr task-finish.');
        }
        const taskCockpit = baselineSkills.find((entry) => entry.id === 'task-cockpit');
        if (!taskCockpit || taskCockpit.source !== 'buildr' || taskCockpit.state !== 'installed' || taskCockpit.enabled !== true) {
          problems.push('Workspace skills baseline must declare enabled installed Buildr task-cockpit.');
        }
        const taskAssetReview = baselineSkills.find((entry) => entry.id === 'task-asset-review');
        if (!taskAssetReview || taskAssetReview.source !== 'buildr' || taskAssetReview.state !== 'installed' || taskAssetReview.enabled !== true) {
          problems.push('Workspace skills baseline must declare enabled installed Buildr task-asset-review.');
        }
        const gitOps = baselineSkills.find((entry) => entry.id === 'git-ops');
        for (const routedIntent of ['pull', 'checkout', 'switch', 'reset', 'cherry-pick', 'revert', 'stash']) {
          if (!gitOps?.description?.includes(routedIntent)) problems.push(`Workspace git-ops description must route ${routedIntent}.`);
        }
        for (const skill of baselineSkills.filter((entry) => entry.source !== undefined)) {
          if (typeof skill.source === 'string' && !isManifestSourceLabel(skill.source)) {
            const parsed = parseSkillSourceRef(skill.source);
            if (parsed.type === 'package' && !skillSourceIds.has(parsed.id)) {
              problems.push(`Workspace skills baseline references unknown package skillSource: ${skill.source}`);
            }
          }
        }
      } catch (error) {
        problems.push(error.message);
      }
    }

    const baselineProjectsRegistry = path.join(packageWorkspaceTargetRoot(), 'projects', 'manifest.yml');
    if (existsFile(baselineProjectsRegistry)) {
      try {
        const registry = parseProjectsYaml(fs.readFileSync(baselineProjectsRegistry, 'utf8'));
        const errors = validateProjectsRegistry(registry);
        if (errors.length > 0) {
          problems.push(`Workspace projects/manifest.yml baseline is invalid:\n- ${errors.join('\n- ')}`);
        }
      } catch (error) {
        problems.push(`Workspace projects/manifest.yml baseline is invalid: ${error.message}`);
      }
    }
  }

  function validatePackageAssets(context) {
    const { root, workspaceRoot, manifestPath, manifest, allowedVariables, files, problems } = context;
    const bootstrapContract = validateBootstrapContract(root, files, problems);
    if (workspaceRoot) {
      validateWorkspaceSkillsBaseline(workspaceRoot, problems);
      validateWorkspaceRulesBaseline(workspaceRoot, problems);
    }

    for (const file of [...new Set(files)]) {
      const relativeFile = toPosixRelative(root, file);
      const content = fs.readFileSync(file, 'utf8');
      if (path.basename(file) === '.gitkeep') {
        problems.push(`Package assets must not use .gitkeep placeholders: ${relativeFile}`);
      }

      const contentForForbiddenScan = path.resolve(file) === manifestPath
        ? content.replace(/\nforbiddenPatterns:\n(?:\s+-\s+.+\n?)*/m, '\nforbiddenPatterns:\n')
        : content;

      for (const pattern of manifest.forbiddenPatterns) {
        if (pattern && contentForForbiddenScan.includes(pattern)) {
          problems.push(`Forbidden pattern ${JSON.stringify(pattern)} found in ${relativeFile}`);
        }
      }

      for (const match of content.matchAll(/\{\{([A-Za-z0-9_]+)\}\}/g)) {
        if (!allowedVariables.has(match[1])) {
          problems.push(`Template variable ${match[1]} is not declared in manifest: ${relativeFile}`);
        }
      }
    }
    return bootstrapContract;
  }

  function validatePackageStatic(context) {
    validatePackageMetadata(context);
    validateMappedEntries(context);
    validatePackageComponents(context);
    const skillSourceIds = validatePackageSkills(context);
    validatePackageBuiltins(context, skillSourceIds);
    const bootstrapContract = validatePackageAssets(context);
    return { bootstrapContract, parseJsonOutput };
  }

  return {
    validateWorkspaceSkillsBaseline,
    validateWorkspaceRulesBaseline,
    validatePackageStatic,
  };
}

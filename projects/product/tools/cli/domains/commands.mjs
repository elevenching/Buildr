import { fs, path, process, spawnSync } from '../shared/platform.mjs';
import { PUBLIC_JSON_SCHEMAS, withJsonSchema } from '../shared/json-contracts.mjs';

export function registerDomainsCommands(runtime) {
  const doctor = (...args) => runtime.doctor(...args);
  const workspaceSymlinkSegment = (...args) => runtime.workspaceSymlinkSegment(...args);
  const componentOwnerForMember = (...args) => runtime.componentOwnerForMember(...args);
  const isValidAssetId = (...args) => runtime.isValidAssetId(...args);
  const assertName = (...args) => runtime.assertName(...args);
  const normalizeRelativePathForBuildr = (...args) => runtime.normalizeRelativePathForBuildr(...args);
  const quoteYaml = (...args) => runtime.quoteYaml(...args);
  const parseYamlValue = (...args) => runtime.parseYamlValue(...args);
  const optionValue = (...args) => runtime.optionValue(...args);
  const optionValueRaw = (...args) => runtime.optionValueRaw(...args);
  const atomicWriteFile = (...args) => runtime.atomicWriteFile(...args);
  const parseYamlDocument = (...args) => runtime.parseYamlDocument(...args);
  const withWorkspaceMutation = (...args) => runtime.withWorkspaceMutation(...args);
  const hasFlag = (...args) => runtime.hasFlag(...args);
  const toPosixRelative = (...args) => runtime.toPosixRelative(...args);
  const existsDirectory = (...args) => runtime.existsDirectory(...args);
  const existsFile = (...args) => runtime.existsFile(...args);
  const assertInitializedBuildrWorkspace = (...args) => runtime.assertInitializedBuildrWorkspace(...args);

  function normalizeCommandCollection(collection) {
    if (!collection) return null;
    const normalized = normalizeRelativePathForBuildr(collection, `Command collection must stay inside commands/: ${collection}`)
      .replace(/^commands\//, '')
      .replace(/\/manifest\.yml$/, '');
    if (!normalized || normalized === 'manifest.yml') throw new Error(`Command collection must name a nested collection: ${collection}`);
    return normalized;
  }

  function commandsManifestPath(targetRoot, collection = null) {
    const normalized = normalizeCommandCollection(collection);
    return normalized
      ? path.join(targetRoot, 'commands', normalized, 'manifest.yml')
      : path.join(targetRoot, 'commands', 'manifest.yml');
  }

  function assertSafeCommandCollectionTarget(targetRoot, manifestPath) {
    const relative = toPosixRelative(targetRoot, manifestPath);
    const symlink = workspaceSymlinkSegment(targetRoot, relative);
    if (symlink) throw new Error(`Command collection path crosses a symbolic link: ${symlink}`);
  }

  function listCommandsManifestPaths(targetRoot) {
    const root = path.join(targetRoot, 'commands');
    if (!existsDirectory(root)) return [];
    const files = [];
    function visit(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const absolute = path.join(dir, entry.name);
        if (entry.isSymbolicLink()) continue;
        if (entry.isDirectory()) visit(absolute);
        else if (entry.isFile() && entry.name === 'manifest.yml') files.push(absolute);
      }
    }
    visit(root);
    return files.sort((left, right) => {
      const rootManifest = commandsManifestPath(targetRoot);
      if (left === rootManifest) return -1;
      if (right === rootManifest) return 1;
      return left.localeCompare(right);
    });
  }

  function parseCommandsManifestYaml(content) {
    const manifest = parseYamlDocument(content, 'commands manifest');
    return manifest;
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function validateCommandsManifest(manifest) {
    const errors = [];
    if (manifest.schemaVersion !== 'buildr.commands/v1') {
      errors.push('commands manifest schemaVersion must be buildr.commands/v1.');
    }
    if (!Array.isArray(manifest.commands)) {
      errors.push('commands manifest must declare commands as an array.');
      return errors;
    }

    const ids = new Set();
    const allowedCommandKeys = new Set(['id', 'source', 'enabled', 'required', 'state', 'name', 'executable', 'purpose', 'description', 'version', 'installHint', 'reason']);
    const allowedVersionKeys = new Set(['constraint', 'args']);
    manifest.commands.forEach((command, index) => {
      const label = `commands[${index}]`;
      if (!isPlainObject(command)) {
        errors.push(`${label} must be an object.`);
        return;
      }
      for (const key of Object.keys(command)) {
        if (!allowedCommandKeys.has(key)) {
          errors.push(`${label}.${key} is not a supported commands manifest field.`);
        }
      }
      if (!isValidAssetId(command.id)) {
        errors.push(`${label}.id must contain only letters, digits, dots, underscores, or dashes.`);
      } else if (ids.has(command.id)) {
        errors.push(`Duplicate command id: ${command.id}.`);
      } else {
        ids.add(command.id);
      }
      if (!command.executable || typeof command.executable !== 'string' || /\s/.test(command.executable) || command.executable.includes('/') || command.executable.includes('\\')) {
        if (command.enabled !== false && command.state !== 'uninstalled') {
          errors.push(`${label}.executable must be a command name without whitespace or path separators.`);
        }
      }
      if (!command.purpose || typeof command.purpose !== 'string') {
        errors.push(`${label}.purpose is required.`);
      }
      if (command.source !== undefined && !['buildr', 'workspace', 'project', 'service'].includes(command.source)) {
        errors.push(`${label}.source must be buildr, workspace, project, or service when provided.`);
      }
      if (command.enabled !== undefined && typeof command.enabled !== 'boolean') {
        errors.push(`${label}.enabled must be a boolean.`);
      }
      if (command.required !== undefined && typeof command.required !== 'boolean') {
        errors.push(`${label}.required must be a boolean.`);
      }
      if (command.state !== undefined && !['installed', 'modified', 'uninstalled', 'missing'].includes(command.state)) {
        errors.push(`${label}.state must be installed, modified, uninstalled, or missing.`);
      }
      if (command.name !== undefined && typeof command.name !== 'string') {
        errors.push(`${label}.name must be a string when provided.`);
      }
      if (command.description !== undefined && typeof command.description !== 'string') {
        errors.push(`${label}.description must be a string when provided.`);
      }
      if (command.installHint !== undefined && typeof command.installHint !== 'string') {
        errors.push(`${label}.installHint must be a string when provided.`);
      }
      if (command.install !== undefined) {
        errors.push(`${label}.install is not supported. Use installHint instead.`);
      }
      if (command.version !== undefined) {
        if (!isPlainObject(command.version)) {
          errors.push(`${label}.version must be an object.`);
        } else {
          for (const key of Object.keys(command.version)) {
            if (!allowedVersionKeys.has(key)) {
              errors.push(`${label}.version.${key} is not a supported version field.`);
            }
          }
          const { constraint, args } = command.version;
          if (!constraint || typeof constraint !== 'string') {
            errors.push(`${label}.version.constraint is required when version is declared.`);
          } else if (!parseVersionConstraint(constraint)) {
            errors.push(`${label}.version.constraint is invalid: ${constraint}.`);
          }
          if (!Array.isArray(args) || !args.every((arg) => typeof arg === 'string')) {
            errors.push(`${label}.version.args must be an array of strings.`);
          }
        }
      }
    });
    return errors;
  }

  function renderCommandsManifestYaml(manifest) {
    const lines = ['schemaVersion: buildr.commands/v1'];
    if (!manifest.commands || manifest.commands.length === 0) {
      lines.push('commands: []');
      return `${lines.join('\n')}\n`;
    }

    lines.push('commands:');
    for (const command of manifest.commands) {
      lines.push(`  - id: ${quoteYaml(command.id)}`);
      for (const key of ['source']) {
        if (command[key] !== undefined) lines.push(`    ${key}: ${quoteYaml(command[key])}`);
      }
      if (command.enabled !== undefined) lines.push(`    enabled: ${quoteYaml(Boolean(command.enabled))}`);
      if (command.required !== undefined) lines.push(`    required: ${quoteYaml(Boolean(command.required))}`);
      if (command.state !== undefined) lines.push(`    state: ${quoteYaml(command.state)}`);
      for (const key of ['name', 'executable', 'purpose', 'description']) {
        if (command[key] !== undefined) lines.push(`    ${key}: ${quoteYaml(command[key])}`);
      }
      if (command.version) {
        lines.push('    version:');
        lines.push(`      constraint: ${quoteYaml(command.version.constraint)}`);
        lines.push(`      args: ${quoteYaml(command.version.args)}`);
      }
      if (command.installHint !== undefined) {
        lines.push(`    installHint: ${quoteYaml(command.installHint)}`);
      }
      if (command.reason !== undefined) {
        lines.push(`    reason: ${quoteYaml(command.reason)}`);
      }
    }
    return `${lines.join('\n')}\n`;
  }

  function readCommandsManifestForWrite(targetRoot, collection = null) {
    const manifestPath = commandsManifestPath(targetRoot, collection);
    assertSafeCommandCollectionTarget(targetRoot, manifestPath);
    if (!existsFile(manifestPath)) {
      return { schemaVersion: 'buildr.commands/v1', commands: [] };
    }
    const manifest = parseCommandsManifestYaml(fs.readFileSync(manifestPath, 'utf8'));
    const validationErrors = validateCommandsManifest(manifest);
    if (validationErrors.length > 0) {
      throw new Error(`${toPosixRelative(targetRoot, manifestPath)} is invalid:\n- ${validationErrors.join('\n- ')}`);
    }
    return manifest;
  }

  function writeCommandsManifest(targetRoot, manifest, collection = null) {
    const manifestPath = commandsManifestPath(targetRoot, collection);
    assertSafeCommandCollectionTarget(targetRoot, manifestPath);
    atomicWriteFile(manifestPath, renderCommandsManifestYaml(manifest));
    return manifestPath;
  }

  function parseVersionArgs(value) {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      const parsed = parseYamlValue(trimmed);
      if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
        throw new Error('--version-args must be a JSON array of strings or a comma-separated string.');
      }
      return parsed;
    }
    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
  }

  function assertNoUnknownOptions(args, allowedFlags, booleanFlags = new Set()) {
    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index];
      if (!arg.startsWith('--')) continue;
      if (!allowedFlags.has(arg)) {
        throw new Error(`Unknown argument: ${arg}`);
      }
      if (!booleanFlags.has(arg)) index += 1;
    }
  }

  function positionalArgs(args) {
    const booleanFlags = new Set(['--replace', '--ignore-unsupported', '--keep-file', '--json', '--include-info', '--verbose']);
    const result = [];
    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index];
      if (!arg.startsWith('--')) {
        result.push(arg);
        continue;
      }
      if (!booleanFlags.has(arg)) index += 1;
    }
    return result;
  }

  function buildCommandEntry(id, args) {
    assertName(id, 'Command id');
    const purpose = optionValue(args, '--purpose', null);
    if (!purpose) throw new Error('Missing required option: --purpose');
    const entry = {
      id,
      executable: optionValue(args, '--executable', id),
      purpose,
    };
    const name = optionValue(args, '--name', null);
    const description = optionValue(args, '--description', null);
    const installHint = optionValue(args, '--install-hint', optionValue(args, '--installHint', null));
    const versionConstraint = optionValue(args, '--version-constraint', null);
    const versionArgs = parseVersionArgs(optionValueRaw(args, '--version-args', null));

    if (name) entry.name = name;
    if (description) entry.description = description;
    if (versionConstraint || versionArgs) {
      if (!versionConstraint || !versionArgs) {
        throw new Error('Version declaration requires both --version-constraint and --version-args.');
      }
      entry.version = { constraint: versionConstraint, args: versionArgs };
    }
    if (installHint) entry.installHint = installHint;

    const errors = validateCommandsManifest({ schemaVersion: 'buildr.commands/v1', commands: [entry] });
    if (errors.length > 0) throw new Error(errors.join('\n'));
    return entry;
  }

  function printCommandsMutationReceipt(action, targetRoot, id, updatedPaths, nextAction) {
    console.log(`已${action}命令行工具清单条目：${id}`);
    console.log('已更新 Buildr 源资产：');
    for (const file of updatedPaths) console.log(`  ${toPosixRelative(targetRoot, file)}`);
    console.log('下一步：');
    console.log(`  ${nextAction}`);
  }

  function commandsAddUnsafe(args) {
    const allowedFlags = new Set(['--target', '--collection', '--purpose', '--executable', '--name', '--description', '--version-constraint', '--version-args', '--install-hint', '--installHint', '--replace']);
    assertNoUnknownOptions(args, allowedFlags, new Set(['--replace']));
    const [id] = positionalArgs(args);
    if (!id) throw new Error('Missing command id');
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    assertInitializedBuildrWorkspace(targetRoot);
    const collection = optionValue(args, '--collection', null);
    const manifestPath = commandsManifestPath(targetRoot, collection);
    const relativeManifest = toPosixRelative(targetRoot, manifestPath);
    const owner = componentOwnerForMember(targetRoot, relativeManifest);
    if (owner) throw new Error(`Command collection is managed by Component ${owner}: ${relativeManifest}. Use buildr component lifecycle commands.`);

    const manifest = readCommandsManifestForWrite(targetRoot, collection);
    const entry = buildCommandEntry(id, args);
    const replace = hasFlag(args, '--replace');
    const existingIndex = manifest.commands.findIndex((command) => command.id === id);
    if (existingIndex !== -1 && !replace) {
      throw new Error(`Command already exists in ${relativeManifest}: ${id}. Use --replace to replace the whole entry.`);
    }
    if (existingIndex === -1) {
      manifest.commands.push(entry);
    } else {
      manifest.commands[existingIndex] = entry;
    }

    writeCommandsManifest(targetRoot, manifest, collection);
    printCommandsMutationReceipt(
      existingIndex === -1 ? '添加' : '替换',
      targetRoot,
      id,
      [manifestPath],
      '运行命令行工具清单检查或 doctor 查看当前本机与组织清单的差异。'
    );
  }

  function commandsAdd(args) {
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    return withWorkspaceMutation(targetRoot, 'commands.add', [path.join(targetRoot, 'commands')], () => commandsAddUnsafe(args));
  }

  function commandsRemoveUnsafe(args) {
    const allowedFlags = new Set(['--target', '--collection']);
    assertNoUnknownOptions(args, allowedFlags);
    const [id] = positionalArgs(args);
    if (!id) throw new Error('Missing command id');
    assertName(id, 'Command id');
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    assertInitializedBuildrWorkspace(targetRoot);
    const collection = optionValue(args, '--collection', null);
    const manifestPath = commandsManifestPath(targetRoot, collection);
    const relativeManifest = toPosixRelative(targetRoot, manifestPath);
    const owner = componentOwnerForMember(targetRoot, relativeManifest);
    if (owner) throw new Error(`Command collection is managed by Component ${owner}: ${relativeManifest}. Use buildr component lifecycle commands.`);

    const manifest = readCommandsManifestForWrite(targetRoot, collection);
    const existingIndex = manifest.commands.findIndex((command) => command.id === id);
    if (existingIndex === -1) {
      throw new Error(`Command not found in ${relativeManifest}: ${id}`);
    }
    manifest.commands.splice(existingIndex, 1);
    writeCommandsManifest(targetRoot, manifest, collection);
    printCommandsMutationReceipt(
      '删除',
      targetRoot,
      id,
      [manifestPath],
      '运行命令行工具清单检查或 doctor 确认当前 workspace 状态。'
    );
  }

  function commandsRemove(args) {
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    return withWorkspaceMutation(targetRoot, 'commands.remove', [path.join(targetRoot, 'commands')], () => commandsRemoveUnsafe(args));
  }

  function parseVersionConstraint(constraint) {
    const match = String(constraint).trim().match(/^(>=|>|<=|<|=)?\s*(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return null;
    return {
      operator: match[1] || '=',
      version: [Number(match[2]), Number(match[3]), Number(match[4])],
      rawVersion: `${match[2]}.${match[3]}.${match[4]}`,
    };
  }

  function parseVersion(version) {
    const match = String(version).match(/(\d+)\.(\d+)\.(\d+)(?:[-+][0-9A-Za-z.-]+)?/);
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
  }

  function compareVersions(left, right) {
    for (let index = 0; index < 3; index += 1) {
      if (left[index] > right[index]) return 1;
      if (left[index] < right[index]) return -1;
    }
    return 0;
  }

  function versionSatisfies(version, constraint) {
    const comparison = compareVersions(version, constraint.version);
    switch (constraint.operator) {
      case '>=': return comparison >= 0;
      case '>': return comparison > 0;
      case '<=': return comparison <= 0;
      case '<': return comparison < 0;
      case '=': return comparison === 0;
      default: return false;
    }
  }

  function findExecutableOnPath(executable) {
    const pathValue = process.env.PATH || '';
    const pathExt = process.platform === 'win32'
      ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';')
      : [''];

    for (const dir of pathValue.split(path.delimiter).filter(Boolean)) {
      for (const ext of pathExt) {
        const candidate = path.join(dir, process.platform === 'win32' ? `${executable}${ext}` : executable);
        try {
          fs.accessSync(candidate, fs.constants.X_OK);
          return candidate;
        } catch {
          // Try the next PATH entry.
        }
      }
    }
    return null;
  }

  function createCommandsCheckResult(targetRoot) {
    return {
      targetRoot,
      manifest: {
        path: 'commands/manifest.yml',
        exists: false,
        valid: false,
        schemaVersion: null,
      },
      manifests: [],
      ok: true,
      summary: { ok: 0, warning: 0, error: 0 },
      commands: [],
      findings: [],
      nextSteps: [],
    };
  }

  function addCommandsFinding(result, status, code, message, extra = {}) {
    result.findings.push({ status, code, message, ...extra });
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (!isPlainObject(value)) return value;
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }

  function normalizedCommandSignature(command) {
    return JSON.stringify(stableValue(command));
  }

  function finalizeCommandsCheckResult(result) {
    const counts = { ok: 0, info: 0, warning: 0, error: 0 };
    if (result.manifest.exists && result.manifest.valid) counts.ok += 1;
    for (const command of result.commands) counts[command.status] += 1;
    for (const finding of result.findings) {
      if (finding.status === 'error' || finding.status === 'warning') counts[finding.status] += 1;
    }
    result.summary = counts;
    result.ok = counts.error === 0;
    result.nextSteps = result.findings
      .filter((finding) => finding.suggestion || finding.installHint)
      .map((finding) => ({
        code: finding.code,
        suggestion: finding.suggestion,
        installHint: finding.installHint,
        commandId: finding.commandId,
      }))
      .slice(0, 10);
  }

  function runCommandsCheck(targetRoot) {
    const result = createCommandsCheckResult(targetRoot);
    const rootManifestPath = commandsManifestPath(targetRoot);
    const manifestPaths = listCommandsManifestPaths(targetRoot);
    result.manifest.exists = existsFile(rootManifestPath);
    if (!result.manifest.exists) {
      addCommandsFinding(result, 'warning', 'commands.manifest_missing', '命令行工具清单不存在。', {
        path: result.manifest.path,
        suggestion: '创建 commands/manifest.yml；新 workspace 可通过 buildr init 初始化默认空清单。',
      });
    }
    const commandsById = new Map();
    for (const manifestPath of manifestPaths) {
      const relative = toPosixRelative(targetRoot, manifestPath);
      const record = { path: relative, exists: true, valid: false, schemaVersion: null, commandCount: 0 };
      result.manifests.push(record);
      try {
        const manifest = parseCommandsManifestYaml(fs.readFileSync(manifestPath, 'utf8'));
        record.schemaVersion = manifest.schemaVersion;
        const validationErrors = validateCommandsManifest(manifest);
        if (validationErrors.length) {
          for (const message of validationErrors) addCommandsFinding(result, 'error', 'commands.manifest_invalid', message, { path: relative });
          continue;
        }
        record.valid = true;
        record.commandCount = manifest.commands.length;
        if (manifestPath === rootManifestPath) {
          result.manifest.schemaVersion = manifest.schemaVersion;
          result.manifest.valid = true;
        }
        for (const command of manifest.commands) {
          const signature = normalizedCommandSignature(command);
          const existing = commandsById.get(command.id);
          if (!existing) {
            commandsById.set(command.id, { command, signature, sources: [relative] });
          } else if (existing.signature === signature) {
            existing.sources.push(relative);
          } else {
            addCommandsFinding(result, 'error', 'commands.collection_conflict', `Command ${command.id} 在多个 collection 中声明冲突。`, {
              commandId: command.id,
              sources: [...existing.sources, relative],
              suggestion: '统一重复 Command 的有效字段，或删除其中一个声明。',
            });
          }
        }
      } catch (error) {
        addCommandsFinding(result, 'error', 'commands.manifest_invalid', `命令行工具清单不可解析：${error.message}`, { path: relative });
      }
    }

    for (const { command, sources } of commandsById.values()) {
      if (command.enabled === false || command.state === 'uninstalled') {
        addCommandsFinding(result, 'info', 'commands.uninstalled', `命令行工具声明已卸载：${command.id}`, {
          path: sources[0],
          sources,
          commandId: command.id,
          suggestion: '如需恢复，运行 buildr builtin restore。',
        });
        continue;
      }
      const item = {
        id: command.id,
        name: command.name || command.id,
        executable: command.executable,
        purpose: command.purpose,
        description: command.description || null,
        installHint: command.installHint || null,
        status: 'ok',
        executablePath: null,
        version: command.version ? {
          constraint: command.version.constraint,
          args: command.version.args,
          current: null,
        } : null,
        message: '命令行工具可用。',
        difference: null,
        sources,
      };
      result.commands.push(item);

      const executablePath = findExecutableOnPath(command.executable);
      item.executablePath = executablePath;
      if (!executablePath) {
        item.status = 'warning';
        item.message = `当前本机找不到 executable：${command.executable}`;
        item.difference = { expected: command.executable, actual: null };
        addCommandsFinding(result, 'warning', 'commands.executable_missing', item.message, {
          path: sources[0],
          sources,
          commandId: command.id,
          executable: command.executable,
          installHint: command.installHint || null,
          suggestion: command.installHint || '根据组织约定安装该命令行工具。',
        });
        continue;
      }

      if (!command.version) continue;

      const versionCheck = spawnSync(command.executable, command.version.args, {
        encoding: 'utf8',
        timeout: 5000,
        windowsHide: true,
      });
      const output = `${versionCheck.stdout || ''}\n${versionCheck.stderr || ''}`.trim();
      const currentVersion = parseVersion(output);
      if (!currentVersion) {
        item.status = 'warning';
        item.message = `无法从版本输出判断 ${command.id} 的版本。`;
        item.difference = { expected: command.version.constraint, actual: output || null };
        addCommandsFinding(result, 'warning', 'commands.version_unknown', item.message, {
          path: sources[0],
          sources,
          commandId: command.id,
          executable: command.executable,
          versionArgs: command.version.args,
          installHint: command.installHint || null,
          suggestion: command.installHint || '根据组织约定确认或升级该命令行工具。',
        });
        continue;
      }

      item.version.current = currentVersion.join('.');
      const constraint = parseVersionConstraint(command.version.constraint);
      if (!versionSatisfies(currentVersion, constraint)) {
        item.status = 'warning';
        item.message = `${command.id} 当前版本 ${item.version.current} 不满足 ${command.version.constraint}。`;
        item.difference = { expected: command.version.constraint, actual: item.version.current };
        addCommandsFinding(result, 'warning', 'commands.version_unsatisfied', item.message, {
          path: sources[0],
          sources,
          commandId: command.id,
          executable: command.executable,
          expected: command.version.constraint,
          actual: item.version.current,
          installHint: command.installHint || null,
          suggestion: command.installHint || '根据组织约定升级该命令行工具。',
        });
      }
    }

    finalizeCommandsCheckResult(result);
    return result;
  }

  function printCommandsCheckReport(result) {
    console.log(`Buildr commands check for ${result.targetRoot}`);
    console.log(`Status: ok=${result.summary.ok} warning=${result.summary.warning} error=${result.summary.error}`);
    console.log('');
    for (const manifest of result.manifests) console.log(`Manifest: ${manifest.path} exists=${manifest.exists} valid=${manifest.valid}`);
    if (result.manifests.length === 0) console.log(`Manifest: ${result.manifest.path} exists=${result.manifest.exists} valid=${result.manifest.valid}`);

    if (result.commands.length > 0) {
      console.log('');
      for (const command of result.commands) {
        console.log(`[${command.status}] ${command.id} (${command.executable}) [${command.sources.join(', ')}] - ${command.message}`);
        if (command.installHint && command.status !== 'ok') console.log(`  安装提示：${command.installHint}`);
      }
    }

    if (result.findings.length > 0) {
      console.log('');
      for (const finding of result.findings) {
        console.log(`[${finding.status}] ${finding.code} - ${finding.message}`);
        if (finding.suggestion) console.log(`  建议：${finding.suggestion}`);
      }
    }
  }

  function commandsCheck(args) {
    const targetRoot = path.resolve(optionValue(args, '--target', process.cwd()));
    const json = hasFlag(args, '--json');
    const result = runCommandsCheck(targetRoot);
    if (json) {
      process.stdout.write(`${JSON.stringify(withJsonSchema(PUBLIC_JSON_SCHEMAS.commandsCheck, result), null, 2)}\n`);
    } else {
      printCommandsCheckReport(result);
    }
    process.exitCode = result.ok ? 0 : 1;
  }

  Object.assign(runtime, { normalizeCommandCollection, commandsManifestPath, assertSafeCommandCollectionTarget, listCommandsManifestPaths, parseCommandsManifestYaml, isPlainObject, validateCommandsManifest, renderCommandsManifestYaml, readCommandsManifestForWrite, writeCommandsManifest, parseVersionArgs, assertNoUnknownOptions, positionalArgs, buildCommandEntry, printCommandsMutationReceipt, commandsAddUnsafe, commandsAdd, commandsRemoveUnsafe, commandsRemove, parseVersionConstraint, parseVersion, compareVersions, versionSatisfies, findExecutableOnPath, createCommandsCheckResult, addCommandsFinding, stableValue, normalizedCommandSignature, finalizeCommandsCheckResult, runCommandsCheck, printCommandsCheckReport, commandsCheck });
  return runtime;
}

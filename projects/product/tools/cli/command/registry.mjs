import process from 'node:process';
import { createRuntime } from '../application/compose-runtime.mjs';
import { registerCommandHelp } from './help.mjs';
import { isVersionRequest, printVersion } from './identity.mjs';
import { printCliError } from './diagnostics.mjs';

export const COMMAND_REGISTRY = [
  { key: 'init', match: ({ domain }) => domain === 'init', run: (r, c) => r.initBuildr(c.argv.slice(3)) },
  { key: 'bootstrap guide', match: ({ domain, action }) => domain === 'bootstrap' && action === 'guide', run: (r) => r.bootstrapGuide() },
  { key: 'package check', match: ({ domain, action }) => domain === 'package' && action === 'check', run: (r) => r.packageCheck() },
  { key: 'package build', match: ({ domain, action }) => domain === 'package' && action === 'build', run: (r, c) => r.packageBuild(c.argv.slice(4)) },
  { key: 'project create', match: ({ domain, action }) => domain === 'project' && action === 'create', run: (r, c) => r.createProject(c.argv.slice(4)) },
  { key: 'service create', match: ({ domain, action }) => domain === 'service' && action === 'create', run: (r, c) => r.createService(c.argv.slice(4)) },
  { key: 'doctor', match: ({ domain }) => domain === 'doctor', run: (r, c) => r.doctor(c.argv.slice(3)) },
  { key: 'mutation recover', match: ({ domain, action }) => domain === 'mutation' && action === 'recover', run: (r, c) => r.mutationRecover(c.argv.slice(4)) },
  { key: 'runtime list', match: ({ domain, action }) => domain === 'runtime' && action === 'list', run: (r, c) => r.runtimeList(c.argv.slice(4)) },
  { key: 'commands check', match: ({ domain, action }) => domain === 'commands' && action === 'check', run: (r, c) => r.commandsCheck(c.argv.slice(4)) },
  { key: 'commands add', match: ({ domain, action }) => domain === 'commands' && action === 'add', run: (r, c) => r.commandsAdd(c.argv.slice(4)) },
  { key: 'commands remove', match: ({ domain, action }) => domain === 'commands' && action === 'remove', run: (r, c) => r.commandsRemove(c.argv.slice(4)) },
  { key: 'openspec baseline create', match: ({ domain, action, runtimeId }) => domain === 'openspec' && action === 'baseline' && runtimeId === 'create', run: (r, c) => r.openspecBaselineCreate(c.argv.slice(5)) },
  { key: 'openspec check', match: ({ domain, action }) => domain === 'openspec' && action === 'check', run: (r, c) => r.openspecCheck(c.argv.slice(4)) },
  { key: 'component list', match: ({ domain, action }) => domain === 'component' && action === 'list', run: (r, c) => r.componentListOrCheck(c.argv.slice(4), false) },
  { key: 'component check', match: ({ domain, action }) => domain === 'component' && action === 'check', run: (r, c) => r.componentListOrCheck(c.argv.slice(4), true) },
  { key: 'component install', match: ({ domain, action }) => domain === 'component' && action === 'install', run: (r, c) => r.componentInstall(c.argv.slice(4)) },
  { key: 'component uninstall', match: ({ domain, action }) => domain === 'component' && action === 'uninstall', run: (r, c) => r.componentUninstall(c.argv.slice(4)) },
  { key: 'rules add', match: ({ domain, action }) => domain === 'rules' && action === 'add', run: (r, c) => r.rulesAdd(c.argv.slice(4)) },
  { key: 'rules remove', match: ({ domain, action }) => domain === 'rules' && action === 'remove', run: (r, c) => r.rulesRemove(c.argv.slice(4)) },
  { key: 'builtin list', match: ({ domain, action }) => domain === 'builtin' && action === 'list', run: (r, c) => r.builtinList(c.argv.slice(4)) },
  { key: 'builtin uninstall', match: ({ domain, action }) => domain === 'builtin' && action === 'uninstall', run: (r, c) => r.builtinUninstall(c.argv.slice(4)) },
  { key: 'builtin restore', match: ({ domain, action }) => domain === 'builtin' && action === 'restore', run: (r, c) => r.builtinRestore(c.argv.slice(4)) },
  { key: 'update check', match: ({ domain, action }) => domain === 'update' && action === 'check', run: (r, c) => r.updateCheck(c.argv.slice(4)) },
  { key: 'update', match: ({ domain }) => domain === 'update', run: (r, c) => r.updateBuildr(c.argv.slice(3)) },
  { key: 'render', match: ({ domain }) => domain === 'render', run: (r, c) => {
    const { targetRoot, files, rulesActions, warnings } = r.renderRuntime(c.action, c.argv.slice(4));
    for (const warning of warnings) console.error(`Warning: ${warning}`);
    const ruleTargets = new Set(rulesActions.map((item) => item.targetFile));
    for (const item of rulesActions) console.log(`[${item.action}] ${r.toPosixRelative(targetRoot, item.targetFile)}`);
    for (const file of files) if (!ruleTargets.has(file)) console.log(r.toPosixRelative(targetRoot, file));
  } },
  { key: 'sync', match: ({ domain }) => domain === 'sync', run: (r, c) => r.syncRuntime(c.action, c.argv.slice(4)) },
  { key: 'skills add', match: ({ domain, action }) => domain === 'skills' && action === 'add', run: (r, c) => r.skillsAdd(c.argv.slice(4)) },
  { key: 'skills remove', match: ({ domain, action }) => domain === 'skills' && action === 'remove', run: (r, c) => r.skillsRemove(c.argv.slice(4)) },
  { key: 'skill install', requiresAgent: true, match: ({ domain, action }) => domain === 'skill' && action === 'install', run: (r, c) => {
    const command = r.withResolvedTarget(c.args);
    const adapter = r.getRuntimeAdapter(c.runtimeId);
    const { targetRoot, files } = r.installProductRuntimeSkill(adapter.id, command.args, { repoRoot: command.targetRoot, command: `buildr skill install ${c.runtimeId}` });
    for (const file of files) console.log(r.path.relative(targetRoot, file).split(r.path.sep).join('/'));
  } },
  { key: 'runtime check', requiresAgent: true, match: ({ domain, action }) => domain === 'runtime' && action === 'check', run: (r, c) => {
    const command = r.withResolvedTarget(c.args);
    const adapter = r.getRuntimeAdapter(c.runtimeId);
    const checker = r.runtimeImplementation(adapter, 'checker', r.RUNTIME_CHECKERS);
    const printer = r.runtimeImplementation(adapter, 'checker', r.RUNTIME_CHECK_PRINTERS);
    const result = checker(command.args, { repoRoot: command.targetRoot, adapterId: adapter.id, command: `buildr runtime check ${c.runtimeId}` });
    printer(result); process.exit(result.exitCode);
  } },
  { key: 'skills render', requiresAgent: true, match: ({ domain, action }) => domain === 'skills' && action === 'render', run: (r, c) => runScopedRender(r, c) },
  { key: 'rules render', requiresAgent: true, match: ({ domain, action }) => domain === 'rules' && action === 'render', run: (r, c) => runScopedRender(r, c) },
];

function runScopedRender(r, context) {
  const adapter = r.getRuntimeAdapter(context.runtimeId);
  const renderer = context.domain === 'skills'
    ? (args) => r.renderSkillsRuntime(context.runtimeId, args)
    : context.domain === 'rules' && adapter.renderCapabilities['rules-entry'].writesFiles
      ? (args) => r.renderRulesRuntime(context.runtimeId, args)
      : null;
  if (!renderer) { r.usage(); process.exit(2); }
  const command = r.withResolvedTarget(context.args);
  const result = renderer(command.args, { repoRoot: command.targetRoot, command: `buildr ${context.domain} render ${context.runtimeId}` });
  const { targetRoot, files } = result;
  if (context.domain === 'skills' && files.length === 0) {
    const scope = r.optionValue(command.args, '--scope');
    console.log(`No workspace/project Skills declared for scope ${r.displayScope(scope)}.`);
    return;
  }
  for (const warning of result.warnings || []) console.error(`Warning: ${warning}`);
  if (context.domain === 'rules' && result.actions) {
    for (const item of result.actions) console.log(`[${item.action}] ${r.toPosixRelative(targetRoot, item.targetFile)}`);
    return;
  }
  for (const file of files) console.log(r.toPosixRelative(targetRoot, file));
}

export function dispatch(argv = process.argv) {
  const runtime = createRuntime();
  registerCommandHelp(runtime);
  const rawArgs = argv.slice(2);
  const commandCandidates = ['version', 'help', ...COMMAND_REGISTRY.map((item) => item.key)];
  if (isVersionRequest(rawArgs)) { printVersion(rawArgs); return; }
  if (runtime.isHelpRequest(rawArgs)) {
    const helpArgs = rawArgs[0] === 'help' ? rawArgs.slice(1) : rawArgs;
    if (runtime.printHelp(helpArgs)) return;
    process.exit(printCliError(rawArgs, { candidates: commandCandidates, helpTopic: rawArgs[0] === 'help' }));
  }
  const [domain, action, runtimeId, ...args] = rawArgs;
  const context = { argv, rawArgs, domain, action, runtimeId, args };
  const direct = COMMAND_REGISTRY.find((item) => !item.requiresAgent && item.match(context));
  if (direct) return direct.run(runtime, context);
  if (!runtime.isSupportedAgent(runtimeId)) {
    process.exit(printCliError(rawArgs, { candidates: commandCandidates }));
  }
  const agent = COMMAND_REGISTRY.find((item) => item.requiresAgent && item.match(context));
  if (agent) return agent.run(runtime, context);
  process.exit(printCliError(rawArgs, { candidates: commandCandidates }));
}

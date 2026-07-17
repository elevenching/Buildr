import { path, RUNTIME_ADAPTERS, SUPPORTED_AGENT_IDS } from '../shared/platform.mjs';

const RULES_RENDER_AGENT_IDS = Object.values(RUNTIME_ADAPTERS)
  .filter((adapter) => adapter.renderCapabilities['rules-entry'].writesFiles)
  .map((adapter) => adapter.id);

export function registerCommandHelp(runtime) {
  const doctor = (...args) => runtime.doctor(...args);

  function usage() {
    const runtimeIds = SUPPORTED_AGENT_IDS.join('|');
    console.error('Usage:');
    console.error(`  buildr init [--agent <${runtimeIds}>] [--target <dir>] [--name <name>] [--profile <personal|team|company>]`);
    console.error('  buildr project create <project> [--target <dir>] [--repo <git-url>] [--title <text>] [--description <text>]');
    console.error('  buildr service create <project>/<service> <repo-ref> [--target <dir>] [--type <type>] [--branch <branch>]');
    console.error('  buildr doctor [--agent <agent>] [--target <dir>] [--scope <.|projects/project[/services/service[/path...]]>] [--json] [--include-info] [--verbose]');
    console.error('  buildr mutation recover <transaction-id> [--target <dir>]');
    console.error('  buildr commands add <id> --purpose <text> [--target <dir>] [--collection <path>] [--executable <name>] [--name <text>] [--description <text>] [--version-constraint <constraint>] [--version-args <args>] [--install-hint <text>] [--replace]');
    console.error('  buildr commands remove <id> [--target <dir>] [--collection <path>]');
    console.error('  buildr commands check [--target <dir>] [--json]');
    console.error('  buildr openspec baseline create <change> --project <project> [--target <dir>] [--adopt-current] [--update] [--json]');
    console.error('  buildr openspec check <change> --stage <proposal|pre-sync|post-sync> --project <project> [--target <dir>] [--json]');
    console.error('  buildr component list [--target <dir>] [--json]');
    console.error('  buildr component check [<id>] [--target <dir>] [--json]');
    console.error('  buildr component install <id> --agent <agent> [--target <dir>]');
    console.error('  buildr component uninstall <id> --agent <agent> [--target <dir>] [--reason <text>]');
    console.error('  buildr builtin list [--target <dir>] [--json]');
    console.error('  buildr builtin uninstall <id> --target <dir> [--reason <text>]');
    console.error('  buildr builtin restore <id> --target <dir>');
    console.error('  buildr update [--json]');
    console.error('  buildr update check [--json]');
    console.error('  buildr runtime list [--json]');
    console.error(`  buildr render <${runtimeIds}> --target <dir> [--scope <scope>]`);
    console.error(`  buildr sync <${runtimeIds}> --target <dir> [--scope <scope>]`);
    console.error('  buildr bootstrap guide');
    console.error('  buildr package check');
    console.error('  buildr package build [--out <dir>]');
    console.error(`  buildr skill install <${runtimeIds}> --target <dir>`);
    console.error('  buildr skills add [<id>] --source <skill-dir> --scope <.|projects/project> [--target <dir>] [--replace] [--ignore-unsupported]');
    console.error('  buildr skills add <id> --remote-source <url> --scope <.|projects/project> [--target <dir>] [--source-kind <kind>] [--description <text>] [--replace]');
    console.error('  buildr skills add <id> --resolved-source <url> --scope <.|projects/project> [--target <dir>] [--resolved-kind <kind>] [--remote-source <url>] [--source-kind <kind>] [--version <version>] [--integrity <hash>] [--description <text>] [--replace]');
    console.error('  buildr skills remove <id> --scope <.|projects/project> [--target <dir>]');
    console.error(`  buildr skills render <${runtimeIds}> --scope <.|projects/project> --target <dir>`);
    console.error('  buildr rules add <id> [--path <rules/file.md>] --description <text> [--target <dir>] [--replace]');
    console.error('  buildr rules remove <id> [--target <dir>] [--keep-file]');
    console.error(`  buildr rules render <${RULES_RENDER_AGENT_IDS.join('|')}> --scope <.|projects/project[/services/service[/path...]]> --target <dir>`);
    console.error(`  buildr runtime check <${runtimeIds}> --scope <.|projects/project[/services/service[/path...]]> --target <dir>`);
  }

  const HELP_TOPICS = {
    root: [
      'Usage: buildr <command> [options]',
      '',
      'Public workspace commands:',
      '  init                 初始化 Buildr workspace；传入 --agent 时一次完成 runtime 与最终 doctor。',
      '  version              输出当前 Buildr CLI package version；支持 --json。',
      '  project create       创建或登记 Project。',
      '  service create       创建或登记 Service。',
      '  doctor               诊断 workspace、源资产和 Agent runtime render 状态。',
      '  mutation recover      从保留 backup 恢复不完整 source mutation。',
      '  runtime list         列出 Buildr 支持的 Agent runtime adapter。',
      '  runtime check        专项检查某个 Agent runtime render 状态。',
      '  render               渲染指定 Agent 的 rules entry 和 workspace/project Skills。',
      '  sync                 同步 Buildr 产品能力并准备当前 Agent 的 workspace 入口 runtime。',
      '  skill install        安装产品入口 Buildr Skill。',
      '  skills add/remove/render',
      '  commands add/remove/check',
      '  component list/check/install/uninstall',
      '  rules add/remove/render',
      '  builtin list/uninstall/restore',
      '  update/check',
      '  bootstrap guide',
      '',
      'Product maintenance / workflow internals:',
      '  package check/build  校验或构建 Buildr 产品包。',
      '  openspec baseline/check  供 Buildr OpenSpec workflow 管理契约基线与同步门禁。',
      '',
      '表面分类说明用途与支持边界，不是权限或安全限制；以上命令仍可执行并可查看主题帮助。',
    ],
    init: [
      `Usage: buildr init [--agent <${SUPPORTED_AGENT_IDS.join('|')}>] [--target <dir>] [--name <name>] [--profile <personal|team|company>]`,
      '',
      '首次 onboarding 推荐传入 --agent：初始化源资产后复用完整 sync，并以最终 doctor 通过作为完成条件。',
      '不传 --agent 时只初始化源资产；已有 workspace 的日常更新继续使用 buildr sync <agent>。',
      '--help 只输出帮助，不会写入文件。',
    ],
    version: [
      'Usage: buildr version [--json]',
      '',
      '输出当前实际执行的 Buildr CLI package identity。也可使用 buildr --version 或 buildr -V。',
    ],
    'project create': [
      'Usage: buildr project create <project> [--target <dir>] [--repo <git-url>] [--title <text>] [--description <text>]',
      '',
      '创建或登记 Project，并写入 Project registry: projects/manifest.yml。',
    ],
    'service create': [
      'Usage: buildr service create <project>/<service> <repo-ref> [--target <dir>] [--type <type>] [--branch <branch>]',
      '',
      '创建或登记 Service，并写入所属 Project 的 Service registry: services/manifest.yml。',
      'Service 规则入口是 Service 目录中的 AGENTS.md，不在 Service registry 中记录规则路径。',
    ],
    doctor: [
      'Usage: buildr doctor [--agent <agent>] [--target <dir>] [--scope <.|projects/project[/services/service[/path...]]>] [--json] [--include-info] [--verbose]',
      '',
      '诊断 workspace 源资产和 Agent runtime render 状态。传入 --agent 时只检查该 Agent adapter。',
    ],
    'mutation recover': [
      'Usage: buildr mutation recover <transaction-id> [--target <dir>]',
      '',
      '从完整 transaction journal 和 backup 恢复操作前源资产；不会猜测或接受半完成新状态。',
    ],
    'runtime list': [
      'Usage: buildr runtime list [--json]',
      '',
      '列出 Buildr 支持的 Agent runtime adapter；不要求当前目录是 Buildr workspace。',
    ],
    'runtime check': [
      `Usage: buildr runtime check <${SUPPORTED_AGENT_IDS.join('|')}> --scope <.|projects/project[/services/service[/path...]]> --target <dir>`,
      '',
      '专项检查某个 Agent runtime render 状态。',
    ],
    sync: [
      `Usage: buildr sync <${SUPPORTED_AGENT_IDS.join('|')}> --target <dir> [--scope <scope>]`,
      '',
      '同步 Buildr 产品能力，安装产品入口 Buildr Skill，并准备当前 Agent 的 workspace 入口 runtime。不是 Project scope 同步工具。',
    ],
    render: [
      `Usage: buildr render <${SUPPORTED_AGENT_IDS.join('|')}> --target <dir> [--scope <scope>]`,
      '',
      '组合渲染 rules entry 和 workspace/project Skills；不安装产品入口 Buildr Skill。',
    ],
    'skill install': [
      `Usage: buildr skill install <${SUPPORTED_AGENT_IDS.join('|')}> --target <dir>`,
      '',
      '只安装或修复产品入口 Buildr Skill。',
    ],
    'skills add': [
      'Usage: buildr skills add [<id>] --source <skill-dir> --scope <.|projects/project> [--target <dir>] [--replace] [--ignore-unsupported]',
      'Usage: buildr skills add <id> --remote-source <url> --scope <.|projects/project> [--target <dir>] [--source-kind <kind>] [--description <text>] [--replace]',
      'Usage: buildr skills add <id> --resolved-source <url> --scope <.|projects/project> [--target <dir>] [--resolved-kind <kind>] [--remote-source <url>] [--source-kind <kind>] [--version <version>] [--integrity <hash>] [--description <text>] [--replace]',
      '',
      '维护 workspace/project Skills 源资产。',
    ],
    'skills remove': [
      'Usage: buildr skills remove <id> --scope <.|projects/project> [--target <dir>]',
      '',
      '删除 workspace/project Skills 源资产登记。',
    ],
    'skills render': [
      `Usage: buildr skills render <${SUPPORTED_AGENT_IDS.join('|')}> --scope <.|projects/project> --target <dir>`,
      '',
      '只渲染 workspace/project Skills 和 Skill install plans。',
    ],
    'commands add': [
      'Usage: buildr commands add <id> --purpose <text> [--target <dir>] [--collection <path>] [--executable <name>] [--name <text>] [--description <text>] [--version-constraint <constraint>] [--version-args <args>] [--install-hint <text>] [--replace]',
      '',
      '新增或替换命令行工具清单条目。',
    ],
    'commands remove': [
      'Usage: buildr commands remove <id> [--target <dir>] [--collection <path>]',
      '',
      '删除命令行工具清单条目。',
    ],
    'commands check': [
      'Usage: buildr commands check [--target <dir>] [--json]',
      '',
      '检查命令行工具清单和本机可用状态。',
    ],
    'openspec baseline create': [
      'Usage: buildr openspec baseline create <change> --project <project> [--target <dir>] [--adopt-current] [--update] [--json]',
      '',
      '供 Buildr OpenSpec workflow 为 active change 显式创建或更新 Requirement 契约基线。不会安装或升级外部 OpenSpec CLI。',
    ],
    'openspec check': [
      'Usage: buildr openspec check <change> --stage <proposal|pre-sync|post-sync> --project <project> [--target <dir>] [--json]',
      '',
      '供 Buildr OpenSpec workflow 检查 proposal、基线、活动 change 冲突和同步结果。',
    ],
    'component list': [
      'Usage: buildr component list [--target <dir>] [--json]',
      '',
      '列出 workspace Components。当前不支持 Project 或 Service scope。',
    ],
    'component check': [
      'Usage: buildr component check [<id>] [--target <dir>] [--json]',
      '',
      '检查 Component definition、成员 integrity 和唯一所有权。',
    ],
    'component install': [
      `Usage: buildr component install <id> --agent <${SUPPORTED_AGENT_IDS.join('|')}> [--target <dir>]`,
      '',
      '安装 workspace Component，reconcile 指定 Agent runtime，并运行 doctor。',
    ],
    'component uninstall': [
      `Usage: buildr component uninstall <id> --agent <${SUPPORTED_AGENT_IDS.join('|')}> [--target <dir>] [--reason <text>]`,
      '',
      '卸载 workspace Component 及其受管源资产；不会卸载外部 CLI，也不会删除 Project 内容。',
    ],
    'rules add': [
      'Usage: buildr rules add <id> [--path <rules/file.md>] --description <text> [--target <dir>] [--replace]',
      '',
      '注册已存在的 root Rule 文件到 rules/manifest.yml。未传 --path 时默认使用 rules/<id>.md。',
    ],
    'rules remove': [
      'Usage: buildr rules remove <id> [--target <dir>] [--keep-file]',
      '',
      '删除 root Rule 登记和规则文件。传入 --keep-file 时只取消注册并保留文件。',
    ],
    'builtin list': [
      'Usage: buildr builtin list [--target <dir>] [--json]',
      '',
      '列出 Buildr 内置能力状态。',
    ],
    'builtin uninstall': [
      'Usage: buildr builtin uninstall <id> --target <dir> [--reason <text>]',
      '',
      '卸载 optional Buildr 内置能力。required 内置能力不能卸载。',
    ],
    'builtin restore': [
      'Usage: buildr builtin restore <id> --target <dir>',
      '',
      '恢复 optional Buildr 内置能力。',
    ],
    update: [
      'Usage: buildr update [--json]',
      '',
      '根据当前命令来源更新 Buildr CLI 自身；不读取或同步 workspace。',
      '同步 workspace 请使用 buildr sync <agent> --target <dir>。',
    ],
    'update check': [
      'Usage: buildr update check [--json]',
      '',
      '检查 Buildr CLI 来源、远端版本和安全更新状态；不读取 workspace。',
    ],
    'package check': [
      'Usage: buildr package check',
      '',
      '供 Buildr 产品维护者检查产品包发布边界和基础行为；不是 workspace onboarding 必需步骤。',
    ],
    'package build': [
      'Usage: buildr package build [--out <dir>]',
      '',
      '供 Buildr 产品维护者构建产品包文件；不是 workspace onboarding 必需步骤。',
    ],
    'bootstrap guide': [
      'Usage: buildr bootstrap guide',
      '',
      '输出最小 bootstrap 指南。',
    ],
  };

  function commandTopic(rawArgs) {
    const [domain, action, runtime] = rawArgs.filter((arg) => !['--help', '-h'].includes(arg));
    if (!domain) return 'root';
    if (domain === 'version') return 'version';
    if (domain === 'project' && action === 'create') return 'project create';
    if (domain === 'service' && action === 'create') return 'service create';
    if (domain === 'runtime' && action === 'list') return 'runtime list';
    if (domain === 'mutation' && action === 'recover') return 'mutation recover';
    if (domain === 'runtime' && action === 'check') return 'runtime check';
    if (domain === 'skill' && action === 'install') return 'skill install';
    if (domain === 'skills' && ['add', 'remove'].includes(action)) return `skills ${action}`;
    if (domain === 'skills' && action === 'render') return 'skills render';
    if (domain === 'commands' && ['add', 'remove', 'check'].includes(action)) return `commands ${action}`;
    if (domain === 'openspec' && action === 'baseline' && runtime === 'create') return 'openspec baseline create';
    if (domain === 'openspec' && action === 'check') return 'openspec check';
    if (domain === 'component' && ['list', 'check', 'install', 'uninstall'].includes(action)) return `component ${action}`;
    if (domain === 'rules' && ['add', 'remove'].includes(action)) return `rules ${action}`;
    if (domain === 'builtin' && ['list', 'uninstall', 'restore'].includes(action)) return `builtin ${action}`;
    if (domain === 'update' && action === 'check') return 'update check';
    if (domain === 'update') return 'update';
    if (domain === 'package' && ['check', 'build'].includes(action)) return `package ${action}`;
    if (domain === 'bootstrap' && action === 'guide') return 'bootstrap guide';
    if (domain === 'render') return 'render';
    if (domain === 'sync') return 'sync';
    if (domain === 'doctor') return 'doctor';
    if (domain === 'init') return 'init';
    if (domain === 'rules' && action === 'render') {
      return 'rules render';
    }
    return null;
  }

  HELP_TOPICS['rules render'] = [
    `Usage: buildr rules render <${RULES_RENDER_AGENT_IDS.join('|')}> --scope <.|projects/project[/services/service[/path...]]> --target <dir>`,
    '',
    '递归发现 canonical workspace scope 的祖先链和子树，并按 adapter reconcile rules bridge 或 vendor rule files。原生消费 AGENTS.md 的 adapter 不执行 rules render。',
  ];

  function printHelp(rawArgs) {
    const topic = commandTopic(rawArgs);
    if (!topic) return false;
    const lines = HELP_TOPICS[topic];
    console.log(lines.join('\n'));
    return true;
  }

  function isHelpRequest(rawArgs) {
    return rawArgs.length === 0 || rawArgs.some((arg) => arg === '--help' || arg === '-h') || rawArgs[0] === 'help';
  }

  Object.assign(runtime, { usage, commandTopic, printHelp, isHelpRequest });
  return runtime;
}

## Why

Buildr 已经能管理规则、项目、服务、OpenSpec、practices、技能和运行环境投射关系，但团队使用的外部命令行工具仍依赖口头说明或个人机器状态，Agent 难以稳定发现、检查和解释差异。

本变更明确规则、技能、命令行工具三类 Agent 直接工作资产的边界分工：规则表达必须遵守的约束，技能表达任务执行方法，命令行工具清单表达当前作用域期望具备的外部命令能力。三者都应先维护在 Buildr 源资产中，但本变更不新增统一工具型资产管理入口。

## What Changes

- 新增命令行工具清单入口：在 Buildr 工作区中记录团队期望使用的外部命令行工具、可执行命令、用途、可选版本约束、结构化版本检查参数，以及最小安装提示或官方链接。
- 新增命令行工具清单检查能力：提供 `buildr commands check --target <dir> --json` 或等价诊断入口，检查本机是否满足工作区清单声明。
- 修改 doctor：聚合命令行工具清单检查结果；命令缺失、版本不满足或版本无法判断时输出警示和差异说明，但不使工作区诊断整体失败。只有清单不可解析、字段非法等源资产问题才视为错误。
- 修改默认工作区规则：用简练强规则要求涉及规则、技能、命令行工具的可复用变更先使用 Buildr 技能，并先维护到 Buildr 源资产，再同步到 Agent 运行环境或本机。
- 修改 Buildr 技能：引导 Agent 在用户要求维护规则、技能或命令行工具时优先操作 Buildr 源资产，并在状态变化后运行 doctor 或对应检查。
- 明确后续源资产维护命令边界：`rules add/remove`、`skills add/remove`、`commands add/remove/check` 面向 Buildr 工作区源资产维护或差异检查；`rules render` 和 `skills render` 继续面向 Agent 运行环境投射；`skill install` 保留为 Buildr 产品内置技能安装入口；暂不新增 `rules check` 或 `skills check`，规则和技能同步状态由现有运行环境检查和 doctor 聚合提示承担。
- 修改 package baseline：默认初始化命令行工具清单入口；当前不随包声明任何默认外部命令行工具，清单为空。未来是否包含默认声明取决于 Buildr 是否随包提供对应内置能力。
- 版本检查使用结构化可执行文件与参数模型，Buildr 不执行清单中的任意 shell 字符串。
- 技能可以在正文中引用命令行工具清单中的工具，但本次不维护依赖图或反向索引。
- 本次 MVP 先提供根级命令行工具清单、检查和 doctor 聚合；project/service 级命令行工具清单、同 `id` 整项覆盖、来源链和权限控制作为后续路线项，不在本变更中实现。

## Non-Goals

- 不新增统一工具型资产管理入口，例如 `assets resolve` 或等价命令。
- 不实现 project/service 级命令行工具清单解析、叠加或覆盖。
- 不实现命令行工具安装，也不维护平台化安装方案。
- 不实现 `commands render`。
- 不维护技能到命令行工具的依赖图或反向索引。
- 不保存或检查 token、cookie、登录态、个人认证状态或个人私有配置。
- 不在本变更中实现工具型资产权限控制系统。

## Capabilities

### New Capabilities

- `command-line-tool-assets`: 管理工作区中的命令行工具清单、检查行为和 Buildr 不接管个人机器的边界。

### Modified Capabilities

- `root-organization-workspace`: 默认工作区规则需要加入简练的工具型资产维护规则。
- `product-agent-skills`: Buildr 技能需要引导 Agent 维护规则、技能和命令行工具清单。
- `agent-readable-doctor`: doctor 需要聚合命令行工具清单检查结果，输出 Agent-readable 状态。
- `buildr-package-assets`: package baseline 需要支持初始化命令行工具清单入口。
- `agent-first-onboarding`: onboarding 需要引导 Agent 安装 Buildr 技能，并根据规则、技能、命令行工具清单检查继续协作。

## Impact

- 影响默认工作区 `AGENTS.md` 随包源和 Buildr 技能内容。
- 影响 Buildr CLI：新增命令行工具清单解析、检查和 doctor 集成，并明确后续规则、技能、命令行工具源资产维护命令的命名边界。
- 影响 package manifest 与 package check：需要校验默认命令行工具清单入口。
- 影响产品 roadmap：记录三层作用域、覆盖语义、来源链、权限控制、技能引用命令行工具等后续方向；这些方向不属于本次 MVP 实现范围。
- 不影响现有 rules render、skills render、service create 的已有语义。
- 不包含破坏性变更；命令行工具差异只作为警示输出，不改变既有规则渲染、技能渲染和运行环境检查语义。

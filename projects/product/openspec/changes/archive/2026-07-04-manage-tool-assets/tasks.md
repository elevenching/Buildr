## 1. 默认资产与规则

- [x] 1.1 更新默认 workspace 规则随包源，加入简练的 Buildr 工具型资产路由规则：涉及规则、技能、命令行工具时先使用 Buildr 技能。
- [x] 1.2 更新 package manifest 和默认 baseline，初始化空的 `commands/manifest.yml` 入口。
- [x] 1.3 更新产品 README 或相关产品文档，说明 Buildr 管团队资产，不接管个人机器。
- [x] 1.4 更新产品 roadmap，记录三层作用域、整项覆盖、来源链、权限控制和源资产维护命令等后续方向。

## 2. 命令行工具清单检查

- [x] 2.1 实现命令行工具清单读取和 schema 校验。
- [x] 2.2 实现 executable 存在性检查。
- [x] 2.3 实现结构化版本检查：使用 executable 加参数数组，不执行任意 shell 字符串。
- [x] 2.4 实现版本约束判断和默认版本输出解析；解析失败输出 warning，不视为源资产 error。
- [x] 2.5 实现 `ok` / `warning` / `error` 状态分层：清单非法为 error，本机命令缺失、版本不满足或版本无法判断为 warning。
- [x] 2.6 实现缺失或版本不满足时的 Agent-readable 差异说明，并从清单读取最小安装提示或官方链接。
- [x] 2.7 新增 `buildr commands check --target <dir> --json` 或等价检查入口。
- [x] 2.8 确认不提供 `commands render` 或 `commands install`。

## 3. Doctor 与 Agent 引导

- [x] 3.1 将命令行工具清单检查结果接入 `buildr doctor --json`，本机差异只警示不阻断，清单错误才作为 error。
- [x] 3.2 更新 Buildr 技能，引导 Agent 识别规则、技能、命令行工具维护任务，并先维护 Buildr workspace 源资产。
- [x] 3.3 更新 Buildr 技能，明确 `skill install` 只安装产品内置技能，workspace/project 技能是 `skills/manifest.yml` 和 `skills/<skill-id>/` 目录。
- [x] 3.4 更新 bootstrap guide，作为 Buildr 技能不可用时的兜底说明，并覆盖三类资产维护路径。
- [x] 3.5 更新 onboarding contract 或等价校验，覆盖工具型资产维护主流程。

## 4. 源资产维护命令后续方向

- [x] 4.1 在 roadmap 中保留 `rules add/remove`、`skills add/remove`、`commands add/remove/check` 的后续方向。
- [x] 4.2 明确本变更不新增 `rules check` 或 `skills check`；规则和技能同步状态由 runtime check、render 和 doctor 聚合提示承担。
- [x] 4.3 明确本变更不实现 project/service 级命令行工具清单解析、叠加、整项覆盖、来源链或权限控制。

## 5. 验证

- [x] 5.1 增加命令行工具清单、check 和 doctor JSON 的单元或集成验证。
- [x] 5.2 更新 package check，验证默认命令行工具清单入口可初始化且不包含私有内容。
- [x] 5.3 更新产品 MVP 验证脚本，覆盖初始化后 commands manifest、doctor、无 `commands render`、无 `commands install` 行为。
- [x] 5.4 运行 `openspec validate --all --strict`、`buildr package check` 和产品 MVP 验证脚本。

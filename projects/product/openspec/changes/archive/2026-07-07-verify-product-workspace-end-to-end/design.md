## Decisions

### 临时 workspace 验收是产品级主验证

产品级验收必须从临时目录创建真实 Buildr workspace，而不是只检查静态文件或 isolated CLI 子命令。该验收至少覆盖：

- Workspace：`init`、baseline 文件、doctor。
- Project：`project create`、project registry、project repo。
- Service：`service create`、service metadata、嵌套 repo 和 Git 忽略。
- Rules：源资产编辑边界、rules render、runtime bridge。
- Commands：`commands add/remove/check`、doctor 聚合、安装授权边界。
- Skills：本地作者型、远端信息源、已解析远端源、render、remove。
- Runtime：Buildr Skill install、workspace/project Skills render、runtime check 细查、doctor 聚合。

### 验证必须跟随 Buildr Skill

Buildr Skill 是 Agent 操作 workspace 的入口，因此验证脚本不应只证明底层命令能跑通，还要证明 Skill 写给 Agent 的主路径能跑通。

验证应检查安装后的 Buildr Skill 内容至少包含七类资产章节、doctor-first 入口、runtime 非源资产边界，以及 Buildr 产品内置 Skill 与 workspace/project Skills 的区别。

### 提供统一产品验收入口

保留已有底层验证命令，同时提供一个单一入口给产品仓规则引用。该入口顺序执行：

1. `./buildr package check`
2. 临时 workspace 端到端验收
3. `openspec validate --all --strict`

实现可以新增 `tools/verify-buildr-product`，也可以让既有脚本提供等价模式；根 `AGENTS.md` 应指向统一入口，并保留底层命令作为分解说明。

## Non-goals

- 不把所有 OpenSpec、package check 或 npm packaging 逻辑塞进 `doctor`。
- 不移除现有专项检查命令。
- 不新增 workspace 功能。

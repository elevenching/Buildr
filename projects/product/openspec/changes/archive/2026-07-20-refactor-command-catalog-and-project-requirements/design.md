## Context

Buildr 当前通过 workspace `commands/manifest.yml` 和嵌套 collections 声明外部 CLI，递归检查相同 ID 冲突、binary 存在性和版本。这个模型能表达组织工具 catalog，却不能表达“哪个 Project 在当前任务中需要哪个工具”：Project A 与 Project B 的要求会被当成同一 workspace 环境事实，版本约束也无法按单 Project或跨 Project task context 解析。

Commands 与 Skills 相似之处是 source definition 和业务适用性必须分开；不同之处是 Commands 不被 Buildr render 或 install。实际 binary、版本、登录态和凭证属于 user/machine environment，Buildr 只读取可公开诊断事实。

## Goals / Non-Goals

**Goals:**

- 建立 workspace Command catalog、Project requirements、machine observation 三层模型。
- 让单 Project 和跨 Project task context 得到确定性的有效要求与冲突结论。
- 保持 Component ownership、transaction、doctor 和 Agent-readable JSON 的一致性。
- 为现有 workspace-only Commands 提供无损兼容和显式迁移路径。

**Non-Goals:**

- 不自动安装、升级或卸载任何外部 CLI。
- 不保存 token、cookie、登录态、license 或个人私有配置。
- 首版不增加 Service 独立 requirements 文件；Project requirement 可预留 applicability，但不据此发明 Service 安装层。
- 不把 Commands 投射到 Agent runtime，也不复用 Skill destination/receipt 模型。

## Decisions

### 1. Workspace catalog 保存定义，Project `commands.yml` 保存引用

workspace `commands/**/manifest.yml` 继续保存 Command definition：稳定 `id`、`executable`、用途、版本探测和安装提示。新增 `projects/<project>/commands.yml`，schema 为 `buildr.project-commands/v1`，只保存 `requirements`：Command ID、`required`、可选版本约束和说明。

选择独立 `commands.yml`，而不是扩展 `capabilities.yml`，因为 capability binding 是 Skill provider selection，Command requirement 是本机环境前置条件；两者诊断和生命周期不同。

### 2. 版本约束属于 requirement，版本 probe 属于 catalog

catalog 决定“如何识别工具和读取版本”；Project requirement 决定“当前业务接受什么版本”。workspace catalog 可以保留 default requirement，兼容现有直接声明 version constraint 的输入，但 canonical 写入会逐步分离 definition 与 requirement。

同 ID 不同 executable、version args 或解析规则是 catalog identity conflict。多个 requirements 的约束有交集时合并；无交集时在跨 Project context 报 `command_requirement_conflict`，不得选择更具体 Project 或数组顺序。

### 3. `commands check` 显式接受 context

`commands check --project <id>` 检查单 Project；重复 `--project` 或等价稳定参数表达跨 Project context；无 Project 参数时只校验 catalog 完整性和 workspace default requirements，不把所有 Project requirements 当作全局必需。

doctor 根据当前 `--scope` 解析 Project context；root doctor 校验所有 Project requirement 引用与 schema，但不把每个 Project 的本机缺失汇总成 root readiness error。缺失 binary、版本不满足或无法解析继续是 machine warning；无效引用、catalog 冲突和跨 Project不兼容是 source/context error。

### 4. Project create 生成空 requirement 文件

新 Project baseline 创建 `commands.yml`，内容为 schema 与空 `requirements`。旧 Project 缺失该文件在迁移期视为等价空集并给出可修复 info/warning；`buildr sync` 或显式 Project migration 可以安全补齐，不能因此猜测 requirements。

### 5. Component 只拥有 catalog collection

Component definition 可以继续拥有 `commands/<collection>/manifest.yml`，但不能拥有 `projects/<project>/commands.yml`，也不能声明或修改本机安装状态。Component 卸载删除 catalog definition 前必须检测仍被 Project requirements 引用并阻断或要求先解除引用。

### 6. JSON 输出按 definition、requirement、observation 分层

每个有效检查项输出 catalog provenance、Project requirement provenance、合并约束、machine observation 和最终 status/reason。这样 Agent 可以区分“源配置错”“跨 Project要求冲突”和“本机没安装”，不会把 warning 当作资产冲突。

## Risks / Trade-offs

- [新增 Project 文件增加模板和 doctor 复杂度] → 使用小型独立 schema、空集默认值和统一 parser，不把它塞进 Skill capability graph。
- [现有 version 字段同时承担定义与要求] → 保留读取兼容，canonical add/update 提供明确 default requirement 语义并输出迁移提示。
- [root doctor 不检查所有 binary 可能降低可见性] → root doctor仍校验全部 source/reference integrity；用户可用显式 `commands check --all-projects` 获取环境盘点，但该模式不代表单任务 readiness。
- [跨 Project constraint 求交实现复杂] → 首版限定现有支持的版本约束语法，并输出每个来源；无法证明兼容时 fail closed。
- [Component 升级删除仍被引用定义] → 在 source transaction 前执行反向引用预检，保持零写入。

## Migration Plan

1. 增加 Project Commands schema/parser 和空 baseline，不改变现有 catalog 读取。
2. 扩展 Project create、registry diagnostics 和 doctor，旧 Project 缺文件按空集兼容。
3. 实现 requirement resolution、版本约束求交与分层 JSON。
4. 扩展 `commands check` context 参数，并保持旧无参数调用检查 workspace defaults。
5. 增加 Component 反向引用保护和 package fixtures。
6. 更新 docs、Buildr Skill 和验证；在候选门禁通过后发布 migration guidance。

回滚时可忽略新 `commands.yml` 文件并恢复旧聚合检查；文件只含引用，不包含 binary 或凭证，因此不会丢失本机状态。

## Open Questions

- `--all-projects` 是否应在首版公开，还是只由 doctor 的诊断详情提供；实现前根据 CLI surface 一致性决定。
- workspace default requirement 是否沿用现有 manifest version 字段，或在 v2 catalog 中拆为独立 `requirements` 段；实现前通过 fixtures 确认最小兼容成本。

## Context

Buildr 当前已经有静态 adapter registry、五项 required capabilities、不可变 runtime context、声明式 RuntimePlan 和通用 reconcile core。问题集中在 descriptor 与消费端：`projection`、`skillsRoot`、`implementation` 等字段仍以 runtime-specific 方式组合，Rules planning 和 checker registry 仍认识 `codex`、`claude-code`，新增 Agent 需要同时修改多个分支和 allowlist。

本 change 先完成 adapter 内部接入模型，不新增第三方 adapter。后续调研只需要回答 trait composer 无法从 Buildr 自身推导的目标 Agent事实。

## Goals / Non-Goals

**Goals:**

- 用受约束 traits 组合静态 adapter descriptor。
- 让 Rules、Skills、surface、activation 和 checker 事实位于同一 descriptor。
- 让通用 planning、check、doctor 和 discovery 通过 trait implementation registry 工作，不按 runtime id 分支。
- 从 traits 派生 capability metadata 和接入调查字段，降低新增 adapter 的重复工作。
- 保持 `codex`、`claude-code` 的 runtime 文件和公开命令兼容。

**Non-Goals:**

- 不在本 change 中新增 Cursor、TRAE、Qoder 或其他 adapter。
- 不允许 workspace Component、外部包或用户配置动态注册 adapter。
- 不实现任意第三方 Rules 格式的通用模板语言。
- 不要求本次迁移立即执行外部 Agent binary 的安装或版本探测；只建立安全的 checker probe contract，现有 adapter 可以显式声明不执行环境 probe。
- 不把产品宣传或“兼容某 Agent”作为 capability evidence。

## Decisions

### 1. Descriptor 使用五组 traits

具体 adapter 通过 `createRuntimeAdapterDescriptor` 声明：

```js
{
  id,
  displayName,
  traits: {
    rules: { kind, implementation, ...parameters },
    skills: { kind, root, ...parameters },
    surfaces: [{ kind, variant }],
    activation: { rules, skills, reloadCommand },
    checker: { kind, installationProbe, versionProbe }
  },
  recommendedCommands
}
```

trait catalog 的稳定分类为：

- Rules：`native-recursive`、`native-root`、`reference-bridge`、`vendor-rule-files`。
- Skills：`agents-compatible`、`vendor-root`。
- Surface：`ide`、`cli`、`desktop`、`cloud`。
- Activation：`immediate`、`path-read`、`session-start`、`explicit-reload`。
- Checker：`projection`，并可声明 `none`、`command` 或 `manual` environment probe。

Rules `kind` 描述目标 Agent 的消费模型，`implementation` 选择 Buildr 随产品发布的纯 planning primitive。`native-root` 本身不自动满足 Buildr 的递归 scope 语义；如果它不能覆盖嵌套 Rules，composer 必须要求另一个完整 projection implementation，不能把部分支持认证为 `rules-entry`。

选择这一结构而不是继续添加扁平字段，是为了让调研结果能直接映射到 descriptor，并由 validation 检查字段组合。没有选择“每个 Agent 一个自由对象”，因为自由对象会把同样的分支迁回各 adapter。

### 2. Trait 是声明数据，implementation registry 是静态代码

trait 不执行文件系统副作用。Rules planner、Skills layout 和 checker 通过 Buildr 内置 registry 按 implementation id 解析，registry key 表示 primitive，不表示 runtime id。

`reference-bridge`、`vendor-rule-files` 可以需要 runtime-specific 参数或静态 planner，但这些实现必须随 Buildr 发布并通过 RuntimePlan validator。Buildr 不加载 descriptor 指向的任意模块或 workspace 代码。

选择静态 registry 是为了保留当前安全边界。没有采用 plugin/component 动态扩展，因为 adapter 能写 runtime 文件，不能绕过 Buildr 的 ownership、路径和零写入预检。

### 3. Capability metadata 由 composer 派生

composer 根据 traits 生成：

- `renderCapabilities`；
- `runtimeTargets`；
- Rules discovery/projection metadata；
- Skills root 和 install-plan root；
- checker 支持的状态；
- RuntimePlan capability evidence。

具体 adapter 不再复制这些派生字段。validation 同时检查：

- trait 值属于 catalog；
- 必需参数齐全；
- implementation 已注册；
- Rules kind 与 planner 能完整覆盖 scope；
- Skills root 是安全的 workspace-relative 目录；
- 五项 required capabilities 全部可由组合结果认证；
- runtime targets 唯一且与 traits 一致。

这样可以减少 metadata 与实现漂移。仍保留每个 adapter 独立 id、descriptor 和 contract tests，生成 capability evidence 时使用具体 adapter id。

### 4. Checker 分为 projection state 与 environment probe

`projection` checker 继续从同一个 RuntimePlan compare-only 得到 missing、stale、conflict 和 repair commands。activation trait 决定成功写入后是否需要提示 reload 或 new session。

安装与版本探测是可选 environment probe：

- `none`：Buildr 不声称检查了产品安装或版本；
- `command`：只允许静态 descriptor 声明的 executable/args，通过无 shell、有限超时的执行器探测；
- `manual`：checker 返回需要人工确认的 Agent-readable 状态。

现有 adapter 迁移默认保持既有 projection check 行为，不因为本次重构新增外部命令调用。未来 adapter 若依赖最低版本，必须声明可执行 probe 或明确的 manual check，不能静默视为已验证。

### 5. `runtime list --json` 暴露组合后的 traits

JSON discovery 增加 trait catalog，并在每个 adapter 中输出可序列化 traits。Agent 可以据此知道 Buildr 已支持哪些组合原语、当前 adapter 如何激活，以及 checker 能证明什么。

人类可读输出保持现有命令摘要，不增加长篇 trait 说明。完整 CLI schema 仍由 help 和产品文档负责。

### 6. 调研 Prompt 直接产出 adapter intake

实现完成后，把现有长问卷压缩为与 descriptor 对齐的 intake：

1. identity、surface 和最低版本；
2. Rules kind、入口、scope、引用格式和 activation；
3. Skills kind、root、冲突优先级和 activation；
4. checker 的安装/版本 probe；
5. 五项 capability 的最小黑盒证据。

Buildr 已知的 RuntimePlan、ownership、orphan cleanup、OpenSpec 和内部文件列表不再询问目标 Agent。目标 Agent 只回答自己的 runtime 事实。

## Risks / Trade-offs

- [Risk] trait 抽象过度，仍需为特殊 Agent 写大量例外 → `implementation` 允许受控的静态 primitive，trait 只统一分类、参数和验证，不设计任意模板 DSL。
- [Risk] composer 派生 metadata 后改变现有 JSON 或诊断 → 为 `codex`、`claude-code` 保留 parity fixtures，比较 targets、content、findings、repairs 和 no-op 结果。
- [Risk] `native-root` 被误认为完整 scoped Rules 支持 → validation 要求 planner 明确证明嵌套 scope，否则拒绝注册为 supported。
- [Risk] 外部版本命令拖慢或污染 doctor → 本 change 不为现有 adapter 启用 probe；未来 command probe 必须无 shell、有限超时且只读。
- [Risk] surface/activation 信息随产品版本漂移 → descriptor 记录最低版本和 evidence，真实 compatibility smoke test 仍按 adapter 独立维护。
- [Trade-off] static registry 不能让第三方零代码安装 adapter → 保留安全性和可验证发布边界；第三方先提交证据和 Buildr change。

## Migration Plan

1. 引入 trait catalog、composer、validation 和 primitive implementation registry，同时保留现有 descriptor 输出用于 parity 比较。
2. 将 `codex`、`claude-code` 改为 composer 输入，保持现有 runtime targets 和命令。
3. 将 Rules planning、Skills target、runtime check、doctor 和 CLI discovery 切换到组合后 descriptor，删除 runtime id allowlist/分支。
4. 用 fake adapters 验证 shared trait 复用、非法组合拒绝和 registry 隔离。
5. 完成兼容与临时 workspace 验证后，简化 adapter 接入指南和调研 Prompt。

如迁移验证失败，回滚 composer 消费端并保留原 descriptor；本 change 不迁移用户源资产，也不需要数据回滚。

## Open Questions

无。具体第三方 Agent 的 surface、activation、最低版本和 vendor paths 在后续独立 adapter change 中通过精简 intake 收集。

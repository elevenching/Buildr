## Context

Buildr 当前通过 `rules/manifest.yml`、`skills/manifest.yml` 和单一 `commands/manifest.yml` 分别管理资产，产品 Builtins 也按单项 Rule、Skill、Command 同步。OpenSpec 实际是一组配套的 CLI 与 workflow Skills，但当前仅以多个独立 Skills 发布，CLI 没有随包 Command 声明，安装、升级和卸载无法保持集合一致。

现有 Builtin 更新只比较当前 package 源和 workspace 内容，无法区分“旧版但未修改”和“用户真实修改”。同时，Agent 才能理解用户口中的“安装某个东西”会涉及哪些资源；CLI 不适合搜索、阅读外部说明并猜测组合关系。

本设计只建立 workspace 级 Component。Project/Service Component、远程 registry 和可执行 Plugin 留给 Buildr 演进为更完整软件系统后处理。

## Goals / Non-Goals

**Goals:**

- 为 workspace 提供可组合 Rules、Skills 和 Command collections 的 Component 源资产与确定性 CLI。
- 让用户明确要求的单项资产也能作为 Component 管理，让跨资产类型资源必须通过 Component 形成统一生命周期。
- 让 Buildr Skill 负责安装对象分析和路由，CLI 负责校验、物化、冲突保护和诊断。
- 让 Component 安装、更新和卸载具备集合级预检，并在完成源资产变更后 reconcile Agent runtime。
- 以 OpenSpec 作为第一个随包 Component，并安全迁移已有独立 Builtins。
- 将 Commands 扩展为易阅读、可独立拥有的 `commands/**/manifest.yml` collections。

**Non-Goals:**

- 不支持 Project 或 Service 级 Component。
- 不自动安装、升级或卸载本机外部 CLI，也不管理认证状态。
- 不实现远程 Component registry、依赖求解、签名、权限系统、任意脚本或 Hook。
- 不让 Component 安装或卸载创建、修改、删除 Project 中的 OpenSpec 目录或内容。
- 不在本 change 实现 OpenSpec 契约漂移门禁。

## Decisions

### 1. Component 是 workspace 源资产和生命周期边界

workspace 使用以下结构：

```text
components/
  manifest.yml
  buildr/
    openspec/
      component.yml
commands/
  manifest.yml
  buildr/
    openspec/
      manifest.yml
skills/
  manifest.yml
  buildr/
    openspec-*/
```

`components/manifest.yml` 使用 `buildr.components/v1`，保存 Component 的 `id`、`source`、`path`、`enabled`、`required`、`state` 和可选 `reason`。`component.yml` 使用 `buildr.component/v1`，保存稳定 id、kind、version、来源、成员路径和成员 integrity。

Component 只支持 workspace scope。Root/Project/Service 资产层级不因本 change 扩张。

备选方案是只在 package manifest 中保存 Component 定义。该方案使用户 workspace 无法独立审计上次安装版本，也无法进行三方比较，因此拒绝。

### 2. 已安装 component.yml 同时作为版本回执

不新增独立 lockfile。更新时比较：

```text
Old  = workspace 已安装 component.yml 及其成员 integrity
Live = workspace 当前成员内容
New  = 当前 package Component 定义及其成员内容
```

- `Live = Old` 时可以安全应用 New。
- `Live = New` 时只需收敛 Component 定义和状态。
- `Live` 同时不同于 Old 和 New 时视为用户修改，更新停止。
- 新成员目标无冲突时可以新增；移除的旧成员只有在仍匹配 Old 时才能删除。

Component 定义必须在成员源资产全部成功物化后最后写入，作为本次源资产更新完成的回执。runtime 是可重建结果；runtime reconcile 失败不回滚已经安全提交的源资产，但命令必须失败并给出修复命令和 doctor 状态。

备选方案是继续把目标与当前 package 直接 diff。该方案会把正常版本升级误判为本地修改，因此拒绝。

### 3. Component 成员由定义文件唯一声明

`component.yml` 是成员关系和所有权的唯一事实来源。Rules、Skills 和 Commands 条目不重复增加 `component` 字段。

同一个受管资产只能属于一个已安装 Component。普通资产维护命令在删除或替换资产前必须检查 Component 所有权；命中受管成员时拒绝并指向 Component 生命周期命令。需要独立启停的资源应拆成另一个 Component，而不是形成成员级 override。

源资产更新采用 Component 级预检：任一成员存在冲突或未确认修改时，不写入该 Component 的任何源资产。

### 4. Commands 使用集合式 manifest

`commands/manifest.yml` 保持默认 workspace collection；Buildr 同时递归发现 `commands/**/manifest.yml`。每个文件独立使用 `buildr.commands/v1`，不引入额外总索引。

`commands check`、doctor 和 Component 校验聚合全部 collection，并保留每个条目的来源 manifest。相同 id 且标准化声明一致时合并检查；相同 id 但 executable、purpose、version 或其他有效字段冲突时报告 error，不静默覆盖。

Component 拥有完整的嵌套 Command collection，例如 `commands/buildr/openspec/manifest.yml`，而不是占用用户默认 collection。卸载时只删除受管 collection；外部 binary 和本机配置不受影响。

普通 `commands add/remove` 默认操作根 collection，并通过 `--collection <relative-path>` 选择嵌套 collection。路径必须保持在 `commands/` 内，Component-owned collection 不能通过普通 Commands 命令修改。

### 5. Agent 判断组合，CLI 确定性执行

Buildr Skill 使用以下路由：

- 用户明确要求“作为 Component 安装”时，无论成员数量都进入 Component 流程。
- 用户明确要求单项 Rule、Skill 或 Command 时使用相应资产维护入口。
- 用户只说“安装 X”时，Agent先读取权威来源并列出资源；跨资产类型或需要统一版本、更新、卸载时创建或选择 Component。
- 无法确认组成时向用户说明未知点，不让 CLI 猜测。

卸载使用独立的确认路由：

- 用户只说“卸载 X”时，Agent先查询 Component registry 和 `component check`，确认 X 是否为 Component 或 Component-owned 成员。
- 如果 X 是 Component，Agent必须在写入前展示 Component id、source、version、workspace scope、将删除的 Rules、Skills、Command collections 和当前 Agent runtime 投射。
- 卸载摘要必须同时说明不会卸载本机外部 CLI，也不会删除 Project 中已有内容。
- 只有用户针对该范围再次明确确认后，Agent才能调用 `component uninstall`；用户拒绝或改变范围时不得产生任何变更。
- 如果 X 不是 Component，Agent回到对应单项资产的卸载协议，不把它擅自包装为 Component。

Component 可以来自 Buildr 随包定义，也可以由 Agent 在 workspace 中创建完整本地定义后安装。CLI 不负责联网发现、解析任意网页或推断产品边界。

### 6. Component CLI 提供高层闭环

首版命令面：

```text
buildr component list [--target <dir>] [--json]
buildr component check [<id>] [--target <dir>] [--json]
buildr component install <id> --agent <agent> --target <dir>
buildr component uninstall <id> --agent <agent> --target <dir> [--reason <text>]
```

install/uninstall 要求已初始化 workspace 和受支持 Agent。两者先完成源资产预检和物化，再通过指定 adapter reconcile runtime，最后运行 `doctor --agent <agent> --json`。仍有 error 时命令不得报告完成。

`buildr update` 只更新启用的 Buildr-managed Components 和其他产品源资产，不直接渲染 runtime；`buildr sync <agent>` 继续承担产品更新与 runtime 同步主路径。

### 7. OpenSpec 是首个随包 Component

OpenSpec Component 定义和 Command collection 位于：

```text
package/targets/workspace/components/buildr/openspec/component.yml
package/targets/workspace/commands/buildr/openspec/manifest.yml
```

成员包括 `openspec` Command 声明和全部随包 `openspec-*` workflow Skills。Component 记录上游名称、版本、来源和成员 integrity；package check 校验 Skill `generatedBy` 与声明的上游版本一致。

OpenSpec Component 不拥有 `projects/*/openspec/`。当前 Project baseline 行为保持不变，后续是否按需初始化 OpenSpec 由独立 change 决定。

## Risks / Trade-offs

- [Risk] Component 与 Builtin 两套命令让用户困惑。→ Buildr Skill 明确 Builtin 是单项产品能力，Component 是统一生命周期集合；Component-owned 成员的单项操作直接拒绝并给出唯一下一步。
- [Risk] 递归 Commands collections 产生重复 id。→ 聚合时保留来源，完全一致才合并，任何有效声明冲突均作为 error。
- [Risk] Component 源资产提交成功但 runtime reconcile 失败。→ 源资产保持为事实源，命令返回失败并提供 adapter 修复命令；doctor 不得报告完成。
- [Risk] 用户修改 Buildr-managed OpenSpec Skill 后升级被阻塞。→ 三方比较保护修改，并提供还原、迁移为 workspace-owned Component 或保留旧版本的决策信息。
- [Risk] 本地 Agent 创建的 Component 定义不完整。→ CLI 校验 schema、路径、成员存在性、唯一所有权和 integrity，任何失败均在写入前终止。
- [Trade-off] V1 只有 workspace scope，不能为不同 Project 选择不同 Component。→ 保持模型和迁移可控，未来软件化后再设计多 scope、依赖与权限。

## Migration Plan

1. 初始化 baseline 增加 `components/manifest.yml` 和 `components/`，保留现有根 `commands/manifest.yml`。
2. package manifest 声明 OpenSpec Component、嵌套 Command collection 和成员源；移除 OpenSpec Skills 在 baseline 文件映射中的重复声明。
3. 已有 workspace 的全部 OpenSpec Skills 与当前 package 一致时，update 原位登记 OpenSpec Component、写入 Command collection 和 installed definition，不重复复制 runtime。
4. 任一旧 OpenSpec Skill 为 `modified`、`missing` 或 `uninstalled` 时，迁移停止并报告集合级用户决策，不静默恢复或覆盖。
5. 迁移完成后，单项 `builtin uninstall/restore`、`skills remove` 和 `commands remove` 对 OpenSpec 成员改为拒绝并引导 Component 命令。
6. 使用临时 workspace E2E 验证新初始化、原位采用、冲突阻塞、安装、卸载、update、sync、Commands 聚合和两个 runtime adapter。

回滚到旧 Buildr 时，旧 CLI 会忽略 `components/` 和嵌套 Command collection，但现有 Skills manifest 条目仍可被旧 runtime renderer 使用。回滚前不得删除 OpenSpec Skills 条目；如需完全回退，使用旧 package 显式恢复原 Builtins 状态。

## Open Questions

无。远程来源、Component 依赖、Project/Service scope 和可执行 Plugin 均明确留待后续 change。

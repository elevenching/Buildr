## Context

Buildr 当前已经让 `task-cockpit` 页面采用 `changes`、`batches`、`dependencyPool`、业务/技术方案和已完成技术细节等任务看板模型，但产品仍以“任务驾驶舱（任务看板）”双名称发布。canonical Skill id、runtime path、Project knowledge 目录、模板名、OpenSpec capability 和验证入口仍是 `task-cockpit`，用户认知与产品身份没有真正收敛。

本次变更涉及两种不同所有权的资产：Buildr package 管理的 builtin Skill，以及用户 Project 中已经存在的任务 HTML。前者应由 Buildr sync 的受管资产事务迁移；后者是历史任务产物，不属于产品能力升级迁移范围。package sync 和 Agent 都不能因本次改名扫描、转换或改写既有 Project knowledge 页面。

当前 `task-cockpit` 没有 capability contract，`task-triage` 和产品入口通过 Skill identity 与 description 路由。改名必须同时验证新入口可发现、旧用户措辞仍能命中新入口，并避免旧、新 Skill 同时存在造成触发歧义。

## Goals / Non-Goals

**Goals:**

- 让“任务看板”成为唯一当前产品名称，并以 `task-board` 作为 canonical Skill identity。
- 由 Agent 执行迁移；用户只确认迁移范围，并在无法无歧义处理时提供判断。
- 安全迁移 Buildr-managed builtin 的 identity、安装状态、源目录、runtime projection 和 receipt。
- 保持旧 `task-cockpits/*.html` 的原文件、原路径和原内容不变，新任务使用 `task-boards/`。
- 保持只读、Agent 单向维护、完整任务边界和权威事实来源边界不变。
- 保留 archive 和历史交付记录的原始术语。

**Non-Goals:**

- 不把任务看板改成可拖拽、可勾选回写或多人实时协作的 Kanban。
- 不让 `buildr update`、`buildr sync` 或 `task-board` Skill 因产品改名扫描并改写 Project knowledge 历史页面。
- 不为 `task-board` 新增 capability contract；当前没有 consumer 依赖其稳定结果协议。
- 不批量重写 OpenSpec archive、Git 历史或外部文档中的历史名称。
- 不要求用户运行 Skill/runtime 迁移命令、移动文件或编辑 JSON/HTML。

## Decisions

### 1. 当前产品只有“任务看板”，旧名称只用于兼容识别

新 Skill、metadata、模板、文档、current-state knowledge、canonical specs、测试和 Agent 回复统一使用“任务看板”。`task-board` 的 description 仍识别用户说“任务驾驶舱”的旧意图，但 Agent 的回复和新产物必须使用当前名称。

相比长期保留“任务驾驶舱（任务看板）”，该方案消除双重心智；相比立即拒绝旧名称，它保留自然语言兼容而不暴露第二个产品入口。

### 2. 用 package replacement 声明迁移 Buildr-managed Skill identity

Product package 为 `task-board` 声明它替代 `task-cockpit`。sync 的只读 preflight 同时检查旧 builtin manifest entry、源目录、安装回执、runtime projection 和目标 identity：

- 旧状态为 `installed` 且 live 内容可证明是官方版本：在同一 source mutation 中删除旧受管源、登记并物化 `task-board`；同一次 sync 随后清理匹配 receipt 的旧 runtime、投射新 runtime 并运行最终 doctor。
- 旧状态为 `uninstalled`：把显式 opt-out 迁移到 `task-board`，不得因改名重新安装。
- 旧状态为 `modified`、`missing`、目标已存在、目录含未知文件或 receipt 无法证明 ownership：preflight 零写入停止，由 Agent说明冲突并请求用户判断。
- 新 workspace 只安装 `task-board`，不经历 legacy 状态。

replacement 是 package-managed builtin 的通用最小元数据和 reconcile 行为，不新增一次性的 `migrate task-cockpit` 命令。相比让 Agent用普通 `skills add/remove` 拼接操作，该方案能保持 builtin ownership、optional 状态和 runtime receipt 一致，并复用现有 source mutation、runtime render 与 doctor 管线。source mutation 失败时自动回滚；runtime render 或 doctor 失败时保留可重复 sync 的诊断状态，不伪装为完成。

### 3. 新页面使用新路径，旧页面原地保留

新建看板的 canonical 路径为：

```text
projects/<project>/openspec/knowledge/task-boards/yyyy-MM-dd-<task-id>.html
```

既有 `projects/<project>/openspec/knowledge/task-cockpits/*.html` 继续保留原路径、内容和历史名称。它们不转换为新模板，不移动到 `task-boards/`，也不替换为跳转页。Product Project 自身的现有页面同样遵守该边界。

`task-board` 只为变更发布后新创建的任务生成 canonical 页面。若历史任务未来重新启动，那是新的任务判断，不属于本次产品升级；Agent必须根据当时目标决定继续历史任务还是创建新迭代，不得预先批量迁移。

### 4. Buildr-managed identity 迁移是 Agent 动作

面向用户的契约只要求处理无法自动判定的 Skill identity 冲突。Agent负责解析 workspace、运行 preflight、调用 sync、验证 source/runtime 结果和汇报状态。Skill 和产品文档不得把 shell 命令或手工文件步骤作为默认交付。

这与 Buildr 的默认交互模型一致：人表达目标和判断，Agent维护工作资产，Buildr保护受管结构与投射。

### 5. 保留历史证据，迁移当前事实

canonical specs、current-state knowledge 和当前产品文档迁移到“任务看板”；已归档 change、历史提交说明和旧任务页面保留原始文本。旧 HTML 是历史产物，不是兼容跳转层，也不因产品升级被改写。

### 6. `task-board` 仍是普通 identity-routed builtin

本次不创建 capability contract。`task-triage` 与产品入口直接路由 `task-board`；新 description 必须覆盖复杂任务可视化、任务看板、整体进度、长期跟踪、任务全景以及旧称“任务驾驶舱”。验证必须证明 runtime 中不存在同时可用的 `task-cockpit` 和 `task-board` 受管入口，且所有 adapter 完整投射新 Skill 目录。

## Risks / Trade-offs

- [Skill identity rename 可能恢复用户已卸载能力] → replacement 显式继承 `uninstalled` 状态，并以测试覆盖 installed/uninstalled/modified/missing。
- [旧 runtime 或 receipt 造成双入口] → 只删除 ownership 和 integrity 可证明的旧投射；未知或修改内容在 preflight 阶段阻塞，最终 doctor 检查 orphan 和 name ambiguity。
- [新旧目录同时存在可能被误解为两个当前入口] → 文档和 Skill 明确 `task-boards/` 只用于新任务，既有 `task-cockpits/` 是原地保留的历史产物；产品升级不扫描或改写它们。
- [历史页面仍显示旧名称] → 接受其历史真实性；当前产品源、runtime 和新产物不得因此继续使用旧名称作为主名称。
- [“任务看板”被理解为可交互 Kanban] → Skill、spec 和页面明确只读、Agent 单向维护，不新增页面写回能力。
- [历史术语仍可被搜索到] → archive 和历史产物有意保留；当前产品源、runtime 和新产物不得继续使用旧名称作为主名称。
- [通用 builtin replacement 扩大实现范围] → 只增加单一 predecessor identity、状态继承、ownership preflight 和事务迁移，不设计任意多跳迁移图或用户自定义 replacement。

## Migration Plan

1. 增加 package builtin replacement 元数据、解析、preflight、事务迁移、rollback 和 installed/uninstalled/modified/missing 测试。
2. 以 `task-board` 替换 package Skill source、workspace baseline、bootstrap、metadata、模板、static validation、adapter parity 和产品入口路由；确认 runtime 不产生双入口。
3. 更新 task triage、canonical specs、current-state knowledge 和产品文档；保留 archive 不变。
4. 增加历史页面零改写验证，确认 Product Project 当前 `task-cockpits/` 文件的路径、内容和 integrity 不因实现改变。
5. 在隔离临时 workspace 验证旧 package workspace 升级、新 workspace 初始化、显式卸载状态继承和冲突零写入；冻结最终 tree 后运行 Product Candidate。
6. 若 Skill identity 迁移验证失败，保留 `task-cockpit` 现行 package identity；不得发布只完成一半的双 Skill 状态。

## Open Questions

无。旧名称的自然语言识别长期保留，既有旧页面原地保留；旧 Skill identity 不作为并行可用能力保留。

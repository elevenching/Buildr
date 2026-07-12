## Context

OpenSpec 1.4.1 能校验 artifact 结构，但不会记录 delta 创建时所依据的 canonical Requirement，也不会阻止两个 active change 修改同一 Requirement。`MODIFIED Requirements` 在同步时会改变完整 Requirement；当较早 change 先更新主规格、较晚同步的 change 仍携带旧内容时，结构校验可以全部通过，但主规格会被回退。

Buildr 已把 OpenSpec CLI 声明和上游 workflow Skills 交付为 workspace Component，并用 Component integrity 保证集合更新。Buildr 自有 `task-finish` 已能在不修改外部 `openspec-*` Skills 的情况下编排同步和归档。本 change 应沿用这两个边界：门禁代码和 Skill 由 Buildr 维护，OpenSpec 上游仍可替换升级；Project `openspec/` 内容仍归项目所有。

## Goals / Non-Goals

**Goals:**

- 在 Requirement 粒度记录 delta 的原始 canonical 基线，确定性识别陈旧 change。
- 在同步前识别 active change 冲突、proposal/delta 不一致和不完整基线。
- 在同步后证明 delta 结果正确，且未触达的 Requirement 没有被删除或改写。
- 提供稳定的 CLI、JSON diagnostics 和 Agent 下一步，使 `task-triage`、`task-finish` 与产品验证共用同一检查器。
- 把 Buildr 自有门禁作为 OpenSpec Component 的 sidebar 成员交付，同时保持上游 CLI 和 Skills 原样。
- 通过渲染期 Skill Contribution 接入通用工作流，使 OpenSpec Component 卸载后不留下门禁正文、命令或悬空路由。
- 在 OpenSpec 上游版本变化时显式验证兼容性，未知版本不静默放行。

**Non-Goals:**

- 不修改、fork、包装或替换外部 OpenSpec CLI 和 `openspec-*` Skills。
- 不提供 Git hook、系统级 Hook、权限门禁或无法绕过的操作系统级拦截。
- 不实现运行时事件总线、可执行生命周期 Hook 或任意脚本回调；本 change 的 contribution 仅组合自然语言 Skill 内容。
- 不实现通用 Component 依赖求解、远程 registry 或任意脚本 Plugin。
- 不尝试理解 proposal/design 的自然语言是否充分，只校验声明的 capability、delta 和 canonical contract。
- 不为缺失基线的历史 change 猜测创建时事实，也不自动解决语义冲突。

## Decisions

### 1. 门禁是 OpenSpec Component 内的 Buildr sidebar

新增 `openspec-contract-guard` workspace Skill，并将它登记为现有 OpenSpec Component 成员。它调用 Buildr CLI 的契约检查能力，再编排外部 OpenSpec workflow；不编辑外部 `openspec-*` Skill 源。

OpenSpec Component 的 `upstream.version` 继续只表示外部 OpenSpec 版本，Component `version` 表示 Buildr 交付集合版本。package check 只对上游生成的 workflow Skills 校验 `generatedBy`，对 Buildr sidebar 校验 Buildr 自有来源和所支持的 OpenSpec 版本。

备选方案是修改 `openspec-sync-specs` 和 `openspec-archive-change`。该方案会在每次上游升级时产生 fork 冲突，因此拒绝。另一个方案是创建独立 Addon Component，但当前 Component 没有依赖契约，可能出现 OpenSpec 已卸载而 Addon 仍安装的无效状态，因此首版放入同一生命周期集合。

### 2. 基线 sidecar 记录 Requirement 级事实

在 active change 内保存：

```text
openspec/changes/<change>/.buildr/contract-baseline.json
```

sidecar 使用版本化 schema，记录 change id、声明的 OpenSpec 上游版本、delta capability/operation、Requirement identity，以及创建基线时 canonical Requirement 的规范化内容或明确的 absent 状态。它是 change 的审计附件，随 change 一起归档，不属于 OpenSpec artifact schema，也不成为 canonical spec 的替代事实源。

Requirement identity 使用 capability id 与 Requirement 标题；`RENAMED` 同时占用旧名称和新名称。规范化只消除行尾和 Markdown 结尾空白等无语义差异，不重写正文。

基线只能通过显式命令创建或更新。历史 active change 缺少 sidecar 时，Agent 必须审阅当前主规格后显式采用；CLI 记录 adopted 状态，不能在普通 check 中自动补齐。

备选方案是只记录整个 spec 文件 hash。该方案会把同一 capability 中互不相干 Requirement 的并行修改误判为冲突，因此拒绝。

### 3. 一个检查器提供 proposal、pre-sync 和 post-sync 三阶段

Buildr 提供 project-scoped OpenSpec contract CLI，使用 workspace target 与 Project id 解析 planning root，不假设调用者当前目录：

```text
buildr openspec baseline create <change> --project <project> --target <workspace> [--adopt-current] [--json]
buildr openspec check <change> --stage proposal|pre-sync|post-sync --project <project> --target <workspace> [--json]
```

- `proposal`：proposal capability 必须与 delta spec 目录一一对应；new/modified 分类必须与 canonical capability 是否存在一致；baseline 必须覆盖全部 ADDED、MODIFIED、REMOVED 和 RENAMED target。
- `pre-sync`：在 proposal 检查基础上，扫描所有 active changes；同一 capability/Requirement 被多个 change 触达时阻塞。当前 canonical target 必须仍与 baseline 相同，否则报告 stale。
- `post-sync`：使用本次成功 pre-sync 写入的版本化 receipt，验证 delta 和 baseline 在同步过程中未变化；ADDED/MODIFIED/REMOVED/RENAMED 的结果必须成立，receipt 中未触达的 Requirement 必须保持不变。

pre-sync receipt 保存在 change 的 `.buildr/` 目录，包含同步前受影响 capability 的规范化 Requirement 集和 delta hash。它只证明一次同步边界，不能替代长期 baseline；失败或中断时保留以便诊断，下一次 pre-sync 在事实仍安全时覆盖。

JSON 输出统一包含 stage、change、project、upstreamVersion、baselineState、conflicts、findings、ok 和 nextActions。任何 error 都返回非零状态；warning 不得被描述为门禁通过。

### 4. delta 采用确定性 Requirement 语义

检查器解析 `ADDED`、`MODIFIED`、`REMOVED` 和 `RENAMED` 区块：

- ADDED 的 Requirement 在 baseline 中必须 absent，post-sync 后必须与 delta 的完整 Requirement 一致。
- MODIFIED 的 Requirement 在 baseline 中必须 present，post-sync 后必须与 delta 提供的完整更新内容一致。
- REMOVED 的 Requirement 在 baseline 中必须 present，post-sync 后必须 absent。
- RENAMED 的旧名称必须 present、新名称必须 absent；post-sync 后内容保持不变且只改变标题。

同一 delta 中相互矛盾或重复的操作直接失败。该约束与 OpenSpec artifact 指令“MODIFIED 必须包含完整 Requirement”一致，从而避免 Agent 把 partial delta 当成安全补丁。

### 5. Component 通过渲染期 Skill Contribution 接入工作流

通用 `task-triage` 和 `task-finish` 源只保留稳定的 contribution slot，不直接包含 `buildr openspec` 命令。OpenSpec Component definition 声明目标 Skill、slot 与 Markdown fragment；fragment 同时作为 Component member 纳入 integrity 和 Old/Live/New 三方比较。

Agent runtime render 读取 enabled installed Components，并按 Component id 和 definition 中的声明顺序，把 fragment 组合到目标 Skill 明确声明的 slot。目标 Skill 是可选资产且当前未启用或未解析到时跳过 contribution；目标已启用但 slot 缺失，或 fragment 无法安全解析时 fail closed。renderer 不回写 workspace Skill 源。OpenSpec Component 安装或卸载后的 runtime reconcile 使用同一路径，因此卸载后通用 Skill 仍存在，但门禁正文和命令完全消失。

OpenSpec Component 向 `task-triage` 的 change-ready slot 贡献 proposal baseline check；向 `task-finish` 的 pre-sync 和 post-sync slot 分别贡献同步前后检查。任一阶段失败就停止尚未执行的 archive、commit、push 和 cleanup。外部 OpenSpec Skill 仍负责其原有 artifact 操作。

产品入口 Buildr Skill 不硬编码 `openspec-contract-guard` 路由；Component 安装后，runtime 中独立门禁 Skill 的 description 和贡献后的任务 Skills 共同提供发现能力。Component 卸载后不会留下指向不存在 Skill 的入口说明。

产品总验证对 Product Project 运行全量 contract audit，并检查当前 Git diff 中 canonical spec 变更是否存在通过 post-sync 的 active 或本次归档 receipt。这样即使有人直接调用外部 OpenSpec 命令，候选产品 tree 也不能仅凭 `openspec validate --strict` 通过。

备选方案是让通用 Skills 在每次运行时检查 Component 状态。该方案仍长期保留 OpenSpec 专用分支和命令，卸载后只是跳过而非解除依赖，因此拒绝。另一备选方案是实现可执行 Hook；当前需求只需要自然语言编排，事件总线会扩大安全和顺序语义范围，因此留给未来独立 change。

### 6. 上游兼容性由 Buildr 发布门禁验证

baseline 和 receipt 都记录 OpenSpec Component 的 `upstream.version`。运行时同时检查 Component metadata、OpenSpec Command 声明和本机 CLI 版本；版本不受支持、Component/Command 缺失或版本与记录不一致时，contract check 失败并要求先完成 Buildr/OpenSpec Component 或本机 CLI 升级，再重新验证基线。

package check 使用 OpenSpec fixture corpus 验证当前声明版本的 delta 语法和 guard 结果。升级 OpenSpec Component 时，如果 fixture 未通过，Buildr 包不得发布。外部 CLI 的安装升级仍由用户负责，Buildr 只声明、检查兼容版本。

## Risks / Trade-offs

- [Risk] Requirement 标题作为 identity，用户同时重命名和修改内容时产生歧义。→ `RENAMED` 只允许纯重命名；需要改内容时先显式 rename，再以新 identity 做 MODIFIED，冲突操作直接失败。
- [Risk] 历史 active change 没有原始基线。→ 默认阻塞；只提供带 `--adopt-current` 的显式采用，并在 sidecar 留下审计标记。
- [Risk] Agent 绕过 Buildr sidebar 直接运行 OpenSpec。→ 不声称系统级拦截；`task-finish` 和 Product verification 使用同一确定性检查器，候选产品 tree 仍会失败。
- [Risk] OpenSpec 上游改变 delta 格式。→ 按 `upstream.version` fail closed，并要求 fixture corpus 随 Component 升级一起通过。
- [Risk] sidecar 增加 change 噪音。→ 只保存受影响 Requirement 的规范化事实和单次 receipt，随 change 归档，不复制完整仓库历史。
- [Trade-off] 同一 Requirement 的两个 active change 即使实际可合并也会被阻塞。→ 先明确顺序、合并 change 或在前一 change 归档后重新建立后者基线；不让 CLI 猜测语义合并。

## Migration Plan

1. 实现 parser、baseline/receipt schema、三阶段 CLI 和 JSON diagnostics，并用 fixtures 固定 OpenSpec 1.4.1 行为。
2. 发布 `openspec-contract-guard` Skill，更新 OpenSpec Component definition、integrity、package manifest 和 runtime 投射验证。
3. 增加 Component Skill Contribution schema 和 renderer，更新 `task-triage`、`task-finish` 与产品总验证；不修改外部 `openspec-*` Skills。
4. 为当前 change 建立基线并运行自身门禁，验证新 change、并行冲突、陈旧基线、历史采用和安全同步路径。
5. 候选 tree 只在临时 workspace 验证 Component update/sync；合入目标分支后，再从保留的 Product checkout 更新实际自举 workspace 并运行当前 Agent doctor。

回滚时可以恢复上一版 Buildr package 和 OpenSpec Component definition；已有 sidecar 是无害的 change 附件，旧 Buildr/OpenSpec 会忽略。回滚不会自动撤销已同步的 canonical specs。

## Open Questions

无。系统级 Hook、通用 Component dependency 和跨 workspace 的中心化审计明确留给后续 change。

## Context

`buildr doctor` 已经覆盖 workspace、registries、层级资产、Commands 与 Agent runtime，但当前结果模型存在三个边界问题：workspace metadata 缺失时仍可能被判定为 initialized；`ok` 只表示没有 error，却容易被理解成 workspace 已 ready；多个下游检查会为同一根因重复生成 warning 和 next step。与此同时，用户需要知道 doctor 默认检查了什么、哪些检查只在条件满足时运行，以及 Git、OpenSpec、构建测试等专项状态为什么不在默认结果中。

本 change 只增强现有 `buildr.doctor/v1`，不删除字段、不改变 `ok` 的既有语义，也不把默认 doctor 扩展为昂贵或场景相关的全量审计。

## Goals / Non-Goals

**Goals**

- 使用统一的 canonical workspace identity 判定 Buildr workspace 是否有效。
- 分离命令诊断成功、workspace validity、工作 readiness 与是否需要用户行动。
- 让 JSON 明确描述默认核心、条件通用、显式专项三层诊断边界。
- 从 actionable findings 生成去重、按阻塞程度排序的 repair plan，并兼容现有 `nextSteps`。
- 未登记 Project 只报告登记根因，不继续制造 baseline、Service manifest 等派生噪音。

**Non-Goals**

- 不改变 doctor 的退出码或 `ok = error count 为 0` 的兼容语义。
- 不在默认 doctor 中执行 Git dirty/ahead/behind、OpenSpec active change 深检、构建或测试。
- 不为专项诊断新增统一插件框架或新的 CLI flags。
- 不自动修复、初始化或覆盖用户 workspace。

## Decisions

### 1. canonical workspace identity 只有一个定义

doctor 与其他 workspace 操作采用同一组必要资产：根 `AGENTS.md`、`.buildr/workspace.yml` 和 `projects/`。doctor 输出 `workspace.identity.state`：

- `valid`：三项都存在；
- `incomplete`：至少存在一项 Buildr 痕迹，但必要资产不完整；
- `absent`：没有 canonical Buildr workspace 痕迹。

`workspace.initialized` 只在 state 为 `valid` 时为 true。`incomplete` 和 `absent` 都产生 error，但前者精确列出缺失资产，避免把损坏 workspace 误报为普通未初始化目录。

### 2. 保留 `ok`，新增独立 health 维度

`ok` 继续表示 doctor 没有发现 error，以保持脚本和现有集成兼容。新增 `health`：

- `workspaceValid`：canonical workspace identity 是否有效；
- `ready`：workspace 有效且不存在 actionable warning/error；
- `actionRequired`：是否存在 `userActionRequired !== false` 的 warning/error；
- `actionableCount`：上述 finding 数量。

因此，一个只有可修复 warning 的 workspace 可以同时是 `ok: true`、`workspaceValid: true`、`ready: false`、`actionRequired: true`。

### 3. doctor 声明三层诊断 profile

JSON 增加稳定的 `diagnosticProfile`，列出：

- `core`：每次默认执行的 workspace identity、mutation recovery 和 root registry 基础检查；
- `conditional`：仅在相关资产、scope 或 selected Agent 存在时执行的 Project/Service、Rules/Skills、package assets、Commands 和 runtime 检查；
- `specialty`：需要显式进入具体场景的 Git readiness、OpenSpec change、build/test 与 runtime/command/component 深检。

该字段声明边界，不意味着本次引入动态插件系统。专项项给出已有命令时使用命令；没有统一 Buildr 命令的项只声明触发场景，避免制造虚假操作入口。

### 4. repair plan 从 finding 归一化生成

finalize 阶段从 actionable warning/error 生成 `repairPlan`。error 优先于 warning；相同 commands 集合或相同 suggestion 的步骤合并，并保留关联 finding codes。每一步包含 priority、codes、suggestion 和可选 commands。兼容字段 `nextSteps` 从同一 repair plan 投影，因而自然去重。

不带动作的事实型 finding 不进入 repair plan。显式标记 `userActionRequired: false` 的 info/warning 也不进入。

### 5. 根因不成立时停止下游派生检查

Project registry 是 Project baseline 与 Service metadata 诊断的前置事实。发现 materialized 目录未登记后，doctor 保留 `projects.unregistered`，但不再对该目录运行 Project baseline 和 Service manifest 检查。登记修复后，下次 doctor 再检查下游资产。

## Risks / Trade-offs

- 新增 JSON 字段会扩大输出，但保持 schema id 和既有字段不变；测试固定新增字段的语义，避免消费者依赖展示顺序。
- `ready` 对 actionable warning 更严格，可能首次暴露已有 workspace 的待办；这是显式状态，不改变退出码。
- 根因抑制会暂时隐藏 orphan Project 内部的其他问题；repair plan 明确要求先修登记，并由下一次 doctor 继续诊断。
- 三层 profile 是产品契约而非执行图；后续新增检查时必须同步归类，避免默认边界漂移。

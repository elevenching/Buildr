## Why

当前任务资产审查只在任务结束时执行只读复盘，候选依赖当前 session 和最终收尾报告；worktree 清理或任务切换后，人无法稳定接入审查，也无法从候选来源回放到最终资产维护结果。并发 task worktree 又共享用户级 Local App、launcher 和其他本机状态，单靠结束时的大模型回忆容易漏掉任务过程中已出现但后来不再显眼的资产信号。

现在需要把“持续轻量观察、任务结束审查、人工决定、独立资产维护任务”建立成明确生命周期，同时只长期保留真正形成 Rule、Skill 或 capability contract 变更的维护历史，避免把无价值观察变成日志。

## What Changes

- **BREAKING** 将 `buildr.task-asset-review` 从只读、结束时调用的 v1 升级为 v2：provider 从任务开始后的可观察节点持续维护轻量 observation，并在任务结束时完成资格审查和人工决策交接。
- 在 Buildr 用户级共享状态根中按 Workspace identity 建立 task observation inbox；所有 worktree 和非 worktree 任务解析到同一位置，但每个任务只写自己的 observation 文件。
- observation 采用 Markdown 与最小 frontmatter，记录来源 identity、精炼信号、审查结论、人工决定和去向；不保存完整对话、工具日志或隐藏推理。
- `task-finish` 只触发 selected asset-review provider 的 finalize 并等待结果，不再自行汇总信号、执行资格门禁或判断沉淀内容；provider 不可用时按 optional dependency 降级。
- 审查候选仅限 Rule、Skill、capability Contract 和 product follow-up；Command、Component 不作为直接候选。
- reject 或正式核验无价值时删除 observation；accept 后必须进入新的 `task-triage`。Rule、Skill、capability Contract 只有实际发生资产修改时，才在 `asset-maintenance/<type>/<asset-id>/records/` 保存 tracked 维护记录并与资产修改一起提交。
- product follow-up 不复制维护历史；新任务的 OpenSpec artifacts 吸收来源事实后删除 observation。
- v1 不引入公共 Buildr CLI、daemon、watcher、全局索引、CAS 或复杂锁；由 Skill 随附的内部 helper 负责共享路径解析、单文件 owner 校验和原子替换。

## Capabilities

### New Capabilities

- `task-asset-observation-lifecycle`: 定义跨 worktree 共享 observation inbox、最小记录模型、人工处置和维护历史交接。

### Modified Capabilities

- `task-asset-promotion`: 将结束时只读复盘改为任务期间轻量观察、结束时由 provider 审查，并扩展 Rule、Skill、capability Contract 与 product follow-up 的分类和交接边界。
- `agent-task-workflows`: 将 Task Finish 与资产审查的配合改为 finish 仅触发 finalize 并等待 provider 结果，不再承担信号汇总和资格门禁。
- `product-agent-skills`: 将内置 task-asset-review provider 和 task-finish consumer 迁移到 `buildr.task-asset-review/v2`，并交付内部 helper 与模板资源。
- `buildr-package-assets`: 将 v2 capability contract、Skill 随附资源和默认 binding 纳入 package 安装、同步与 runtime 投射。

## Impact

- 影响 `task-asset-review`、`task-finish` 和产品入口 Buildr Skill 的行为与说明。
- 新增 `buildr.task-asset-review/v2` contract，并更新 workspace/package manifests、默认 binding 和 consumer requirement；v1 contract 保留为旧版本事实。
- 新增用户级本地 observation 文件，默认不进入 Git；新增可选的 workspace tracked `asset-maintenance/` 历史目录。
- 新增 Skill 内部 helper、模板、静态契约测试和生命周期行为测试。
- 不新增公开 CLI 命令、后台进程、数据库或 runtime adapter trait。

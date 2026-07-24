## Context

`task-asset-review/v1` 是 task-finish 的 optional、只读 provider：finish 先凭当前上下文做资格判断，命中后才加载完整审查。该模型有三个缺口：信号只能依赖结束时仍可访问的上下文；worktree 清理前只能把候选塞进最终报告；接受候选后的新任务与原任务之间没有可验证交接。

Buildr 已有稳定 Workspace identity 和跨 checkout 共享的用户级状态根，Local App registry 等状态也遵循“用户级共享、Workspace identity 隔离”。新能力可以复用这个边界，不需要把 observation 放进 task worktree，也不需要引入数据库或后台采集。

## Goals / Non-Goals

**Goals:**

- 从任务开始后的公开、可观察节点持续保存精炼资产信号。
- 让同一 Workspace 的所有 worktree 和非 worktree 任务访问同一 inbox，同时保持单任务单写者。
- 明确 finalize、人工 accept/reject、独立 task-triage 和最终去向。
- 只为真实 Rule、Skill、capability Contract 修改保留 tracked 维护历史。
- 让 task-finish 只负责触发和等待，不拥有资产审查政策。

**Non-Goals:**

- 不保存完整对话、工具日志、隐藏推理或逐节点 execution trace。
- 不新增公开 Buildr CLI、Local App 页面、daemon、watcher、事件总线、数据库或全局索引。
- 不在 v1 解决资产改名、拆分、合并、长期数据库迁移或“调查后不修改”的历史。
- 不让当前任务自动修改被建议的资产。

## Decisions

### 1. capability 升级为 v2

v1 的 effects 只允许只读审查；新流程会写用户级 observation、要求人工处置并产生交接证据，因此升级为 `buildr.task-asset-review/v2`。保留 v1 contract 文件作为旧版本事实，但默认 provider、binding、产品入口和 task-finish consumer 一次性迁移到 v2，避免同一 Skill 同时宣称两套互斥行为。

### 2. observation 位于 Workspace 共享用户状态

路径为：

```text
<Buildr user state>/asset-review/<workspace-id>/inbox/<observation-id>.md
```

helper 从传入的 Workspace root 向上定位 `.buildr/workspace.yml` 并读取稳定 `workspace.id`。macOS、Windows、Linux 的用户状态根沿用 Buildr 现有平台规则，并允许测试通过专用环境变量覆盖。路径不包含 worktree 名称，因此所有 checkout 解析到同一 inbox；文件仍记录 worktree、branch、change 和 commit 来源。

备选方案是把文件放进 worktree 或 Git tracked inbox。前者会随 cleanup 消失，后者会把未审核信号变成产品事实和日志，均不采用。

### 3. Markdown frontmatter 只保存最小领域状态

每个 task 使用一个 observation 文件，frontmatter 包含 schema、observation id、workspace id、task owner、lifecycle status、created/updated 时间和来源/去向摘要；正文保存精炼 observations、Agent review、human decision 和 handoff evidence。来源可包含 task/thread、worktree、branch、change、commit、Project、Service；不存在的字段省略。

状态只使用 `observing`、`awaiting-human`、`accepted`。reject 直接删除，不保留 rejected tombstone。每条 observation 是已提炼事实和证据引用，不复制完整消息或命令输出。

### 4. Skill 随附内部 helper，Root Agent 单写

`task-asset-review/scripts/observation.mjs` 提供 Skill 内部 lifecycle actions，不注册为公开 Buildr command。helper 负责：

- 解析共享路径并初始化模板；
- 在 owner 匹配时追加精炼 observation；
- finalize 到 awaiting-human；
- 记录 accept 和 handoff；
- reject 或完成 handoff 后精确删除；
- 列出当前 Workspace inbox。

写入使用同目录临时文件加 rename 原子替换。单文件 owner 不匹配时拒绝；v1 不增加 CAS、锁文件或进程锁。不同并发任务天然写不同 observation id，同一任务由 root Agent 单写。

### 5. task-asset-review 拥有完整政策

description 覆盖非简单 Workspace 任务的探索、设计、诊断、实现与验证节点，使 Agent 在任务开始时加载 provider。provider 自己判断是否值得创建 observation、持续筛选信号、在任务结束时 finalize、完成候选分类并请求人工决定。

task-finish 只在 cleanup 前调用 selected v2 provider 的 finalize，并等待 provider 返回 `no-observation`、`discarded` 或 `awaiting-human`。若 awaiting-human，finish 必须在 cleanup 前等待明确 accept/reject；这是防止 observation 来源丢失的交接步骤，不代表 finish 判断候选价值。optional provider 缺失或 helper 失败时，finish 报告降级但不伪造结果。

### 6. accept 总是进入新任务

人工 accept 后，原任务保持结束；后续工作重新进入 `task-triage`。Rule、Skill、capability Contract 候选在新任务实际修改资产时创建：

```text
asset-maintenance/
  rules/<rule-id>/records/<date>-<record-id>.md
  skills/<skill-id>/records/<date>-<record-id>.md
  capability-contracts/<contract-id>/records/<date>-<record-id>.md
```

记录包含 observation 来源、核验结论、实际资产 diff/commit/change 和最终去向，并与资产修改一起提交、集成。集成成功后才删除 observation；暂停或失败则保留。

若正式调查后不修改资产，v1 不保存 tracked 记录，删除 observation。product follow-up 由新 OpenSpec proposal/design 吸收来源事实后删除 observation，不创建 `asset-maintenance` 副本。

### 7. 不引入 asset.yml

目标 Rule、Skill 和 capability Contract 的当前事实已经由各自 manifest、frontmatter 和 contract 表达；新增 `asset.yml` 会形成第二事实源。维护目录只保存按时间排列的实际变更记录，当前版本不做聚合索引。

## Risks / Trade-offs

- [Agent 忘记在任务早期加载 Skill] → description 覆盖任务开始和实现节点，task-finish 仍提供最后一次 finalize 触发；不承诺后台自动采集。
- [两个 Agent 写同一 observation] → owner mismatch fail closed；v1 明确 root Agent 单写，不用复杂锁掩盖错误所有权。
- [共享用户状态无法写入] → provider 报告降级并继续任务，不把 observation 能力冒充产品交付门禁。
- [awaiting-human 阻塞 cleanup] → 只在确有 observation 时等待，用户 reject 可立即删除并继续；这是保留来源证据的明确取舍。
- [长期目录逐渐增大] → 只记录实际资产变更，不记录 reject 或无修改调查；未来数据库再处理索引和重构历史。

## Migration Plan

1. 发布 v2 contract、helper、模板和更新后的 provider/consumer。
2. package sync 将 workspace 默认 binding、provider 和 task-finish dependency 从 v1 迁移到 v2。
3. 既有 v1 contract 文件保留，但不再作为默认 binding。
4. 首次使用时按需创建用户级目录，不迁移旧最终报告或历史任务。
5. 回滚时恢复 v1 binding；未处理 observation 保留为普通本地 Markdown，可由用户人工删除或后续版本接管。

## Open Questions

无。数据库、长期索引和资产改名/拆分/合并历史留待未来设计。

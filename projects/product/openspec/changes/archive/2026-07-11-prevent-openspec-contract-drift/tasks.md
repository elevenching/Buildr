## 1. 契约解析与数据模型

- [x] 1.1 实现 OpenSpec proposal capability 和 delta spec 的确定性 parser，覆盖 ADDED、MODIFIED、REMOVED、RENAMED 与完整 Requirement block
- [x] 1.2 定义并实现 `buildr.openspec-contract-baseline/v1` sidecar parser、renderer、路径安全和 schema 校验
- [x] 1.3 实现 capability + Requirement identity、规范化内容、absent 状态和 rename 双 identity 模型
- [x] 1.4 定义并实现版本化 pre-sync receipt，记录受影响 capability 快照、delta hash 和 OpenSpec upstream version

## 2. Baseline 与 Proposal 门禁

- [x] 2.1 实现通过 workspace target 与 Project registry 解析 repo-local OpenSpec planning root 和 active change
- [x] 2.2 实现 baseline create，记录全部 delta target 的 present/absent canonical facts 并拒绝非法或不完整 change
- [x] 2.3 实现历史 active change 的显式 `--adopt-current` 路径和 adopted 审计标记，普通检查不得自动采用
- [x] 2.4 实现 proposal capability 与 delta capability 一一对应、new/modified 分类和 baseline coverage 检查
- [x] 2.5 实现 delta 触达范围变化后的 baseline incomplete 诊断和显式更新路径

## 3. 同步前后契约检查

- [x] 3.1 实现全部 active changes 的 Requirement identity 索引和冲突检测，允许同 capability 的不同 Requirement 并行
- [x] 3.2 实现 touched canonical Requirement 与 baseline 的 stale/occupied 比较，任何不一致默认阻塞
- [x] 3.3 实现 pre-sync stage 的完整预检、receipt 写入和可重复执行语义
- [x] 3.4 实现 post-sync 对 ADDED、MODIFIED、REMOVED、RENAMED 结果的确定性验证
- [x] 3.5 实现 post-sync 对未触达 Requirement 保持不变、delta/receipt 未变化和 partial sync 的验证
- [x] 3.6 实现 upstream version 支持检查，Component/Command 缺失、本机 CLI 不满足声明、未知版本或 baseline 版本不一致时 fail closed

## 4. CLI 与 Agent-readable diagnostics

- [x] 4.1 在 `tools/buildr` 增加 `buildr openspec baseline create` 和 `buildr openspec check` 命令、help 与参数校验
- [x] 4.2 为 proposal、pre-sync、post-sync 输出统一文本摘要、非零退出状态和包含 nextActions 的稳定 JSON schema
- [x] 4.3 覆盖无 workspace、Project 不存在、planning root/change 不存在、sidecar 损坏、路径越界和 unsupported stage 的失败路径
- [x] 4.4 更新 Buildr 产品入口 Skill 与 CLI 使用说明，使 Agent 能发现并正确调用契约门禁

## 5. OpenSpec Component 与 Skills sidebar

- [x] 5.1 新增 Buildr 自有 `openspec-contract-guard` workspace Skill，封装 baseline、三阶段检查和失败报告流程
- [x] 5.2 将门禁 Skill 登记到 package manifest、workspace skills manifest 和 OpenSpec Component definition，并更新成员 integrity 与 Component version
- [x] 5.3 调整 package Component 校验，分别验证上游 workflow Skills 的 `generatedBy` 和 Buildr sidebar 的来源/兼容版本
- [x] 5.4 验证 OpenSpec Component install、update、sync 和 uninstall 统一维护门禁 Skill，且不修改外部 CLI、外部 `openspec-*` Skills 或 Project OpenSpec 内容

## 6. 任务工作流集成

- [x] 6.1 更新 `task-triage`，在 change artifacts apply-ready 后建立 baseline 并运行 proposal check，delta 触达范围变化后重新检查
- [x] 6.2 更新 `task-finish`，在 sync 前执行 pre-sync、sync 后 archive 前执行 post-sync，并在失败时停止后续远端和清理动作
- [x] 6.3 更新产品入口 Buildr Skill 的工作流路由和状态说明，保持外部 OpenSpec Skills 原样
- [x] 6.4 增加 package 文本契约检查，防止门禁逻辑回流到 required Core 或外部 `openspec-*` Skills

## 7. 产品验证与回归测试

- [x] 7.1 建立 OpenSpec 1.4.1 contract fixture corpus，覆盖安全 ADDED、MODIFIED、REMOVED、RENAMED 和正常归档路径
- [x] 7.2 覆盖 proposal/delta 不一致、active change 冲突、stale baseline、ADDED target occupied、缺失/损坏/不完整 baseline 和历史 adopted baseline
- [x] 7.3 覆盖 delta 在 pre-sync 后变化、partial sync、未触达 Requirement 删除或改写、unsupported upstream version 和 receipt 重放
- [x] 7.4 扩展产品总验证，审计候选 Git tree 的 canonical spec 变化必须关联通过 post-sync 的 active 或本次归档 receipt
- [x] 7.5 扩展临时 workspace E2E，验证 Component 物化、两个 Agent runtime 投射、update、sync、uninstall 和 JSON diagnostics
- [x] 7.6 为当前 `prevent-openspec-contract-drift` change 建立 baseline 并使用新门禁完成自举验证

## 8. 文档、发布与最终验证

- [x] 8.1 更新 current-state knowledge、产品说明、CLI surface、Component 边界、发布检查清单和文档索引
- [x] 8.2 运行 package check、产品临时 workspace E2E、OpenSpec strict validation、contract audit、`npm pack --dry-run` 和 `git diff --check`
- [x] 8.3 在最终候选 Product checkout 运行 `tools/install-buildr-cli`，验证 `command -v buildr`、`buildr --help` 和当前 Agent doctor
- [x] 8.4 确认候选验证只使用临时 workspace，记录实际自举 workspace 的 Component update/sync 为合入后从保留 Product checkout 执行的收尾动作

## 9. Skill Contribution 解耦修正

- [x] 9.1 扩展 Component definition，支持受 integrity 管理的 `skillContributions` members 和目标 Skill/slot/fragment 声明，并校验路径、引用与重复项
- [x] 9.2 扩展 Claude Code 与 Codex Skills renderer，只组合 enabled installed Component 的 Markdown fragments，目标 Skill 或 slot 无效时 fail closed，且不回写 workspace Skill 源
- [x] 9.3 将 OpenSpec 门禁说明迁入 Component-owned fragments，在 `task-triage` 与 `task-finish` 源中只保留通用 contribution slots，并移除产品入口 Buildr Skill 的 guard 硬编码路由
- [x] 9.4 扩展 package check 和临时 workspace E2E，验证 install/update/sync 注入、uninstall 移除、两种 Agent runtime 一致以及通用 Skill 源不变
- [x] 9.5 更新产品说明、current-state knowledge、发布检查清单和 Component 边界，明确 Skill Contribution 不是可执行 Hook
- [x] 9.6 重新运行 package check、产品临时 workspace E2E、OpenSpec strict validation、contract audit、`npm pack --dry-run`、`git diff --check` 与本机开发 CLI/doctor 验证
- [x] 9.7 修复 nested Product repo 与未跟踪新增 canonical spec 的 contract audit 路径发现，并增加临时 Git repo 回归验证

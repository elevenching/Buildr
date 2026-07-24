## MODIFIED Requirements

### Requirement: 产品验证覆盖分层验证门禁契约
Buildr package verification MUST 防止随包任务 Skills 和 Product Project 开发契约回退为普通收尾固定完整 Candidate、重复启动运行中验证、重复执行被上层入口覆盖的检查或把 browser 作为独立顶层测试类型。

#### Scenario: 校验日常与完整候选边界
- **WHEN** Buildr 验证随包任务 Skills 和 Product Project 开发契约
- **THEN** 验证 MUST 确认实现循环可以运行 minimal 快速反馈、普通完成和普通收尾要求 affected、发布高风险或显式完整验证要求 candidate
- **AND** 验证 MUST 确认 Task Finish 不维护测试命令或路径风险名单

#### Scenario: 校验完整验证去重语义
- **WHEN** Buildr 验证实现阶段和收尾阶段的流程文本
- **THEN** 验证 MUST 确认上层入口已覆盖的底层检查在同一候选状态中不会被机械重复
- **AND** 验证 MUST 确认相同 identity 的后续 Git 动作复用已有满足 requiredAssurance 的 evidence

#### Scenario: 校验运行中验证进程复用
- **WHEN** Buildr 验证随包任务 Skills
- **THEN** 验证 MUST 确认 session、cell、process id 或仍在运行状态通过 wait、poll 或 resume 继续
- **AND** 暂时无输出 MUST NOT 触发相同命令的重复启动

#### Scenario: 校验失败后的重验范围
- **WHEN** Buildr 验证失败后的修复流程
- **THEN** 验证 MUST 确认修复期间优先重跑失败项和受影响专项检查
- **AND** 最终内容变化后 MUST 重跑同一 requiredAssurance，普通任务不得机械升级为 Candidate

#### Scenario: 校验 browser integration 路由
- **WHEN** Buildr 验证 Product changed planner
- **THEN** planner MUST 能独立选择 Project、Service、Change 与 Shell browser integration
- **AND** 局部 API 或单资源页面改动 MUST NOT 触发无关资源 browser 流程、CLI architecture 或 managed mutations

#### Scenario: 校验外部 OpenSpec Skill 所有权
- **WHEN** Buildr 验证门禁的交付来源
- **THEN** 门禁 MUST 由 Buildr-owned Skills 或 Product Project 开发契约提供
- **AND** Component 管理的外部 `openspec-apply-change` Skill MUST 保持上游所有权

### Requirement: 随包任务验证能力保持完整可组合
Buildr package MUST 原子交付 `buildr.task-verification/v2` contract、默认 `task-verification` provider、测试能力声明参考/模板、workspace binding、Task Finish consumer dependency 和全部 supported runtime 投射输入，并 MUST 通过产品验证防止验证职责重新耦合到 worktree lifecycle provider或具体团队测试分层。

#### Scenario: Package 声明 task-verification provider
- **WHEN** package static validation 读取随包能力声明
- **THEN** workspace Skills manifest MUST 声明 installed、enabled 的 `task-verification` provider及 `buildr.task-verification/v2` contract 和 binding
- **AND** `task-finish` MUST 以 required consumer dependency 引用 v2，而不是固定 provider id

#### Scenario: Package 交付测试声明资料
- **WHEN** package static validation 检查 `task-verification` 完整目录
- **THEN** provider MUST 包含可读取的 schema 参考和初始化模板
- **AND** 资料 MUST 使用通用能力集合、成熟度、阶段、环境、副作用和授权模型，不得包含具体团队固定分层

#### Scenario: Runtime 可发现验证入口
- **WHEN** 临时 workspace 为任一 supported runtime 完成 sync 或 render
- **THEN** runtime inventory MUST 包含可发现的 `task-verification` Skill
- **AND** description MUST 覆盖直接测试、实现完成节点、所需保证 evidence、初始化测试声明和测试能力演进意图

#### Scenario: Provider contract 组合验证
- **WHEN** Buildr 运行随包任务 Skills 契约验证
- **THEN** verifier MUST 同时覆盖 affected、candidate、Task Finish consumer、零配置 legacy、augment 声明、authoritative Candidate 和增量演进路径
- **AND** verifier MUST 确认 provider 返回 `requiredAssurance`，且不依赖 Git worktree、Git provider identity、Buildr Product 专用验证命令或固定团队分层

#### Scenario: 替换默认验证 provider
- **WHEN** workspace 安装并绑定兼容的内部 `buildr.task-verification/v2` provider
- **THEN** Task Finish MUST 通过 binding 使用新 provider而不修改 consumer Skill
- **AND** 默认 provider 在不再被选中时 MUST 可安全卸载而不破坏 consumer

### Requirement: 产品验证覆盖 Candidate task metadata 分类
Buildr package verification MUST 覆盖 `verification-result-metadata-only` 的允许与拒绝路径，并 MUST 确认该优化保持 task-verification v2 provider identity、默认 binding、requiredAssurance 和原 evidence identity。

#### Scenario: 校验唯一 checkbox transition
- **WHEN** package contract tests 读取 Task Finish、Task Verification、OpenSpec apply sidebar 和 closeout fixtures
- **THEN** 验证 MUST 确认同一会话内唯一最终验证任务的精确 `[ ]` → `[x]` transition 复用原 evidence且 verification executor count 为 `0`
- **AND** 结果 MUST 保留 source implementation identity、requiredAssurance 与独立 target delivery identity

#### Scenario: 校验 fail-closed 分支
- **WHEN** fixture 表示额外内容变化、任务歧义或跨会话缺少 transition evidence
- **THEN** 验证 MUST 确认 transition 为 `implementation-changed` 并要求重新执行同一 requiredAssurance
- **AND** verifier MUST 拒绝仅按 `tasks.md` 路径、Markdown 类型或最终 checkbox 状态放行

#### Scenario: 校验能力拓扑迁移
- **WHEN** Buildr package verification 检查 contract、provider、consumer 和 binding
- **THEN** 验证 MUST 确认默认拓扑完整迁移到 `buildr.task-verification/v2` 且不存在仍被默认流程引用的 v1
- **AND** 验证 MUST 确认外部 `openspec-*` Skill 源未被修改

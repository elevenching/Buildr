## MODIFIED Requirements

### Requirement: 任务工作流必须显式可见
Buildr task 和 OpenSpec Skills MUST 在改变 task state 前，以及已报告状态发生实质变化时，明确 workflow selection、task environment location、repository set 和当前 OpenSpec change status。

#### Scenario: 使用 OpenSpec 前说明 change
- **WHEN** Agent 决定 create、explore、apply、sync 或 archive OpenSpec change
- **THEN** Agent MUST 在执行动作前说明正在使用 OpenSpec
- **AND** Agent MUST 在已知时尽快明确 change id、resolved change path 和 intended action

#### Scenario: 采用 OpenSpec 时说明当前 change 状态
- **WHEN** task triage 选择或继续 OpenSpec change-flow
- **THEN** Agent MUST 在面向用户的回复中包含当前 change status
- **AND** status MUST 在已知时标识 change id、resolved change path、current action，以及 change 是 planned、active、blocked、apply-ready、complete 还是 archived
- **AND** 在可用时，status MUST 汇总 artifact 或 task progress，并明确 next executable action 或 blocking reason
- **AND** Agent MUST 在首次采用 OpenSpec、状态发生实质变化、工作暂停或完成，或用户询问进度时刷新该 status

#### Scenario: 创建或复用 task environment 前说明位置
- **WHEN** Agent 决定 create 或 reuse task environment
- **THEN** Agent MUST 在 task edits 前说明正在创建还是复用 environment
- **AND** Agent MUST 明确当前 Buildr Workspace root、task id、environment root、任务分支和显式选择的 repository set

#### Scenario: Task environment canonical location
- **WHEN** Agent 在 Buildr Workspace 中创建 task environment
- **THEN** 其 canonical root MUST 为 `<workspace-root>/.worktrees/<task-id>`
- **AND** Agent MUST NOT 静默回退到 `/tmp` 或其他任意位置
- **AND** 同一 task MUST reuse 其现有 environment
- **AND** multi-repository task MUST 在同一 environment identity 下使用 registry-qualified repository selectors，MUST NOT 用彼此无关联的 repo-qualified task ids 冒充统一环境

#### Scenario: Task environment lifecycle remains a Skill concern
- **WHEN** Buildr 打包 task worktree guidance
- **THEN** placement、repository selection、disclosure、reuse、retention 和 cleanup procedures MUST 保留在 task Skills 中
- **AND** required Core Rule MUST NOT 复制 task environment operation manual

### Requirement: Task worktree 提供 change 单写入与验证证据边界
Buildr task triage 和 OpenSpec propose guidance MUST 在首次写入预计进入实现的 OpenSpec change artifacts 前完成执行位置判断，并在需要隔离开发时先创建或复用 canonical task environment；采用 environment 后必须保持唯一任务写入位置和显式 repository set。worktree lifecycle 与 Git integration providers MUST 只返回各自动作产生的 environment/candidate identity 和 transition evidence，由独立 task-verification capability 管理验证政策与 Candidate evidence。

#### Scenario: Task triage 独立判断执行形态和任务位置
- **WHEN** Agent 使用 task triage 判断修改、修复、实现或文档任务
- **THEN** task triage MUST 在语义路径之外独立判断执行形态为 implementation、metadata-only 或待确认
- **AND** it MUST 输出 task environment 创建、复用、不需要或待确认的任务位置结论、repository set 及依据

#### Scenario: 实现型 change 在 propose 前创建 task environment
- **WHEN** task triage 选择 change-flow，且任务预计包含代码修改、构建、测试或长期实现上下文
- **THEN** Agent MUST 在创建 OpenSpec change artifacts 前创建或复用 canonical task environment
- **AND** proposal、design、specs、tasks、实现和候选验证 MUST 只写入该 environment 的允许执行根

#### Scenario: 直接 propose 仍执行 task environment 门禁
- **WHEN** 用户意图直接命中 installed OpenSpec propose Skill
- **THEN** Buildr OpenSpec contribution MUST 在 `openspec new change` 或其他 artifact 写入前判断任务是否预计进入代码修改、构建、测试或长期开发上下文
- **AND** 需要隔离开发时 MUST 先创建或复用 canonical task environment 并在该 environment 中继续 propose
- **AND** 无法判断执行形态或 repository set 时 MUST 先澄清而不是提前创建 artifacts

#### Scenario: 纯元内容任务不创建 task environment
- **WHEN** 任务明确只维护 OpenSpec artifacts、规则、Skills、文档或模板，且不进入代码实现、构建或测试
- **THEN** Agent MAY 在当前 Workspace 直接维护这些元内容
- **AND** Agent MUST 在任务升级为实现前重新执行 task environment 决策

#### Scenario: code-only 实现仍使用 task environment
- **WHEN** task triage 选择 code-only 且任务预计进入代码修改、构建、测试或长期开发上下文
- **THEN** Agent MUST 创建或复用 canonical task environment
- **AND** Agent MUST NOT 因为不创建 OpenSpec change 而跳过任务隔离和 repository set 判断

#### Scenario: artifacts 任务升级为实现
- **WHEN** 未使用 task environment 的 OpenSpec 任务后来需要代码实现、构建或测试
- **THEN** Agent MUST 先创建或复用 task environment 并将 change artifacts 收敛到该唯一位置
- **AND** Agent MUST 清除原工作区的重复副本并确认原 Workspace checkout 没有该任务的开发改动后再继续

#### Scenario: 开发命令使用 environment context
- **WHEN** Agent 在 task environment 中执行 Buildr CLI、代码生成、构建、测试或启动 task-owned 本机进程
- **THEN** Agent MUST 使用 environment root 或目标成员 repository checkout 作为明确 workdir
- **AND** Buildr CLI target、checkout-local CLI source 和 task environment context MUST 相互匹配
- **AND** context mismatch MUST 在结果进入正式验证或收尾前 fail closed

#### Scenario: 最终候选 identity 交给验证 provider
- **WHEN** task environment 中的全部内容修改已经结束并准备验证最终候选
- **THEN** task-worktree provider MUST 提供当前 environment identity、repository set、各 checkout 的 clean/dirty 状态和可确认 tree/fingerprint identity 输入
- **AND** selected task-verification provider MUST 负责建立最终 multi-repository candidate identity、执行项目要求的验证并返回绑定该 environment 的 evidence

#### Scenario: Git 集成改变候选内容
- **WHEN** 任一 repository 的 rebase、冲突解决、merge、reset 或其他 Git integration 操作使集成后的内容 identity 不同于输入 candidate
- **THEN** selected Git provider MUST 返回该 repository 操作前后 identity 和 `treeChanged` evidence
- **AND** selected Git provider MUST NOT 执行 Candidate 验证或决定既有 evidence 是否可复用
- **AND** selected task-verification provider or its consumer MUST 根据当前 environment repository candidate set 决定 evidence 失效与重新验证

#### Scenario: Worktree provider 只报告 lifecycle transition
- **WHEN** task-worktree provider 创建、复用、检查、保留或清理 canonical task environment
- **THEN** it MUST 返回 lifecycle state、environment root、repository set、任务分支和由本次 checkout 操作产生的 transition evidence
- **AND** it MUST NOT 监控普通编辑、判断 Git integration 内容等价性或决定验证复用与重跑

#### Scenario: 上游 OpenSpec Skill 保持原文
- **WHEN** Buildr 为 OpenSpec propose 增加执行位置门禁
- **THEN** Buildr MUST 通过 Component-owned Skill contribution 组合该 guidance
- **AND** Buildr MUST NOT 修改外部 `openspec-propose` Skill 的上游正文

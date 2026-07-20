## ADDED Requirements

### Requirement: Verification timing 必须暴露调度等待
Buildr verification timing summary MUST 以向后兼容字段记录 step 的调度时间轴，使维护者能够区分排队等待与 executor 执行耗时。

#### Scenario: Step 成功或失败完成
- **WHEN** scheduler 启动并完成一个 passed 或 failed step
- **THEN** timing summary MUST 为该 step 记录 `queuedAt`、`startedAt`、`finishedAt` 和 `queueDurationMs`
- **AND** `queueDurationMs` MUST 表示从进入候选执行队列到实际启动的 wall-clock milliseconds
- **AND** 既有 `durationMs` MUST 继续表示 executor 执行耗时

#### Scenario: Step 因依赖失败被阻断
- **WHEN** scheduler 在 step 启动前因依赖失败将其标记为 blocked
- **THEN** timing evidence MUST 保留该 step 的 `queuedAt` 和 `blockedAt`
- **AND** verifier MUST NOT 为该 step 生成 `startedAt` 或 `finishedAt`
- **AND** 既有 `durationMs: 0` MUST 继续作为未执行的兼容哨兵

#### Scenario: 旧消费者读取 timing v1
- **WHEN** 消费者只读取 `name`、`status`、`exitCode` 和 `durationMs`
- **THEN** 新增调度字段 MUST NOT 改变这些既有字段的名称或语义

### Requirement: 高耗时 verifier 优化必须保持覆盖
Buildr Product MUST 在优化高耗时 verifier 时保留稳定 step identity、公开 CLI 边界、既有 adapter/状态语义覆盖和有界并行，不得以删除 Candidate gate 或跳过关键生命周期换取耗时下降。

#### Scenario: 优化 runtime adapter parity
- **WHEN** verifier 优化 runtime adapter parity 的 wall-clock
- **THEN** 全部 supported adapters MUST 仍验证完整 Skill inventory 与 doctor 识别
- **AND** lifecycle adapters MUST 仍覆盖 install、render、runtime check 和幂等行为
- **AND** symlink、orphan、uninstall、restore 与 cleanup 安全回归 MUST 保留
- **AND** 共享 runtime 目标的 adapter mutation 与紧随其后的 check MUST NOT 并行

#### Scenario: 并行 capability 与 JSON fixtures
- **WHEN** verifier 并行运行 capability 或 public JSON/doctor 场景
- **THEN** 并行场景 MUST 使用相互隔离的 workspace 和环境状态
- **AND** provider replacement、optional degradation、ambiguity、Project override、JSON schema、readiness 与 repair plan 断言 MUST 保留

#### Scenario: 调整高耗时阶段预算
- **WHEN** 维护者准备收紧高耗时 step 的非阻断目标预算
- **THEN** 调整 MUST 基于同一冻结候选 tree 的多轮成功 timing evidence
- **AND** 决策 MUST 使用中位数并保留合理波动余量
- **AND** 单次超预算 MUST NOT 改变候选 step status 或退出码

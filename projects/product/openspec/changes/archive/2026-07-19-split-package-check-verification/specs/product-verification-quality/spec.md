## ADDED Requirements

### Requirement: Candidate 必须观测独立 package 验证阶段
Buildr Candidate MUST 将 package static、package workspace smoke 和 package domain integration 作为独立 verification steps 编排，并 MUST 为每个 step 保留稳定 identity、耗时预算和失败诊断。

#### Scenario: Candidate 运行 package 验证
- **WHEN** `npm run test:candidate` 到达 package 验证阶段
- **THEN** timing summary MUST 分别记录每个 package step 的状态、exitCode、durationMs、budgetMs 和 diagnostics 路径
- **AND** Candidate MUST NOT 只记录一个不透明的 `package check` timing step

#### Scenario: 开发期间定点重跑 package verifier
- **WHEN** 维护者通过已登记入口选择 package static、workspace smoke 或 domain integration
- **THEN** 入口 MUST 只运行所选 focused verifier 及其显式前置门禁
- **AND** 未知 selector MUST fail closed

#### Scenario: package steps 并行执行
- **WHEN** 两个 package verifier 使用彼此隔离的只读源码或临时状态
- **THEN** Candidate MAY 在有界并行批次执行它们
- **AND** verifier MUST NOT 依赖同批次其他 step 的可变输出或执行顺序

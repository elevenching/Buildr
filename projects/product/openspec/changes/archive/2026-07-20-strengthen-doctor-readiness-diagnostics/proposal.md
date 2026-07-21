## Why

Buildr doctor 已能聚合多数源资产与 runtime 状态，但 workspace metadata 缺失时仍可能误判为已初始化，且 `ok`、可继续工作和需要行动混在一起；同一根因还会产生重复 next steps。现在需要把默认 doctor 收敛成可信、轻量、能直接决定下一步的用户 workspace 事实入口。

## What Changes

- 严格按 canonical workspace identity 判断初始化状态，区分有效、信息不完整和完全未初始化，并对缺失 `.buildr/workspace.yml` 等必要资产给出明确诊断。
- 保留 `ok` 的向后兼容语义，同时新增独立的 workspace validity、readiness 和 action-required 结果，避免把“命令成功”误读为“无需处理”。
- 为 doctor 输出增加默认核心、条件通用与显式专项三层诊断 profile；默认 doctor 不执行 Git 操作状态、OpenSpec change 深检、构建或测试。
- 从 actionable findings 生成去重、有优先级的 repair plan，并保留兼容的 `nextSteps`。
- 抑制未登记 Project 派生出的 baseline、Service manifest 等级联噪音，先解决登记根因，再检查其下游资产。
- 补充 JSON、文本输出、文档和故障注入测试，覆盖 metadata 缺失、action-required warning、repair plan 去重和未登记 Project。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-readable-doctor`: 严格化 workspace identity，分离 validity/readiness/action-required，声明诊断层级并输出根因化 repair plan。

## Impact

- CLI JSON 与文本输出：`buildr doctor` 新增兼容字段，不删除现有 `ok`、`summary`、`findings` 或 `nextSteps`。
- 实现：`tools/cli/application/workspace-operations.mjs` 与 doctor diagnostics modules。
- 测试：doctor unit、JSON contract、temporary workspace integration/verification。
- 文档：CLI reference、JSON contracts、产品 doctor 边界说明。

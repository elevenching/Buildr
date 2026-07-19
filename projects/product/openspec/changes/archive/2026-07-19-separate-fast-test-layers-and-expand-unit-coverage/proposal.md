## Why

当前 `test:unit` 聚合了纯单元、静态契约和真实 Git/CLI 子进程集成测试，使名称、覆盖率和失败诊断都不能准确表达验证边界。前三批已经统一 Candidate registry 和 diff-aware planner，现在需要完成低成本验证内部的职责分层，并以风险 owner 而不是虚高聚合数字指导核心模块补测。

## What Changes

- 将现有 Node 测试按 `unit`、`contract`、`integration:fast` 三类归属，非 unit 测试从 `test:unit` 移出但不删除覆盖。
- 保留 `npm test` / `test:fast` 作为低成本聚合入口，并让 Candidate 通过 registry 显式依赖三个稳定 step。
- 新增独立 unit coverage 入口和机器可读摘要，只统计 unit owner 直接负责的产品模块，不用 fast 聚合覆盖率冒充单元覆盖率。
- 为核心 CLI application/domain、doctor diagnostics、package validation 和 runtime checker 建立风险矩阵与直接 unit owner；优先补齐可隔离的纯逻辑和错误分支。
- 文档化命名、归属、覆盖率观察和阈值边界；本次不建立全局覆盖率发布硬门禁。
- 这是测试入口的职责调整，不删除测试、不缩小 `test:fast` 或 `test:candidate` 的验证范围。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-verification-quality`: 将 fast 内部验证明确分为 unit、静态契约和快速集成，并增加独立 unit coverage 可观察性与核心模块 owner 要求。

## Impact

- `package.json` 测试 scripts、`tools/verification/registry.mjs`、planner/entrypoint 契约测试。
- `test/` 测试目录结构与若干核心模块的直接单元测试。
- `docs/verification-ownership.md`、`docs/release-checklist.md` 和验证框架任务驾驶舱。
- 不新增运行时依赖；继续使用 Node 内置 test/coverage 能力。

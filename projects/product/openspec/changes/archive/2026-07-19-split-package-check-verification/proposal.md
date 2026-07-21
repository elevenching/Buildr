## Why

`buildr package check` 仍把 package 静态内容校验、临时 workspace 生命周期以及 Commands、Rules、Skills、runtime 等领域行为塞进同一个不可选择的进程，导致 Candidate 只能把约 16 秒的聚合步骤作为黑盒执行，失败定位、耗时归属和定点重跑都不清晰。第一批次已经建立分层 Candidate、Workspace suites 与阶段预算，现在需要消除最大的剩余验证聚合热点，让每类契约由明确 verifier 持有。

## What Changes

- 将 package 验证拆成稳定的静态资产校验、package workspace smoke 和领域 integration steps，每个 step 可独立执行、计时、诊断和重跑。
- 保留 `buildr package check` 作为产品维护聚合命令，但让它只组合拆分后的 verifier，不再承载一个跨领域巨型场景。
- Candidate 直接编排拆分后的 package steps，避免把整个 `package check` 当成黑盒，同时保持完整发布门禁。
- 把 Commands、Rules、Skills 与 runtime 的细粒度行为移交给对应 focused verifier；package workspace smoke 只保留初始化、随包 baseline 和安装后收敛的代表路径。
- 为拆分边界、入口清单、失败诊断与阶段耗时建立自动化回归保护。
- 不改变 `buildr package check` 的公开用途和成功/失败语义，不包含破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `buildr-package-assets`: 明确 package check 的聚合边界，以及静态资产、workspace smoke 与领域 integration 的覆盖归属。
- `product-verification-quality`: 要求 Candidate 将 package 验证作为独立 timing/diagnostics steps 编排，并支持 focused 重跑。
- `cli-modular-architecture`: 要求 package maintenance handler 只组合可独立执行的 verifier，禁止重新形成跨领域 smoke 巨石。

## Impact

- 影响 `tools/cli/application/package-maintenance/`、`tools/verification/`、Candidate/affected 入口、阶段预算及对应测试。
- 影响验证职责矩阵、release checklist 与 package 维护说明。
- 不改变 workspace 用户资产格式、runtime adapter 公共契约、npm 包公开 API 或正式发布前完整 Candidate 要求。

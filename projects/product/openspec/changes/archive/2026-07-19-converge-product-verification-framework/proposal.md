## Why

Buildr 已经具备完整的分层验证、统一 registry 和 diff-aware planner，但测试语义层、领域 selector、聚合门禁和覆盖率观测都平铺为 `test:*` 入口，导致维护者需要理解十多个近似命令。与此同时，DAG 中部分 `dependsOn` 只是“希望一起通过”而不是真实执行依赖，过宽 `inputs` 又使普通实现改动经常退化为接近完整 Fast，削弱了 `test:changed` 的价值。

## What Changes

- 将维护者主要工作流收敛为 `npm test`、`test:changed` 和 `test:candidate` 三个门禁，并提供统一 `test:focus` 作为按 step 或 group 的故障定位入口。
- 将 `test:affected`、`test:package`、`test:workspace` 和含义不完整的 `test:release` 从主要入口收敛为兼容或内部执行面，不再分别承担平级验证层语义。
- 只为真实制品或输出消费关系声明 DAG 依赖，Fast/Candidate 的完整性由 profile 表达，避免局部重跑因假依赖展开整套低成本测试。
- 收窄 unit、contract、integration-fast 和 architecture 的 changed inputs，使实现路径匹配真实 owner；继续对未映射 Product 路径 fail closed。
- 将轻量 `docs-quality` 纳入完整 Candidate，并移除对 Candidate 固定 step 数量的脆弱断言，改为验证 required gate、artifact consumer 和 registry invariant。
- 明确 onboarding、repository checkout、package parity 与 release smoke 的唯一 owner，删除重复 happy path 断言但保留不同分发边界的证据。
- 将 unit coverage 恢复为观测命令语义，同时保留既有测试层直接入口供定位使用。

本 change 不减少正式 Candidate 的风险覆盖，不把内部 verifier 合并为不透明大脚本，也不改变 Buildr 对外 CLI 或 workspace 数据格式。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-verification-quality`: 收敛主要验证入口，明确真实 DAG 依赖和 changed owner，补齐 Candidate 文档质量门禁，并收缩重复的 onboarding 成功路径。

## Impact

- 主要影响 `package.json`、`tools/verification/registry.mjs`、planner/focus 入口、相关 Node tests 和验证维护文档。
- CI/publish 使用的 `tools/verify-buildr-product` 与 `test:candidate` 完整语义保持不变。
- 现有局部 selector 可能保留短期兼容提示，但新的维护文档只推荐三种主门禁和统一 focus 入口。

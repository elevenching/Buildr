## Why

Buildr 已有统一 RuntimePlan 和五项 adapter capability 契约，但具体 descriptor、Rules/Skills 投射选择和 checker 入口仍散落着 runtime-specific 字段与映射；继续增加 Agent 会重复扩展分支，也无法从实现契约准确反推接入时必须调查的信息。现在先把现有 `codex`、`claude-code` 收敛到可组合 traits，才能以小而稳定的证据集接入后续 Agent。

## What Changes

- 定义受约束的 adapter trait catalog，分别描述 Rules 投射、Skills layout、产品 surface、激活/刷新语义和 checker 能力。
- 提供统一 descriptor composition 与 validation，使具体 adapter 只声明 identity、traits、runtime targets 和必要的 runtime-specific 参数。
- 让 runtime planning、Skills targets、checker/doctor 解析和 `runtime list --json` 从同一组合后 descriptor 读取事实，移除新增 runtime 时需要扩大的独立 allowlist 和 `if runtime === ...` 分支。
- 将 `codex`、`claude-code` 迁移为 traits 组合，保持现有公开命令、文件目标、诊断、ownership、冲突和清理语义不变。
- 用 fake adapter contract tests 验证共享 traits 可以组合为独立 adapter，同时仍要求每个 adapter 独立认证五项 required capabilities。
- 根据最终 trait schema 重写 adapter 调研说明和 Prompt，只询问实例化 descriptor、checker 和 compatibility tests 所缺少的信息。
- 本 change 不新增任何第三方 Agent adapter，不把兼容产品 alias 或 fallback 到现有 adapter。
- 无破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `workspace-first-runtime-projection`: 明确 supported adapter descriptor 通过受约束的 Rules、Skills、surface、activation 和 checker traits 组合，并在 Agent-readable discovery 中暴露接入与诊断所需的组合事实。

## Impact

- 影响 `tools/runtime/adapter-contract.mjs`、runtime projection、Skills render plan、checker/doctor implementation registry 和相关 CLI discovery 输出。
- 影响 adapter contract verification、fake adapter tests、package static validation 与临时 workspace runtime smoke tests。
- 更新 Buildr 产品说明、current state、adapter 接入指南和目标 Agent 调研 Prompt。
- 不新增依赖，不改变现有 supported adapter id，也不修改用户 Buildr 源资产格式。

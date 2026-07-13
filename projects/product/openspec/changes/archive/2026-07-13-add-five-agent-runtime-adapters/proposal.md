## Why

Buildr 已完成 runtime adapter traits 与声明式计划的基础抽象，但公开支持仍只有 Codex 和 Claude Code，用户已完成 Qoder、TRAE、TRAE Work、WorkBuddy 的本机调研，并要求补充 Cursor。现在需要把已确认的 runtime 机制落实为独立、可诊断、无 fallback 的正式 adapters，同时给人和 Agent 一份可从 README 发现的权威接入说明。

本 change 不包含破坏性变更；现有 `codex` 和 `claude-code` adapter 行为必须保持兼容。

## What Changes

- 新增 `qoder`、`trae`、`trae-work`、`workbuddy`、`cursor` 五个独立 runtime adapter descriptor，各自保留 surface、Rules、Skills、activation、checker、能力证据和 contract tests。
- 复用已认证的 `native-recursive`、`reference-bridge`、`agents-compatible`、`vendor-root` traits，并为 Qoder/TRAE 的 runtime-specific Rules 文件补齐 `vendor-rule-files` 投射原语；只有 primitive 无法表达时才新增静态实现。
- Cursor 以官方支持的嵌套 `AGENTS.md` 作为原生 Rules 入口；Qoder 与 TRAE 将 Buildr 分层 `AGENTS.md` 投射为各自 vendor rule files；TRAE Work 与 WorkBuddy 使用短小、受管、可诊断的根 reference bridge 引导 Agent 读取 Buildr scope 规则。
- 为五个 adapters 完整提供产品 Buildr Skill、workspace/Project Skills、Skill install plans、runtime check、安装/版本 probe 与 reload guidance；无法由 Buildr 自动确认的 UI toggle、版本差异或 reference 读取行为必须显示为 finding，不得静默视为可用。
- 新增已接入 Agent adapter 权威文档，逐个说明 adapter id、适用 surface、Rules/Skills 接入路径、激活与重载、checker、限制和验证证据；根 `README.md` 与 `README.en.md` 必须链接该文档，并把当前支持摘要更新为事实矩阵入口。
- 增加 descriptor、planner、reconcile、diagnostic、CLI JSON、人类可读输出、`documented` / `verified` 证据等级和一次性 runtime smoke kit；自动测试覆盖 scope 顺序、兄弟目录隔离、冲突零写入、幂等、陈旧投射清理与现有 adapter parity，真实产品 smoke 只补充运行时发现证据。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `workspace-first-runtime-projection`: 扩展 supported adapter 集合，定义五个新增 adapter 的 Rules/Skills 投射、诊断、证据与兼容边界。
- `human-agent-onboarding`: 让 README 和 onboarding 文档可发现完整 adapter 接入说明，并引导 Agent 根据 adapter-specific 前置条件、reload 与诊断结果完成接入。

## Impact

- 影响 `tools/runtime/` 的 adapter registry、Rules planner/renderer、Skills roots、checker 与 reconcile 管线，以及相关 CLI application 层和 JSON 输出测试。
- 影响 runtime 生成目标：`.qoder/`、`.trae/`、`.codebuddy/`、`.agents/`、`CODEBUDDY.md` 及 TRAE Work 的受管根桥接入口；所有写入继续遵守冲突预检、受管标记、幂等与 orphan cleanup。
- 影响产品说明、CLI Reference、Buildr Skill/bootstrap/current-state knowledge、根中英文 README 和新增 adapter 文档。
- 不新增第三方运行时依赖，不为 unsupported runtime 使用 alias 或 fallback，也不覆盖用户已有的非 Buildr 管理 vendor 文件。

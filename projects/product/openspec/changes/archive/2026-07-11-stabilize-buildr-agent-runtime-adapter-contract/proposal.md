## Why

Buildr 已有 `codex` 与 `claude-code` runtime adapter，但 adapter metadata、render、sync、check、doctor 和 CLI 路由仍分散在多处分支中；新增类似 Trae 的 runtime 会重复修改控制流，也容易让能力声明与实际行为漂移。现在需要把 supported adapter 收敛为可验证的静态契约，让新增 runtime 只增加显式 adapter 实现和测试，同时保持 Component 只是受管资产生命周期边界。

## What Changes

- 定义静态内置 Agent runtime adapter 契约，以唯一 registry 声明 adapter identity、五项 required capabilities、runtime targets、推荐命令和投射实现。
- 将 adapter 的职责限定为描述 runtime-specific 投射并生成无副作用的运行时计划；scope discovery、源资产解析、Component Skill Contribution 组合、冲突预检、写入、清理、findings、repairs 和 doctor 聚合由通用 core 负责。
- 让 `render`、`sync`、`runtime check`、`doctor --agent`、产品 Buildr Skill 安装和 Component 生命周期从同一 adapter registry 与通用 reconcile 逻辑派生，不再分别维护 Agent 分支。
- 保持 `codex` 与 `claude-code` 的现有外部行为和受管路径兼容，并以共享投射原语减少重复实现。
- 明确 supported adapter 必须完整实现 `rules-entry`、`product-buildr-skill`、`workspace-project-skills`、`skill-install-plans` 和 `runtime-check`；缺项、重复 target、非法计划或未注册 adapter 均 fail closed，且不得 fallback。
- 明确 Component 不能注册、替换、注入或执行 runtime adapter；Component 仍必须通过 Component/package check、生命周期预检和 doctor 验证自身 definition、成员、integrity、ownership 与 Skill Contribution 声明完整性，然后由通用 runtime 管线消费已验证的贡献。
- 增加 adapter contract、计划校验、现有 runtime parity、Component 边界和可扩展性测试；使用测试专用 fake adapter 验证扩展点，不把 fake runtime 暴露为产品支持能力。
- 本 change 不正式新增 Trae adapter；Trae 作为后续 adapter 的设计验证案例。

本变更不包含面向用户的破坏性 CLI 变更；内部 runtime adapter 接口会被替换，但当前没有对 workspace 开放的 adapter 插件 API。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `workspace-first-runtime-projection`: 将 supported runtime 的能力声明、投射计划、reconcile、check 与 doctor 收敛到单一静态 adapter contract，并规定 fail-closed、无 fallback 和现有 runtime 兼容行为。
- `managed-components`: 明确 Component 不构成 adapter 扩展机制，但必须验证自身 definition、成员 integrity、ownership 和 Skill Contribution 完整性后才能参与通用 runtime 投射。

## Impact

- 受影响实现包括 `tools/buildr`、runtime render/check modules、产品 Buildr Skill renderer、package/runtime manifest 校验和相关测试脚本。
- `buildr runtime list`、`render`、`sync`、`runtime check`、`doctor --agent`、`skill install` 与 Component install/uninstall 的内部路由会统一，但现有命令形式和 `codex`、`claude-code` runtime 结果应保持兼容。
- 不引入动态 JavaScript 插件、Component adapter member、第三方代码执行或新 runtime 支持承诺。

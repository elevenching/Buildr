## Why

Buildr 当前主要在 Skill 和自举规则中重复要求 doctor，required Core 却没有向所有用户声明“状态变更后必须验证”的统一约束，导致用户 workspace 与自举 workspace 的完成标准不一致。本变更不包含破坏性变更。

## What Changes

- 在 required Buildr Core 中增加统一 invariant：Buildr 源资产或 Agent runtime 状态变更后，必须使用当前 Agent 的 doctor 验证后才能视为完成。
- 在 Buildr Skill 和 bootstrap 中保留具体 doctor 命令与执行时机，删除资产章节中的重复提醒。
- 在 Product AGENTS 中声明 `package/agent-skills/` 与 `package/workspace/` 是发布给用户的资产，修改时必须从用户使用视角审视。
- Buildr CLI 安装后除校验命令入口外，还必须对目标 workspace 运行 doctor。
- 精简自举 root AGENTS 中重复的 doctor 文案，让更新/渲染流程依赖 Core 的统一完成约束。
- 产品变更先在 Product Project 验证，再由当前候选 Buildr 更新并验证自举 workspace；通过后才合并、推送。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `workspace-first-runtime-projection`: required Core 增加 Buildr 状态变更后的统一 doctor invariant。
- `product-agent-skills`: Buildr Skill 保留统一执行循环，删除各资产章节重复的 doctor 要求。

## Impact

- 影响 required Core、Buildr Skill、bootstrap guide、Product/root AGENTS。
- 不改变 CLI 参数、doctor 实现或 runtime adapter 行为。

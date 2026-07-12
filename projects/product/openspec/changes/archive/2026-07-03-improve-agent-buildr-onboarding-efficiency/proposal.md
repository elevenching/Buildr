## Why

Buildr 已经具备内置 Buildr Skill、bootstrap guide 和基础 CLI 命令，但当前 Skill/guide 仍偏流程手册，容易把 Agent 本来擅长的对话编排写死，也让用户上手路径显得冗长。

现在需要把 Buildr Skill 收敛为轻量产品使用协议：Agent 自己负责编排，Buildr CLI 负责确定性执行，`doctor --json` 负责事实反馈；bootstrap guide 退回兜底发现入口。

## What Changes

- 将 Buildr Skill 从详细流程说明优化为轻约束、命令地图和完成标准。
- 明确 Skill 的核心约束：
  - 优先使用 Buildr CLI 完成用户指令，不手工拼装 Buildr 核心结构。
  - workspace 必须完成 `init`，并根据当前 Agent 需要完成 `rules render`、`skills render`。
  - 每次状态变更后运行 `buildr doctor --json`，根据诊断结果引导用户继续创建 Project 和接入 Service。
  - Agent runtime 是投射产物，不作为 workspace 源资产维护。
- 新增 `buildr skill install <agent>`，用于单独安装 Buildr 产品内置 Skill。
- 将 bootstrap guide 定位为 Agent 不支持 Skills、Skill 不可用或 Agent 尚不知道 Buildr 命令入口时的兜底入口。
- 更新 onboarding contract，使它校验 Skill/guide 共同覆盖轻约束、命令地图和禁用入口。
- 不新增 `buildr onboard`、`buildr use` 或其他高层编排命令。

## Capabilities

### New Capabilities

- `buildr skill install <agent>`：单独安装 Buildr 产品内置 Skill，不要求目标目录已初始化为 workspace。

### Modified Capabilities

- `product-agent-skills`: Buildr Skill 的职责从流程手册收敛为轻量使用协议和 Agent 编排约束。
- `agent-first-onboarding`: onboarding 主路径调整为用户自然语言 → Buildr Skill 轻约束编排 → 基础 CLI 命令；bootstrap guide 作为兜底入口。
- `buildr-package-assets`: onboarding contract 需要覆盖轻约束、命令地图和禁用入口。

## Impact

- 影响 `product/package/agent-skills/buildr/SKILL.md` 内容结构。
- 影响 `product/package/bootstrap/guide.md` 的定位和内容详略。
- 影响 `product/package/bootstrap/onboarding.contract.yml` 与 `buildr package check` 的同步校验目标。
- 影响产品手册、runtime adapter 文档和验证脚本。
- 新增产品级 Skill 安装命令，但不新增 `buildr onboard`、`buildr use` 等高层 onboarding command。

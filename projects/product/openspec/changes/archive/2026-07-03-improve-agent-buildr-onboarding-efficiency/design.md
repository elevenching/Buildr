## Context

当前 Buildr 的 Agent-first 入口包括：

- Buildr Skill：渲染到 Agent runtime 后的首选入口。
- bootstrap guide：CLI 输出的兜底发现入口。
- `buildr skill install <agent>`：安装 Buildr 产品内置 Skill 的产品入口。
- 基础 CLI 命令：`init`、`doctor`、`project create`、`service create`、runtime check/render。

之前讨论过新增 `buildr onboard` 或 `buildr use`，但用户指出：Agent 本身会自动编排，Skill 里只需要给轻约束和命令能力即可。这个判断更符合 Agent 产品的使用方式，也避免过早把对话流程固化为 CLI command。

## Goals / Non-Goals

**Goals:**

- 让 Buildr Skill 成为简洁的产品使用协议，而不是详细流程脚本。
- 提供独立的 Buildr Skill 安装入口，让“安装 CLI 后让 Agent 学会 Buildr”成为清晰产品动作。
- 保持 Agent 的自主编排能力：Agent 根据用户目标、`doctor --json` 和命令地图选择下一步。
- 将 bootstrap guide 降级为兜底入口，避免与 Skill 维护两份流程手册。
- 用 onboarding contract 保证 Skill/guide 不遗漏关键命令和边界。

**Non-Goals:**

- 不新增 `buildr onboard`、`buildr use` 或交互式 wizard。
- 不让 `buildr init` 自动执行 runtime render。
- 不把 workspace 内部目录细节写成 Agent 必须逐项检查的强耦合规则。

## Decisions

### Decision 1: Skill 是轻约束协议，不是流程控制器

Buildr Skill 应告诉 Agent：

1. 优先使用 Buildr CLI 完成用户指令，不手工拼装 Buildr 核心结构。
2. workspace 必须完成 `init`，并根据当前 Agent 需要完成 `rules render`、`skills render`。
3. 每次状态变更后运行 `buildr doctor --json`，根据诊断结果引导用户继续创建 Project 和接入 Service。
4. Agent runtime 是投射产物，不作为 workspace 源资产维护。

它不应规定“必须第几步问什么问题”。用户可能已经有 workspace、可能只想接入 service、也可能只是让 Agent 检查 Buildr 状态。Agent 应根据 `doctor --json` 和用户目标自由编排。

### Decision 2: guide 是兜底入口

bootstrap guide 的职责调整为：

- 没有 Buildr Skill 时，让 Agent 学会如何开始。
- 当前 Agent 不支持 Skills、Skill 不可用或 Agent 尚不知道 Buildr 命令入口时，提供纯文本兜底路径。
- 解释 Buildr Skill 与 CLI 基础命令的关系。

guide 可以保留命令地图和最小流程，但不再承担完整操作手册。

### Decision 3: 新增产品级 Skill 安装入口，不新增高层 onboarding command

新增 `buildr skill install <agent>`，用于把 Buildr 产品内置 Skill 安装到当前 Agent runtime。它不同于 `buildr skills render <agent>`：

- `skill install` 只安装产品内置 Buildr Skill，不需要 workspace 已初始化，也不读取 workspace/project Skills。
- `skills render` 继续按 scope 投射 workspace/project Skills。

暂不新增 `buildr onboard` 或 `buildr use`。

原因：

- 当前需要的是让 Agent 上手更快，不是引入新的状态变更 API。
- 对话式问题更适合 Agent 询问用户，而不是 CLI wizard。
- 基础命令已经足够确定，`doctor --json` 已经提供事实反馈。
- 但“安装 Buildr Skill”是产品入口，不应伪装成 workspace Skills render。

如果未来发现多种 Agent 在同一段编排上反复出错，再把那段稳定流程下沉成 CLI command。

### Decision 4: contract 校验轻约束，不校验长流程

`onboarding.contract.yml` 继续作为 guide 与 Skill 的同步契约，但校验目标从“完整流程文本”收敛为：

- 必备命令。
- Codex / Claude Code runtime 分支。
- `skill install`、`init`、必要 runtime render、`doctor --json`、Project / Service 引导。
- 禁用 `buildr bootstrap install-skill` 和不存在的高层编排命令。

## Risks / Trade-offs

- [Risk] Skill 变短后，不同 Agent 编排差异变大。 → Mitigation：保留 `doctor --json` 必跑约束和 command map，让事实反馈收敛行为。
- [Risk] guide 与 Skill 职责仍然重叠。 → Mitigation：guide 明确为兜底入口，Skill 明确为首选 runtime 入口。
- [Risk] 后续仍可能需要高层 command。 → Mitigation：先观察 Skill 编排效果，只有稳定重复且需要幂等的片段才下沉为 command。

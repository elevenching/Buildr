## Context

Buildr 当前把“更新/同步 workspace”路由为单一 `buildr sync` 命令。该命令的正确职责是使用当前 CLI package 同步当前 checkout 中的 workspace 产品能力并准备 Agent runtime，不负责从 Git 远端取得新的 workspace 源资产。缺失发生在 Agent 意图编排层，而不是 CLI reconcile 层。

该意图还与单独 Git 操作后的环境检查相邻：用户只要求 pull 时，Git Ops 在 tree 变化后先 doctor、按需询问 sync；用户已经明确要求完整“更新/同步 workspace”时，sync 本身已被授权，不应重复询问。

## Goals / Non-Goals

**Goals:**

- 为 Git 管理的 workspace 建立“Git 安全更新 → Buildr sync → 最终 doctor”的完整编排。
- 保留 Git Ops 对本地改动、upstream、分叉、冲突和历史改写的安全边界。
- 让非 Git workspace、Git 更新失败和显式 workspace 同步授权具有确定行为。
- 通过随包文本和静态验证防止语义回退。

**Non-Goals:**

- 不让 `buildr sync`、`buildr update` 或其他 CLI 命令执行隐式 Git 更新。
- 不定义新的 Git merge/rebase/stash 策略，也不绕过 Git Ops 授权。
- 不承诺 sync 后当前 session 立即重新发现 runtime 资产。

## Decisions

### 在 Buildr Skill 编排 Git 与 sync

Buildr Skill 负责识别复合用户意图，并复用 Git Ops 完成 workspace 根 checkout 的安全更新。相比把 Git pull 放进 `buildr sync`，该方案保持 CLI 可预测、非交互且只处理 Buildr 资产，同时让 Agent 能解释 Git 决策点。

### 显式 workspace 同步意图不重复询问

当用户只要求 Git 操作时，继续使用既有 post-transition doctor 和按需询问 sync 的流程。当用户明确要求“更新/同步 workspace”时，该意图已经授权后续 `buildr sync`；Git tree 安全更新成功后直接执行 sync，并使用其最终 doctor。这样既保留单项 Git 操作边界，又避免复合流程中的重复确认。

### Git 更新必须先完成，失败时 fail closed

Agent 先确认 workspace root 的 Git ownership、当前分支、upstream 和工作区状态，再采用 Git Ops 允许的非破坏方式更新。存在本地改动、分叉、冲突、缺少 upstream 或其他需要选择的状态时，停止并报告，不自动 stash、rebase、覆盖，也不继续 sync。非 Git workspace 没有该前置步骤，直接 sync。

### 只加强随包契约，不新增 CLI 实现

修改产品入口 Skill、bootstrap guide、CLI reference、runtime render 提示和静态验证。CLI reference 说明的是 Agent 对用户意图的编排，而 `buildr sync` 命令表仍保持“不更新 CLI”和“不负责 Git”的事实。

## Risks / Trade-offs

- [Risk] “同步 workspace”过去可能被理解为只做本地 reconcile，新语义会访问 Git remote → Mitigation：仅在 workspace 根确由 Git 管理且具备可安全更新条件时执行，并在文档中明确这是 Agent 复合意图，不是 `buildr sync` 命令语义。
- [Risk] 本地改动导致完整更新更容易停下 → Mitigation：fail closed 并给出具体 Git 状态和可选处理路径，不牺牲用户改动。
- [Risk] 与 Git transition doctor 流程产生重复检查 → Mitigation：复合 workspace 更新流程直接进入已授权 sync，以 sync 的最终 doctor 收口；单独 Git 意图继续 doctor-first、sync-if-needed。

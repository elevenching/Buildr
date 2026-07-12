## Context

当前 required Core 定义资产与 Rule/Skill 边界，但 doctor 完成条件主要重复散落在 Buildr Skill、bootstrap 和自举 AGENTS 中。用户 workspace 始终读取 Core，因此统一 invariant 应进入 Core；具体命令与分支流程仍属于 Skill。

## Goals / Non-Goals

**Goals:**

- 让用户 workspace 与 Buildr 自举 workspace 共享同一 doctor 完成条件。
- 减少 Buildr Skill 各资产章节中的重复 doctor 文案。
- 明确发布资产必须从用户使用视角评审。
- 保证 Buildr CLI 开发安装后验证目标 workspace。

**Non-Goals:**

- 不修改 doctor、sync、render 或 CLI 安装脚本行为。
- 不把具体操作手册复制进 Core。
- 不要求没有 Buildr workspace 的纯 CLI 安装场景运行 workspace doctor。

## Decisions

### 1. Core 只声明完成 invariant

Core 规定：初始化后的 Buildr workspace 中，只要 Buildr 源资产、安装状态或 Agent runtime 状态发生变化，就必须使用当前 Agent 的 doctor 验证后才能视为完成。Core 不展开各资产命令和专项排查流程。

### 2. Skill 保留唯一主执行循环

Buildr Skill 在执行循环和完成标准中保留 doctor 命令；Project、Service、Rules 等章节删除“操作后再 doctor”的重复句。bootstrap 作为 Skill 不可用时的兜底入口，保留同一命令。

### 3. 自举规则只描述额外顺序

Product AGENTS 规定产品变更先只修改 Product Project；产品验证后，再使用当前候选 Buildr 的 update/sync 更新自举 workspace。root AGENTS 只声明自举 workspace 中的产品交付资产不得直接编辑；doctor 由 Core invariant 触发。自举验证通过后才可合并、推送。

### 4. 发布资产采用用户视角

Product AGENTS 明确 `package/agent-skills/` 与 `package/workspace/` 会发布给用户。修改这些内容时，不得只验证当前自举 workspace 的可用性，还要判断新用户初始化、更新和日常使用是否成立。

## Risks / Trade-offs

- [Core 变成操作手册] -> 只保留一条 invariant，具体命令和异常处理留在 Skill。
- [Skill 删除过多提示] -> 保留执行循环、完成标准和 bootstrap 兜底三处稳定入口。
- [CLI 安装时尚无 workspace] -> Core 只要求对已初始化的目标 workspace 运行 doctor。

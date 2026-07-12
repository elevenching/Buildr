## Context

当前 Git Ops 已负责提交范围和 Git 安全策略，但未定义提交信息格式。Core 也没有默认提交语言，导致 Git Ops 卸载后缺少稳定的语言约束。

## Goals / Non-Goals

**Goals:**

- 提供简洁、一致的 Conventional Commits 默认格式。
- 让默认中文约束独立于 Git Ops Skill 生命周期。
- 允许更具体的项目或仓库约定覆盖默认语言。

**Non-Goals:**

- 不增加 commit hook、lint 或 CLI 强制校验。
- 不改变 Git 授权、分支集成和任务收尾策略。
- 不把完整提交操作流程写入 Rule。

## Decisions

### 1. 格式归 Git Ops，默认语言归 Core

Git Ops 定义 `<type>(<scope>): <subject>`、可选正文、类型选择和生成原则。Core 规定没有更具体约定时 subject/body 使用中文，代码标识、路径、scope 和专有名词可保留原文。

备选方案是新增 optional Rule；它增加 manifest 和生命周期管理，但没有提供额外必要能力，因此不采用。把默认中文写入 Git Ops 同样不采用，因为约束会随 Skill 卸载。

### 2. 更具体约定可以覆盖默认语言

Core 表达产品默认值，而不是不可覆盖的组织政策。Project、Service 或仓库规则明确指定其他语言时，Agent 遵循更具体的约定。

### 3. Git Ops 不复制语言约束

Git Ops 生成提交信息时遵循 Core 和更具体约定，不复制中文规则。`task-finish` 继续只展示和使用生成结果，不重复格式说明。

## Risks / Trade-offs

- [默认中文不适合部分团队] → 允许更具体的 Project、Service 或仓库规则覆盖。
- [Core 逐渐承载场景流程] → 只保留一条语言默认值，格式、类型和生成步骤仍归 Git Ops。
- [格式说明膨胀] → 仅保留格式、类型、scope、subject、可选正文和破坏性变更规则。

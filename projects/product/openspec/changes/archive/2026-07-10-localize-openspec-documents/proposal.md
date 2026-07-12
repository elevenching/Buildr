## Why

Buildr 已在项目规则中约定文档与 OpenSpec artifact 默认使用中文，但 `task-triage` 未把该约束落实到采用 OpenSpec 的任务中，且 Buildr 自有的现行与归档文档仍散落英文正文。这会让同一工作流的产出语言不一致，也降低中文协作场景下的可读性。

本变更不包含破坏性变更。

## What Changes

- 扩展 `task-triage`：采用 OpenSpec 时，Agent 必须以中文编写 Buildr 自有的 proposal、design、specs、tasks 及面向用户的说明。
- 明确保留命令、路径、代码标识符、协议字段、YAML/frontmatter 与 OpenSpec 格式关键字的英文原文。
- 翻译 Buildr 自有 Markdown 中的英文正文，包括 `openspec/specs/` 和 `openspec/changes/archive/`；不修改外部加载或 OpenSpec 生成的 `openspec-*` Skills。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `buildr-development-openspec`：补充 Buildr 自有 OpenSpec 文档语言约束和外部生成内容边界。
- `product-agent-skills`：要求任务分流在选择 OpenSpec 时明确中文文档产出约束。

## Impact

- 修改随包 `package/targets/workspace/skills/buildr/task-triage` Skill。
- 修改当前和已归档的 Buildr 自有 OpenSpec 文档中的英文正文。
- 不修改 OpenSpec CLI、外部生成 Skills、代码标识符或命令行接口。

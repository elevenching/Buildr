## ADDED Requirements

### Requirement: task-triage 明确 OpenSpec 中文文档约束
Buildr 的 task-triage Skill MUST 在选择或继续 OpenSpec 工作流时，要求 Agent 使用中文编写 Buildr 自有 OpenSpec 文档和用户可见说明，并说明允许保留英文的格式与技术内容。

#### Scenario: task triage 选择 OpenSpec
- **WHEN** task triage selects or continues an OpenSpec change-flow
- **THEN** its user-facing guidance MUST require Chinese for Buildr-authored document prose
- **AND** it MUST permit English commands、paths、code identifiers、protocol fields、YAML/frontmatter and OpenSpec format keywords

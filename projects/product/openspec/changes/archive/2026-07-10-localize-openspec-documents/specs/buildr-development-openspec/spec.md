## ADDED Requirements

### Requirement: Buildr 自有 OpenSpec 文档使用中文
Buildr MUST 使用中文编写自有 OpenSpec artifact 和相关用户可见说明；命令、路径、代码标识符、协议字段、YAML/frontmatter 以及 OpenSpec 格式关键字可以保留英文。

#### Scenario: Agent 采用 OpenSpec 创建或维护 artifact
- **WHEN** Agent 创建或更新 Buildr 自有的 proposal、design、spec、task 或面向用户的 OpenSpec 状态说明
- **THEN** 叙述性正文 MUST 使用中文
- **AND** Agent MUST 保留命令、路径、代码标识符和 OpenSpec 格式关键字的原文

#### Scenario: 文档来自外部 OpenSpec 生成器
- **WHEN** `openspec-*` Skill 或其他文档由 OpenSpec 上游生成并作为外部内容加载
- **THEN** Buildr MUST NOT 为本地化而修改该内容

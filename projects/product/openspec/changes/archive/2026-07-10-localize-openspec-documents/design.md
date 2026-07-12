## Context

Buildr 的 Project 规则和 `openspec/config.yaml` 已声明 OpenSpec artifact 正文使用中文，但这一约束没有在任务分流时明确呈现。扫描显示外部生成的 `openspec-*` Skills 全文为英文；它们需要保持与 OpenSpec 上游兼容，不能作为本次翻译对象。Buildr 自有文档中则只残留少量英文规范句与若干早期纯英文归档 artifact。

## Goals / Non-Goals

**Goals:**

- 让 `task-triage` 在采用 OpenSpec 时明确中文文档要求和保留英文的例外。
- 将 Buildr 自有的当前与归档 Markdown 英文正文翻译为中文。
- 保持 OpenSpec 结构、命令、路径、代码标识符和格式关键字不变。

**Non-Goals:**

- 不翻译外部加载或 OpenSpec 生成的 `openspec-*` Skills。
- 不重写历史语义、需求编号、文件路径或命令。
- 不改变 OpenSpec schema、CLI 或产品运行时行为。

## Decisions

1. **按内容来源划定翻译边界。** Buildr 自有文档（包括 archive）翻译；上游生成的 `openspec-*` Skill 保持原文，避免本地副本偏离上游。
2. **保留结构关键字。** Markdown 标记、OpenSpec 的 `Requirement`/`Scenario`、`MUST`/`WHEN`/`THEN`、命令、路径、代码和 frontmatter 不翻译，以维持解析与使用兼容性。
3. **翻译英文叙述，不制造伪变更。** 对历史 archive 只转换语言，不调整表达的事实、需求或任务完成状态。

## Risks / Trade-offs

- [Risk] 归档文档翻译后与原始提交文本不同 → 保持语义、结构和完成状态不变，并通过 OpenSpec strict validation。
- [Risk] 将上游生成 Skill 本地化会造成更新漂移 → 按来源边界排除 `openspec-*` Skills。
- [Risk] 误翻译格式关键字导致校验失败 → 保留 OpenSpec 标题、关键词和代码块原文。

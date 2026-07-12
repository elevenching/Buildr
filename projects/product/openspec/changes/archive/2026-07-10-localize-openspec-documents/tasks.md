## 1. OpenSpec 文档语言约束

- [x] 1.1 更新随包 `task-triage`，声明采用 OpenSpec 时的中文文档要求及英文保留边界。
- [x] 1.2 翻译当前 `openspec/specs/` 中的英文叙述性正文，保持 OpenSpec 格式关键字和技术标记不变。
- [x] 1.3 翻译已归档 Buildr 自有 OpenSpec artifact 中的英文正文，不改外部生成内容。

## 2. 验证与运行时同步

- [x] 2.1 更新 package check，验证 task-triage 保留 OpenSpec 中文文档约束。
- [x] 2.2 渲染 Codex runtime，并运行 package check、OpenSpec strict validation、doctor 和 `git diff --check`。

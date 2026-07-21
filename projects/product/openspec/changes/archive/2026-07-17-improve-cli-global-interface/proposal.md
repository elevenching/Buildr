## Why

Buildr 已有多层命令、主题帮助、发布版本和面向 Agent 的 JSON 输出，但缺少标准版本入口、`help <command>` 形式和稳定的未知命令诊断。随着公开 CLI 表面扩大，这些缺口会增加人工操作成本，也让 Agent 无法可靠识别当前 CLI identity 或以机器可读方式处理命令路由错误。

## What Changes

- 增加 `buildr --version`、`buildr -V` 和 `buildr version`，统一从当前 CLI package identity 输出版本；`buildr version --json` 提供登记的公开 JSON schema。
- 增加 `buildr help <command...>`，与既有 `buildr <command...> --help` / `-h` 使用同一主题解析和内容。
- 未知命令改为简洁、可操作的诊断：输出未知输入、相近命令建议、根帮助提示和稳定非零退出码，不再默认打印整页 legacy usage。
- 未知命令携带 `--json` 时输出登记的单一 JSON error 对象；文本模式继续使用 stderr，不向 stdout 混入机器不可解析内容。
- 扩展 CLI compatibility、package parity 和 JSON schema coverage，保护 checkout 与 npm tarball 行为一致。
- 不增加 Shell completion，不把 `-v` 定义为版本短参数，为未来 verbose 语义保留空间。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `cli-product-surface`: 增加公开 version/help 入口与未知命令诊断契约。
- `public-json-contracts`: 增加 version payload 和 CLI error payload 的 schema identity、单对象输出与覆盖要求。

## Impact

- 主要实现：`tools/cli/command/registry.mjs`、`tools/cli/command/help.mjs` 及新的 CLI identity/diagnostic helper。
- 公开行为：新增兼容入口；未知命令输出从整页 usage 收敛为简洁诊断，但退出码继续为非零。
- JSON：新增 additive schema families，不改变既有 JSON payload 的字段或 identity。
- 验证与文档：CLI compatibility、JSON schema registry、checkout/tarball parity 和 CLI reference。

# Buildr 公开 JSON 契约

Buildr 支持 `--json` 的命令在顶层提供 `schemaVersion`。它是输出格式的稳定身份，不是 Buildr package 版本；例如 doctor 使用 `buildr.doctor/v1`，runtime list 使用 `buildr.runtime-list/v1`。

## 兼容规则

- 同一个 `/v1` 内可以新增可选字段；消费者必须忽略不认识的字段。
- 已有字段的含义、类型、必填性或退出状态语义不能在同一个 schema version 内破坏性改变。
- 删除/重命名字段、改变字段类型或根结构时必须发布新的 major identity（例如 `/v2`），并在变更说明中给出迁移方式。
- 每个 command family 使用独立 identity，因此一个命令演进不会迫使所有 JSON 输出同时升级。
- `schemaVersion` 始终位于 JSON 根对象。脚本应先检查它，再解析所需字段。

当前 identity：

| 命令 family | schemaVersion |
|---|---|
| `version` | `buildr.version/v1` |
| 未知 CLI 路由错误 | `buildr.cli-error/v1` |
| `runtime list` | `buildr.runtime-list/v1` |
| `doctor` | `buildr.doctor/v1` |
| `commands check` | `buildr.commands-check/v1` |
| `component list` | `buildr.component-list/v1` |
| `component check` | `buildr.component-check/v1` |
| `builtin list` | `buildr.builtin-list/v1` |
| `update check` | `buildr.update-check/v1` |
| `openspec baseline create` | `buildr.openspec-baseline/v1` |
| `openspec check` | `buildr.openspec-check/v1` |

人类可读的默认输出不受本契约约束。新增 JSON 命令时必须先登记 identity，并补充 checkout 与打包安装后的输出测试。

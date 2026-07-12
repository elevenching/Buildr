## Why

Buildr 的 Claude Code 规则桥接已经改成 `@AGENTS.md` 形式的 live reference。此时 `CLAUDE.md` 中记录的旧内容 hash 只代表生成时的元数据，不再决定 Claude Code 是否能读取最新规则。

当前 runtime check 仍按 managed block 字符串完全一致判断 stale，导致用户只要修改 Buildr workspace 中的 `AGENTS.md`，就会看到 Claude Code runtime 过期告警。这个告警没有实际运行风险，会把用户引向不必要的 `rules render`。

## What Changes

- 区分 Claude Code 规则桥接类型：
  - reference bridge：managed block 主体是 `@AGENTS.md` 等同目录引用。
  - inline bridge：managed block 主体是展开后的规则正文。
- reference bridge 不再用内容 hash 判断 runtime stale，只校验：
  - managed block 存在且结构完整。
  - 引用路径存在。
  - 引用路径解析后指向当前 scope 应桥接的同目录 `AGENTS.md`。
- reference bridge 的旧 hash 过期只作为元数据状态：
  - runtime 操作状态仍为 ok。
  - 输出 `runtime.reference_bridge_metadata_stale` info。
  - 标记 `impact: none`、`userActionRequired: false`。
  - repair 使用 `optional-rules-render`。
- 新渲染的 reference bridge 不再写内容 hash，改为写明 `type: reference` 和 `source: AGENTS.md`。
- `doctor` 默认只展示 action-required 的 runtime warning/error；metadata info 只在 `--verbose` 或 `--json --include-info` 中输出。

## Capabilities

### Modified Capabilities

- `workspace-first-runtime-projection`: 调整 Claude Code reference bridge 的 stale 判定语义。
- `agent-readable-doctor`: 增加非打扰型 runtime metadata info 的输出规则。

## Impact

- 影响 `buildr runtime check claude-code` 的规则桥接检查语义。
- 影响 `buildr rules render claude-code` 的新 managed block 头部格式。
- 影响 `buildr doctor` 默认输出与 `--include-info` 输出。
- 不改变 Skills runtime stale 语义。
- 不改变 reference bridge 缺失、引用不存在、引用错误或 managed block 损坏时的 action-required 诊断。

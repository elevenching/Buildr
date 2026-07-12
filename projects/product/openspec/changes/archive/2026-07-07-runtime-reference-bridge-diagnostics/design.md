## 背景

Claude Code 的 `CLAUDE.md` 规则桥接目前只需要让 Claude Code 读取同目录 `AGENTS.md`。`@AGENTS.md` 是 live reference，源文件内容变化后，Claude Code 读取的是最新内容。

因此，reference bridge 中的内容 hash 不能再代表 runtime 是否 stale。它最多表示该桥接文件的元数据不是最新。

## 决策

### Decision 1: reference bridge 使用语义校验

对 `@AGENTS.md` reference bridge，runtime check 只校验桥接链路：

1. managed block 边界完整。
2. block 内只有一个 `@...` 引用。
3. 引用是相对路径，且解析后指向同目录当前 scope 的 `AGENTS.md`。
4. 目标 `AGENTS.md` 文件存在。

通过这些检查后，规则 runtime 可用。源文件内容变化不构成 stale。

### Decision 2: 旧 hash 兼容但降级

旧版本已经生成的 block 形如：

```md
<!-- BEGIN Buildr managed Claude Code rules bridge; hash: ... -->
@AGENTS.md
<!-- END Buildr managed Claude Code rules bridge -->
```

检查器继续识别该格式。若 hash 与当前 `AGENTS.md` 内容不一致，输出 info：

```json
{
  "status": "info",
  "code": "runtime.reference_bridge_metadata_stale",
  "impact": "none",
  "userActionRequired": false,
  "repair": "optional-rules-render"
}
```

该 finding 不影响 exit code，不进入默认 doctor warning，也不进入 nextSteps。

### Decision 3: 新 render 不再写内容 hash

新生成 block 使用：

```md
<!-- BEGIN Buildr managed Claude Code rules bridge; type: reference; source: AGENTS.md -->
@AGENTS.md
<!-- END Buildr managed Claude Code rules bridge -->
```

这样避免把 reference bridge 误读成需要按内容 hash 同步的 inline bridge。

### Decision 4: doctor 默认过滤 info

`doctor` 默认面向用户和 Agent 的下一步行动，只输出需要处理的 warning/error。metadata info 保留给显式排查场景：

- 文本输出：`buildr doctor --verbose`
- JSON 输出：`buildr doctor --json --include-info`

## 风险

- 旧版 hash stale 不再触发 `rules render`，但 reference bridge 会实时读取源文件，因此没有规则读取风险。
- 如果用户手工把引用改到其他路径，检查仍会报告 stale 并建议 render。
- 如果未来引入 inline bridge，需要继续用内容 hash 或等价机制判断内容 stale。

# Minimal Buildr Workspace

这个示例展示从 CLI 可用到 Agent runtime 可用的最小路径，不保存生成后的 runtime 文件。

先用 `buildr runtime list --json` 选择当前 Agent 对应的 adapter id（`claude-code`、`codex`、`cursor`、`qoder`、`trae`、`trae-work` 或 `workbuddy`）：

```bash
mkdir buildr-demo
cd buildr-demo
buildr runtime list --json
buildr init --agent <agent> --target . --name buildr-demo --profile personal
```

该命令已包含完整 sync 和最终 doctor；已有 workspace 后续更新时再使用 `buildr sync <agent> --target .`。

随后可以创建 Project 并接入 Service：

```bash
buildr project create shop --target . --title "Shop" --description "示例业务项目"
buildr service create shop/api <git-url> --branch main --target . --type backend
buildr doctor --agent <agent> --target . --json
```

长期事实写入 `AGENTS.md`、`rules/`、`skills/`、`commands/`、`components/` 和 `projects/`；各 Agent 的接入路径见 [Agent Runtime Adapters](../../docs/agent-runtime-adapters.md)，生成目标都是可重建 runtime。

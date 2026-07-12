## Context

Buildr 产品仓本身也是一个 Buildr workspace。此前默认 workspace/project 规则源保存在 root `rules/` 下，导致产品 baseline 源和当前开发 workspace 的安装后资产混在一起。

这次改动把默认规则源放回 `product/package/`，让 `Buildr/` root 通过正常 `buildr init` 路径消费产品 baseline。

## Decisions

### 1. 产品 baseline 规则源归入 package

默认 workspace/project 规则源维护在：

```text
product/package/workspace-rules/AGENTS.workspace.md
product/package/workspace-rules/AGENTS.project.md
```

`product/package/manifest.yml` 显式引用这些文件生成用户 workspace/project 的 `AGENTS.md`。

### 2. 当前 root 使用安装副本

当前 Buildr root 保留组合入口 `AGENTS.md`，并使用 `AGENTS.workspace.md` 作为通用 workspace 规则副本。root `rules/` 不再保存 `AGENTS.workspace.md` 或 `AGENTS.project.md` 这类产品 baseline 源。

### 3. init 兼容已有 root AGENTS

普通新 workspace 没有 `AGENTS.md` 时，`buildr init` 仍生成 root `AGENTS.md`。

如果目标 root 已经存在 `AGENTS.md`，说明它可能是组合入口或用户自定义入口。`buildr init` 不覆盖它，而是把默认 workspace 规则写入 `AGENTS.workspace.md`。

### 4. 不改变 runtime render

`rules render` 仍只负责把现有规则源投射到需要桥接的 Agent runtime，例如 Claude Code 的 `CLAUDE.md` managed block。本次兼容行为属于 workspace baseline 安装，不属于 runtime render。

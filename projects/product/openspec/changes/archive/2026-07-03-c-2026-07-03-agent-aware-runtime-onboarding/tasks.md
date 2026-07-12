## 1. Bootstrap 与文档

- [x] 1.1 更新 `product/package/bootstrap/guide.md`，加入 Agent runtime 自判流程。
- [x] 1.2 在 guide 中明确 Codex 直接使用 `AGENTS.md`，不执行 rules render。
- [x] 1.3 在 guide 中保留 Claude Code 的 `runtime check`、`rules render`、`skills render` 流程。
- [x] 1.4 更新产品手册和 runtime adapter 文档，区分标准资产、规则桥接和 Skills runtime。

## 2. 验证

- [x] 2.1 扩展产品验证脚本，检查 bootstrap guide 包含 Codex/Claude Code 分支说明。
- [x] 2.2 运行 `openspec validate c-2026-07-03-agent-aware-runtime-onboarding --strict`。
- [x] 2.3 运行 `openspec validate --all --strict`。
- [x] 2.4 运行 `buildr package check` 和产品 MVP 验证脚本。

## 3. Claude Code managed block

- [x] 3.1 将 `CLAUDE.md` rules render 改为只覆盖 Buildr managed block。
- [x] 3.2 将 runtime check 改为只校验 Buildr managed block，允许用户在区块外保留 Claude Code 专属内容。
- [x] 3.3 用临时 workspace 验证区块外用户内容可保留、规则变更可正确触发 stale。

## 4. Agent 调用视角

- [x] 4.1 将 bootstrap guide 改为 Agent 已发现/安装 Buildr 后的命令使用指南。
- [x] 4.2 明确 `service create` 是当前 MVP 创建和维护 service metadata 与 service repo 引用的入口。

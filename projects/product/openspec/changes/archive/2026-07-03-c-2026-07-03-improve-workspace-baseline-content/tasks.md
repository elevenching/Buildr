## 1. 规则源与组合

- [x] 1.1 将 `rules/AGENTS.workspace.md` 扩展为发布版 workspace 规则源。
- [x] 1.2 将 root `AGENTS.md` 改为读取 `rules/AGENTS.workspace.md` 后叠加产品/业务 overlay。
- [x] 1.3 确认 `rules/AGENTS.workspace.md` 不引用 `product/`、`acme` 或私有路径。

## 2. README baseline

- [x] 2.1 改进 `product/package/README.workspace.md`，提升默认 README 的 onboarding 价值。
- [x] 2.2 确认 README 不把 Claude Code 命令当成所有 Agent 的固定步骤。

## 3. 验证

- [x] 3.1 运行 `openspec validate c-2026-07-03-improve-workspace-baseline-content --strict`。
- [x] 3.2 运行 `buildr package check`。
- [x] 3.3 用临时目录执行 `buildr init`，检查生成的 `AGENTS.md` 和 `README.md` 内容。

## 4. 后续收敛

- [x] 4.1 删除未被当前命令消费的低信息量 `project/practices/skills` README 随包占位。
- [x] 4.2 压缩 `AGENTS.workspace.md`、`AGENTS.buildr.md`、`AGENTS.acme.md`，保留可执行规则和真实路由。

## 1. Task Finish Skill 与路由

- [x] 1.1 新增 `task-finish` Skill，实现收尾前置检查、OpenSpec 归档、验证证据、Git 集成和本地清理状态机
- [x] 1.2 更新 `git-ops` 与 `task-worktree` Skills，移交完整“收尾”路由并保持各自授权和生命周期边界
- [x] 1.3 更新 workspace/package manifests 与产品入口 Buildr Skill，随包发布并路由 `task-finish`

## 2. 产品事实与防回退

- [x] 2.1 更新 Product Project 规则、产品文档和 current state，说明自动收尾语义与安全排除项
- [x] 2.2 扩展 package check，校验 `task-finish` manifest、状态机、EOF 处理、验证复用和授权边界文本
- [x] 2.3 扩展产品 E2E，确认 `task-finish` 随包初始化、可渲染且 Git Ops 不再占用完整“收尾”意图

## 3. 验证与自举入口

- [x] 3.1 运行 package check、产品 E2E、OpenSpec strict validation、`npm pack --dry-run` 和 `git diff --check`
- [x] 3.2 确认主 `dev` workspace 保持干净，当前 task worktree 只包含本 change 改动
- [x] 3.3 从当前 Product checkout 刷新本机 Buildr 开发入口，并运行 help 与 Codex doctor

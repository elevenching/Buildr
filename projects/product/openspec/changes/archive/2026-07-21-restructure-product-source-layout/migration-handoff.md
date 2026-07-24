# Workspace 功能恢复交接

## 当前隔离状态

- 架构迁移 change：`restructure-product-source-layout`
- 架构迁移 worktree：仓库 `.worktrees/restructure-product-source-layout`
- 冻结功能 change：`productize-workspace-project-service`
- 冻结功能 worktree：仓库 `.worktrees/productize-workspace-project-service`
- 产品化任务看板只存在于冻结功能 worktree：`projects/product/openspec/knowledge/task-boards/2026-07-20-buildr-productization-modeling.html`

架构迁移期间不修改冻结功能 worktree，也不从未集成的架构 checkout 更新主自举 Workspace 或 Agent runtime。

## 集成后的恢复顺序

1. 将 `restructure-product-source-layout` 完成验证、OpenSpec 收口并集成到 `dev`。
2. 在冻结功能 worktree 重新读取其 change、Git 状态和 checkpoint，确认没有新增并行修改。
3. 把功能分支更新到包含架构迁移的新 `dev`；只解决内部路径迁移冲突，不借机改变 Workspace/Project/Service 需求。
4. 删除功能分支中仅用于旧 Workspace metadata 迁移的根目录 diff，重新确认 `.buildr/workspace.yml` 的事实来源。
5. 将尚未合入的 Workspace 功能按新 owner 放置：纯模型进入 `src/domain/`，用例进入 `src/application/`，HTTP/Web adapter 进入 `src/interfaces/local-app/`，基础设施进入 `src/infrastructure/`，测试进入 `test/`。
6. 更新同一产品化任务看板，新增架构迁移 change 关联，把源码布局迁移标为 Workspace UI 切片的已满足前置，并记录功能 change 的实际恢复状态。
7. 按恢复后 change 的 affected 范围重新验证，不复用架构迁移 Candidate 作为功能实现证据。

## 边界

- 不从架构分支直接复制或重写功能分支的任务看板。
- 不把旧路径 shim 带回功能 change。
- 不把现有 application handler 误迁为纯 domain；只有存储无关的 Workspace、Project、Service 实体和值对象进入 `src/domain/`。
- 功能恢复是迁移集成后的独立执行阶段，不属于当前架构 Candidate 的已验证内容。

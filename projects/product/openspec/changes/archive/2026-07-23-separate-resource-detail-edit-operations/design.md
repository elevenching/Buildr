## Context

上一轮信息架构已提供资源独立详情，但 Project/Service 详情仍放置编辑表单，Project 详情还重复展示服务和变更目录。这会把事实阅读、关联资源定位和低风险修改混在同一屏。所有修改仍必须保留现有 HTTP API、revision CAS 和迁移只读语义。

## Goals / Non-Goals

**Goals:**

- 详情页只解释一个资源，编辑页只处理稳定 metadata。
- Project 详情只提供服务、变更和编辑的明确操作，不复制目录内容。
- 对目录、详情和编辑路径都提供清晰且明显的侧栏当前态。

**Non-Goals:**

- 不为 Change 增加直接编辑能力。
- 不改变 API、Domain、prompt-only 创建或 CAS 行为。

## Decisions

### 用 `/edit` 子路由承载 metadata 表单

Project 使用 `/projects/:projectCode/edit`，Service 使用 `/services/:projectCode/:serviceCode/edit`。详情页与目录均链接到编辑 URL；编辑成功后保留当前编辑上下文和明确反馈。

在详情页以抽屉显示表单的方案不采用，因为它仍混合阅读和修改状态，也不能提供可链接的编辑上下文。

### Project 详情只保留关联资源操作

项目详情用一个紧凑操作区链接服务目录、变更目录和编辑页，而不拉取或渲染 Service/Change 列表。目录继续是资源集合的唯一阅读模型。

### 用独立子项而非分组强调当前导航

资源分组保持展开状态，当前 Project/Service/Change 子项使用高对比背景和左侧标记；详情与编辑路由继承其资源类型，避免分组背景掩盖当前项。

## Risks / Trade-offs

- [多一个编辑 URL] → 在目录和详情都提供编辑入口，并为刷新/保存添加浏览器测试。
- [Project 详情信息减少] → 明确提供服务数量、变更目录和服务目录操作，而不隐藏资源入口。
- [路由高亮遗漏] → 统一 route id 并覆盖目录、详情和编辑三种路径。

## Why

当前项目页面只能在列表旁查看元数据，尚未形成稳定的项目 URL 和项目内资源上下文。随着服务、OpenSpec、规则、验证与命令逐步进入本机应用，需要先把项目建设成可导航的管理中心，让人和 Agent 能围绕同一个项目身份查看真实状态并进入后续资产能力。

## What Changes

- 增加可直接访问的项目详情路由 `/projects/:projectCode`，从项目列表进入后保留稳定 URL，并支持刷新与浏览器历史导航。
- 建设项目详情首批“概览”视图，展示项目身份、说明、来源声明、实时 Git 观察与诊断状态。
- 将项目与服务目录建设为 PC 管理系统常用的表格视图：数据列只展示真实事实，操作栏提供明确行为，整行不作为默认入口。
- 在项目详情中展示所属服务摘要和服务列表，并提供进入按项目过滤的服务管理表格与创建服务 Agent Action 的明确入口。
- 为 OpenSpec、规则、验证和命令展示基于真实文件或 Application read model 的能力入口；本阶段不可管理的能力必须明确标为后续阶段，不伪造数量或状态。
- 保持项目 metadata 修改、revision CAS、迁移只读、prompt-only 创建和本机应用安全边界不变。
- 不包含破坏性变更，不新增持久化字段或高影响直接写操作。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `local-workspace-application`: 增加项目详情 canonical route、项目概览、所属服务摘要和真实项目资产入口契约。

## Impact

- Web interface：扩展本机应用 router、项目与服务表格、项目详情 feature，并调整项目/服务间导航；窄屏只保证基本可用，不建设独立移动端流程。
- HTTP interface：为参数化项目详情页面提供受限 App Shell fallback；现有 Project、Service API payload 保持兼容。
- Application read model：优先组合现有 Project detail 与 Service list，不建立第二事实源；若现有接口不足，只增加只读聚合边界。
- 验证：补充参数化路由、未知项目、详情刷新、服务空状态、Agent Action 上下文和 390px 布局测试。

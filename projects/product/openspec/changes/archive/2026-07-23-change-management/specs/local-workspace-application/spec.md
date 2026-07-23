## ADDED Requirements

### Requirement: 本机应用必须提供 Change 管理视图
Buildr 本机应用 MUST 在资源导航中提供独立的变更（Change）管理视图，并 MUST 使用明确的表格操作栏、过滤和详情入口展示真实 Project Change。

#### Scenario: 打开 Change 表格
- **WHEN** 用户访问 `/changes`
- **THEN** 页面 MUST 展示 Change 名称、所属项目、生命周期、任务进度、更新时间和操作栏
- **AND** 页面 MUST 提供项目与 active/archived 生命周期过滤

#### Scenario: 使用表格操作栏
- **WHEN** 用户查看任一 Change 行
- **THEN** 操作栏 MUST 提供详情和交给 Agent 的明确行为
- **AND** 表格行本身 MUST NOT 是唯一的信息或行为入口

#### Scenario: 创建 Change
- **WHEN** 用户点击“创建变更”
- **THEN** 页面 MUST 使用抽屉或弹窗收集所属项目与目标说明
- **AND** MUST 展示可复制的 Agent prompt，不得直接写入 OpenSpec

### Requirement: 本机应用必须提供可链接的 Change 详情页
Buildr 本机应用 MUST 使用稳定独立路由展示 Change 详情，并 MUST 将长 artifact 内容与短 prompt 交互分离。

#### Scenario: 打开 Change 详情
- **WHEN** 用户访问 `/changes/<projectCode>/<changeRef>`
- **THEN** 页面 MUST 展示 identity、lifecycle、任务进度、artifact availability 和可用的 proposal、design、specs、tasks 内容
- **AND** 页面刷新后 MUST 保持同一 Change 上下文

#### Scenario: Change 不存在
- **WHEN** 详情 API 返回 not found
- **THEN** 页面 MUST 显示明确空状态并提供返回 Change 表格的入口

#### Scenario: 详情中的 Agent 行为
- **WHEN** 用户在详情中选择继续或审阅
- **THEN** 页面 MUST 打开短交互抽屉并生成可复制 prompt
- **AND** MUST NOT 叠加承载第二份完整 Change 详情的二级抽屉

### Requirement: 项目详情必须展示所属 Change 摘要
Buildr 本机应用 MUST 在项目详情中展示该 Project 的 Change 数量、有限列表和进入过滤后 Change 表格的稳定入口。

#### Scenario: Project 存在 Change
- **WHEN** 项目详情读取到 active 或 archived Change
- **THEN** 页面 MUST 展示总数和最近 Change 摘要
- **AND** “管理变更” MUST 进入带 Project filter 的 Change 表格

#### Scenario: Project 没有 Change
- **WHEN** Change read model 返回空集合
- **THEN** 项目详情 MUST 显示明确空状态
- **AND** MUST 保留创建 Change 的 Agent 入口

## ADDED Requirements

### Requirement: 本机应用必须使用统一的资源目录与独立详情模型
Buildr 本机应用 MUST 将已登记工作空间作为全局目录；进入工作空间后，Project、Service 和 Change MUST 分别提供资源目录和可刷新、可返回的独立详情 URL。资源目录 MUST NOT 承载完整详情或主编辑表单。

#### Scenario: 从服务目录进入详情
- **WHEN** 用户在 `/services` 中选择某个服务的“详情”操作
- **THEN** 页面 MUST 导航到 `/services/:projectCode/:serviceCode`（在工作空间 URL 前缀内）
- **AND** 服务目录 MUST NOT 在表格下方展开详情或编辑表单

#### Scenario: 直接打开服务详情
- **WHEN** 用户访问或刷新合法的 `/services/:projectCode/:serviceCode`
- **THEN** HTTP interface MUST 返回本机应用 shell，页面 MUST 读取并展示对应 Service
- **AND** 浏览器历史导航 MUST 恢复相同 Project 与 Service 上下文

#### Scenario: 详情页承载低风险编辑
- **WHEN** 用户在 Service 详情页保存合法的 name、description 或 type
- **THEN** 页面 MUST 使用既有 Service metadata API 和 revision CAS
- **AND** 保存、冲突和迁移只读反馈 MUST 明确且不得影响目录页

### Requirement: 本机应用必须以控制台级信息层级呈现资源
Buildr 本机应用 MUST 使用紧凑的工作控制台信息层级：中文为主语言、技术身份与 Git observation 为次级信息、稳定 metadata 编辑与资源目录分离，且所有创建动作 MUST 明示为交给 Agent 的 prompt-only 行为。

#### Scenario: 查看资源列表
- **WHEN** 用户打开 Project、Service 或 Change 目录
- **THEN** 页面 MUST 提供一致的标题、数量、过滤控件与“交给 Agent 创建”主操作
- **AND** 表格操作 MUST 使用一致的低强调详情链接或按钮，资源行本身不得同时承担主编辑流程

#### Scenario: 查看资源详情
- **WHEN** 用户打开 Project、Service 或 Change 详情
- **THEN** 页面 MUST 按页头、概览、稳定 metadata、技术信息和关联资源的层级展示真实 read model
- **AND** UUID、revision、路径、source 和 Git observation MUST 不占用主标题或主概览视觉

#### Scenario: 反映真实导航层级
- **WHEN** 用户在工作空间内浏览目录或详情
- **THEN** 应用 shell MUST 显示可理解的工作空间、资源与当前资源层级
- **AND** 侧边栏当前工作空间 MUST 只展示名称和截断路径，并提供返回工作空间目录的明确入口

### Requirement: 工作空间目录与资源视图必须在窄屏保持可用
Buildr 本机应用 MUST 在桌面、约 1024px 和 390px 宽度保持可读且主要操作可用，不让页面主容器发生横向溢出。

#### Scenario: 查看工作空间目录
- **WHEN** 用户在宽屏、中屏或窄屏打开工作空间目录
- **THEN** 工作空间卡片 MUST 分别以 2–3 列、2 列和 1 列等宽网格显示
- **AND** 同一张卡内的状态、路径和操作位置 MUST 保持一致，整卡可进入工作空间，移除操作为次级行为

#### Scenario: 在窄屏查看和编辑资源
- **WHEN** viewport 宽度为 390px
- **THEN** 资源目录、详情、稳定 metadata 表单与“交给 Agent”操作 MUST 可见并可操作
- **AND** 必要的表格横向滚动 MUST 限定在表格容器内

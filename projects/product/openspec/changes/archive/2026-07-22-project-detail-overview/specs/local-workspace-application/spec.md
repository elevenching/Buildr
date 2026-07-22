## MODIFIED Requirements

### Requirement: 项目与服务独立视图必须保留现有能力
Buildr MUST 为项目与服务提供独立管理视图和稳定的项目详情上下文，且二者现有 read、metadata update、diagnostic 和 prompt-only 行为 MUST 保持可用。

#### Scenario: 打开项目视图
- **WHEN** 用户访问 `/projects`
- **THEN** 页面 MUST 以表格只展示当前工作空间的项目目录和项目管理入口
- **AND** 每个项目 MUST 在操作栏提供进入其 canonical 详情 URL 和按项目过滤的服务管理入口
- **AND** PC 表格整行 MUST NOT 作为默认操作入口
- **AND** MUST NOT 同时渲染服务管理内容

#### Scenario: 直接打开项目详情
- **WHEN** 用户访问或刷新合法的 `/projects/:projectCode`
- **THEN** HTTP interface MUST 返回本机应用 shell
- **AND** 页面 MUST 展示对应项目的身份、说明、来源声明、实时观察和诊断状态
- **AND** 浏览器历史导航 MUST 能恢复同一项目上下文

#### Scenario: 项目详情展示所属服务
- **WHEN** 对应 Project 与 Service read model 均可读取
- **THEN** 项目详情 MUST 展示该项目的服务数量与服务列表
- **AND** MUST 提供进入服务管理和创建服务 Agent Action 的入口
- **AND** 创建服务 MUST 自动携带当前项目 code

#### Scenario: 项目没有服务
- **WHEN** 项目详情中的 Service read model 返回空列表
- **THEN** 页面 MUST 展示当前项目尚未登记服务的空状态
- **AND** MUST NOT 渲染虚构的服务详情或状态

#### Scenario: 项目不存在
- **WHEN** 项目详情 API 对 URL 中的 projectCode 返回 not found
- **THEN** 页面 MUST 展示项目不存在的明确错误状态
- **AND** MUST 提供返回项目目录的入口
- **AND** MUST NOT 回退展示其他项目

#### Scenario: 展示后续项目资产入口
- **WHEN** 项目详情展示 OpenSpec、规则、验证或命令入口但本阶段尚未提供对应 read model
- **THEN** 页面 MUST 明确标记该能力属于后续阶段
- **AND** MUST NOT 展示未经真实来源证明的数量、健康度或可编辑状态

#### Scenario: 打开服务视图
- **WHEN** 用户访问 `/services` 或携带合法项目查询参数
- **THEN** 页面 MUST 以表格明确展示当前所属项目并只列出该项目的服务
- **AND** 用户 MUST 能切换已登记项目来查看对应服务
- **AND** 每个服务 MUST 通过明确的“详情”操作进入现有详情与 metadata 修改能力
- **AND** PC 表格整行 MUST NOT 作为默认操作入口

#### Scenario: 窄屏查看管理表格
- **WHEN** 用户在窄屏查看项目或服务管理视图
- **THEN** 页面 MUST 保持信息可读且关键操作可用
- **AND** MAY 使用表格横向滚动而无需提供独立移动端管理流程

#### Scenario: 当前项目没有服务
- **WHEN** 当前所属项目的 Service read model 返回空列表
- **THEN** 页面 MUST 展示该项目尚未登记服务的空状态与创建服务入口
- **AND** MUST NOT 渲染空的服务详情表单

#### Scenario: 使用项目或服务写操作
- **WHEN** 用户在独立视图修改项目或服务 metadata 或生成创建 prompt
- **THEN** HTTP API MUST 继续执行已有 session、Origin、JSON、body size、字段白名单和 revision conflict 约束

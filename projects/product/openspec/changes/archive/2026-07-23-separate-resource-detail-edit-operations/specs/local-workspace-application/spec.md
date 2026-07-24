## ADDED Requirements

### Requirement: 资源详情与修改必须使用独立操作
Buildr 本机应用 MUST 将 Project 与 Service 的详情呈现保持为只读；修改稳定 metadata MUST 通过明确、独立的编辑操作和 URL 进入。Project 详情 MUST NOT 内嵌所属 Service 或 Change 的目录内容，而应提供进入相应资源目录的操作。

#### Scenario: 查看只读资源详情
- **WHEN** 用户打开 Project 或 Service 详情
- **THEN** 页面 MUST 展示身份、说明、概览、技术信息和相关目录操作
- **AND** 页面 MUST NOT 直接展示可编辑 input、textarea 或保存按钮

#### Scenario: 从资源目录开始修改
- **WHEN** 用户在 Project 或 Service 目录中选择“编辑”操作
- **THEN** 页面 MUST 导航到对应资源的独立编辑 URL
- **AND** 编辑页面 MUST 保持现有 metadata 白名单、revision CAS、迁移只读与反馈语义

#### Scenario: 从项目详情访问关联资源
- **WHEN** 用户查看 Project 详情
- **THEN** 页面 MUST 提供进入该项目服务目录、变更目录和 Project 编辑页的明确操作
- **AND** 页面 MUST NOT 重复呈现服务或变更资源列表

#### Scenario: 侧边栏指示当前资源
- **WHEN** 用户打开项目、服务、变更目录或其详情/编辑页
- **THEN** 相应侧边栏资源项 MUST 显示明显的当前状态
- **AND** 资源分组状态 MUST NOT 取代当前资源项的高亮

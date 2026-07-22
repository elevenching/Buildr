## ADDED Requirements

### Requirement: Buildr 自举 Product 必须登记真实 application Service
Buildr Product Project MUST 在 canonical Service registry 中登记承载 Buildr 可执行产品的 `buildr` Service，并 MUST 使用真实 workspace source path，而不是空壳、重复路径或只为界面展示生成的 fixture。

#### Scenario: 读取 Product Service registry
- **WHEN** CLI、doctor 或本机应用读取 Product Project 的 Service collection
- **THEN** registry MUST 返回 code 为 `buildr`、名称为“Buildr”、type 为 `application` 的 Service
- **AND** Service `source.path` MUST 等于 `projects/product/services/buildr`

#### Scenario: 定位 Buildr Service 资产
- **WHEN** Application 通过 Service metadata 定位 `product/buildr`
- **THEN** 对应目录 MUST 存在并包含真实 Buildr package 与 Service `AGENTS.md`
- **AND** Project root 与 Service root MUST NOT 声明重叠 source path

#### Scenario: 观察 workspace-source Buildr Service
- **WHEN** Buildr Service 与 Product Project 使用同一上级 Git workspace
- **THEN** Service Domain MUST 保持 `source.type: workspace`
- **AND** 页面与 doctor MUST NOT 虚构独立 remote、integration branch 或 Service Git 状态

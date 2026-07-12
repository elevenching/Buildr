## MODIFIED Requirements

### Requirement: Buildr workspace 作为项目管理资产库
Buildr MVP MUST 将 Buildr root 定义为长期项目管理资产库和 Organization 上下文实例，用于管理 Rules、OpenSpec、Skills、Components、Commands、Project registry、Service registry 和 Agent runtime 渲染关系。

#### Scenario: 初始化 workspace
- **WHEN** Agent 执行 `buildr init`
- **THEN** Buildr MUST 创建可作为 Organization 上下文维护的根资产骨架，而不是创建 `organizations/` 容器
- **AND** Buildr MUST NOT 把 Practices 作为独立受管资产类型

#### Scenario: 共享 workspace
- **WHEN** 组织将 Buildr workspace 作为 Git repo 共享
- **THEN** root MUST 保存项目管理资产，而不是保存 service repo 的业务代码内容

# Buildr workspace 管理规范

## Purpose

定义 Buildr workspace、root-as-Organization、项目资产目录和嵌套 service repo 忽略关系的 MVP 行为。

## Requirements

### Requirement: Buildr workspace 作为项目管理资产库
Buildr MVP MUST 将 Buildr root 定义为长期项目管理资产库和 Organization 上下文实例，用于管理 Rules、OpenSpec、Skills、Components、Commands、Project registry、Service registry 和 Agent runtime 渲染关系。

#### Scenario: 初始化 workspace
- **WHEN** Agent 执行 `buildr init`
- **THEN** Buildr MUST 创建可作为 Organization 上下文维护的根资产骨架，而不是创建 `organizations/` 容器
- **AND** Buildr MUST NOT 把 Practices 作为独立受管资产类型

#### Scenario: 共享 workspace
- **WHEN** 组织将 Buildr workspace 作为 Git repo 共享
- **THEN** root MUST 保存项目管理资产，而不是保存 service repo 的业务代码内容

### Requirement: workspace 目录骨架
Buildr MVP MUST 使用 root-as-Organization 模型生成项目资产目录。

#### Scenario: 创建项目资产目录
- **WHEN** Buildr 创建项目 `<project>`
- **THEN** Buildr MUST 在 `projects/<project>/` 下维护项目级资产

#### Scenario: 准备 service 默认目录
- **WHEN** Buildr 需要在项目下放置 service repo
- **THEN** Buildr MUST 默认使用 `projects/<project>/services/<service>/` 作为 service repo 目录

### Requirement: workspace 忽略嵌套 service repo
Buildr MVP MUST 防止外层 workspace Git 误提交嵌套 service repo 的业务代码内容。

#### Scenario: service repo 嵌套在 workspace 中
- **WHEN** Buildr 将 service repo clone 到项目默认 service 目录
- **THEN** Buildr MUST 维护 workspace `.gitignore` 规则以忽略该 service repo 的业务代码内容

#### Scenario: 诊断忽略规则
- **WHEN** `doctor` 检查 workspace 状态
- **THEN** Buildr MUST 能报告嵌套 service repo 是否被 workspace Git 忽略

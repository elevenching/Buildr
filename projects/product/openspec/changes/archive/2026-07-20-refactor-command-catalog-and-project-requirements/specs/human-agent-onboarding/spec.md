## ADDED Requirements

### Requirement: Onboarding 区分 Command definition、requirement 与本机状态
Buildr onboarding MUST 引导 Agent 将 workspace Command catalog、Project requirements 和 user/machine environment 视为不同事实层。

#### Scenario: 用户声明组织认可工具
- **WHEN** 用户希望在 workspace 中登记可复用外部 CLI
- **THEN** Agent MUST 使用 Commands catalog 维护入口创建或更新 definition
- **AND** MUST NOT 因登记 definition 自动把所有 Projects 标记为需要该工具

#### Scenario: 用户声明 Project 需要工具
- **WHEN** 用户说明某个 Project 需要已登记 Command
- **THEN** Agent MUST 在该 Project `commands.yml` 增加 requirement reference
- **AND** MUST NOT 复制 executable、probe 或 install hint

#### Scenario: 用户要求安装工具
- **WHEN** machine observation 显示 required Command 缺失或版本不满足
- **THEN** Agent MUST 说明 requirement 来源和环境差异
- **AND** 只有取得相应授权后 MAY 协作安装或升级
- **AND** Buildr onboarding MUST NOT 声称 Commands add/check 会完成安装

## ADDED Requirements

### Requirement: 公开 README 统一产品入口与两种模式
Buildr MUST 以 workspace 根 README 作为公开产品入口，并分别说明开发 checkout 与 registry package 两种快速开始和更新模式。

#### Scenario: 根 README 介绍 Buildr 产品
- **WHEN** 用户或 Agent 从仓库根 README 了解 Buildr
- **THEN** README MUST 先说明 Buildr 产品定位、核心模型、快速开始、主要能力和文档入口
- **AND** README MUST 在产品说明之后再说明该仓库同时是 Buildr 自举 workspace

#### Scenario: 两种快速开始
- **WHEN** README 提供 Buildr 安装说明
- **THEN** README MUST 分别提供开发 checkout 安装和 registry package 安装路径
- **AND** 两种路径 MUST 汇合到 runtime discovery 与 `buildr init --agent <agent>` onboarding

#### Scenario: 不重复维护 Product README
- **WHEN** 根 README 已承载公开产品说明
- **THEN** Product Project MUST NOT 继续维护内容重复的独立产品 README
- **AND** 仓内文档链接 MUST 指向根 README 或对应权威产品文档

## MODIFIED Requirements

### Requirement: 开发仓库安装必须形成 Agent 可用闭环
Buildr MUST 提供与当前仓库结构一致的开发 checkout 安装路径，并提供 registry package 安装路径，使 Agent 在没有预装 Buildr Skill 的环境中能够准备 CLI，再用单个高层初始化命令完成 workspace 源资产、当前 runtime 和诊断闭环。

#### Scenario: Agent 从干净开发仓库开始
- **WHEN** Agent 在 Buildr 仓库的干净 clone 中按根 README 安装 Buildr
- **THEN** 安装说明 MUST 使用仓库中真实存在的产品目录和安装脚本
- **AND** 安装流程 MUST 确定性准备 lockfile 声明的运行依赖
- **AND** Agent MUST 能运行 `buildr runtime list --json`

#### Scenario: Agent 从 registry package 开始
- **WHEN** Agent 在没有 Buildr checkout 的环境中按根 README 安装 Buildr
- **THEN** 安装说明 MUST 使用发布的 npm package identity 和支持的 registry 安装方式
- **AND** Agent MUST 能运行 `buildr runtime list --json`

#### Scenario: Agent 完成首次 runtime 准备
- **WHEN** CLI 已从开发 checkout 或已安装 npm package 可用，且 Agent 已从 supported runtime list 选择自身 adapter
- **THEN** 公开 onboarding MUST 引导 Agent 运行 `buildr init --agent <agent>`
- **AND** 该单个命令 MUST 创建源资产、安装产品 Buildr Skill、投射 workspace Skills 并运行最终 doctor
- **AND** 最终 doctor MUST 不包含需要立即处理的 error

#### Scenario: 两种安装模式回归验证
- **WHEN** 产品完整验证运行 onboarding smoke tests
- **THEN** verifier MUST 分别覆盖不包含 `node_modules` 和 Agent runtime 产物的临时开发 checkout，以及从 npm package 安装的临时 prefix
- **AND** 两种模式 MUST 都能从公开安装入口运行 `buildr runtime list --json` 并仅用 `buildr init --agent <agent>` 完成 workspace/runtime onboarding
- **AND** verifier MUST 独立读取 doctor JSON 证明最终状态可用

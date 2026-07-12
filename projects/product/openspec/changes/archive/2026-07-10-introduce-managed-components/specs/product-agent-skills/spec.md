## ADDED Requirements

### Requirement: Buildr Skill 引导安装对象路由
Buildr 产品内置 Skill MUST 帮助 Agent 根据用户明确意图和安装对象的实际资源组成，选择单项资产维护或 workspace Component 生命周期。

#### Scenario: 用户明确要求 Component
- **WHEN** 用户明确要求将某个对象作为 Component 安装或管理
- **THEN** Buildr Skill MUST 引导 Agent 使用 Component 流程
- **AND** 即使该 Component 只有一个 Rule、Skill 或 Command collection，Agent MUST NOT 擅自降级为单项资产安装

#### Scenario: 用户明确要求单项资产
- **WHEN** 用户明确要求安装或登记一个 Rule、Skill 或 Command，且没有要求 Component 生命周期
- **THEN** Buildr Skill MUST 引导 Agent使用对应资产维护入口
- **AND** Buildr Skill MUST NOT 无理由包装为 Component

#### Scenario: 用户只要求安装某个对象
- **WHEN** 用户只表达“安装 X”而没有说明资产类型
- **THEN** Buildr Skill MUST 引导 Agent 阅读权威来源并识别会增加的 Rules、Skills、Commands 和其他资源
- **AND** 当结果跨越多个 Buildr 资产类型或需要统一版本、更新和卸载时，Agent MUST 创建或选择 Component
- **AND** 当只有单一资产且没有统一生命周期需求时，Agent MUST 使用对应单项资产入口

#### Scenario: 安装对象组成不明
- **WHEN** Agent 无法可靠确认安装对象包含哪些资源或这些资源是否属于同一生命周期
- **THEN** Agent MUST 向用户说明未知点或继续调查
- **AND** Agent MUST NOT 要求 Buildr CLI 根据名称、目录或网页内容猜测 Component 边界

### Requirement: Buildr Skill 引导 Component 安装闭环
Buildr Skill MUST 将 Component definition 视为 Agent 已完成语义分析后的确定性输入，并引导 CLI 完成源资产、runtime 和 doctor 闭环。

#### Scenario: 使用随包 Component
- **WHEN** Buildr package 已提供匹配用户目标的 Component
- **THEN** Agent MUST 优先检查并复用其版本、来源、成员和 integrity 定义
- **AND** Agent MUST 在执行前向用户说明将安装的资产类型和外部 Command 要求

#### Scenario: 创建 workspace-owned Component
- **WHEN** 上游未提供 Buildr Component，但用户意图或资源组成要求统一生命周期
- **THEN** Buildr Skill MUST 引导 Agent 在 workspace `components/` 中创建完整定义
- **AND** 定义 MUST 记录可验证的来源、版本、成员和 integrity
- **AND** Agent MUST 在定义通过 Buildr 检查后再执行安装

#### Scenario: 安装或卸载完成检查
- **WHEN** Agent 执行 Component install 或 uninstall
- **THEN** Buildr Skill MUST 要求提供当前受支持 Agent id
- **AND** Buildr Skill MUST 要求完成 runtime reconcile 和最终 `doctor --agent <agent> --json`
- **AND** 仍有 error 时 Agent MUST NOT 报告任务完成

#### Scenario: 外部 CLI 差异
- **WHEN** Component Command collection 声明的外部 CLI 缺失或版本不匹配
- **THEN** Buildr Skill MUST 使用 Commands 检查结果和 `installHint` 向用户说明差异
- **AND** Buildr Skill MUST NOT 声称 Component 安装会自动修改本机 CLI

### Requirement: Buildr Skill 引导对象级卸载确认
Buildr 产品内置 Skill MUST 在用户只表达卸载对象而未明确 Component 范围时，先识别该对象的 Component 所有权，并在 Component 卸载前获得针对完整范围的二次确认。

#### Scenario: 卸载对象是 Component
- **WHEN** 用户表达“卸载 OpenSpec”或等价对象级卸载意图
- **AND** Component registry 或 `component check` 表明该对象由 Component 管理
- **THEN** Agent MUST 将卸载动作解释为 Component lifecycle operation
- **AND** Agent MUST NOT 直接调用单项 `skills remove`、`commands remove` 或 `builtin uninstall`

#### Scenario: 展示 Component 卸载范围
- **WHEN** Agent 已确认卸载对象是 Component
- **THEN** Agent MUST 在执行前展示 Component id、source、version 和 workspace scope
- **AND** Agent MUST 列出将删除的 Rules、Skills、Command collections 和当前 Agent runtime 投射
- **AND** Agent MUST 明确说明本机外部 CLI 和 Project 中已有内容不会被删除

#### Scenario: 二次确认后执行
- **WHEN** Agent 已展示完整 Component 卸载范围
- **THEN** Agent MUST 再次请求用户明确确认
- **AND** 只有用户确认该范围后 Agent MUST 执行 `buildr component uninstall`
- **AND** 用户拒绝、未确认或改变范围时 Agent MUST NOT 修改源资产或 runtime

#### Scenario: 卸载对象不是 Component
- **WHEN** Component registry 和 ownership 检查表明卸载对象不属于 Component
- **THEN** Buildr Skill MUST 引导 Agent 使用对应单项资产卸载协议
- **AND** Agent MUST NOT 为了执行卸载临时创建 Component

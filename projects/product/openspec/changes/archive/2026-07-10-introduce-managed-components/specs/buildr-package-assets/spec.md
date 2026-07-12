## ADDED Requirements

### Requirement: Package manifest 声明 workspace Components
Buildr package manifest MUST 显式声明随包 workspace Components，并将 Component 定义和成员源限制在 `package/targets/workspace/` 交付边界内。

#### Scenario: 声明随包 Component
- **WHEN** Buildr 产品包提供 workspace Component
- **THEN** `package/manifest.yml` MUST 声明 Component id、定义源路径、默认启用状态和 required 状态
- **AND** Component 定义源 MUST 位于 `package/targets/workspace/components/<source>/<id>/component.yml`

#### Scenario: Component 定义引用成员
- **WHEN** 随包 Component 声明 Rules、Skills 或 Command collections
- **THEN** 每个成员源和目标路径 MUST 位于允许的 workspace target 边界
- **AND** Component 定义 MUST 声明成员 integrity
- **AND** 同一个随包成员 MUST NOT 被多个 Component 声明所有权

#### Scenario: Package check 校验 Component
- **WHEN** Agent 运行 `buildr package check`
- **THEN** Buildr MUST 校验 Component manifest schema、定义 schema、稳定 id、版本、来源、成员路径、成员存在性和 integrity
- **AND** Buildr MUST 校验 Component 与独立 Builtins、workspace baseline 和其他 Components 不存在 id、路径或 ownership 冲突

#### Scenario: OpenSpec Component 上游版本对齐
- **WHEN** package check 校验随包 OpenSpec Component
- **THEN** Buildr MUST 校验 OpenSpec Command collection 和全部声明的 workflow Skills 存在
- **AND** Buildr MUST 校验 Skills 的 `generatedBy` 与 Component 声明的 OpenSpec 上游版本一致

#### Scenario: Component 不重复进入 baseline 映射
- **WHEN** package manifest 已通过 Component 声明某个 Rule、Skill 或 Command collection
- **THEN** Buildr MUST NOT 再依赖重复的 workspace baseline 文件清单决定该成员的安装状态
- **AND** init/update MUST 通过 Component 生命周期物化该成员

### Requirement: 产品验证覆盖 Component 生命周期
Buildr package check 和产品端到端验证 MUST 覆盖 Component 及 Commands collections 的主要用户路径和安全边界。

#### Scenario: 临时 workspace Component 验证
- **WHEN** Agent 运行产品验证入口
- **THEN** 验证 MUST 覆盖默认 Component 初始化、list、check、install、uninstall、update 和 sync
- **AND** 验证 MUST 覆盖 Component 成员的 runtime 安装与清理

#### Scenario: Component 冲突与迁移验证
- **WHEN** Agent 运行产品验证入口
- **THEN** 验证 MUST 覆盖安全三方升级、用户修改阻塞、成员缺失、ownership conflict 和旧 OpenSpec Builtins 原位采用
- **AND** 验证 MUST 确认失败预检不会产生部分源资产写入

#### Scenario: Commands collections 验证
- **WHEN** Agent 运行产品验证入口
- **THEN** 验证 MUST 覆盖根 collection、嵌套 collection、相同声明合并、冲突声明报错和 Component-owned collection 保护


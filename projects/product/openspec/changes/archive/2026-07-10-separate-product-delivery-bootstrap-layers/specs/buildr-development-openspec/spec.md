## ADDED Requirements

### Requirement: Buildr 产品候选版本必须完成自举验收
Buildr 产品开发 MUST 区分 Product Project、用户交付资产源和当前自举 workspace，并在合并推送前验证候选产品能够更新自举 workspace。

#### Scenario: 产品开发先限制在 Product Project
- **WHEN** 维护者实现 Buildr 产品能力或修改用户交付资产源
- **THEN** 正式产品源变更 MUST 先只发生在 `projects/product/`
- **AND** 维护者 MUST NOT 通过同步手工编辑 workspace 根中的产品安装结果来代替修改 Product Project

#### Scenario: 从用户视角验证交付资产
- **WHEN** 变更影响 `package/targets/`、bootstrap、CLI 或 runtime adapter
- **THEN** 产品验证 MUST 覆盖新用户初始化、已有 workspace 更新和日常 Agent 使用路径中的相关部分
- **AND** 产品验证 MUST 使用临时用户 workspace 避免把当前自举状态当作唯一证据

#### Scenario: 合并推送前完成自举验收
- **WHEN** Product Project 的候选版本通过产品验证
- **THEN** 维护者 MUST 使用当前 Product checkout 的 Buildr update/sync 更新当前自举 workspace
- **AND** 维护者 MUST 检查生成的 workspace 和 runtime 变化
- **AND** 当前 Agent doctor MUST 通过后才能合并、推送产品变更

#### Scenario: 产品源与自举结果分开提交
- **WHEN** 候选 Buildr 在当前仓库产生 Product Project 变更和自举 workspace 更新结果
- **THEN** 维护者 MUST 将产品源变更与自举 workspace 更新结果分别提交
- **AND** 自举 workspace 提交 MUST 只包含由 update/sync 生成或自举专用的直接相关变化

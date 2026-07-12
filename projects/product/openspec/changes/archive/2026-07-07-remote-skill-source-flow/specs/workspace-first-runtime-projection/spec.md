## MODIFIED Requirements

### Requirement: Skills runtime 区分产品内置 Skill 与 workspace Skill
Buildr runtime projection MUST 区分产品内置 Agent Skills、workspace/root Skills 和 project Skills，并将它们都视为可重建 runtime 投射产物。

#### Scenario: 安装产品内置 Skill
- **WHEN** 当前 Agent runtime 支持 Skills 且 Buildr package manifest 声明了适用的产品内置 Agent Skill
- **THEN** `buildr skill install <agent>` MUST 将该 Skill 安装或修复到目标 Agent runtime
- **AND** `buildr skills render <agent>` MUST NOT 安装或修复该产品内置 Skill

#### Scenario: 保持 workspace Skill 解析
- **WHEN** workspace 或 project 定义了 Skills manifest
- **THEN** `buildr skills render <agent>` MUST 继续按现有 scope 规则解析并渲染 workspace/root/project Skills
- **AND** Buildr MUST 根据 manifest 条目的本地源、远端 resolved 状态和 install mode 选择 render 方式

#### Scenario: 渲染本地作者型 Skill
- **WHEN** Skill manifest 条目使用 `path`
- **THEN** `buildr skills render <agent>` MUST 从本地 `skills/<skill-id>/SKILL.md` 读取源内容
- **AND** Buildr MUST 将该 Skill 安装或更新到目标 Agent runtime

#### Scenario: 渲染已解析远端 Skill
- **WHEN** Skill manifest 条目包含 `resolved`
- **AND** install mode 是 `buildr`
- **THEN** `buildr skills render <agent>` MUST 从 resolved 精确安装源拉取 Skill 内容
- **AND** Buildr MUST 支持 `resolved.kind: skill-url`，其中 URL 内容是 raw `SKILL.md`
- **AND** 当 resolved kind 不受当前 CLI 支持时 Buildr MUST 报告错误
- **AND** Buildr MUST 在可用时校验 version 或 integrity
- **AND** Buildr MUST 将该 Skill 安装或更新到目标 Agent runtime

#### Scenario: 渲染未解析远端信息源
- **WHEN** Skill manifest 条目只有 `source` 或 install mode 是 `agent`
- **THEN** `buildr skills render <agent>` MUST NOT 将该 Skill 视为已安装
- **AND** Buildr MUST 生成 Buildr managed 的 Agent-readable 安装说明或安装任务
- **AND** 该说明 MUST 包含 manifest 中可用的 source/resolved 信息、Skill id、scope 和目标 Agent runtime
- **AND** 该说明 MUST 要求 Agent 阅读 source/resolved 信息、解析精确安装源或按来源指引安装到 Agent runtime

#### Scenario: runtime check 标识 Agent action
- **WHEN** Skill manifest 条目需要 Agent 安装或解析
- **THEN** runtime check 或 doctor MUST 报告该 Skill 需要 Agent action
- **AND** 该状态 MUST NOT 被计为 up to date
- **AND** 诊断结果 MUST 提供下一步建议

#### Scenario: 远端 resolved 缺少 integrity
- **WHEN** Skill manifest 条目包含 resolved 远端安装源
- **AND** manifest 没有声明 integrity
- **THEN** runtime check 或 doctor MUST 报告 warning
- **AND** warning MUST NOT 阻止 render，除非当前 policy 要求完整校验

#### Scenario: runtime 投射不是源资产
- **WHEN** Buildr 将产品内置 Agent Skill 或 workspace/project Skill 写入目标 Agent runtime 目录
- **THEN** 写入结果 MUST 被视为 runtime 投射产物
- **AND** Agent MUST NOT 将写入结果作为 Buildr 产品 Skill 或用户 workspace Skill 的源资产维护

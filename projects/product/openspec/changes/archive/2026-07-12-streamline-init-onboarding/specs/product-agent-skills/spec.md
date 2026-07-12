## MODIFIED Requirements

### Requirement: 产品内置 Agent Skills
Buildr MUST 支持面向支持 runtime 的产品内置 Agent Skills，并将其作为向用户交付最新 Buildr 产品的一部分进行同步。

#### Scenario: 产品内置 Buildr Skill
- **WHEN** Buildr 产品包包含 Buildr 使用 Skill
- **THEN** 该 Skill MUST 由 package 的产品入口 Skill 声明管理
- **AND** `buildr skill install <agent>`、`buildr sync <agent>` 和首次 `buildr init --agent <agent>` MUST 能够为支持的 Agent runtime 安装或修复该 Skill
- **AND** 该 Skill MUST NOT 写入 workspace 的 `skills/manifest.yml`

#### Scenario: Buildr Skill 感知更新意图
- **WHEN** 用户要求 Agent “更新 Buildr”
- **THEN** 产品内置 Buildr Skill 的 description 和正文 MUST 能让 Agent 识别该意图
- **AND** Buildr Skill MUST 引导 Agent 先确认自身 runtime adapter，再运行 `buildr sync <agent> --target <dir>`
- **AND** 该 sync 流程 MUST 包含 workspace 产品能力 update、产品入口 Buildr Skill 安装、当前 Agent runtime render 和 doctor 复查

#### Scenario: Buildr Skill 感知首次初始化意图
- **WHEN** 用户要求 Agent 首次使用 Buildr 管理尚未初始化的目录，且 runtime adapter 已确认
- **THEN** Buildr Skill MUST 引导 Agent 使用 `buildr init --agent <agent>` 完成源资产初始化、产品 Buildr Skill 安装、runtime render 和 doctor
- **AND** Buildr Skill MUST NOT 把独立 `skill install` 或 `sync` 列为完成首次 onboarding 的额外必需步骤

#### Scenario: Buildr Skill 与用户 Skills 保持区分
- **WHEN** Buildr 同步产品内置 Skills
- **THEN** Buildr MUST 将产品入口 Buildr Skill 与 `skills/buildr/*` 能力 Skills 区分开
- **AND** 用户 workspace/project Skill 维护 MUST 继续使用 `skills/manifest.yml` 和源目录，而不是编辑 runtime 目录

#### Scenario: 内置能力 Skills 默认 optional
- **WHEN** Buildr 提供 `skills/buildr/*` 能力 Skills
- **THEN** 这些 Skills MUST 默认为 optional
- **AND** 用户 MUST 能够卸载 optional 内置 Skill，卸载时删除源目录和 runtime 投射，并在 `skills/manifest.yml` 保留卸载状态

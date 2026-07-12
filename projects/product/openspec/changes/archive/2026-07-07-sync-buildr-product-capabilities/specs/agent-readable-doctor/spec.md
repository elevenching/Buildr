## ADDED Requirements

### Requirement: doctor 报告内置能力状态
Buildr doctor MUST 在 Agent-readable 诊断中报告产品内置能力状态。

#### Scenario: 内置能力诊断
- **WHEN** Agent 运行 `buildr doctor --target <dir> --json`
- **THEN** doctor MUST 报告内置能力状态，包括 installed、modified、uninstalled 和 missing 项
- **AND** 每个 finding MUST 包含 severity、userActionRequired 和建议的下一步动作

#### Scenario: 已卸载内置能力作为 info
- **WHEN** 某个内置能力已被显式卸载
- **THEN** doctor SHOULD 将其报告为 info
- **AND** doctor MUST NOT 仅因为显式卸载状态导致 workspace 整体诊断失败

#### Scenario: 期望安装的内置能力缺失
- **WHEN** 某个期望 installed 的内置能力文件缺失
- **THEN** doctor MUST 报告 warning
- **AND** required 能力 MUST 建议 update 或 sync 恢复
- **AND** optional 能力 MUST 建议 restore 或保留卸载状态

#### Scenario: 内置能力被修改
- **WHEN** 某个声明了 version 或 hash 的内置能力与当前 package 版本或 hash 不一致
- **THEN** 除非用户已显式接受或卸载该项，否则 doctor MUST 报告 warning
- **AND** doctor MUST NOT 建议静默覆盖

### Requirement: doctor 报告 manifest 对齐
Buildr doctor MUST 报告 Rules 和 Skills 源资产与 manifest 的对齐状态。

#### Scenario: Rules manifest 不对齐
- **WHEN** `rules/` 下存在未登记的 `.md` 文件，或 `rules/manifest.yml` 登记的文件缺失
- **THEN** doctor MUST 报告 warning
- **AND** `rules/buildr/` 下未登记文件 MUST 使用更高优先级 warning

#### Scenario: Rule metadata 缺失
- **WHEN** `rules/manifest.yml` 中的规则 entry 缺少 `description` 或 description 为空
- **THEN** doctor MUST 报告 warning
- **AND** doctor MUST 提示 Agent 补充该规则的适用场景和用途

#### Scenario: Skills manifest 不对齐
- **WHEN** `skills/` 下存在未登记的 Skill 目录，或 `skills/manifest.yml` 登记的目录缺失
- **THEN** doctor MUST 报告 warning
- **AND** `skills/buildr/` 下未登记目录 MUST 使用更高优先级 warning

### Requirement: doctor 报告 AGENTS required block
Buildr doctor MUST 报告根 `AGENTS.md` 是否保留 Buildr required block。

#### Scenario: required block 缺失或损坏
- **WHEN** 根 `AGENTS.md` 缺少或破坏 Buildr required block
- **THEN** doctor MUST 报告 warning
- **AND** doctor MUST 说明 update/sync 会只恢复 required block，不覆盖用户正文

#### Scenario: Codex runtime 当前有效
- **WHEN** 根 `AGENTS.md` 的 required block 有效且 Codex Skills runtime 投射为最新
- **THEN** doctor MUST 报告 Codex runtime 为 up to date

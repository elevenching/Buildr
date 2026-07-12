## MODIFIED Requirements

### Requirement: doctor 报告 manifest 对齐
Buildr doctor MUST 报告 Rules 和 Skills 源资产与 manifest 的对齐状态。

#### Scenario: Rules manifest 不对齐
- **WHEN** `rules/` 下存在未登记的 `.md` 文件，或 `rules/manifest.yml` 登记的文件缺失
- **THEN** doctor MUST 报告 warning
- **AND** `rules/buildr/` 下未登记文件 MUST 使用更高优先级 warning
- **AND** doctor MUST suggest `rules add/remove` or manual manifest repair for user-managed root Rules when applicable
- **AND** doctor MUST report a Rule file kept by `rules remove --keep-file` as unregistered until it is re-registered, moved, or deleted

#### Scenario: Rule metadata 缺失
- **WHEN** `rules/manifest.yml` 中的规则 entry 缺少 `description` 或 description 为空
- **THEN** doctor MUST 报告 warning
- **AND** doctor MUST 提示 Agent 补充该规则的语义边界和用途
- **AND** doctor MUST describe description as metadata for Agent relevance judgment rather than as a structured routing rule

#### Scenario: Skills manifest 不对齐
- **WHEN** `skills/manifest.yml` 登记的本地 Skill 目录缺失，或本地 Skill 目录未登记
- **THEN** doctor MUST 报告 warning
- **AND** doctor MUST 提示 Agent 使用 `skills add/remove` 或修复 manifest

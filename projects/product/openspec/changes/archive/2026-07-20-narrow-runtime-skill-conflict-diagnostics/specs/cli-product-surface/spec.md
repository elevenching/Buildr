## MODIFIED Requirements

### Requirement: Skill 冲突输出使用稳定机器契约
Skills render、sync、runtime check 和 doctor MUST 使用稳定 diagnostics 表达 Buildr 管理 Skill 的 identity、ownership、内容和已观察冲突，并 MUST 使用独立 assurance metadata 表达 runtime inventory 的可见性上限。

#### Scenario: 同名冲突 JSON
- **WHEN** JSON mode 检测到 Buildr 管理候选 Skill 的名称冲突
- **THEN** finding MUST 包含 candidate skillId、asset/source identity、destination、observed entries、ownership、digests、inventory evidence 和 nextActions
- **AND** MUST 使用稳定 reason，例如 `name_conflict`、`foreign_owner` 或 `equivalent_external`

#### Scenario: Partial inventory JSON
- **WHEN** adapter inventory 只能部分观察 Agent Skills 集
- **THEN** runtime scope MUST 返回 `skillInventoryEvidence.evidence: partial` 和 `opaqueSources`
- **AND** doctor health summary MUST NOT 将该 assurance metadata 计为 warning、error 或 actionable finding

#### Scenario: 冲突导致零写入
- **WHEN** 任一 Buildr 管理候选 finding 为 blocking
- **THEN** command MUST 以非零状态结束并报告 `mutationApplied: false`
- **AND** MUST NOT 只更新未冲突候选

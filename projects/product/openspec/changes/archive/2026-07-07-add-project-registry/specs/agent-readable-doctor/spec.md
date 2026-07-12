## ADDED Requirements

### Requirement: doctor 检查 Project registry 状态
Buildr doctor MUST 诊断 root Project registry 状态及其与已 materialize 的 Project directories 的一致性。

#### Scenario: Project registry 缺失
- **WHEN** `buildr doctor --target <root> --json` 在没有 `projects.yml` 的 initialized workspace 中运行
- **THEN** doctor MUST 报告 Project registry 缺失的 warning
- **AND** doctor MUST 建议创建或修复 `projects.yml`

#### Scenario: registry 中的 Project directory 缺失
- **WHEN** `projects.yml` 声明 Project `<project>`，但 `<root>/projects/<project>/` 缺失
- **THEN** doctor MUST 将该 Project 报告为缺失
- **AND** 如果 registry 记录了 Git URL，doctor MUST 包含允许 Agent 询问是否 clone Project repo 的建议

#### Scenario: orphan Project directory
- **WHEN** `<root>/projects/<project>/` 存在，但 `projects.yml` 未声明 `<project>`
- **THEN** doctor MUST 将该 directory 报告为未登记的 Project
- **AND** doctor MUST 建议通过 `buildr project create <project>` 修复，或在它不是 Project 时删除该 directory

#### Scenario: Project title 缺失
- **WHEN** `projects.yml` 声明 Project `<project>` 但没有 title
- **THEN** doctor MUST 报告 Project navigation metadata 不完整
- **AND** doctor MUST 建议添加 title 或通过 Buildr CLI 修复 registry

#### Scenario: Project baseline 不完整
- **WHEN** 已登记的 Project directory 存在但缺少所需 Project baseline assets
- **THEN** doctor MUST 报告缺失的 Project baseline assets
- **AND** doctor MUST 建议通过 Buildr CLI 修复 Project baseline

#### Scenario: Project Git metadata 不一致
- **WHEN** Project registry entry 具有 `repo.kind: git`，且已 materialize directory 缺少 Git metadata 或 remote 不匹配
- **THEN** doctor MUST 报告 Project repo 不一致
- **AND** doctor MUST 包含基于 registry metadata 的修复建议

#### Scenario: Git 管理的 Project 未被 root Git 忽略
- **WHEN** Project registry entry 具有 `repo.kind: git`，且 root `.gitignore` 未忽略 `projects/<project>/`
- **THEN** doctor MUST 报告 nested Project repo ignore risk
- **AND** doctor MUST 建议更新 root `.gitignore`

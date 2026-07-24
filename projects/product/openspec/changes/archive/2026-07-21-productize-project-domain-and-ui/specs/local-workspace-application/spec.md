## ADDED Requirements

### Requirement: 本地应用必须提供 Project 列表与详情
Buildr MUST 在固定 Workspace 的本地应用中提供 Project read model，且 Interfaces MUST 通过 Project Application 查询。

#### Scenario: 查看 Project 列表
- **WHEN** 用户打开本地应用的 Projects 视图
- **THEN** 页面 MUST 展示每个 Project 的 code、name、description、source type 和 path
- **AND** 页面 MUST 标识 registry migration state

#### Scenario: 查看 Project 详情
- **WHEN** 用户选择一个 Project
- **THEN** 页面 MUST 展示 id、workspaceId、code、name、description、source declaration 和 registry revision
- **AND** Git Project MUST 展示可用的实时 Git observation 与 declared/observed diagnostics

#### Scenario: Git 状态不可用
- **WHEN** Git adapter cannot observe a Project within its bounded query
- **THEN** page MUST show an unavailable diagnostic without treating guessed values as facts
- **AND** Workspace and other Project information MUST remain readable

### Requirement: Project 页面必须支持低风险 metadata 修改
Buildr MUST allow Project `name` and `description` edits while keeping identity and source read-only.

#### Scenario: 保存 Project metadata
- **WHEN** 用户基于当前 registry revision 保存合法 name 或 description
- **THEN** HTTP interface MUST invoke Project Application update with compare-and-swap
- **AND** page MUST refresh the returned canonical Project and revision

#### Scenario: Project revision 冲突
- **WHEN** Agent、Git、编辑器或另一个页面会话 changed `projects/manifest.yml` after the page loaded
- **THEN** API MUST return conflict without write
- **AND** page MUST ask the user to refresh and reassess

#### Scenario: v1 registry 只读
- **WHEN** registry requires migration
- **THEN** page MUST keep Project data readable and disable mutation
- **AND** page MUST show a copyable Agent instruction for canonical update or sync

### Requirement: 新增 Project 必须生成可复制 Agent prompt
Buildr MUST generate a complete Agent prompt for Project creation rather than directly mutating files from the page.

#### Scenario: 生成 workspace Project prompt
- **WHEN** 用户填写 code、name、description and chooses workspace source
- **THEN** Application MUST return a prompt that asks Agent to confirm target Workspace and source boundary, run canonical Project creation and verify the result
- **AND** the page MUST state that copying does not create the Project

#### Scenario: 生成 Git Project prompt
- **WHEN** 用户填写 Git URL、remote and integration branch
- **THEN** prompt MUST preserve those declarations and ask Agent to validate remote identity, path, authorization and branch before mutation
- **AND** prompt MUST NOT ask Buildr to switch an existing checkout blindly

### Requirement: Project HTTP 写操作必须复用本地应用安全边界
Project write routes MUST use the same fixed-target, same-origin, token, JSON and body-size controls as Workspace writes.

#### Scenario: 合法 Project 写请求
- **WHEN** request comes from the current Origin with valid token, JSON body, allowed size and current revision
- **THEN** server MUST pass only Project code, allowed metadata and revision to Application

#### Scenario: 非法 Project 写请求
- **WHEN** request contains target path, filesystem path, invalid token/origin/content type, oversized body or unknown mutation fields
- **THEN** server MUST reject it before Application mutation
- **AND** Project registry MUST remain unchanged

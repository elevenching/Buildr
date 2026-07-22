## ADDED Requirements

### Requirement: 本地应用必须提供 Service 列表与详情
固定 Workspace 的本地应用 MUST 按 Project 展示 Service Domain、声明 source 与实时观察状态。

#### Scenario: 查看 Service 列表
- **WHEN** 用户选择一个 Project
- **THEN** 页面 MUST 展示该 Project 的 Service code、name、type、description 与 source 类型

#### Scenario: 查看 Git Service 详情
- **WHEN** 用户选择 Git Service
- **THEN** 页面 MUST 分开展示 Domain 声明和 current branch、HEAD、dirty、upstream、ahead/behind、remote URL 与 comparison findings

### Requirement: Service 页面必须支持低风险 metadata 修改
本地应用 MUST 只允许修改 Service `name`、`description` 与 `type`。

#### Scenario: 保存 Service metadata
- **WHEN** 用户提交允许字段和当前 revision
- **THEN** HTTP API MUST 通过 Service Application 原子保存并刷新真实结果

#### Scenario: Service registry 需要迁移
- **WHEN** 当前 registry 是 legacy schema
- **THEN** 页面 MUST 保持修改只读并展示由 Agent 执行显式 update/sync 的提示

### Requirement: 新增 Service 必须生成可复制 Agent prompt
本地应用 MUST 将新增 Service 保持为 prompt-only Agent Action，不得直接写 registry、复制目录或 clone repo。

#### Scenario: 生成本地来源 prompt
- **WHEN** 用户填写 Project、Service Domain 信息与本地路径
- **THEN** 页面 MUST 生成要求 Agent 核对来源、物化路径、Git boundary、调用 canonical CLI 并验证的完整 prompt

#### Scenario: 生成 Git 来源 prompt
- **WHEN** 用户填写 Git URL、remote 与 integration branch
- **THEN** prompt MUST 明确这些稳定声明并要求 Agent 在写入前检查既有 identity

### Requirement: Service HTTP 写操作必须复用本地应用安全边界
Service API MUST 复用 fixed target、loopback、session token、Origin、JSON、body size 与 revision conflict 约束。

#### Scenario: 非法写请求
- **WHEN** Service PATCH 或 prompt 请求缺少任一写安全条件
- **THEN** server MUST 拒绝请求且零写入

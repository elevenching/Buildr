## Why

Buildr 现有 Project registry 仍是围绕 YAML 字段和 CLI 流程组织的存储结构，缺少稳定、存储无关的 Project Domain，也无法让人在本地应用中看清 Project 的声明信息与实际 Git 状态。Workspace 产品切片已经验证了 Domain、Application、filesystem adapter 与本地 UI 的完整迭代方式，现在应以同一方式完成 Project 切片，而不是继续在旧 `workspace.mjs` 中叠加行为。

## What Changes

- 定义存储无关的 Project entity：统一使用 UUID `id`、所属 `workspaceId`、可读 `code`、`name`、`description` 与 `source` 值对象。
- 将 `source.path` 明确为文件系统存储介质定位；Git source 另外声明 `url`、`remote` 与稳定的 `integrationBranch`。
- **BREAKING**：canonical Project registry 升级为 `buildr.projects/v2`；兼容读取 v1，并只通过显式 update/sync 收敛迁移，不在 app 启动或普通读取时静默改写。
- 将 Project 用例、filesystem repository 与 Git observation 从旧混合模块拆到新源码分层；CLI、doctor、HTTP 和 Web 共用 Application。
- 实时观察 Git `currentBranch`、dirty、upstream、ahead/behind、HEAD 与实际 remote URL；这些运行态不写入 Project Domain。doctor 和 UI 对比声明与实际状态，分支漂移只诊断、不盲目切换或 stash。
- 扩展 `project create` 以写入 canonical Domain，并允许声明 `integrationBranch`；旧 `title`/`repo.defaultBranch` 输入迁移为 `name`/`source.git.integrationBranch`。
- 在本地应用中提供 Project 列表、详情、Git 状态和 `name`/`description` 受控修改；Project 新增仅生成可复制的 Agent prompt。
- 更新产品说明、Buildr Skill 使用指引、任务看板与分层测试，Service Domain 继续冻结。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `project-registry`: 将 Project registry 从 YAML 字段集合提升为存储无关 Domain，定义 v1 兼容迁移、Project source、Git 声明/观察边界及 CLI/doctor 行为。
- `local-workspace-application`: 在固定 Workspace 的本地应用中增加 Project 查看、受控修改、Git 状态和 prompt-only 新增能力。
- `cli-product-surface`: 更新 Project CLI 与 app 帮助，使 canonical 字段、`integrationBranch`、迁移和页面边界可发现。
- `product-source-layout`: 将 Project Domain、Application、filesystem/Git Infrastructure 与 Interfaces 纳入新源码分层约束。
- `product-agent-skills`: 让 Buildr Skill 引导 Agent 使用新的 Project 模型、迁移、Git 状态诊断和本地应用边界。
- `root-organization-workspace`: 让新 Workspace 初始化直接创建 canonical `buildr.projects/v2` 空 registry。

## Impact

- 源码：`src/domain/project/`、`src/application/project/`、filesystem/Git infrastructure、CLI registry、doctor composition、本地 HTTP/Web。
- 数据：`projects/manifest.yml` canonical schema 升级到 `buildr.projects/v2`，继续兼容读取 v1。
- 产品资产：bootstrap/package baseline、Buildr Skill、产品文档、OpenSpec current-state specs 与长期任务看板。
- 验证：Domain 单元测试、manifest repository/迁移测试、CLI/doctor 集成测试、HTTP 安全与并发测试、桌面和窄屏浏览器测试、package parity 与最终 Candidate。

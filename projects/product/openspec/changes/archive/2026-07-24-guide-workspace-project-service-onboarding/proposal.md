## Why

Buildr 已经具备 Workspace、Project、Service 的真实 Domain、CLI 与本机应用能力，但第一次使用仍以资产目录、技术字段和初始化命令为中心。普通用户完成安装后仍可能不知道 Buildr 适合解决什么问题、应如何建立工作范围，以及下一句该对 Agent 说什么。

现在需要把 Workspace → Project → Service 收敛为 Buildr 的最小用户心智，并让 README、初始化后的 Agent 引导和 local app 形成同一条从认识产品、建立工作范围到开始第一项真实工作的 onboarding 路径。

## What Changes

- 将 local app 全局首页升级为 Workspace 首次使用入口：解释 Workspace、登记已有 Workspace 的影响、创建新 Workspace 的 Agent 路径，并为未初始化、需要迁移或不可用的目录提供可执行恢复引导。
- 将 Workspace 概览升级为派生式“开始”页，根据真实 Project/Service read model 展示当前工作范围与一个明确的下一步，不持久化第二套 onboarding 状态。
- 调整 Workspace 内信息架构，使 Project 与所属 Service 的层级关系清晰可见；Change 等后续能力进入次级区域，Project、Service 仍使用独立目录、详情和编辑页面。
- 将 Project/Service 创建从 CLI 参数式表单改为普通用户可理解的意图式 Agent Action：优先收集名称、用途、所属关系和已有目录或仓库，技术字段后置或交给 Agent 提议并确认。
- 新增“用 Agent 开始”交接能力，根据当前 Workspace、Project、可选 Service 和用户目标生成可复制 prompt；local app 继续只负责认知、选择和交接，不连接或替代 Agent 会话。
- 在 `init --agent` 成功后，由 Buildr Skill 基于真实 doctor、Project 与 Service 状态完成简短的首次教学，逐步引导用户建立工作范围或直接开始任务；不创建 `WELCOME.md`，不要求用户先学习 CLI。
- 重构公开 README 的产品入口与快速开始：提前说明 Buildr 适用场景、两种开始方式、Workspace/Project/Service 最小模型、第一次有效工作的完成标准，并将安装和 runtime 细节后置为 Agent/手动兜底信息。
- 更新产品说明中 local app 作为“人的认知与治理入口、Agent 的工作交接入口”的正式边界，并同步中英文公开入口。
- 本变更不改变 Workspace、Project、Service canonical Domain schema，不引入数据库、Agent session connector、聊天界面或自动专业任务执行；没有破坏性数据变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `local-workspace-application`: 修改本机应用首次进入、Workspace 开始页、Project/Service 层级导航、意图式 Agent Action、恢复引导与开始工作 prompt 的产品行为。
- `human-agent-onboarding`: 修改 `init --agent` 完成后的首次教学、渐进式 Project/Service 引导、local app/Agent 两种开始方式和第一次有效工作的完成条件。
- `agent-first-product-positioning`: 修改公开 README 与产品说明对适用场景、普通用户快速开始、Workspace/Project/Service 最小心智及 local app 人机桥梁边界的要求。

## Impact

- OpenSpec：`local-workspace-application`、`human-agent-onboarding`、`agent-first-product-positioning` canonical specs。
- 本机应用：Workspace 目录与状态处理、Workspace 开始页、导航与路由、Project/Service 创建抽屉、Agent prompt Application/API、样式与窄屏交互。
- Agent onboarding：产品 Buildr Skill、bootstrap/CLI `init` 成功输出及相关 onboarding verification。
- 公开文档：`README.md`、`README.en.md`、`projects/product/docs/buildr-product.md`，必要时同步 CLI Reference 与已知限制。
- 验证：Domain/Application 单元测试、HTTP/static contract、local app browser primary-flow、init onboarding verification、README/docs quality、受影响验证与最终 Candidate。

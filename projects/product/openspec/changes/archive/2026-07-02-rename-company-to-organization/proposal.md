## Why

Buildr 的产品模型已经收敛为 `Workspace → Organization → Project → Service`，但当前仓库仍大量使用 `company/companies` 作为一级语义和路径，这会让后续 Agent-first MVP 继续背负“公司”这个过窄概念。

在实现 `buildr-product-mvp` 前，应先完成 Organization 语义和路径迁移，让个人、团队、客户、公司和企业治理都建立在同一套抽象上。

## What Changes

- **BREAKING** 将 Buildr 的一级所有权和规则边界从 `Company` 统一改为 `Organization`。
  - 产品语义使用 `Organization`。
  - 简写和路径可使用 `org` / `organizations`。
  - `company` 不再作为新文档、新模板和新资产路径中的推荐概念。
- **BREAKING** 将资产路径从 `companies/<company>/...` 迁移为 `organizations/<org>/...`。
  - 组织级规则：`organizations/<org>/AGENTS.md`。
  - 组织级实践：`organizations/<org>/practices/`。
  - 组织级 Skills：`organizations/<org>/skills/`。
  - 项目路径：`organizations/<org>/projects/<project>/...`。
  - 共享服务路径：`organizations/<org>/shared/<service>/...`。
- 更新 Buildr 根规则、README、文档索引、设计文档、模板和示例中的 `company/companies` 表述。
- 更新现有资产目录：
  - 将当前 `companies/` 目录迁移为 `organizations/`。
  - 将各级文档中的“公司级”语义调整为“组织级”。
  - 保留历史语境中确实指法律公司或企业客户的“公司/企业”用词，但不再作为 Buildr 层级名。
- 更新 runtime scope、示例命令和文档中的路径表达。
  - 新路径应以 `organizations/<org>` 为准。
  - 现有命令实现若仍未支持 `org`，本 change 只调整文档、模板、路径和资产语义；命令能力由后续产品 MVP 或 CLI 变更实现。
- 更新 `buildr-product-mvp` 的上下文依赖。
  - MVP 应基于 Organization 模型继续设计。
  - 后续 proposal/design/specs/tasks 不应再引入新的 `company` 一级语义。

## Capabilities

### New Capabilities

- `organization-model`: 定义 Buildr 中 Organization 作为 Workspace 下最高所有权、规则和项目资产边界的语义、路径和迁移要求。

### Modified Capabilities

- `buildr-development-openspec`: 本 change 遵守 Buildr 自身产品和架构性变更必须先走 OpenSpec 的要求，但不改变该规范本身的需求。

## Impact

- 影响根级规则、README、设计文档、文档索引、模板、示例和当前项目资产目录。
- 影响所有 scope/path 示例：`companies/<company>` 需要迁移为 `organizations/<org>`。
- 影响 Agent 启动流程和 routing 说明：任务层级从“框架 → 公司 → 项目 → 服务”改为“框架 → 组织 → 项目 → 服务”。
- 影响后续 `buildr-product-mvp`：MVP 的默认组织、项目创建、service link、doctor 和 bootstrap guide 都应以 Organization 模型为基础。
- 不直接实现 CLI 命令改造，不引入兼容别名，不处理外部已发布用户的迁移脚本；这些可在后续 CLI/product change 中规划。

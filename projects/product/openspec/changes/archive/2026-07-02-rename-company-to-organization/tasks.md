## 1. 迁移资产目录

- [x] 1.1 将根目录下 `companies/` 迁移为 `organizations/`。
- [x] 1.2 检查迁移后的组织、项目、共享服务、practices、skills 和 OpenSpec 目录结构是否保持原有资产内容。
- [x] 1.3 更新外层路径引用，确保当前仓库不再依赖 `companies/` 作为 Buildr 一级资产目录。

## 2. 更新根规则和平台规则

- [x] 2.1 将根级 `AGENTS.md` 中的“公司”层级和 `companies/<company>` 路径改为 Organization / `organizations/<org>`。
- [x] 2.2 更新 `rules/` 下涉及公司层级、路径、scope 或任务路由的规则文档。
- [x] 2.3 更新平台模板中涉及公司层级和 `companies/` 路径的内容。

## 3. 更新产品和设计文档

- [x] 3.1 更新 `README.md` 中的仓库结构、命令示例、scope 示例和贡献约定。
- [x] 3.2 更新 `docs/buildr-organization-model.md`，将其从“抽象讨论”推进为正式 Organization 模型说明。
- [x] 3.3 更新 `docs/buildr-productization-roadmap.md` 中的旧 `company/companies` 表述，使后续 MVP 基于 Organization。
- [x] 3.4 更新 `docs/document-index.md` 和其他设计文档中的公司级路径、层级和术语。

## 4. 更新 OpenSpec 与后续 change 上下文

- [x] 4.1 更新 `openspec/specs/` 中涉及公司层级或路径的主规格。
- [x] 4.2 更新 active change `buildr-product-mvp` 的 proposal，使其使用 Organization / `organizations/<org>` 语义和路径。
- [x] 4.3 确认后续 OpenSpec artifacts 不再新增 `companies/<company>` 作为一级资产路径。

## 5. 验证迁移结果

- [x] 5.1 全仓搜索 `companies/`、`companies<`、`<company>`、`公司级`、`company create` 等旧层级表达，区分历史语境和需要迁移的 Buildr 层级语义。
- [x] 5.2 运行可用的文档、runtime check 或路径相关检查，确认迁移没有破坏现有资产入口。
- [x] 5.3 记录暂不处理的 CLI 命令兼容问题，留给后续产品 MVP 或 CLI change。

验证记录：`buildr rules render claude-code --scope organizations/acme --target .` 已可渲染根和组织级 `CLAUDE.md`；`runtime check` 已能解析 `organizations/acme` scope，规则桥接为 ok。现有 `.claude/skills/` 中部分 Skills 为历史非 Buildr-managed 或 stale 状态，本 change 不迁移 Skills runtime。CLI 兼容问题（是否保留 `company create`）留给后续产品 MVP 或 CLI change。

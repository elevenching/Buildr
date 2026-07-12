## Context

Buildr 当前以 `companies/<company>` 作为一级资产路径，并在根规则、README、设计文档、模板和示例中使用“公司级”描述组织边界。随着产品模型收敛为 `Workspace → Organization → Project → Service`，`company` 已经不足以覆盖个人、团队、客户、公司和企业治理等场景。

`buildr-product-mvp` 将以 Agent-first onboarding 为核心继续设计。如果继续沿用 `company/companies`，MVP 会把历史命名带入新的产品模型，导致用户理解和后续命令设计不一致。因此需要先完成 Organization 语义和路径迁移。

## Goals / Non-Goals

**Goals:**

- 将 Buildr 的一级所有权、规则和项目资产边界统一命名为 Organization。
- 将物理资产路径从 `companies/` 迁移为 `organizations/`。
- 更新文档、规则、模板、示例和 scope/path 表达，使新资产默认使用 Organization 模型。
- 保持 OpenSpec、practices、skills、AGENTS 等资产边界不变，只改变一级语义和路径。
- 为后续 `buildr-product-mvp` 提供干净的 Organization 基础。

**Non-Goals:**

- 不实现新的 CLI 命令。
- 不实现 `company create` 到 `org create` 的兼容别名。
- 不设计外部已发布用户的自动迁移工具。
- 不改变 Project、Service、OpenSpec、practices、skills 的职责边界。
- 不引入 Buildr Server 或云端组织管理能力。

## Decisions

### 决策：使用 `Organization` 作为产品概念，使用 `organizations/` 作为物理路径

Buildr 的一级边界应表达“所有权、规则、项目资产和治理边界”，而不是法律公司。`Organization` 可以覆盖个人、团队、客户、公司和企业，是更通用的产品概念。

物理路径采用：

```text
organizations/<org>/
```

而不是继续使用：

```text
companies/<company>/
```

也不采用更短的：

```text
orgs/<org>/
```

原因是 `organizations/` 可读性更好，适合项目资产库长期维护；CLI 或口语中后续可以使用 `org` 作为简写。

### 决策：直接迁移路径，不保留 `companies/` 作为推荐路径

Buildr 仍处于早期阶段，尚未形成稳定公开用户面。现在直接迁移可以避免后续 MVP 同时背负两套一级路径。

迁移后：

```text
organizations/<org>/AGENTS.md
organizations/<org>/practices/
organizations/<org>/skills/
organizations/<org>/projects/<project>/AGENTS.md
organizations/<org>/projects/<project>/openspec/
organizations/<org>/projects/<project>/practices/
organizations/<org>/projects/<project>/skills/
organizations/<org>/shared/<service>/AGENTS.md
```

### 决策：历史语境可以保留“公司/企业”，层级名必须改为“组织”

文档中描述企业采用、公司客户或法律公司时，可以继续使用“公司/企业”。但当描述 Buildr 的层级、资产边界、路径、规则继承、scope 或模板时，必须使用“组织”。

例如：

```text
企业团队可以创建一个 organization。
组织级规则位于 organizations/<org>/AGENTS.md。
```

而不是：

```text
公司级规则位于 companies/<company>/AGENTS.md。
```

### 决策：本 change 不实现 CLI 命令迁移

用户明确指出当前应该完成语义、路径等变更，命令能力还未形成完整产品层。因此本 change 只迁移资产语义、路径、文档和模板，不实现命令变更。

后续 CLI 设计可以基于新模型定义：

```bash
buildr org create <org>
buildr project create [<org>/]<project>
buildr service link [<org>/]<project>/<service> <repo-ref>
```

如果需要兼容旧命令，可在后续 CLI change 中独立规划。

### 决策：`buildr-product-mvp` 依赖本 change 的语义结果

`buildr-product-mvp` 已经在讨论 Agent-first onboarding、默认 Organization、service link 和 doctor。该 MVP 应以 `organizations/<org>` 为基础继续推进，不应继续写入新的 `companies/<company>` 路径或“公司级”层级表述。

## Risks / Trade-offs

- 路径迁移会影响当前 README、AGENTS、docs、模板、示例和可能的脚本引用 → 通过全仓搜索 `company`、`companies`、`公司级` 等关键字逐项更新，并运行现有 runtime check 或相关测试确认没有遗漏。
- 直接迁移为 `organizations/` 会破坏旧路径引用 → 当前 Buildr 尚处早期，优先保持产品模型干净；若后续需要兼容，可单独设计迁移命令或兼容别名。
- `organizations/` 路径较长 → 资产库强调可读性和长期维护，CLI 层后续可使用 `org` 简写降低输入成本。
- 文档中“公司/企业”和“组织”可能混用造成歧义 → 约定只有描述现实主体时使用“公司/企业”，描述 Buildr 层级时使用“组织”。

## Migration Plan

1. 将 `companies/` 目录迁移为 `organizations/`。
2. 更新根级 `AGENTS.md`、`README.md`、`docs/`、`rules/`、`platform/templates/`、示例和相关索引中的路径与层级表述。
3. 更新 `buildr-product-mvp` proposal 中仍指向 `company/companies` 的内容，使其依赖 Organization 模型。
4. 搜索确认没有新的 Buildr 层级语义继续使用 `company/companies`。
5. 运行必要检查，确认文档链接、runtime check 或路径示例没有明显失效。

## Open Questions

- CLI 层最终是否只提供 `org create`，还是同时提供 `company create` 作为兼容别名？本 change 不处理。
- 是否需要提供自动迁移命令，将旧项目资产库从 `companies/` 移到 `organizations/`？本 change 不处理。

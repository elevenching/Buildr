## Context

当前 Buildr 模型是 `Workspace → Organization → Project → Service`，物理路径是 `organizations/<org>/projects/<project>/`。这个模型适合“一个管理仓同时管理多个组织”的情况，但默认初始化体验并不贴近用户心智。

用户实际会先选择一个文件夹作为上下文起点：个人项目放在个人目录，公司 A 的项目放在公司 A 的目录，公司 B 的项目放在公司 B 的目录。这个起点天然就是 Organization 边界。继续在根目录下创建 `organizations/<same-name>/` 会让根目录变成空壳容器，也让命令、scope 和文档都重复表达同一个概念。

本 change 将 Buildr 默认物理模型调整为根目录即组织上下文：

```text
<buildr-root>/
├── AGENTS.md
├── ASSETS.md
├── README.md
├── .buildr/
│   └── workspace.yml
├── rules/
├── practices/
├── skills/
├── shared/
│   ├── services.yml
│   └── services/
└── projects/
    └── <project>/
        ├── AGENTS.md
        ├── openspec/
        ├── practices/
        ├── skills/
        ├── services.yml
        └── services/
```

## Goals / Non-Goals

**Goals:**

- 让 `buildr init` 生成可直接工作的 Organization 上下文实例，而不是只生成空 workspace 容器。
- 简化默认路径和命令：项目从 `projects/<project>/` 开始，共享服务从 `shared/` 开始。
- 让 `scope` 默认使用根相对表达，减少用户和 Agent 重复输入组织名。
- 提供旧版 `organizations/<org>/` 结构的诊断、兼容和迁移策略。
- 为后续“版本化初始化模板包”打基础，使根规则、资产手册、实践、skills 和 shared service 容器随产品交付。

**Non-Goals:**

- 不在本 change 中实现完整多组织 portfolio workspace。
- 不迁移历史归档中的 OpenSpec artifact。
- 不改变 OpenSpec 在项目下管理 specs、knowledge、changes 的基本职责。
- 不改变 service repo 仍由自身 Git 管理、Buildr 只维护引用和 metadata 的边界。

## Decisions

### Decision 1: 默认 one root = one Organization

Buildr root 直接承载 Organization 语义。根 `AGENTS.md` 是组织级最高规则入口，根 `practices/` 和 `skills/` 是组织级资产，根 `shared/` 是组织共享服务入口。

备选方案是继续保留 `organizations/<org>/` 作为默认结构，并在 init 时自动创建同名组织。这个方案能少改代码，但仍然保留重复心智，不能解决 `~/acme/organizations/acme/` 的核心问题。

### Decision 2: 用 `.buildr/workspace.yml` 记录根上下文元数据

根目录需要保存 Buildr 实例元数据，例如：

```yaml
schemaVersion: 1
kind: organization
name: acme
profile: company
```

`name` 用于人类展示、诊断和迁移，不再参与默认路径。`profile` 可用于初始化模板差异，例如 `personal`、`team`、`company`。

### Decision 3: scope 改为根相对默认表达

默认 scope 应支持：

```text
.
projects/<project>
projects/<project>/<service>
shared
shared/<service>
```

CLI 可以在迁移期兼容旧 scope：

```text
organizations/<org>
organizations/<org>/projects/<project>
organizations/<org>/shared
```

兼容旧 scope 时，`doctor` 应给出迁移建议，而不是把旧路径继续包装成推荐路径。

### Decision 4: `org create` 退出默认主路径

`buildr init --name <name> [--profile personal|team|company]` 应承担创建根组织上下文的职责。`buildr org create` 可暂时保留为兼容命令，但不应继续出现在默认 onboarding 主路径中。

### Decision 5: 旧 workspace 先诊断再迁移

当根目录存在 `organizations/` 且没有 `projects/`、`shared/` 等新结构时，Buildr 应识别为 legacy multi-organization layout。`doctor --json` 应返回结构化 finding，建议用户选择：

- 迁移单个 `organizations/<org>/` 为新的 Buildr root。
- 继续以兼容模式读取旧结构。
- 未来显式启用高级多组织 workspace。

迁移命令可以作为后续实现任务，但本 change 至少要定义诊断和迁移策略。

## Risks / Trade-offs

- [Risk] 这是破坏性路径变更，会影响当前文档、CLI、runtime render 和已有 acme 资产路径。 → 通过兼容读取和明确迁移提示降低风险。
- [Risk] 根目录同时承载 workspace 和 organization 语义，术语可能混淆。 → 产品文档中明确：Buildr root 是一个 Organization context instance；workspace 是实现载体，不再是默认用户心智层。
- [Risk] 少数用户确实需要一个目录管理多个组织。 → 将其定义为高级模式，不作为 MVP 默认路径；旧 `organizations/` 可作为兼容输入。
- [Risk] `openspec/changes/buildr-product-mvp` 中已有基于旧路径的 active delta。 → 本 change 需要在实施时同步修正该 active change 或先归档/替换相关内容，避免两个 active change 表达冲突。

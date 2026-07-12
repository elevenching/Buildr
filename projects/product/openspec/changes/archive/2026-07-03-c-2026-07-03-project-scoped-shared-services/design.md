## Context

当前模型把业务项目服务放在 `projects/<project>/services/`，把共享服务放在 root `shared/services/`。这让 Buildr 同时维护两套 service metadata、两套路由、两种 doctor scope 和两种文档说明。

在 root-as-Organization 模型下，root 已经是最高上下文边界。共享服务不需要再作为 root 下的特殊层级；它可以是一个 Project 的服务集合，例如 `projects/foundation/`、`projects/platform/` 或用户自定义的 `projects/shared/`。

## Goals / Non-Goals

**Goals:**

- 让 `buildr service create <project>/<service>` 成为唯一 service 创建和维护入口。
- 移除 root `shared/` 默认初始化资产和 `doctor --scope shared[...]` 特殊逻辑。
- 用普通 Project 表达共享/基础服务，当前示例组织 root 迁移到 `projects/foundation/`。
- 更新 package baseline、docs、bootstrap guide、README、doctor 和验证脚本。

**Non-Goals:**

- 不实现跨 Project 依赖图或“被多个 Project 使用”的自动关系建模。
- 不设计 shared service 专属命令。
- 不自动迁移任意用户旧 workspace；本次只迁移当前产品仓自用 root，并在文档中说明新模型。

## Decisions

### Decision 1: 共享服务通过普通 Project 表达

共享/基础服务不再有 root `shared/` 特殊入口。用户可以创建一个普通 Project，如 `foundation`、`platform`、`shared` 或公司自定义名称，再通过 `service create <project>/<service>` 接入服务。

原因：

- Project 已经拥有 `AGENTS.md`、`services.yml`、`openspec/`、`practices/`、`skills/`。
- 共享服务也需要规则、实践和变更上下文；用 Project 表达更一致。
- 避免 `shared/services.yml` 与 `projects/<project>/services.yml` 两套 metadata。

### Decision 2: 默认 baseline 不再创建 `shared/`

`buildr init` 只创建 root、rules、practices、skills 和 projects。共享/基础服务只有在用户创建对应 Project 后出现。

### Decision 3: doctor 只诊断 root 和 projects

`doctor` 默认发现 root 与 `projects/*`。如果用户要诊断基础服务，使用普通 project scope：

```bash
buildr doctor --scope projects/foundation --target .
buildr doctor --scope projects/foundation/base --target .
```

不再支持 `--scope shared` 或 `--scope shared/<service>`。

### Decision 4: 当前 root 迁移到 `projects/foundation/`

当前示例组织 root 的 root `shared/services.yml` 和 `shared/services/*` 迁入：

```text
projects/foundation/services.yml
projects/foundation/services/<service>/
```

`rules/AGENTS.acme.md`、`ASSETS.md` 和相关服务规则路径同步更新。

## Risks / Trade-offs

- [Risk] 用户已经习惯 root `shared/`。→ 在 docs 和 guide 中说明共享/基础服务应创建一个 Project 表达。
- [Risk] `foundation` 命名不是通用产品概念。→ 产品只规定“放入某个 Project”，当前 root 选择 `foundation` 只是自用迁移。
- [Risk] 移动嵌套 Git repo 可能影响本地路径。→ 只移动目录，不改服务仓内部 Git 历史；metadata 路径同步到新位置。

## Migration Plan

1. 更新 OpenSpec specs 和产品文档。
2. 修改 package manifest 和 CLI，移除 root `shared/` baseline 和 doctor shared scope。
3. 修改验证脚本，使用 `projects/foundation` 覆盖基础服务场景。
4. 迁移当前 root `shared/` 到 `projects/foundation/`。
5. 运行 package check、MVP 验证、OpenSpec validate 和 doctor。

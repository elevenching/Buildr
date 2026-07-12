## Context

当前 Buildr root 通过 `projects/` 目录表达 Project 集合。这个模型简单，但有两个缺口：

1. workspace 没有显式 Project registry，Agent 只能扫描目录，无法区分已登记 Project、偶然存在的目录和应补全的 Project。
2. Project 资产默认跟随 root Git repo，无法把某个 Project 的记忆、规则、OpenSpec 和 Skills 作为独立 Git repo 管理。

`services.yml` 已经证明“目录结构 + 最小 metadata”适合 repo 类资产。Project 需要类似 registry，但它的 registry 应位于 root，因为 Project 是 root 管理的直接子资产。

## Goals / Non-Goals

**Goals:**

- 引入 root `projects.yml`，让 workspace 明确声明管理哪些 Project。
- 保持 `projects/<project>/` 作为唯一 Project materialized path。
- 支持 `project create --repo <git-url>` 将 Project 资产 repo clone 到 `projects/<project>/`。
- 让不带 repo 的 Project 继续由 workspace root repo 管理。
- 让 `doctor` 能诊断 registry、目录、baseline 和 Git repo 状态。
- 保持 `services.yml` 只管理 Project 下的 service repo metadata。

**Non-Goals:**

- 不支持把本地外部路径登记为 Project 链接。
- 不把 `projects.yml` 做成项目管理系统，不记录业务状态、任务、需求、owner 权限模型或项目事实；只允许 `title` / `description` 这种导航级说明。
- 不改变 service repo 的接入语义。
- 不实现跨机器自动 clone 所有 Project repo 的批量同步命令。
- 不引入云端权限或远程 registry 服务。

## Decisions

### Decision 1: `projects.yml` 是 root registry

`projects.yml` 位于 Buildr root，记录 workspace 管理的 Project 名称、简短说明、materialized path 和 repo 来源。Project key 是稳定 name/id；`title` 是人类可读短显示名；`description` 是可选一句话说明。

推荐最小结构：

```yaml
schemaVersion: 1
projects:
  shop:
    title: Shop
    description: Shop product workspace assets.
    path: projects/shop
    repo:
      kind: workspace
  platform:
    title: Platform
    path: projects/platform
    repo:
      kind: git
      url: git@github.com:acme/buildr-platform-project.git
      remote: origin
      defaultBranch: main
```

`repo.kind: workspace` 表示 Project 资产由 root repo 管理。`repo.kind: git` 表示 Project 资产目录自身是嵌套 Git repo。

备选方案是只扫描 `projects/`。这个方案无法表达缺失 Project、独立 Project repo 来源和跨用户恢复建议，因此不满足 registry 目标。

另一个备选方案是在 registry 里只保留 key，不记录 `title` / `description`。这个方案对 Agent 和人类导航不友好，尤其当 Project key 使用短码、缩写或内部代号时，无法快速判断它是什么项目。因此 registry 允许最小导航说明，但不继续扩展到 owner、状态、任务或业务事实。

### Decision 2: Project repo 必须 materialize 到 `projects/<project>/`

即使用户提供 Git URL，Buildr 也应 clone 到 `projects/<project>/`。不支持“登记外部本地路径”作为 Project。

原因：

- 保持用户和 Agent 的路径心智稳定。
- 保持 scope、runtime render、OpenSpec 和规则读取路径稳定。
- 避免 workspace 里出现不可见的外部 Project 资产源。

如果用户已有本地 Project 资产 repo，推荐先由用户或 Agent 把它移动或 clone 到 `projects/<project>/`，再登记为该 Project。

### Decision 3: Project registry 不替代 Project 资产

`projects.yml` 只记录 registry/source metadata 和导航级说明。Project 的业务事实、规则、记忆、实践和 Skills 继续维护在 `projects/<project>/` 下：

- `AGENTS.md`
- `openspec/`
- `practices/`
- `skills/`
- `services.yml`
- `services/`

这样避免 root 中央索引和 Project 内资产形成双事实源。

### Decision 4: `project create` 负责 registry 和 baseline

`project create <project>` 应创建 `projects/<project>/` baseline，并登记默认 `title` 和 repo 来源：

```yaml
title: <project>
repo:
  kind: workspace
```

`project create <project> --repo <git-url>` 应 clone 目标 repo 到 `projects/<project>/`，记录 Git URL、remote、defaultBranch 和 path，然后补齐缺失 baseline。补齐 baseline 不应覆盖 repo 中已有的 Project 资产文件。

`project create` 可以支持 `--title <text>` 和 `--description <text>`。未提供 `--title` 时，默认使用 `<project>`；未提供 `--description` 时不写该字段。

不新增独立的 `buildr project register <project>`。对既有目录的补登记由 `project create <project>` 承担：目录存在时补齐缺失 baseline 和 registry，不覆盖已有文件。

### Decision 5: root Git 忽略独立 Project repo

当 Project 是 `repo.kind: git` 时，root `.gitignore` 应忽略 `projects/<project>/`，防止 root repo 误提交嵌套 Project repo 内容。

不带 repo 的 Project 不应被忽略，因为它的资产由 root repo 管理。

### Decision 6: doctor 同时检查 registry 和 materialized state

`doctor` 应基于 `projects.yml` 和 `projects/` 目录检查：

- `projects.yml` 缺失或不可解析。
- registry 声明的 Project 目录缺失。
- `projects/` 下存在未登记 Project 目录。
- Project baseline 缺少必需资产。
- `repo.kind: git` 的 Project 目录不是 Git repo、remote 不匹配或 defaultBranch 缺失。
- `repo.kind: git` 的 Project 未被 root `.gitignore` 忽略。

对 Git URL Project 缺失目录时，doctor 应提供可供 Agent 询问用户是否 clone 的建议。

## Risks / Trade-offs

- [Risk] `projects.yml` 和目录状态漂移。 -> Mitigation: `doctor` 报告 missing/orphan/stale，并提供 `project create` 或 registry 修复建议。
- [Risk] 嵌套 Project repo 让 root Git 状态更复杂。 -> Mitigation: 只在 `repo.kind: git` 时添加项目级 ignore，并由 doctor 检查。
- [Risk] `projects.yml` 被滥用为项目管理表。 -> Mitigation: spec 明确只允许 registry/source metadata，项目事实继续写入 Project 资产。
- [Risk] 已有 workspace 没有 `projects.yml`。 -> Mitigation: `doctor` 给出补登记建议；`init` 新 workspace 默认创建空 registry。

## Migration Plan

1. 新 workspace：`buildr init` 创建 `projects.yml`，初始为空。
2. 既有 workspace：`doctor` 发现 `projects/` 下目录未登记时输出 warning，建议用新命令或修复动作登记。
3. 已有 Project：`project create <project>` 对已存在目录应补齐 registry 和缺失 baseline，不覆盖已有文件。
4. 回滚：如果暂时不采用独立 Project repo，保留 `repo.kind: workspace` 即可继续由 root repo 管理。

## Open Questions

暂无。

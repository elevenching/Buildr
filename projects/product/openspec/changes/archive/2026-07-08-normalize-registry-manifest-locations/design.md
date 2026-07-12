## Context

当前 Buildr 已经把 Rules、Skills、Commands 收敛为目录内 `manifest.yml`：`rules/manifest.yml`、`skills/manifest.yml`、`commands/manifest.yml`。但 Project registry 仍是 root `projects.yml`，Service metadata 仍是 Project root `services.yml`。

用户心智上，`projects/` 是管理 Project 的资产目录，`services/` 是管理 Service 的资产目录。registry/metadata 作为管理这些集合的资产，更适合放在对应目录下并统一命名为 `manifest.yml`。

## Goals / Non-Goals

**Goals:**

- 统一 Project 和 Service registry 的 manifest 位置与命名。
- 保持目录结构可识别：空集合也有目录和空 manifest。
- 提供 MVP 开发期旧布局收敛路径。
- 统一 Project、Service、Skill manifest 的 `schemaVersion` 心智。
- 将 Project/Service manifest 收敛为封闭 schema，并让 `doctor` 能校验漂移。
- 维护独立 Project/Service Git repo 与最近上级 Git repo 的忽略边界。
- 更新 CLI、doctor、package baseline、Buildr Skill 和验证。

**Non-Goals:**

- 不改变 Project、Service 的业务语义。
- 不引入多 Organization 布局。
- 不改变 Rules/Skills/Commands 的 manifest 模型。
- 不实现 service 级 Agent runtime 独立投射。
- 不把 Project/Service manifest 扩展为 workspace 资产总入口。
- 不记录一次性本地导入来源路径，不追踪资产历史来源。
- 不实现完整 Git 生命周期管理，例如自动 commit、push、remote 管理或 submodule 管理。
- 不在 Service manifest 中声明 service 规则入口；Service 目录内 `AGENTS.md` 作为 service 自身规则资产，由 runtime adapter 处理。

## Decisions

### 1. 使用 `projects/manifest.yml`

Project registry 的事实源改为：

```text
projects/
  manifest.yml
  <project>/
```

理由：`projects/` 是 Project 集合容器，`manifest.yml` 是该集合的管理资产。相比 `projects.yml`，它和 `skills/manifest.yml`、`rules/manifest.yml` 心智一致。

`projects/manifest.yml` 只管理 Project 集合，不管理 Project 下的 rules、skills、commands、openspec、practices 或 services 明细。

### 2. 使用 `projects/<project>/services/manifest.yml`

Service metadata 的事实源改为：

```text
projects/<project>/
  services/
    manifest.yml
    <service>/
```

理由：`services/` 是 Service 集合容器。即使 Project 暂无 Service，`services/manifest.yml` 也能表达“这是一个可管理的空服务集合”。

`services/manifest.yml` 只管理 Service 集合，不管理 Service repo 内部资产。

### 3. manifest schema

Project manifest 使用：

```yaml
schemaVersion: buildr.projects/v1
projects: {}
```

Service manifest 使用：

```yaml
schemaVersion: buildr.services/v1
project: demo
services: {}
```

Skill manifest 补齐：

```yaml
schemaVersion: buildr.skills/v1
skills: []
```

Rules 和 Commands 已分别使用 `buildr.rules/v1`、`buildr.commands/v1`，本变更不改变其语义。

### 4. Project/Service manifest 使用封闭 schema

Project entry 必填字段：

```yaml
title: "demo"
description: "demo 项目资产"
path: "projects/demo"
repo:
  kind: "workspace"
```

Service entry 必填字段：

```yaml
title: "api"
description: "api 服务资产"
type: "service"
path: "services/api"
repo:
  kind: "workspace"
```

规则：

- Project/Service id 继续使用 `^[A-Za-z0-9._-]+$`。
- `path` 必须是 workspace/project 内的相对路径，不能是绝对路径或逃逸路径。
- `repo.kind` 只允许 `workspace` 或 `git`。
- Git repo 可记录 `url`、`remote`、`defaultBranch`；`url` 缺失时允许接入但 `doctor` warning。
- `title` 缺失时可补 id，不 warning。
- `description` 缺失或为空时可补 TODO，但 `doctor` warning。
- Service `type` 缺失时补 `service`。
- 新 manifest 里的未知字段由 `doctor` warning，`update/sync` 清理。
- 不支持 `metadata` 扩展字段。

### 5. MVP 旧布局收敛

`projects.yml` 属于未启用旧能力，不做内容迁移。`update/sync` 发现后直接删除。

Project entry 的收敛来源是目录事实：

- `update/sync` 扫描 `projects/` 直属合法目录。
- 合法 Project 目录存在但 `projects/manifest.yml` 缺 entry 时，生成最小 Project entry。
- 排除隐藏目录、系统目录、非法 id 和普通文件。
- `repo.kind` 按 `projects/<project>/.git/` 判断，存在则 `git`，否则 `workspace`。

旧 `projects/<project>/services.yml` 做最小转换：

- 如果 `services/manifest.yml` 不存在，转换可识别 service 条目到新 schema。
- 如果 `services/manifest.yml` 已存在，以新 manifest 为准，删除旧 `services.yml`。
- 转换后删除旧 `services.yml`。
- 未知字段不迁移。

Service entry 也可从目录事实补齐：

- `update/sync` 扫描 `projects/<project>/services/` 直属合法目录。
- 合法 Service 目录存在但 `services/manifest.yml` 缺 entry 时，生成最小 Service entry。
- `repo.kind` 按 `services/<service>/.git/` 判断，存在则 `git`，否则 `workspace`。

### 6. Service 本地路径导入

`service create <project>/<service> <local-path>` 可以把本地路径导入为受管理 Service 资产，但长期事实必须落在：

```text
projects/<project>/services/<service>/
```

manifest 不记录本地来源路径。导入后如果 service 目录是 Git repo，`repo.kind` 为 `git`；否则为 `workspace`。

### 7. AGENTS.md 规则资产投射

`AGENTS.md` 是所有层级的规则源资产。Service 层暂时不凸显独立 `rules/`、`skills/`、`commands/` manifest，但 `projects/<project>/services/<service>/AGENTS.md` 仍是 service 自身资产，表达任务触及该 service 时需要遵守的约定。

Service manifest 不记录 `rules.source`。旧 `services.yml` 中的 `rules.source` 不迁入新 manifest；只要对应 `AGENTS.md` 文件仍在 service 目录内，就由 runtime adapter 负责暴露。

runtime render/sync 必须按 scope 将 root -> Project -> Service 路径上的 `AGENTS.md` 暴露给目标 Agent：

- Claude Code adapter 通过 `CLAUDE.md` 桥接对应 scope 的 `AGENTS.md`。
- Codex adapter 默认使用原生 `AGENTS.md`；runtime check/sync 仍应确认规则链路存在。
- 其他 Agent adapter 由各自 adapter 决定输出格式。

### 8. Git 边界维护

Project/Service 管理包含独立 Git repo 的基础边界维护。

- 当 Project 是独立 Git repo，最近上级 Git repo 是 workspace root 时，维护 root `.gitignore` 的 `/projects/<project>/`。
- 当 Service 是独立 Git repo，最近上级 Git repo 是 Project 时，维护 Project `.gitignore` 的 `/services/<service>/`。
- 当 Service 是独立 Git repo，Project 不是 Git repo 但 workspace root 是 Git repo 时，维护 root `.gitignore` 的 `/projects/<project>/services/<service>/`。
- 没有上级 Git repo 时不写 `.gitignore`。
- `create/update/sync` 补齐缺失规则；`doctor` 只诊断，缺失时 warning。
- `.gitignore` 状态不写入 manifest。

### 9. 首版迁移不改 Project/Service 目录

Project 目录仍是 `projects/<project>/`。Service repo 默认目录仍是 `projects/<project>/services/<service>/`。本变更只调整 registry/metadata 文件位置。

## Risks / Trade-offs

- 风险：`projects.yml` 不迁移会丢弃旧 registry 中的自定义字段。接受原因：该能力尚未正式启用，本变更按 MVP 强 schema 收敛；Project 事实由目录和新 manifest 维护。
- 风险：旧 `services.yml` 中未知字段会被清理。接受原因：Service manifest 采用封闭 schema，Buildr 只管理当前资产状态，不追踪非 schema metadata。
- 风险：Git 边界维护会写 `.gitignore`。缓解：只追加缺失 ignore 规则，不删除用户已有规则，不写入 manifest。
- 风险：路径迁移影响较多 CLI helper。缓解：集中封装 registry path helper，并用临时目录 E2E 覆盖 init/project/service/doctor/npm 包。

## Migration Plan

1. 新 workspace 直接生成 `projects/manifest.yml`；新 Project 直接生成 `services/manifest.yml`。
2. update/sync 删除 root `projects.yml`，不读取、不迁移。
3. update/sync 扫描合法 Project/Service 目录，补最小 manifest entry。
4. update/sync 将旧 `projects/<project>/services.yml` 最小转换为 `services/manifest.yml`，转换后删除旧文件。
5. update/sync 为 `skills/manifest.yml` 补齐 `schemaVersion: buildr.skills/v1`。
6. update/sync 补齐独立 Git repo 的最近上级 `.gitignore` 规则。
7. doctor 只报告 drift，不写文件。

## Open Questions

- 暂无。当前 change 按 MVP 强收敛实现，不设计复杂旧 registry 冲突兼容。

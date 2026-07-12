## Context

当前 Skills manifest 只有 `path` 条目，`path` 同时承担“源目录位置”和“runtime 输出路径”的含义。`buildr skills add --source <skill-dir>` 会把完整 Skill 源目录复制到当前 scope 的 `skills/<skill-id>/`，`skills render` 再从该目录读取 `SKILL.md` 并投射到 Agent runtime。

这个模型适合用户自定义 Skill，但不适合 Buildr 默认随包 Skills。默认 OpenSpec Skills 由产品维护，用户 workspace 只需要声明“启用这些 Skills”，不需要持有完整源内容。与此同时，产品内置 Buildr Skill 已经通过 `agentSkills` 和 `buildr skill install` 单独管理，不能和 workspace/project Skills 混在同一个安装入口里。

## Goals / Non-Goals

**Goals:**

- 支持 workspace/project Skills manifest 中的引用型条目，让默认随包 Skills 可以只通过清单进入 workspace。
- 保持本地源目录模式兼容，团队自定义 Skill 仍可维护 `SKILL.md`、脚本、模板、示例和引用材料。
- 让 render、runtime check、doctor 和 package check 都能区分本地源目录 Skill 与引用型 Skill。
- 减少默认 workspace baseline 中复制的随包 Skill 源文件。

**Non-Goals:**

- 不把 Skill 完整内容嵌入 `skills/manifest.yml`。
- 不改变 Commands 的 manifest-only 模型。
- 不新增 service scope。
- 不把 `buildr skill install <agent>` 合并进 `buildr skills render <agent>`。
- 不在本 change 引入远程 registry 下载、鉴权或版本锁定实现；只预留 resolver 形态。

## Decisions

### 1. Skills manifest 支持两种条目

Skill 条目必须包含 `id`，并且必须且只能包含 `path` 或 `source` 之一：

```yaml
skills:
  - id: local-release
    path: local-release
    description: Project-local release workflow

  - id: openspec-explore
    source: package:openspec-explore
    description: Buildr 随包的 OpenSpec explore Skill
```

`path` 表示当前 scope 的本地源目录，语义保持不变。`source` 表示引用型来源，由 Buildr resolver 解析到受支持的 Skill 源资产。初始实现只要求支持 `package:<source-id>`；未来可扩展 `registry:` 或 `git:`，但未实现来源必须明确报错。

取舍：不复用 `path` 表达包内引用，因为 `path` 当前有本地删除、安全校验和 runtime path 语义；混用会让 `skills remove` 和 stale check 风险变高。

### 2. package manifest 增加 workspace Skill source registry

产品随包的 workspace/project 可引用 Skill 源通过 `package/manifest.yml` 的专用字段声明，例如：

```yaml
skillSources:
  - id: openspec-explore
    path: package/skills/openspec/openspec-explore
    runtimes:
      - claude-code
    runtimePath: openspec/openspec-explore
```

`skillSources` 是 workspace/project Skills 的可解析来源，和 `agentSkills` 分开。`agentSkills` 继续只服务产品内置 Buildr Skill 及 `buildr skill install <agent>`；`skills render` 不安装 `agentSkills`。

取舍：不用 `package/workspace/skills/<id>/SKILL.md` 作为未映射源目录，因为 `package/workspace/` 的产品规则要求该目录只放会映射到用户 workspace 的 baseline 源文件。

### 3. CLI 维护入口保持清晰

本地源目录继续使用现有命令：

```bash
buildr skills add --source <skill-dir> --scope <scope> --target <dir>
```

引用型 Skill 使用新入口：

```bash
buildr skills add <id> --reference package:<source-id> --scope <scope> --target <dir>
```

`--source` 继续只表示本地目录，避免同一参数同时接受目录和引用 URI。`skills remove <id>` 对 `source` 条目只删除 manifest 条目；对 `path` 条目继续在安全校验后删除本地源目录。

### 4. 渲染解析结果使用统一内部模型

`resolveSkills` 应输出统一结构：

- `id`
- `origin`: `workspace` / `project` / `package`
- `sourceKind`: `path` / `source`
- `sourceFile`
- `displaySource`
- `runtimePath`

本地 `path` 条目的 `runtimePath` 默认沿用 `path`。引用型条目的 `runtimePath` 优先来自 package source registry，其次使用 manifest 条目的 `runtimePath`，最后回退到 `id`。

### 5. 冲突和诊断以 id 为准

同一 manifest 内重复 `id` 必须报错。workspace 与 project 的同 id 条目继续由 project 覆盖 workspace。workspace/project 条目与产品内置 `agentSkills` id 冲突必须报错。引用来源不可解析、resolved `SKILL.md` 不存在、frontmatter `name` 与 manifest `id` 不一致时，render/runtime check/package check 必须报错或产生 error finding。

## Risks / Trade-offs

- [Risk] manifest 引入 `source` 后旧解析器会忽略或拒绝该字段 → Mitigation：同一 change 内更新 CLI、render、runtime check、doctor 和 package check，并保留 `path` 条目兼容。
- [Risk] 默认 OpenSpec Skills 从本地目录迁移到包内引用后，用户已经修改过默认 Skill 源目录可能失去清晰迁移路径 → Mitigation：不自动删除用户 workspace 里已有本地目录；只调整新 init baseline，并在迁移文档中说明用户自定义内容应保留为 `path` 本地 Skill。
- [Risk] package source registry 与 `agentSkills` 容易混淆 → Mitigation：规格明确 `skillSources` 与 `agentSkills` 分离，并在校验中禁止 `skills render` 把 `agentSkills` 当 workspace Skill source。
- [Risk] `runtimePath` 默认变化影响 Agent 原生 Skills 分组 → Mitigation：package source registry 为默认 OpenSpec Skills 显式声明原有 `openspec/<id>` runtime path。

## Migration Plan

1. 扩展 manifest 解析、校验和渲染逻辑，支持 `path`/`source` 二选一。
2. 在 `package/manifest.yml` 增加 `skillSources`，将默认 OpenSpec Skill 源移到包内非 workspace baseline 源路径。
3. 将 `package/workspace/skills/manifest.yml` 改为 `source: package:<id>` 条目，移除 workspaceFiles 中默认 Skill `SKILL.md` 映射。
4. 更新 package check、runtime check、doctor 和 MVP 验证脚本。
5. 更新 Buildr Skill 和文档中关于 Skills 维护方式的说明。

Rollback 策略：保留 `path` 本地源目录模式。如果引用型解析出现问题，可把默认 Skills manifest 临时恢复为 `path` 条目并重新映射源文件。

## Open Questions

- 是否需要在首版实现 `runtimePath` 作为 workspace manifest 字段，还是只允许 package source registry 提供。
- 是否需要单独提供 `buildr skills check`，还是继续由 runtime check 和 doctor 承担诊断入口。

## Context

Buildr 目前用 `resolveRuleScope` 把 `.`、Project 和 Service 缩写转换为固定层级，再由 `resolveAgentFiles` 收集 root 到当前 scope 的祖先 `AGENTS.md`。Claude Code adapter 在每个源文件旁生成 `CLAUDE.md` 引用桥，Codex adapter 不写规则文件，只复用同一收集结果做检查。

该模型可以表达“进入某个已知 Service 时继承哪些规则”，但无法保证 scope 子树中所有局部规则都已经为非原生 Agent 准备好。默认 `sync` 使用根 scope，因此只生成根桥；`runtime list` 也只声明 Root/Project target。当前 Service scope 的 CLI 缩写还会在内部隐式插入 `services/`，与真实 workspace 路径和规范示例不一致。

## Goals / Non-Goals

**Goals:**

- 让任意受管理目录中的 `AGENTS.md` 都能作为局部规则源，并在所选 scope 内递归投射。
- 保持 Root -> Project -> Service -> 深层模块的规则继承和更具体规则后置语义。
- 让 native 和 rendered adapter 对同一批规则源给出等价、可诊断的结果。
- 使用真实 workspace 相对路径作为唯一 canonical scope 表达。
- 让根 `sync` 一次完成整个受管理 workspace 的规则 runtime reconcile。
- 在跨 Git 边界、符号链接、生成目录和已有 Agent 配置时保持安全边界。
- 消除 Service registry 是否保存规则源指针的规范歧义，保持目录约定与封闭 schema 一致。

**Non-Goals:**

- 不为 Rules 增加 role、path、service 或 directory routing table。
- 不把 `rules/*.md` 各自渲染为 Agent runtime 文件；它们仍由 `AGENTS.md` 和 manifest 语义暴露。
- 不新增 Service 级 `rules/manifest.yml` 或 `skills/manifest.yml`。
- 不改变 Skills 的 Root/Project 来源模型；深层 Rules scope 只解析到所属 Root/Project Skills scope。
- 不扫描 Buildr workspace 之外的目录，也不跟随可能逃逸或形成环的目录符号链接。
- 不在 Buildr 产品默认 Rule 中硬编码中文 Git 提交偏好，也不在本 change 修改 `git-ops` 的 Conventional Commits 生成流程；该 Git 协作目标使用独立 change。

## Decisions

### 1. 规则发现使用“祖先链 + scope 子树”

scope resolver 先把输入规范化为 workspace 内真实目录，再构建有序源集合：

```text
workspace root 到 scope 的祖先 AGENTS.md
                     +
scope 子树内递归发现的 AGENTS.md
                     =
按目录深度和路径稳定排序的规则源集合
```

祖先从宽到窄排列；子树按深度优先、同深度按路径排序。scope 自身同时属于祖先链和子树时去重。Project scope 不包含兄弟 Project，Service scope 不包含兄弟 Service。

相比“只收集祖先链”，该模型可以提前为子目录准备需要写文件的 adapter。相比“无条件扫描整个 workspace”，显式 scope 仍能限制写入和诊断范围。

### 2. scope 使用真实 workspace 相对路径

canonical scope 只使用实际目录表达：

```text
.
projects/pig
projects/pig/services/api
projects/pig/services/api/src/orders
```

resolver 不再无条件插入 `services/`。旧 `projects/<project>/<service...>` 形式仅在以下条件同时满足时兼容：对应 canonical Service 已登记、旧输入位置本身不存在、转换结果唯一。CLI 输出 warning，所有 receipt、doctor next step、help 和 `runtime list` 只输出 canonical scope。存在歧义时拒绝并展示真实路径。

### 3. 扫描边界以 Buildr 管理范围为准

递归 walker 始终跳过 VCS 元数据、Agent runtime 输出、外部依赖和构建产物目录，不跟随目录符号链接。首版排除集合由共享常量维护，至少覆盖 `.git`、`.agents`、`.claude`、`.codex`、`.cursor`、`.trae`、`node_modules`、`vendor`、`dist`、`build` 和 `coverage`。

普通目录在当前 scope 内可递归进入。`.worktrees/` 是任务工作副本容器，始终作为排除目录处理。遇到嵌套 Git repo 时，只在该目录是 Buildr registry 中已管理 Project 或 Service asset root 时继续扫描；未登记嵌套 repo 视为不透明边界。这样既允许已接入 Service 定义任意深度规则，又不跨越未知仓库所有权或重复扫描任务副本。

### 4. adapter 共享发现计划，按能力投射

规则发现返回与 Agent 无关的 plan，包含 canonical scope、source files、relative paths、边界信息和顺序。adapter 只决定如何消费 plan：

- Codex `rules-entry.mode = native`：不写 bridge；runtime check 验证 plan 中每个 `AGENTS.md` 可读并报告原生来源。
- Claude Code `rules-entry.mode = rendered`：为每个 `AGENTS.md` 在同目录 reconcile `CLAUDE.md` 引用桥。
- 后续 adapter 可以复用 plan，并声明自己的 target pattern。

`buildr render` 仍组合 Rules 与 Skills。传入 Service 或更深 scope 时，Rules 使用完整 canonical scope；Skills 根据 scope 归属折叠为 `.` 或 `projects/<project>`，避免隐式引入 Service Skills 模型。

### 5. rendered adapter 使用两阶段 reconcile

第一阶段只发现源、计算目标、读取现状并检查冲突，不写文件。任何目标存在非 Buildr-managed 内容且没有可识别 managed block 时，整个命令失败并列出冲突。

第二阶段在计划无冲突后创建或更新 bridge。scope 内存在 Buildr-managed bridge、但同目录 `AGENTS.md` 已删除时，将其作为 orphan runtime 产物移除；非 Buildr-managed 文件永不删除。receipt 区分 created、updated、unchanged、removed。

两阶段处理避免深层冲突造成部分目录已更新、部分目录未更新。

### 6. 根 sync 递归 reconcile 整个受管理 workspace

`buildr sync <agent>` 继续以 `--scope .` 为默认值，但 `.` 的新语义是根祖先加整个受管理 workspace 子树。因此写入型 adapter 会准备所有发现到的局部规则入口；native adapter 只检查，不产生规则文件。

显式传入更窄 scope 的 `render`、`rules render` 和 `runtime check` 只处理该 scope 的祖先链与子树。`doctor` 无显式 scope 时可以按现有 Project 聚合方式报告，但必须去重同一 source/target finding。

### 7. runtime capability metadata 描述发现与投射

保留现有 required capability 和兼容字段，同时为 `rules-entry` 增加结构化元数据：

```yaml
scopeSyntax: workspace-relative-path
sourceDiscovery:
  pattern: "**/AGENTS.md"
  mode: recursive-scope
  includesAncestors: true
projection:
  mode: native | rendered
  targetPattern: "<source-dir>/CLAUDE.md"  # rendered adapter
writesFiles: true | false
```

元数据描述 adapter 能力，不代表当前 workspace 状态；具体缺失、冲突和 stale 状态仍由 doctor/runtime check 报告。

### 8. Service 规则入口使用目录约定，不进入 registry

`projects/<project>/services/<service>/AGENTS.md` 是 Service 级规则源。adapter 通过 canonical scope 和递归 discovery 找到它，不需要也不得依赖 `services/manifest.yml` 中的 `rules.source`、`rules` 或等价指针。

`services/manifest.yml` 继续只记录 title、description、type、path 和 repo 等 Service registry metadata。旧 `services.yml` 中的 `rules.source` 不迁移；封闭 schema 校验继续拒绝或清理未知规则字段。

该决策修正当前主规范中两段互相冲突的要求，并与 current-state 和现有实现保持一致。相比在 registry 重复保存 `AGENTS.md` 路径，目录约定避免路径漂移，也使任意深层 `AGENTS.md` discovery 使用同一套规则。

### 9. Rule discovery 与 Rule 正文读取分成两个阶段

adapter discovery 只解决“哪些规则源对 Agent 可见”；Agent 是否读取正文由 manifest 状态和任务语义决定。required Buildr Core 必须提供稳定消费协议：

```text
enabled + required + installed
  -> 进入 workspace 后必须读取

enabled + optional + installed
  -> 先读取 description
  -> 根据用户目标、修改范围、代码语义和 workspace context 判断
  -> 相关时在行动前读取正文

disabled 或 uninstalled
  -> 不参与当前任务
```

`description` 只表达语义边界和用途，不承载正文，也不演变为 role/path/service routing table。Buildr Skill 负责向 Agent 和用户解释这套状态机；doctor 负责报告非法或缺失 metadata；adapter 不替 Agent作任务相关性决策。

Git 提交信息是该分层的一个例子，但不作为本 change 的产品默认资产：精简 Conventional Commits 的格式和生成方法属于 `git-ops` Skill，具体 workspace 的中文 subject/body 偏好属于用户 Rule。这样避免把中文偏好发布给所有 Buildr workspace，也避免把完整提交操作手册复制进 Rule。

### 10. OpenSpec 与 task worktree 必须显式披露

OpenSpec 和 task worktree 会改变任务的事实位置与后续生命周期，Agent 在执行前必须让用户可见：

- 采用 OpenSpec 时说明使用或创建的 change id、change 路径和当前动作。
- 创建或复用 task worktree 时说明当前 workspace root、task id、worktree 路径和任务分支。
- canonical task worktree 路径固定为 `<workspace-root>/.worktrees/<task-id>`，不得自行退回 `/tmp` 或其他临时目录。
- 同一任务复用现有 worktree；多仓任务为每个独立仓库使用带 repo 标识的 task id，避免路径碰撞。

`/.worktrees/` 进入 workspace 和 package baseline `.gitignore`，并加入 Rules discovery 排除集合。该约束属于 task/OpenSpec Skills 的操作协议，不进入 required Core Rule。

## Risks / Trade-offs

- [根 sync 可能写入大量 bridge] -> 先输出完整 plan、稳定排序并保留 managed marker；冲突时零写入。
- [递归扫描大型仓库变慢] -> 及早裁剪排除目录和不透明 Git 边界，只读取名为 `AGENTS.md` 及潜在 managed target 的文件。
- [旧 scope 缩写与真实目录冲突] -> 只做基于 registry 的无歧义兼容，canonical 输出永远使用真实路径，歧义直接失败。
- [删除源文件后残留 runtime bridge] -> reconcile 只清理具有 Buildr managed marker 的 orphan bridge。
- [doctor 聚合重复 findings] -> finding 以 adapter、canonical source 和 target 组成稳定键去重。
- [扫描边界和 Codex 原生发现略有差异] -> runtime metadata 和诊断明确 Buildr 管理边界；未知嵌套 Git repo、依赖和构建输出不作为组织规则源。
- [旧文档或资产仍携带 `rules.source`] -> update/sync 不迁移该字段，doctor/schema 校验按未知字段处理，文档统一指向 Service 目录 `AGENTS.md`。
- [Agent 看见 manifest 但不读取 optional Rule] -> required Core 和 Buildr Skill 明确先检查 description、语义相关时行动前读取正文，并通过 package contract 防止入口回退。
- [任务副本被误提交或重复扫描] -> 固定使用 workspace root `/.worktrees/`、写入 baseline ignore，并将该目录作为 Rules discovery 边界。
- [Agent 静默切换 OpenSpec/worktree 上下文] -> 对应 Skills 要求行动前报告 change、路径、分支和创建/复用状态。

## Migration Plan

1. 引入 canonical scope resolver 和独立 discovery plan，先保持现有 adapter 输出。
2. 让 runtime check 和 adapter render 切换到统一 plan，并补充两阶段冲突检查与 orphan 清理。
3. 更新 `runtime list`、help、doctor next steps 和文档，只输出 canonical scope。
4. 在兼容期接受可无歧义解析的旧 Service 缩写并输出迁移 warning；后续 change 再决定移除时间。
5. 通过 Root、Project、Service、深层目录和嵌套 Git 临时 workspace 验证后发布。

回滚时可以恢复旧 resolver 和祖先链收集器；已经生成的 bridge 都带 Buildr managed marker，可由旧 render 更新或由用户安全移除。主规则源 `AGENTS.md` 不受回滚影响。

## Open Questions

无。旧 scope 缩写的最终移除版本不在本 change 决定，本次只建立兼容和迁移提示。

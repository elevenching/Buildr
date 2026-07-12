## Why

当前 runtime adapter 只按显式 scope 收集祖先链上的 `AGENTS.md`，`sync` 默认也只处理根入口，无法把 scope 子树内 Service、模块和更深目录定义的规则完整投射给需要桥接文件的 Agent。与此同时，CLI 使用的 Service scope 缩写、OpenSpec 中的真实目录路径和 `runtime list` 能力元数据彼此不一致，已经影响跨 Agent 规则语义的一致性和可诊断性。

## What Changes

- 将 `buildr render <agent> --scope <path>` 和 Rules runtime check 的规则发现模型改为：包含 scope 的适用祖先规则链，并递归发现 scope 子树内所有受支持的 `AGENTS.md`。
- 对原生读取 `AGENTS.md` 的 adapter 只检查递归发现结果，不生成重复规则文件；对需要桥接的 adapter 在每个源文件同目录生成对应 runtime 入口。
- 将 scope 的 canonical 表达统一为真实 workspace 相对路径，例如 `projects/pig/services/api`；旧 `projects/pig/api` Service 缩写仅在可无歧义解析时兼容并提供迁移提示。
- 定义递归扫描边界，跳过 VCS 元数据、Agent runtime 输出和依赖/构建产物；嵌套 Project/Service Git repo 仅按 Buildr 已管理资产边界进入。
- 更新 `buildr runtime list --json`，准确声明 adapter 的规则发现模式、源模式、目标模式、递归能力和写文件行为。
- 在 required Buildr Core 和 Buildr Skill 中明确 Rule 消费状态机：required Rule 常驻读取，enabled optional Rule 先读取 description 再按任务语义读取正文，disabled 或 uninstalled Rule 不参与任务。
- 消除 Service 规范中关于规则入口的冲突：`services/manifest.yml` 不记录 `rules.source` 或其他规则源指针，Service 目录内 `AGENTS.md` 是由目录约定发现的唯一服务级规则入口。
- 补充 Root、Project、Service、深层模块、兄弟 scope 隔离、嵌套 Git 边界、非 Buildr-managed 配置冲突以及 Codex/Claude Code 差异的集成测试。
- 统一任务 worktree 位于当前 Buildr workspace 根的 `.worktrees/<task-id>`，并要求 Agent 在采用 OpenSpec 或创建/复用 worktree 前明确说明 change、路径和分支。
- 不引入路径、角色或 Service 规则路由表，不单独渲染 `rules/*.md`，也不允许 Buildr 覆盖非 Buildr-managed runtime 配置。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `root-organization-workspace`: 将多层 `AGENTS.md` 从固定 Root/Project/Service 祖先链扩展为 canonical scope 的祖先链加递归子树，并统一 scope 路径表达与 Git 边界。
- `workspace-first-runtime-projection`: 定义 native/rendered adapter 的递归规则投射、`sync` 行为和 `runtime list` capability 元数据。
- `agent-readable-doctor`: 让 doctor/runtime check 检查 scope 内完整 `AGENTS.md` 发现结果，并提供 canonical scope 与冲突修复信息。
- `buildr-package-assets`: 让 package check 和产品 MVP 验证覆盖 Service、深层目录、scope 隔离和多 adapter 规则投射。
- `service-asset-indexing`: 统一 Service 规则入口语义，删除“service metadata 可以记录规则源位置”的冲突要求，明确 `AGENTS.md` 目录约定和 manifest 封闭 schema。
- `product-agent-skills`: 让 Buildr Skill 准确解释 Rule 的 enabled、required、state 和语义相关性读取行为，并让 task/OpenSpec Skills 明确工作流选择、change 与 worktree 位置。

## Impact

- 主要影响 `tools/render-claude-code-rules.mjs`、Claude Code/Codex runtime check、`tools/buildr` 的 scope resolver、runtime capability metadata、doctor 聚合和产品验证脚本。
- CLI 文档、Buildr Skill、bootstrap guide、current state 和产品文档需要统一 canonical scope 与递归投射语义。
- required Buildr Core 和 package contract 需要增加 Rule 消费协议，确保 native/rendered adapter 暴露 manifest 后 Agent 采用同一加载语义。
- `service-asset-indexing` 主规范将在归档时收敛为“不记录 `rules.source`”；现有实现和 current-state 已符合该方向，不引入 Service manifest schema 迁移。
- `sync <agent>` 对根 scope 的规则处理将覆盖整个受管理 workspace 子树；写入型 adapter 可能在 Project、Service 和深层目录创建 runtime bridge，因此必须继续执行 managed marker 冲突保护。
- 旧 Service scope 缩写进入兼容期；canonical 输出、帮助和修复命令只使用真实 workspace 相对路径。
- workspace `.gitignore` 和 package baseline 将忽略 `/.worktrees/`；Rules discovery 将该目录视为不透明边界，避免递归扫描任务副本。

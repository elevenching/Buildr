## 1. Canonical Scope 与规则发现

- [x] 1.1 将现有 Rules scope resolver 重构为真实 workspace 相对路径解析，覆盖 root、Project、Service 和任意深层目录，并拒绝绝对路径、逃逸路径和缺失目录。
- [x] 1.2 实现与 adapter 无关的 Rules discovery plan，合并 scope 祖先链和 scope 子树递归 `AGENTS.md`，完成去重及宽到窄的稳定排序。
- [x] 1.3 实现扫描裁剪：不跟随目录符号链接，跳过 VCS、Agent runtime、dependency、build-output 目录，并只进入 registry 已管理的嵌套 Project/Service Git repo。
- [x] 1.4 为可无歧义解析的旧 `projects/<project>/<service...>` scope 提供 registry-backed 兼容和迁移 warning；歧义输入必须失败且不写 runtime。
- [x] 1.5 统一 Service 规则入口语义：保持 `services/manifest.yml` 封闭 schema，不写入或迁移 `rules.source`，并让 adapter 只通过 Service 目录 `AGENTS.md` 约定发现规则。

## 2. Adapter 投射与 Reconcile

- [x] 2.1 让 Codex runtime check 消费统一 discovery plan，报告全部 native `AGENTS.md` source 且不写 Rules bridge。
- [x] 2.2 将 Claude Code Rules render 改为两阶段 reconcile：先计算并校验全部 target/conflict，再统一创建、更新或保持同目录 `CLAUDE.md` bridge。
- [x] 2.3 在 rendered adapter reconcile 中清理 scope 内 source 已删除的 Buildr-managed orphan bridge，保留所有非 Buildr-managed 文件，并输出 created/updated/unchanged/removed receipt。
- [x] 2.4 调整组合 `buildr render`：Rules 使用完整 canonical scope，Skills 对 Service/深层 scope 折叠到所属 Root/Project scope。
- [x] 2.5 让默认 `buildr sync <agent>` 以 canonical `.` 递归 reconcile 整个受管理 workspace Rules 子树，同时保持 native adapter Rules 零写入。
- [x] 2.6 更新 required Buildr Core 和 Buildr Skill，明确 required/optional、enabled/disabled、installed/uninstalled 的 Rule 消费状态机，并保持任务操作手册在 Skills 中。

## 3. Runtime Metadata 与诊断

- [x] 3.1 更新 `buildr runtime list --json` 的 `rules-entry` capability metadata，声明 canonical scope syntax、递归 source discovery、祖先包含、projection mode、target pattern 和 writes-files 行为。
- [x] 3.2 更新 Claude Code/Codex runtime check 与 doctor 聚合，覆盖 missing、stale、conflict、orphan、扫描边界信息，并按 adapter/canonical source/target 去重 findings。
- [x] 3.3 让 help、receipt、doctor next steps 和 recommended commands 只输出 canonical workspace 相对 scope；旧 scope 仅出现在兼容 warning 中。

## 4. 产品验证

- [x] 4.1 扩展 `buildr package check`，验证 Root -> Project -> Service -> 深层模块的发现顺序、Project/Service scope 子树隔离和 canonical scope 解析。
- [x] 4.2 扩展产品 MVP 临时 workspace 测试，验证 Claude Code 对 Project、Service、深层模块和根 sync 生成完整同目录 bridge。
- [x] 4.3 补充 Codex 对相同多层 scope 的 native Rules diagnostics，并断言没有生成 Codex Rules bridge。
- [x] 4.4 补充旧 scope 兼容/歧义、目录逃逸、符号链接、排除目录、未登记嵌套 Git repo、两阶段 conflict 零写入和 orphan managed bridge 清理测试。
- [x] 4.5 验证 `runtime list --json` 对 Claude Code/Codex 的递归 Rules capability metadata 与实际 adapter 行为一致。
- [x] 4.6 补充 Service manifest 回归测试，确认 create/update/sync 不写入或迁移 `rules.source`，同时 Service `AGENTS.md` 仍能被 runtime adapter 发现。
- [x] 4.7 扩展 package contract/check，验证 required Core 包含 Rule 消费协议、默认 package 不发布场景化 optional Rule，也不硬编码组织级中文提交规则。

## 5. 文档、自举与验收

- [x] 5.1 更新 Buildr Skill、bootstrap guide、CLI 帮助、产品文档和 current state，说明 canonical scope、递归规则投射、Rule 状态消费、native/rendered adapter 差异及扫描边界。
- [x] 5.2 根据 source asset 变更运行 `projects/product/buildr sync codex --target ../..` 或所需 targeted render，并确认生成的 Buildr Skill/runtime 内容同步。
- [x] 5.3 运行 `projects/product/buildr package check`、`projects/product/tools/verify-buildr-product`、`openspec validate --all --strict`、Codex doctor 和 `git diff --check`。

## 6. Task Worktree 位置与工作流披露

- [x] 6.1 更新 task-worktree 与 OpenSpec Skills：执行前说明 workflow/change/worktree/branch，并固定 canonical worktree 为 `<workspace-root>/.worktrees/<task-id>`。
- [x] 6.2 将 `/.worktrees/` 加入 workspace/package `.gitignore` baseline 和 Rules discovery 排除集合，不允许静默回退临时目录。
- [x] 6.3 扩展 package check 与产品 MVP 测试，验证 Skill 披露契约、`.worktrees` ignore 和递归扫描隔离。
- [x] 6.4 同步自举资产，将当前任务 worktree 迁移到 workspace `.worktrees/recursive-agents-runtime-projection`，并重新运行全量验证。

## Context

当前 `initBuildr` 只物化 workspace 源资产，`syncRuntime` 则要求 workspace 已初始化，并统一执行产品源能力更新、Component reconcile、产品 Buildr Skill 安装、Rules/Skills runtime 投射和最终 doctor。这个职责划分适合内部演进，但公开首次路径要求连续执行三个命令，且容易让用户误以为还需要单独执行 `skill install`。

CLI 已有统一 runtime adapter registry 和 `syncRuntime` 管线，因此高层初始化不需要新增另一套 runtime 实现。变更需要同时覆盖开发 checkout、npm package、bootstrap/Skill 自然语言代码、帮助和 verifier，避免 canonical onboarding 再次分叉。

## Goals / Non-Goals

**Goals:**

- 让支持的 Agent 首次 onboarding 在完成 runtime identity 选择后，只需执行 `buildr init --agent <agent> ...`。
- 保留 `init` 创建源资产、`sync` 日常 reconcile 的内部边界，并让高层入口直接复用现有 sync 管线。
- 保持不带 `--agent` 的 `init`、独立 `sync`、`skill install` 和 `doctor` 完全可用。
- 明确参数预检、部分失败、幂等重试和最终 doctor 的行为。

**Non-Goals:**

- 不删除或隐藏 `sync`、`skill install`、`render`、`runtime check` 等高级/修复入口。
- 不让 `sync` 自动猜测 workspace name/profile 或自动初始化普通目录。
- 不引入 `buildr onboard`、`buildr use` 或新的 runtime adapter。
- 不把源资产初始化和 runtime 写入合并成单个跨边界回滚事务。

## Decisions

### 1. 使用 `init --agent` 作为高层组合入口

`--agent` 是可选参数。存在时，CLI 在写入前通过统一 adapter registry 校验 id，然后执行源资产初始化，再调用现有 `syncRuntime(agent, ...)`。不存在时保持现有纯源资产行为。

选择可选参数而不是新命令，是因为用户心智仍是“初始化 workspace”，而 name/profile 也天然属于 `init`。没有采用让 `sync` 自动初始化的方案，因为 sync 无法可靠推断 name/profile，且会模糊日常更新与首次创建的失败边界。

### 2. 复用完整 sync 管线，不复制 update/render/doctor

高层入口只做 orchestration。产品能力、Component、Buildr Skill、Rules/Skills 投射和 doctor 都继续由 `syncRuntime` 负责。这样 `init --agent` 与日常 `sync` 共享 adapter 选择、冲突保护和完成条件。

### 3. 在源资产写入前完成 runtime 参数校验

unsupported 或缺失值必须在 `initBuildr` 开始创建目录前失败，避免无效高层命令留下半套 workspace。`--name`、`--profile` 的现有校验同样保持在写入前。

### 4. 部分失败保留已初始化 workspace，并提供确定性恢复入口

源资产初始化完成后，runtime 冲突、optional Component 决策点或 doctor error 可能使 sync 失败。此时不回滚已成功创建的 Organization/Root 源资产，也不声称 onboarding 完成；错误信息必须说明 workspace 已初始化，并引导修复后执行 `buildr sync <agent> --target <dir>`。这是因为 runtime 可能包含用户文件，跨源资产与 runtime 做全局回滚会扩大数据风险。

### 5. canonical 文档只展示单命令首次路径

README、CLI reference、bootstrap guide 和 Buildr Skill 的首次初始化示例使用 `runtime list -> init --agent`。独立 `init` 和 `sync` 在职责说明、兼容/高级场景和日常更新中保留，避免把高层体验收敛误解为删除底层能力。

## Risks / Trade-offs

- [Risk] `init --agent` 在 sync 阶段失败会留下已初始化但 runtime 未完成的 workspace → 明确输出阶段状态和重试命令，利用 sync 的幂等 reconcile 恢复。
- [Risk] 文档中同时存在高层 init 与日常 sync，读者仍可能重复执行 sync → canonical quick start 只展示 `init --agent`，并明确命令已经包含 sync 与 doctor。
- [Risk] orchestration 直接传递 init 专属参数给 sync 可能形成隐式耦合 → 构造只包含 `--target` 和 canonical root scope 的 sync 参数，不让 sync 解析 name/profile。
- [Risk] verifier 只检查最终 doctor，无法证明单命令边界 → repository onboarding 和 npm E2E 明确只调用一次 `init --agent`，并断言产品 Skill/runtime 与 doctor 状态。

## Migration Plan

1. 增加可选参数和 orchestration，保留所有旧调用。
2. 更新专项 verifier 与完整产品验证，确认 checkout 和 npm 两条安装路径。
3. 更新所有 canonical onboarding 文本和 current-state knowledge。
4. 发布后旧自动化无需迁移；新 onboarding 改用 `init --agent`，已有 workspace 继续使用 `sync <agent>`。

回滚时可移除 `--agent` orchestration 并恢复多命令文档；已由该命令创建的 workspace 与 runtime 均是现有 init/sync 的标准产物，不需要数据迁移。

## Open Questions

无。

## Context

Buildr 的源资产由 `tools/buildr` 中多个命令直接维护。Component 已经提供成员 ownership、integrity、符号链接检查和集合级 Old/Live/New 预检，OpenSpec contract guard 也能保护 Requirement 同步；但通用命令仍分别使用 `writeFileSync`、`cpSync` 和 `rmSync`，资产 id 校验允许 `.` 与 `..`，`package build --out` 会删除任意输出目录，手写 YAML 标量 parser 不能正确 round-trip escape。预检之后发生 I/O 失败时，manifest、资产内容和回执可能停在不同版本。

该问题横跨 workspace、Project、Service、Component、Builtin、Rule、Skill、Command、package output、OpenSpec sidecar 和 runtime adapter。安全保证必须是不可卸载的 CLI core，而不是 OpenSpec Component 或可选 Skill。

## Goals / Non-Goals

**Goals:**

- 为所有 Buildr mutation 提供统一、可测试的 identity、路径、ownership 和 symlink 安全边界。
- 在第一次写入前生成并验证完整 mutation plan；已知冲突、无效 manifest 和 repo identity 不一致保持零写入。
- 文件原子替换，目录 staged swap；普通进程内失败恢复操作前状态。
- 对异常退出留下的锁、staging 和 backup fail closed，并通过 doctor 提供恢复事实。
- 复用 Component integrity 和 ownership，而不复制一套 Component 专用文件系统安全实现。
- 保持源资产提交与 runtime reconcile 的既有边界。
- 正确解析 YAML 语义并继续执行现有封闭 schema 和 convergence 契约。

**Non-Goals:**

- 不实现权限、审批、OS sandbox、Git Hook、系统 Hook 或不可绕过的外部写入拦截。
- 不实现跨机器锁、跨文件系统分布式事务或断电后的自动语义恢复。
- 不阻止用户手工编辑文件，也不把所有相邻用户文件纳入 Buildr 备份。
- 不改变 OpenSpec CLI、外部 workflow Skills 或 Project `openspec/` 的所有权。
- 不保证保留 Buildr manifest 的原始排版和注释；保证的是 schema 内语义值。
- 不在本 change 处理 Practices、未来 Agent 文档、prototype capability 或权限 Roadmap。

## Decisions

### 1. 安全能力属于 CLI core，而不是 Component

新增内部安全模块，提供 `assertAssetId`、scope path resolver、protected root policy、symlink walker、atomic writer、tree integrity、workspace mutation lock 和 transaction API。Component lifecycle、普通资产命令和 OpenSpec sidecar 共用这些 primitives。

备选方案是创建 `data-integrity` Component。该方案允许安全能力被卸载，并使 OpenSpec 是否安装影响其他资产安全，因此拒绝。

### 2. 路径授权使用“严格后代 + 明确所有权”，不是禁止保护根全部后代

删除目标必须是命令声明资产容器的严格后代，且不得等于集合根、workspace 根、Product 根、当前目录、用户 home 或文件系统根，也不得成为这些保护根的祖先。目标任一已存在 segment 是 symlink 时拒绝。

因此 `skills/foo/`、`rules/team/review.md` 和 Component 明确成员仍可删除；`skills/`、workspace 根或通过 `..` / symlink 到达的目标不可删除。对用户指定的 package output 还必须满足 output receipt 契约。

备选方案是只做字符串 prefix 检查。它无法正确处理 `..`、绝对路径、大小写/分隔符差异和 symlink，因此拒绝。

### 3. MutationPlan 在写入前封闭操作集合

每个 mutation 先声明 scope、operation id、受影响 manifest、write/replace/remove 目标、预期 ownership 和可选 Old integrity。preflight 完成路径、symlink、manifest schema、Component ownership、repo identity、Old/Live/New 和锁检查；任何错误都发生在第一次持久化写入前。

单个文件采用同目录临时文件、`fsync`（平台支持时）和 rename。目录替换先复制到同一文件系统 staging，再把旧目标 rename 到 transaction backup，最后把 staged tree rename 到目标。事务记录已应用步骤，普通异常按逆序回滚。

备选方案是只把 `writeFileSync` 换成 atomic file write。它不能保护跨 manifest 与目录的集合操作，因此不足。

### 4. 使用 workspace 单写者锁，异常退出不自动猜测

workspace source mutation 使用 `.buildr/mutations/lock.json` 的原子 exclusive create 串行化。事务 metadata、staging 和 backup 位于 `.buildr/mutations/<transaction-id>/`；package output 位于 workspace 外时使用输出目录同级 staging，并在 workspace transaction 中记录。

成功提交后清理事务目录和锁。异常退出留下 lock 或 transaction 时，后续 mutation fail closed；doctor 输出 owner、operation、affected paths 和确定的 inspect/restore/remove next action。首版不依据时间自动认定 stale，也不自动删除无法证明状态的 backup。

### 5. Source commit 与 runtime reconcile 仍是两个边界

Rule、Skill、Builtin 和 Component 的源资产与 manifest 在一个 source transaction 中提交。Component `component.yml` 仍作为最后成功物化回执；transaction 内将它作为最后一个逻辑 commit step。source commit 完成后才运行 runtime reconcile 和最终 doctor。

runtime reconcile 失败时不回滚已提交源资产，返回失败并指向 render/sync/doctor 修复。这保持 `managed-components` 的事实源语义，也避免用可重建 runtime 覆盖长期源资产。

### 6. Package output 使用 receipt 和 Old/Live/New

新输出先构建到同级 staging。目标不存在或为空时可以接管；非空目标必须包含版本化 `.buildr-package-output.json`，且 live tree（receipt 文件除外）匹配 receipt integrity。匹配时把旧输出移入 backup 并原子换入新输出；不匹配、存在额外内容或无 receipt 时拒绝。

receipt 记录 schema、生成产品版本/commit（可用时）、文件清单与 integrity，不包含本机秘密。首版不提供 `--force`。

### 7. Repo create 先验证 identity，再修复 baseline

Project/Service Git 目标不存在时 clone 到 staging 后 rename。目标已存在时读取实际 Git remote，并与命令参数和 registry 比较：相同来源允许幂等修复 baseline；不同来源在任何 manifest 或 `.gitignore` 写入前失败。workspace-managed Project 不因后来传入 Git URL 被静默改绑。

显式 relink/replace 涉及用户 repo ownership 决策，留给未来独立 change。

### 8. YAML 使用成熟 parser，封闭 schema 不变

引入 `yaml` 运行时依赖，统一解析 Buildr 管理的 YAML manifest。parser 必须拒绝 duplicate key、非预期 document 形态和 schema 不支持字段；serializer 输出确定性 canonical YAML。现有 spec 明确要求 update/sync 移除未知字段的 convergence 路径仍可执行，但删除字段必须进入 mutation plan 并享受回滚。

备选方案是继续扩展正则 parser。合法 YAML 的 quoting、escape、null、数字和 collection 语义会持续扩大维护面，因此拒绝。

### 9. OpenSpec guard 只复用原子 sidecar 写入

baseline 与 pre-sync receipt 使用 atomic JSON writer，并继续先安全解析 Project/change 路径。canonical specs 仍由外部 OpenSpec sync 修改，Requirement baseline/pre/post-sync 仍是语义门禁；本 change 不把 OpenSpec canonical sync 纳入 Buildr source transaction。

## Risks / Trade-offs

- [Risk] 一次迁移全部 mutation 入口可能遗漏隐蔽直接写入。→ 增加静态验证，枚举生产代码中的 `rmSync`、`writeFileSync`、`copyFileSync`、`cpSync`，只允许在安全 primitives、只读 fixture setup 或显式审阅位置出现。
- [Risk] transaction rollback 本身可能失败。→ 保留 backup 和 journal，不清理事实；doctor 报告 error，后续 mutation fail closed。
- [Risk] lock 因进程异常永久保留。→ 首版要求显式诊断与恢复，不按超时静默夺锁；避免两个进程同时修改。
- [Risk] YAML canonical render 改变排版。→ package check 和 fixtures 验证语义 round-trip；文档明确 manifest 是封闭 schema 的机器契约。
- [Risk] directory hashing 和 staging 增加 I/O。→ 只对将被替换/删除的受管树计算 integrity；runtime 输出保持可重建，不纳入 source transaction backup。
- [Trade-off] 非空无 receipt 的旧 package output 不再自动覆盖。→ 用户可删除该专用输出目录后重建，Buildr 不猜测目录所有权。
- [Trade-off] 异常退出后需要人工确认恢复。→ 以可审计 fail-closed 换取不误删 backup；自动恢复留给未来。

## Migration Plan

1. 引入 YAML dependency、安全 identity/path、atomic write、integrity、lock 和 transaction primitives，并用单元 fixture 固定行为。
2. 迁移 manifest writers、Rules/Skills/Builtins、legacy convergence 和 OpenSpec sidecar；加入 production direct-write allowlist check。
3. 迁移 Component install/update/uninstall，在 fault injection 下验证旧状态或新状态完整、无中间状态。
4. 迁移 Project/Service create 与 package build，加入 repo identity 和 output receipt。
5. 扩展 doctor、package check 和临时 workspace E2E；验证两种 runtime adapter，并运行产品总验证、npm pack dry-run 和 OpenSpec contract audit。
6. 发布后旧 workspace 无需预迁移；首次 mutation 创建 `.buildr/mutations/`。既有 package output 没有 receipt 时拒绝自动接管，由用户显式清空后首次重建。

回滚到旧版本 Buildr 时，新的 receipt 和 `.buildr/mutations/` 对旧 CLI 是未知文件；回滚前必须确认没有 active transaction。已提交的 canonical manifests 仍使用既有 schema，不需要数据降级。

## Open Questions

无。危险 `--force`、自动 crash recovery、显式 repo relink 和跨机器协调留给后续 change。

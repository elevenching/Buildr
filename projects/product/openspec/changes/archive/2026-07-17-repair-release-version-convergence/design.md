## Context

Buildr 发布采用 `dev` 准备候选、squash 到 `main`、再把 main 历史桥接回 dev 的模型。RC4/RC5 实际从临时 release branch 发布，版本提交未先进入 `dev`；旧 bridge 只连接上一版 main 与 release branch，也没有修复当前 dev。结果是 registry/main 已为 rc.5，而开发 checkout 仍为 rc.3，且 update check 只比较 `dev` upstream，无法识别发布事实漂移。

当前 `dev` 已包含 RC5 之后的新实现，不能用 rc.5 的 main tree 覆盖，也不能直接用 `ours` merge 掩盖缺失发布材料。修复必须区分一次性事实收敛与未来 release gate。

## Goals / Non-Goals

**Goals:**

- 将当前 dev 的 package identity 与必要发布材料收敛到已发布 rc.5，同时保留后续开发内容。
- 候选只允许从最新 origin/dev 形成，版本提交先进入 dev，再进入 main。
- 用机器 checker 证明 candidate base、package version、tree identity、main/dev ancestry 和 release task hygiene。
- update check 分别表达 Git source 状态与 registry release version 状态。

**Non-Goals:**

- 不增加 `--version` 或新公开 release command surface。
- 不自动发布、移动 tag/dist-tag 或重写 main/dev 历史。
- 不让 update check 自动把 registry release 内容写入开发 checkout。

## Decisions

### 1. 一次性恢复采用语义合并，不复用旧 candidate bridge

从 `main@v0.1.0-rc.5` 选择 package/lockfile 版本与缺失发布材料合并进当前 dev 候选，保留当前 dev 的实现与后续文档。旧 bridge 的 candidate tree 已不等于当前 dev，继续运行会正确 fail closed。

不直接 `merge -s ours main`：仅建立 ancestry 会隐藏尚未收敛的版本或发布材料。当前 change 先让受审阅内容收敛；历史关系是否需要单独修复由 checker 明确报告，不在普通产品 commit 中伪造已完成。

### 2. Release candidate 必须以 captured origin/dev 为基线

准备 release worktree 时记录 `origin/dev` commit 作为 base。候选在进入 `task-finish` 前必须证明该 base 是 release branch 的直接开发基线，且候选能够 fast-forward 集成到当时的 dev。需要排除内容时先在 dev 创建 revert/change，不能从旧 ancestor 选取发布快照。

相比允许任意 commit selection，这会牺牲临时挑选候选的灵活性，但消除 dev/main/package 三套事实。

### 3. 新增内部 convergence checker，不扩展公开 CLI 命令

实现可复用的 release verification 模块和脚本，接收 target version、candidate base/tree 与阶段，输出 versioned JSON。Skill 调用 checker，测试直接调用模块。checker 只读 Git refs、package metadata 和 release task refs，不创建 merge/tag。

准备 main 前检查 origin/dev 包含候选版本且 tree 等于验证 tree；main squash 后检查 main/dev tree 相同且 main 为 dev ancestor。任何 mismatch 都 fail closed。

### 4. Update check 输出 source 与 release 两个维度

development-checkout 继续以 upstream 决定 Git 更新策略，同时查询 npm `next`/`latest` 可用版本并返回 `sourceStatus`、`versionStatus` 与 releasedVersion。checkout Git 最新但 package version低于已发布版本时，顶层 status 使用 `version-stale`，但不自动安装 registry package或修改 checkout。

registry 不可达时保留现有 Git 结论，并将 release version 状态报告为 `unknown`，避免把网络问题变成开发 Git update 的写入授权。

## Risks / Trade-offs

- [Risk] 将 rc.5 标记写入包含 rc.5 后改动的 dev，开发内容与已发布 tarball不完全相同。→ version 表示当前发布基线；update check 同时报告 development checkout commit，发布仍以 tag tree 为准。
- [Risk] registry 查询增加 update check 延迟或离线噪声。→ 复用有限超时，失败时返回 `unknown`，不阻塞纯 Git 状态诊断。
- [Risk] release task ref 扫描误伤无关分支。→ 仅检查规范化的 `tasks/release-<version>` identity 和对应 worktree。
- [Risk] Skill 再次被跳过。→ checker 纳入候选验证与回归测试，使违规路径机器失败。

## Migration Plan

1. 在当前 dev 候选中同步 rc.5 package/lockfile 与缺失发布事实。
2. 加入 checker、update diagnostics、Skill/docs/spec/tests。
3. 运行受影响验证和最终候选验证。
4. 后续通过正常 task-finish 集成；不在本 change 自动创建 tag 或发布。

## Open Questions

无。main/dev 历史的既有分叉保持显式诊断；若需要建立 ancestry，后续使用经过 tree/content gate 的独立 Git 操作，而不是本 change 隐式执行。

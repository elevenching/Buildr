## Why

RC4、RC5 已在 `main`、Git tag 和 npm registry 发布，但对应版本与发布历史没有收敛回 `dev`，导致开发 checkout 仍声明 rc.3，且 `buildr update check` 因只比较 branch upstream 而错误报告 `up-to-date`。当前发布流程需要把候选来源、版本事实、main/dev tree 和历史衔接变成不可绕过的机器门禁，并修复既有分支漂移。

## What Changes

- 将当前 `dev` 的 package/lockfile 与发布材料安全收敛到已发布的 rc.5，同时保留 rc.5 后新增的开发改动。
- 强制 release candidate 基于准备时最新 `origin/dev`；如需排除提交，必须先在 `dev` 通过独立 change 撤销，禁止从旧 ancestor 直接发布。
- 增加 release convergence checker，验证 candidate base、版本、main/dev tree、祖先关系和残留 release task 状态；不满足时 fail closed。
- 强化 `buildr-release` Skill、release checklist 和 history bridge 调用边界，禁止绕过 `task-finish` 直接把 release task branch 送入 `main`。
- 扩展 development-checkout 的 `buildr update check --json`，区分 Git source 同步状态与 registry 发布版本漂移，避免把 stale package version 报告为整体最新。
- 不增加 `buildr --version`、`-V` 或 `version` 命令。
- 不包含破坏性 CLI 或 JSON 字段删除。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `open-source-release-governance`: 发布候选必须从最新 `dev` 形成、先回到 `dev`，并通过可执行的 main/dev/version convergence gate 后才能创建 tag。
- `buildr-cli-self-update`: development-checkout 更新检查必须分别报告 source 同步与已发布版本漂移，不能仅凭 upstream 一致返回整体 `up-to-date`。

## Impact

- 发布流程：`projects/product/skills/buildr-release/SKILL.md`、release checklist、release bridge/check tooling 与测试。
- CLI：`tools/cli/application/cli-update.mjs` 的只读 JSON 诊断；保持现有命令表面。
- 发布事实：`projects/product/package.json`、`package-lock.json` 及必要的 rc.4/rc.5 发布材料收敛。
- 验证：release contract/history bridge、CLI update 和候选验证。

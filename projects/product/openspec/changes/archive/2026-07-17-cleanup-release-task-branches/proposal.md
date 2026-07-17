## Why

Buildr 发布完成后会清理本地 release worktree 和本地分支，但远端 release task 分支默认长期保留。已经由 tag、GitHub Release 和 npm 承载的候选因此继续显示为未集成任务，增加后续诊断噪音。

## What Changes

- 在发布成功且发布事实完成验证后，识别本版本的远端 release task 分支。
- 删除前展示分支、commit 及已验证的 tag/npm/GitHub Release 证据，并取得用户明确授权。
- 授权后删除远端 release task 分支并复核 ref 已不存在；未授权或删除失败不影响已经完成的发布事实。
- 不改变 main/dev history bridge 规则，也不静默删除任何远端分支。

## Capabilities

### Modified Capabilities
- `open-source-release-governance`: 增加发布成功后的受控 release task 分支清理契约。

## Impact

- 更新 `buildr-release` Project Skill 与 release checklist。
- 增加 Skill 契约回归测试。


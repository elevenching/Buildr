## Context

远端 release task 分支在发布完成后不再是版本事实源；tag、GitHub Release、npm registry 和 main commit 才是稳定发布证据。但远端分支删除是破坏性 Git 操作，不能由普通 task finish 默认授权。

## Goals / Non-Goals

**Goals:**
- 把远端 release task 分支清理纳入发布完成阶段。
- 删除前验证发布成功并取得明确授权。
- 删除后复核远端 ref。

**Non-Goals:**
- 自动删除分支。
- 修改 task-finish 的通用远端分支授权。
- 修复既有 main/dev ancestry。

## Decisions

### Decision: 清理由 release Skill 编排

`buildr-release` 知道目标版本、tag、npm dist-tag、GitHub Release 和发布 workflow，能够证明分支已经失去恢复用途；通用 task-finish 不具备这些发布事实。

### Decision: 明确授权后才删除

发布完成报告先列出 `tasks/release-<version>`、commit 和稳定发布证据。只有用户明确授权，Agent 才普通删除远端 ref，并在删除后查询远端确认不存在。

### Decision: 清理失败不回滚发布

tag、npm publish 和 GitHub Release 是已经完成的外部事实。分支删除失败只形成清理 follow-up，不得回滚或重做发布。

## Risks / Trade-offs

- 分支暂时保留会产生噪音，但比未授权删除安全。
- 远端查询失败时必须保留分支并报告，不能假设删除成功。


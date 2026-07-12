## 1. Rule 拆分决策

- [x] 1.1 确认 `buildr-core` 需要保留或新增的最小 invariant 清单。
- [x] 1.2 确认 `task-triage` 的触发描述和正文结构，确保它面向用户任务意图而不是内部路径名。
- [x] 1.3 确认直接删除 `buildr-openspec`，并移除归档外活动引用。
- [x] 1.4 确认 `task-worktree` 的触发描述和正文结构，确保它只覆盖任务 worktree 生命周期。
- [x] 1.5 确认 `git-ops` 的触发描述和正文结构，确保它聚焦 Git 协作约定和安全默认值。

## 2. 随包资产调整

- [x] 2.1 更新 `package/manifest.yml`，移除 procedural optional Rules，并声明对应 builtin Skills。
- [x] 2.2 更新 `package/workspace/rules/manifest.yml` 和 `package/workspace/skills/manifest.yml`。
- [x] 2.3 调整 `package/workspace/rules/buildr/` 与 `package/workspace/skills/buildr/` 下的源资产文件。
- [x] 2.4 同步 root workspace 中对应的 `rules/`、`skills/` 源资产，保持自举 workspace 与 package baseline 对齐。

## 3. CLI 与验证脚本

- [x] 3.1 更新 package check 对默认 Rules/Skills baseline 的断言。
- [x] 3.2 更新产品验证脚本中对 package baseline 文件和内置能力清单的断言。
- [x] 3.3 确认不为旧 optional procedural Rules 实现兼容迁移、superseded 提示或 doctor/update 特判。

## 4. Agent 入口与文档

- [x] 4.1 更新产品内置 Buildr Skill，说明 procedural guidance 应通过 Skills 承载。
- [x] 4.2 更新 bootstrap guide、README、Buildr current state 和产品文档中的 Rule/Skill 分层说明。
- [x] 4.3 更新所有仍引用旧 optional Rule 路径的角色规则、验证说明或归档外的活动文档。

## 5. 验证

- [x] 5.1 运行 `projects/product/buildr package check`。
- [x] 5.2 运行产品 MVP 验证入口。
- [x] 5.3 运行 `openspec validate --all --strict`。
- [x] 5.4 修复验证发现的问题，并确认没有未说明的 runtime/baseline drift。

## 1. Worktree 与验证证据契约

- [x] 1.1 更新 task-worktree Skill，在实现型 change propose 前完成 worktree 决策并保持 artifacts、实现和候选验证单写入
- [x] 1.2 更新 task-worktree 与 git-ops Skills，将完整验证绑定最终候选 tree，并明确相同 tree 集成不重复验证
- [x] 1.3 更新 Product Project 规则、current state、产品说明和开发入口文档，删除 post-merge 重复 E2E 门禁

## 2. 防回退验证

- [x] 2.1 扩展 bootstrap/package contract，校验唯一写入、verified-tree 证据复用和 tree 改变后重验文本
- [x] 2.2 产品 E2E 确认未合并候选验证不修改主开发工作区
- [x] 2.3 更新 package check 与产品 E2E，确保不再要求合并后重复 E2E

## 3. 验证与隔离收尾

- [x] 3.1 运行 package check、产品 E2E、OpenSpec strict validation 和 npm pack dry-run
- [x] 3.2 确认 `dev` 主工作区保持干净，task worktree 只包含本任务文件
- [x] 3.3 按 Product Project 规则刷新本机 Buildr 开发入口并运行入口检查与当前 Agent doctor

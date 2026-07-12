## 1. Git Ops 策略

- [x] 1.1 在随包 Git Ops Skill 中增加 rebase-first、fast-forward-only 和 merge commit 明确授权规则。
- [x] 1.2 保留已推送/共享分支、force push 和 rebase 冲突的现有安全边界。

## 2. 验证与同步

- [x] 2.1 更新产品验证脚本，检查 Git Ops Skill 的线性集成语义。
- [x] 2.2 同步 delta specs，运行产品总验证、OpenSpec strict validation 和 `git diff --check`。
- [x] 2.3 使用当前候选 Buildr 同步自举 workspace，确认 Codex doctor 通过。
- [x] 2.4 归档 change，并按产品源与自举结果分层提交。

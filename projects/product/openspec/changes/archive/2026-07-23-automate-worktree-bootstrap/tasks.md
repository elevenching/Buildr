## 1. CLI 与应用服务

- [x] 1.1 新增 `worktree create` 参数解析、help、命令注册和稳定 JSON result schema，覆盖必填 agent/branch、canonical task id/path 与 start point。
- [x] 1.2 实现 Git worktree 创建/复用预检与结构化 lifecycle evidence，保证占用、identity mismatch 和 branch 冲突零写入。
- [x] 1.3 实现创建后 doctor、安全 runtime-stale allowlist、自动 sync、最终 doctor 与 Git identity/clean 复核，阻塞时保留现场。

## 2. Agent 入口与产品验证

- [x] 2.1 更新产品入口 Buildr Skill、task-worktree Skill、package manifest/静态校验和 CLI 文档，使新 checkout 统一使用产品入口且一般 transition 保留原授权边界。
- [x] 2.2 增加 unit/contract/CLI integration 测试，覆盖 healthy skip、stale auto-sync、unsafe blocked、JSON stdout、幂等复用和 identity 冲突。
- [x] 2.3 运行 minimal 与 affected 验证，修复发现的问题并确认 OpenSpec proposal 门禁仍通过。

## 3. 最终候选

- [x] 3.1 冻结实现、自然语言资产与生成资产，运行完整 Candidate 并记录 timing summary；成功后仅更新本任务 checkbox。

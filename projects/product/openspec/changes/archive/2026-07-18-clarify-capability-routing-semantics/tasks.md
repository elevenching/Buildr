## 1. 语义与实例

- [x] 1.1 更新能力契约产品说明，区分 Agent Skill 意图发现、能力目录、consumer dependency graph、产品入口内部路由和 Agent 执行协作，并明确不是 Skill 方法调用
- [x] 1.2 使用 `buildr.git-task-integration/v1` 补充 contract、manifest、provider、consumer、binding、resolver、runtime evidence 和实际执行的完整结构实例
- [x] 1.3 更新 `capability-adaptation` 判断语言及相关自然语言断言，避免把“Skill 被调用”作为创建 contract 的充分条件
- [x] 1.4 修正产品入口 Buildr Skill 的角色，明确它只在自身被 Agent 命中后执行内部 capability 路由，不是全局前置 dispatcher
- [x] 1.5 补充顶层入口 provider 替换时的 runtime 可发现性与 description 歧义检查

## 2. 验证

- [x] 2.1 运行专项测试、package check、OpenSpec strict validation 和 `git diff --check`
- [x] 2.2 冻结候选后运行 `npm run test:fast`，确认文档和随包 Skill 契约一致

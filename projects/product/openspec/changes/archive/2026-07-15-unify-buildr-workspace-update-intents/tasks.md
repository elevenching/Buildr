## 1. 统一 Buildr Skill 意图路由

- [x] 1.1 更新产品内置 Buildr Skill 的 description、执行循环、任务路由和 runtime 说明，将“更新/同步 Buildr”路由为 `update + skill install`。
- [x] 1.2 将“更新/同步 workspace”路由为 `sync`，并保留“只更新 CLI”的单项边界。

## 2. 对齐产品说明与验证

- [x] 2.1 更新 CLI reference 或其他受影响的 canonical 说明，区分 Buildr 产品入口更新、workspace 同步与底层原子命令职责。
- [x] 2.2 增加或调整定向验证，覆盖两组各自的“更新/同步”表达和“只更新 CLI”限制。

## 3. 候选验证

- [x] 3.1 运行 OpenSpec validation、package check 和受影响的 Skill/文档定向验证。
- [x] 3.2 审阅生成资产影响，并确认 change 归档或集成后按自举规则同步当前 workspace。

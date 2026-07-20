## 1. 契约与随包登记

- [x] 1.1 新增 `buildr.task-verification/v1` capability contract，定义输入、最低保证、授权、结果证据、停止条件和可替换范围
- [x] 1.2 在 workspace/package manifests、bootstrap contract 和默认 bindings 中登记 contract、provider 与 runtime 资产
- [x] 1.3 将 `task-finish` 的 verification dependency 声明为 required，并保持 worktree lifecycle 与 Git integration dependencies 不变

## 2. 默认验证工作流

- [x] 2.1 新增 `task-verification` Skill，落实政策 authority、三级验证、候选 identity、失效与失败恢复规则
- [x] 2.2 实现 verifier-reported 与 wrapper-measured 两类 wall-clock 证据，以及统一的直接用户报告格式
- [x] 2.3 收紧 `task-worktree` description 和正文，只保留 task checkout 生命周期、候选 identity 与验证交接边界
- [x] 2.4 调整 `task-triage` 和 `task-finish`，让规划只安排验证节点、收尾通过 selected provider 复用或补齐 Candidate evidence

## 3. 路由、文档与规范

- [x] 3.1 更新产品入口 Buildr Skill 的任务验证路由，并确保新 provider description 可独立发现且不与 worktree lifecycle 混淆
- [x] 3.2 更新产品说明、capability contract 文档和 Product Project 验证边界，明确 Rule、Project policy、verification provider 与 finish consumer 的职责
- [x] 3.3 更新 OpenSpec current-state 相关 delta，并完成 change strict、proposal baseline 和 contract gate

## 4. 受影响范围验证

- [x] 4.1 扩展 package/architecture contract tests，覆盖随包 inventory、manifest/binding、职责拆分和报告字段
- [x] 4.2 扩展 capability/runtime tests，覆盖默认 ready、replacement provider、缺失 provider blocked 和七 runtime 投射
- [x] 4.3 运行 `test:changed` 或等价 focus checks，修复全部受影响失败并确认 OpenSpec strict 通过

## 5. 最终候选验证

- [x] 5.1 冻结最终候选并运行 `npm run test:candidate`，核对 Candidate timing summary 的身份、总耗时、预算、最慢与失败阶段
- [x] 5.2 确认候选 package 临时 workspace/sync E2E 与 capability graph ready，并记录主自举 workspace 必须在集成后从 retained Product checkout sync 与 doctor

## 6. 自动触发与证据生命周期优化

- [x] 6.1 更新 contract、provider description 和产品路由，覆盖用户直接验证、Agent 完成前自动验证与 Task Finish consumer 调用
- [x] 6.2 为 transient/caller-managed evidence 定义保留、替代、消费后清理和失败保留语义
- [x] 6.3 为 Buildr Product timing summary 增加 lifecycle metadata 和边界安全的 cleanup 入口
- [x] 6.4 更新 Task Finish、产品文档与契约测试，验证临时证据不会被长期引用或交给 worktree lifecycle 清理
- [x] 6.5 更新 proposal baseline，运行 affected 与最终 Candidate 验证，并清理已被新证据替代的旧 transient run

## 7. 收尾验证执行去重

- [x] 7.1 定义 `inspect`、`execute`、`cleanup` provider operations，并区分 provider 调用与验证 executor 调用
- [x] 7.2 定义 `same-content`、`closeout-metadata-only`、`implementation-changed` transition 和双 identity 报告
- [x] 7.3 收紧 Task Finish 决策矩阵，保证已有 Candidate 的正常收尾与 archive-only 收尾均不重复 Candidate
- [x] 7.4 增加组合 fixture 和契约测试，直接断言三类场景的 provider operation 与 executor invocation count
- [x] 7.5 更新 baseline，运行 affected 与最终 Candidate，并在新 evidence 生效后清理旧 run

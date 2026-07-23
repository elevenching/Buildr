## Why

当前任务验证同时暴露 Minimal、Affected、Candidate、测试类型、执行入口和成熟度等多组概念，且 Task Finish 对所有普通任务都要求完整 Candidate evidence，容易让小范围改动触发不必要的全量验证。本次调整将日常工作收敛为“受影响验证”，将完整 Candidate 保留给发布、高风险或用户明确要求的场景，同时保持候选身份、证据复用、计时和失败语义的严谨性。

## What Changes

- 将面向 Agent 和用户的验证决策收敛为两类：普通开发/普通收尾使用受影响验证，发布/高风险/显式完整验证使用 Candidate。
- **BREAKING**：将 `buildr.task-verification` 升级为 v2，以 `requiredAssurance: affected | candidate` 明确 consumer 所需保证；默认 `task-verification` provider 与 `task-finish` consumer 同步迁移到 v2，不保留对旧结果形状的隐式兼容。
- Task Finish 只负责提供任务、发布意图、改动和候选身份；selected task-verification provider 根据 Project policy 返回所需保证和可信 evidence。普通收尾不再硬编码 Candidate。
- 保留 `minimal` 作为 provider 内部开发反馈动作，但不再作为 Task Finish 的正式交付保证；对外正式保证只使用 `affected` 与 `candidate`。
- 将 Buildr 本机应用 browser smoke 拆为 Project、Service、Change、Shell 四个可独立选择的 integration step，并接入统一 changed planner；browser 仍是 integration 的一种，不新增顶层测试类型。
- 收窄过宽的 Changed source owner，移除已由真实浏览器行为覆盖的前端源码正则断言，并补充必要的前端快速检查，避免修改局部 API 时触发无关 CLI architecture、managed mutation 或整套页面测试。
- 保持完整 Candidate 不读取 diff、不缩小权威门禁，并继续复用 identity 匹配的既有 evidence。
- 本 change 暂不修改 `projects/product/verification.yml`；Project 测试声明的能力拆分和成熟度调整留给后续经团队确认的独立更新。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `task-verification`: 把正式保证收敛为 affected/candidate，定义 v2 consumer 协作、普通收尾与发布/高风险收尾的选择和证据语义。
- `agent-task-workflows`: Task Finish 从固定 Candidate 门禁改为消费 provider 返回的 `requiredAssurance`，并按最终内容变化重跑同一所需保证。
- `buildr-package-assets`: 随包 contract、provider、consumer、runtime 投射和产品验证迁移到 `buildr.task-verification/v2`，并验证 changed/browser 精确路由。
- `local-app-browser-verification`: 浏览器集成测试拆为四个独立流程，按受影响范围执行并避免重复低层 API 覆盖。

## Impact

- Skills 与 contracts：`task-verification`、`task-finish`、`buildr.task-verification/v2`、相关 manifest/binding/package targets/runtime 投射。
- 产品验证：verification registry、changed/focus/candidate planner、browser integration、前端快速检查和契约测试。
- 产品文档与 current-state：验证类型、日常入口、Task Finish 门禁及 evidence 报告。
- 不修改本次 Product `verification.yml`，不改变外部 OpenSpec Skills，不引入新的浏览器下载或外部系统依赖。

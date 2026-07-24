## Why

`task-verification` 目前只能从 Rules、项目文档和既有命令临时解析验证政策，无法让不同团队声明任意测试能力、成熟度和适用阶段，也缺少由 Agent 持续引导能力从发现、试运行到门禁的通用机制。结果是团队特有的测试分层容易被写进通用 Skill，或者每个任务都要重新判断命令、环境、副作用与 Candidate 完整性。

## What Changes

- 为 Project 增加可选的 `verification.yml` 测试能力声明，表达稳定能力 ID、命令、成熟度、适用阶段、覆盖范围、环境依赖、副作用、授权和门禁强度。
- 扩展 `task-verification`，优先解析已确认声明，并按 `minimal`、`affected`、`candidate`、变更范围和授权动态编排任意能力集合。
- 保持严格零配置兼容：没有声明时继续读取 AGENTS、POM、项目文档和已有入口，不新增失败或阻塞，也不自动启动 Spring、端到端或其他新环境。
- 增加“初始化测试声明”和增量演进流程：Agent 扫描现有测试、生成 `discovered` 候选、请求团队确认、以 `trial/advisory` 累积证据，再建议提升为 `stable/required`；自动补充不得直接升级为门禁。
- 扩展验证结果证据，披露政策模式、可用/选中/跳过/阻塞能力、覆盖摘要、环境就绪度、授权决策和 Candidate 完整性。
- 更新 Project 资产校验、随包模板、产品文档和验证 fixtures，确保声明缺失、部分声明和权威声明三种路径行为稳定。

本 change 不包含破坏性变更；新声明是可选增强，旧 workspace 和旧团队无需迁移即可继续工作。

## Capabilities

### New Capabilities

- `project-test-capabilities`: 定义 Project 可选测试能力声明、初始化/增量演进、成熟度与门禁治理，以及零配置兼容边界。

### Modified Capabilities

- `task-verification`: 让默认 provider 消费任意测试能力集合并动态编排三级验证，同时返回扩展后的选择与完整性证据。
- `project-registry`: 将可选 `verification.yml` 识别为受 Project 所有且可校验的上下文资产，但不把它变成 Project 创建或开发的前置条件。
- `buildr-package-assets`: 随包交付并验证更新后的 Skill、contract、声明参考资料和 Project 资产校验行为。

## Impact

- 影响 `task-verification` Skill、`buildr.task-verification/v1` contract、Buildr Skill 的 Project 资产说明和产品文档。
- 新增 Project `verification.yml` schema 解析与 doctor/Project 资产诊断，不改变 `capabilities.yml` 的 Skill requirements/bindings/applicability 职责。
- 影响 Project doctor、package static/contract fixtures、capability consumer 组合测试和零配置临时 workspace 测试。
- 不自动安装测试工具、不启动外部环境、不修改 Service repo，也不把任何具体团队或技术栈的固定分层写进 Buildr 产品。

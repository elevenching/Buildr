## 1. Project 测试能力声明

- [x] 1.1 定义并实现 `buildr.project-verification/v1` 解析与校验，覆盖字段闭集、路径边界、成熟度/门禁约束、引用和依赖环
- [x] 1.2 将可选 `verification.yml` 接入已登记 Project doctor，保持声明缺失零 finding、诊断只读且不执行测试
- [x] 1.3 为 `task-verification` 随包目录增加通用 schema 参考和初始化模板

## 2. Agent 引导与动态编排

- [x] 2.1 更新 `task-verification` Skill，支持 legacy、augment、authoritative 政策模式和任意能力集合的 Minimal/Affected/Candidate 选择
- [x] 2.2 加入初始化、增量补充、discovered/trial/stable 演进和团队门禁确认流程，并写清环境、副作用与授权停止边界
- [x] 2.3 扩展 `buildr.task-verification/v1` contract、Buildr 产品入口 routing 和 Result Evidence，同时保持 provider identity 与 consumers 兼容

## 3. 产品事实与验证

- [x] 3.1 更新 Product 文档、Project 资产说明和 package 校验，说明零配置、声明生命周期与 Agent 引导演进边界
- [x] 3.2 增加声明 validator/doctor 单元测试及随包 Skill 契约测试，覆盖零配置、有效/无效声明、动态选择和增量演进 guardrails
- [x] 3.3 运行 OpenSpec proposal contract guard 和受影响范围验证，修复发现的问题
- [x] 3.4 运行最终完整 Candidate 验证并捕获与 implementation identity 绑定的 evidence

## ADDED Requirements

### Requirement: 产品验证入口必须共享声明与薄执行层
Buildr fast、affected、changed、Workspace/package selectors 和 Candidate entrypoints MUST 共享统一 step registry 与 planner/scheduler，并 MUST 将稳定 shell/npm 表面保持为薄 wrapper。

#### Scenario: 检查验证入口架构
- **WHEN** CLI architecture verifier 扫描产品验证入口
- **THEN** step 命令、预算、依赖和 group/profile membership MUST NOT 在多个入口重复维护
- **AND** wrapper MUST 只负责参数转交、环境前置检查和退出状态传播

#### Scenario: 专项 selector 保持兼容
- **WHEN** 维护者使用已有 affected group、Workspace suite 或 package selector
- **THEN** selector MUST 解析为统一 registry 中的稳定 step identity
- **AND** 未知或重复 selector MUST 保持 fail-closed 与去重行为

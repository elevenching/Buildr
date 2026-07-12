## MODIFIED Requirements

### Requirement: CLI 架构和 mutation 边界必须由自动验证保护
Buildr 产品验证 MUST 自动检查薄 executable、command 唯一登记、模块依赖方向、显式 shared platform 依赖、关键 facade 职责、npm runtime inventory、verifier 场景边界和直接文件写入边界，并 MUST 在模块回退为巨石、出现宽 namespace 或反向依赖、漏发运行时文件、验证流程重新内嵌到聚合入口或绕过受管 mutation primitive 时失败。

#### Scenario: 维护者运行产品验证
- **WHEN** 维护者运行 CLI 架构专项检查或产品完整验证
- **THEN** verifier MUST 扫描全部发布 CLI runtime modules，而不是只检查 `tools/buildr` 单文件
- **AND** verifier MUST 对不符合分层、显式依赖、facade 职责、verifier 场景或 mutation 白名单的实现返回非零状态和可定位文件/模块的诊断

#### Scenario: package check 聚合发布验证
- **WHEN** 维护者运行 `buildr package check`
- **THEN** package maintenance 层 MUST 聚合发布 metadata、inventory、baseline 和 smoke 结果
- **AND** 单个 package command handler MUST NOT 重新内嵌其他领域的完整实现

#### Scenario: 运行细粒度自动测试
- **WHEN** 维护者运行产品完整验证或单独运行 unit test 入口
- **THEN** Buildr MUST 使用 Node 原生测试入口验证可独立执行的解析、路径选择、计划生成和架构约束
- **AND** 需要完整临时 workspace 或真实 CLI 进程的端到端行为 MUST 继续由场景化 smoke 或 MVP verifier 覆盖

#### Scenario: 检查稳定 facade
- **WHEN** 架构 verifier 检查 package maintenance、doctor、runtime Skill renderer 或 MVP verifier 聚合入口
- **THEN** 这些入口 MUST 只承担参数接入、模块组合、兼容导出或场景调度
- **AND** 具体静态校验、诊断、来源解析、render plan 或长场景实现 MUST 位于职责明确的下层模块

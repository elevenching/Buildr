## ADDED Requirements

### Requirement: 低成本 Node 验证必须按测试语义分层
Buildr Product MUST 将低成本 Node tests 分为 unit、静态契约和快速集成三个稳定入口，并 MUST 由 fast 与 Candidate profile 聚合全部三层；测试迁移 MUST NOT 删除既有覆盖或把昂贵 Workspace、package、network、onboarding、release 生命周期引入 fast。

#### Scenario: 运行纯单元测试
- **WHEN** 维护者运行 `npm run test:unit`
- **THEN** verifier MUST 只发现直接调用同进程产品模块的 unit tests
- **AND** 这些测试 MUST NOT 启动真实 CLI、Git 或 npm 子进程

#### Scenario: 运行静态契约测试
- **WHEN** 维护者运行 `npm run test:contract`
- **THEN** verifier MUST 检查源码结构、manifest、文档、Skills、schema 或 entrypoint declaration 的静态一致性
- **AND** 这些测试 MUST 与 unit coverage 分开报告

#### Scenario: 运行快速集成测试
- **WHEN** 维护者运行 `npm run test:integration:fast`
- **THEN** verifier MUST 运行需要真实 CLI、Git 子进程或多模块组合的低成本测试
- **AND** verifier MUST NOT 执行完整用户 workspace、npm tarball 安装或发布生命周期

#### Scenario: 聚合低成本验证
- **WHEN** 维护者运行 `npm test`、`npm run test:fast` 或完整 Candidate
- **THEN** unified registry MUST 选择 unit、contract 和 fast integration 三个独立 step
- **AND** 每层 MUST 保留稳定 step identity、失败状态和 diagnostics

### Requirement: 单元测试覆盖率必须独立可观察
Buildr Product MUST 提供只执行 unit owner 的 coverage 入口，并 MUST 将核心产品模块的直接 unit owner 与缺口记录在覆盖职责文档中；fast 聚合执行覆盖率 MUST NOT 被标记为单元测试覆盖率。

#### Scenario: 采集 unit coverage
- **WHEN** 维护者运行 unit coverage 入口
- **THEN** verifier MUST 只执行 unit tests 并输出 line、branch 和 function coverage
- **AND** verifier MUST 支持将机器可读 coverage summary 写入显式位置

#### Scenario: 审查核心模块覆盖缺口
- **WHEN** 维护者审查 CLI application/domain、doctor diagnostics、package validation、runtime checker 或 verification planner 等核心区域
- **THEN** 覆盖职责文档 MUST 标明直接 unit owner、现有 focused integration owner和待补缺口
- **AND** 无法隔离的生命周期行为 MUST 保留在 integration/E2E owner，不得为了覆盖率数字伪装为 unit

#### Scenario: 发布候选不以初始全局阈值阻断
- **WHEN** 本次分层迁移建立首个可信 unit-only baseline
- **THEN** Candidate MUST 记录并保留该覆盖事实
- **AND** Candidate MUST NOT 仅因未达到预设全局百分比而失败

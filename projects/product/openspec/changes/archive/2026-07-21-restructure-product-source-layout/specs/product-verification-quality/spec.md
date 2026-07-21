## MODIFIED Requirements

### Requirement: 产品总验证必须包含开源候选门禁
Buildr 产品总验证 MUST 运行开源候选安全 verifier，并 MUST 在公开 metadata、tracked candidate 或 npm tarball inventory 不满足发布边界时失败。

#### Scenario: 验证最终产品候选
- **WHEN** 维护者运行 `scripts/verify-buildr-product`
- **THEN** verifier MUST 在最终成功前运行开源候选安全检查
- **AND** timing summary MUST 将该检查记录为独立阶段

## ADDED Requirements

### Requirement: 产品 verifier 与仓库 verification 必须具有独立所有权
Buildr Product MUST 根据安装后 CLI 的真实运行依赖区分产品 verifier 与仓库 verification：被产品命令调用的 verifier MUST 位于 `src/`，只服务 Fast、Changed、Focus、Candidate、coverage 或 CI 的验证编排 MUST 位于 `test/verification/`。

#### Scenario: 分类现有 verification module
- **WHEN** 维护者迁移一个现有 `tools/verification` module
- **THEN** 若安装后的 `buildr` command 可达该 module，module MUST 迁入对应 `src/application` 或 `src/infrastructure` owner
- **AND** 若 module 只由 npm test scripts、verification registry 或 CI 调用，module MUST 迁入 `test/verification/`
- **AND** 分类 MUST 由 import graph、package inventory 和 command smoke 证明，不得只依据原目录名称

#### Scenario: 架构 verifier 检查依赖方向
- **WHEN** verifier 扫描 Product imports 和 npm runtime inventory
- **THEN** `bin/` 与 `src/` MUST NOT 导入 `test/verification/`
- **AND** `test/verification/` MAY 导入产品源码并执行 `bin` 入口
- **AND** 违反边界时 MUST 输出引用方、目标 module 和建议 owner

### Requirement: 仓库 verification 必须统一位于 test 根
Buildr 的 verification registry、planner、scheduler、runner、changed selection、Candidate orchestration、timing、evidence、coverage 和 focused verifier MUST 位于 `test/verification/`，并 MUST 继续提供现有 Fast、Changed、Focus 和 Candidate 行为。

#### Scenario: 运行迁移后的验证入口
- **WHEN** 维护者运行 `npm test`、`npm run test:changed`、`npm run test:focus` 或 `npm run test:candidate`
- **THEN** npm scripts MUST 调用 `test/verification/` 下的唯一 registry 和薄入口
- **AND** stable step identities、profiles、groups、budgets、dependencies、timing schema 和 failure propagation MUST 与迁移前保持语义兼容

#### Scenario: Changed 规划源码布局改动
- **WHEN** Product changed paths 位于 `src/`、`bin/`、`scripts/`、`test/` 或 `package/`
- **THEN** unified registry MUST 为每个路径匹配明确 verifier owner 或显式 ignore policy
- **AND** 旧 `tools/` input globs MUST 不再存在
- **AND** 未映射路径 MUST 在启动 verifier 前 fail closed

### Requirement: 测试数据和测试代码必须分离
Buildr Product MUST 将固定 Workspace、manifest、旧格式、损坏状态和冲突样本放入 `test/fixtures/`，并 MUST 将 unit、contract、fast integration 与 candidate integration test code 保留在各自测试层。

#### Scenario: verifier 创建临时 Workspace
- **WHEN** integration 或 focused verifier 需要预设 Workspace 状态
- **THEN** verifier MUST 从 `test/fixtures/` 复制或构造输入到独立临时目录
- **AND** fixture MUST NOT 进入 npm runtime package
- **AND** verifier MUST NOT 把用户主 Workspace 当作测试状态

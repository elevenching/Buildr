## ADDED Requirements

### Requirement: Changed 重型验证必须由精确实现所有权触发
Buildr Product MUST 将 Changed planner 的重型 verification step inputs 限定为其直接实现 owner、公共入口、专属测试和资产边界，并 MUST NOT 仅因产品源码最终可被 CLI 到达而使用无差别 `src/**` 触发 Workspace、tarball、release 或 recovery 生命周期；Candidate profile MUST 继续无条件包含全部 required gates。

#### Scenario: 普通基础设施 helper 发生改变
- **WHEN** changed path 只影响 network、layout 或其他不属于 recovery、tarball 或 managed mutation 生命周期的精确 helper
- **THEN** planner MUST 选择该 helper 的直接 verifier owner以及适用的低成本 contract/architecture fallback
- **AND** planner MUST NOT 选择无关的 recovery、capability、package parity、release smoke 或 managed integrity step

#### Scenario: 重型 owner 的直接实现发生改变
- **WHEN** changed path 匹配 builtin replacement、runtime publication、package installation 或其他已登记的重型实现 owner
- **THEN** planner MUST 选择对应重型 step 及其真实 artifact dependencies
- **AND** 输出 MUST 说明精确 path-to-owner 匹配原因

#### Scenario: 运行完整 Candidate
- **WHEN** 维护者运行 Candidate profile
- **THEN** Candidate MUST 忽略 Changed path 选择范围并运行全部 required gate identities
- **AND** inputs 收窄 MUST NOT 删除、跳过或合并 Candidate gate

### Requirement: 重型状态矩阵必须分离分类证据与生命周期证据
Buildr Product MUST 将 builtin replacement 和 recovery 的纯状态分类分支交给 unit owner，并 MUST 只让 Candidate E2E 持有需要真实 CLI、独立 Workspace、filesystem transaction、runtime projection 或最终 doctor 的生命周期证据；优化 MUST 保留既有安全场景语义，而不是通过删除分支缩短耗时。

#### Scenario: 验证 replacement 状态分类
- **WHEN** verifier 检查 manifest source/target、predecessor snapshot/receipt、replacement target、uninstalled state 或 restore override 的组合
- **THEN** unit owner MUST 在同进程中断言 finding、outcome 和 mutation plan
- **AND** 该分类分支 MUST NOT 为每个输入组合重复创建完整 CLI Workspace

#### Scenario: 验证公开恢复生命周期
- **WHEN** verifier 检查真实 sync/restore diagnostics、整树零写入、rollback、runtime 收敛、最终 doctor、uninstalled 迁移或历史资产保护
- **THEN** Candidate E2E MUST 使用独立临时 Workspace 执行真实命令边界
- **AND** 每个主风险 MUST 保留至少一个可独立定位的黄金路径

#### Scenario: 复用 recovery fixture 准备
- **WHEN** 多个 mutation 场景需要相同的初始化或 legacy 基础状态
- **THEN** verifier MAY 复用只读基础状态并复制到每个测试的独立临时 root
- **AND** source-only 场景 MUST NOT 为生成后立即删除的 runtime 执行无效 sync
- **AND** 任一测试 MUST NOT mutation 共享基础目录或其他测试的 Workspace

#### Scenario: 校准 recovery 观察预算
- **WHEN** recovery 分层和 fixture 优化完成并冻结候选 tree
- **THEN** 维护者 MUST 使用多轮成功 timing 的中位数与波动范围决定保留或调整非阻断预算
- **AND** 预算调整 MUST NOT 替代场景覆盖核对或把单次超时变为正确性失败

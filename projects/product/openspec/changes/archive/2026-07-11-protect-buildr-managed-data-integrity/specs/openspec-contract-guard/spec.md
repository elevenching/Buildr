## ADDED Requirements

### Requirement: OpenSpec 契约 sidecar 原子写入
Buildr MUST 通过受管数据完整性 atomic writer 提交 contract baseline 和 pre-sync receipt，使 sidecar 不会以截断或半写入状态替代上次有效事实。

#### Scenario: Baseline 写入成功
- **WHEN** baseline create 或显式 update 通过全部契约和路径预检
- **THEN** Buildr MUST 原子替换 `contract-baseline.json`
- **AND** 成功结果 MUST 对应完整可解析的版本化 sidecar

#### Scenario: Receipt 写入失败
- **WHEN** pre-sync receipt 写入发生 I/O 失败
- **THEN** pre-sync check MUST 返回失败
- **AND** Buildr MUST 保留上次完整 sidecar 或保持 receipt 不存在，不得留下截断 JSON

#### Scenario: OpenSpec Component 卸载
- **WHEN** workspace OpenSpec Component 被卸载
- **THEN** Component transaction MUST NOT 删除任何 Project change 内的 `.buildr/` sidecar 或其他 `openspec/` 内容

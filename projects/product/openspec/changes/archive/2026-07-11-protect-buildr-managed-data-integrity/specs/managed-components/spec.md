## ADDED Requirements

### Requirement: Component 源资产通过统一 transaction 提交
Buildr MUST 在集合级预检通过后，通过受管数据完整性 transaction 提交 Component 成员、Rules/Skills manifests、Component registry 和已安装 definition。

#### Scenario: Component 更新中途失败
- **WHEN** Component install、update 或 uninstall 在任一 source commit step 失败
- **THEN** Buildr MUST 回滚本次已应用的成员和 manifest 变更
- **AND** workspace MUST 保持完整旧版本，或者保留可由 doctor 诊断且阻止后续 mutation 的 transaction

#### Scenario: Component source transaction 成功
- **WHEN** Component 全部成员和相关 manifest 成功提交
- **THEN** Buildr MUST 最后提交安装 definition 作为成功物化回执
- **AND** Buildr MUST 在 source transaction 完成后才 reconcile runtime

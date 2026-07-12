## MODIFIED Requirements

### Requirement: sync 的源资产更新必须使用安全事务
Buildr MUST 让 `sync` 对 builtin、Builtin 安装回执、Component 和其他受管源资产的更新使用现有的 workspace mutation 事务。

#### Scenario: sync 更新多个源文件
- **WHEN** `sync` 需要新增、更新或删除多个受管源文件
- **THEN** Buildr MUST 在写入前检查完整修改范围
- **AND** Builtin 资产、registries 和 `.buildr/builtin-receipts.json` MUST 在同一 source transaction 中提交
- **AND** 任一步骤失败时源资产 MUST 保持操作前状态，或者保留可诊断且停止后续写入的 transaction

#### Scenario: Builtin lifecycle 更新回执
- **WHEN** `sync`、`builtin uninstall` 或 `builtin restore` 改变独立 Builtin 状态
- **THEN** 对应资产、manifest 和安装回执 MUST 一起提交或一起回滚

#### Scenario: 源资产提交后同步运行时
- **WHEN** `sync` 已经成功提交源资产修改
- **THEN** Buildr MUST 再根据提交后的源状态同步运行时
- **AND** 运行时同步失败 MUST NOT 回滚已经提交的源资产

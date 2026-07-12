## ADDED Requirements

### Requirement: Package output 只能安全接管和替换
Buildr MUST 将 package build 输出视为带版本化 receipt 和 integrity 的受管生成树，并在替换前验证目标 ownership。

#### Scenario: 新建或接管空输出目录
- **WHEN** `buildr package build --out <dir>` 的目标不存在或为空且不属于保护根
- **THEN** Buildr MUST 在同级 staging 完成构建后物化输出
- **AND** 输出 MUST 包含 `.buildr-package-output.json` receipt

#### Scenario: 安全替换既有输出
- **WHEN** 既有输出包含有效 receipt，且 live 文件集合与 integrity 匹配上次 receipt
- **THEN** Buildr MUST staged build 新输出并原子替换旧输出
- **AND** 失败时 MUST 恢复旧输出

#### Scenario: 拒绝未受管或已修改输出
- **WHEN** 输出目录非空但没有有效 receipt，或 live 内容已修改、缺失或包含未登记文件
- **THEN** Buildr MUST 在删除任何目标内容前拒绝构建
- **AND** Buildr MUST NOT 提供隐式 force 覆盖

#### Scenario: 拒绝危险输出路径
- **WHEN** `--out` 解析为 workspace 根、Product 根、当前目录、用户 home、文件系统根、资产集合根或这些保护根的祖先
- **THEN** Buildr MUST 拒绝构建且保持目标不变

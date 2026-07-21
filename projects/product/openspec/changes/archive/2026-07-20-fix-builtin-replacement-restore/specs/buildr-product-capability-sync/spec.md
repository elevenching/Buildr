## ADDED Requirements

### Requirement: Buildr 必须显式恢复被替代的 Builtin
Buildr MUST 允许 Agent 通过 `builtin restore <replacement>` 明确放弃内容完整性无法识别、但 ownership 可证明为 Buildr-managed 的 predecessor，并将其恢复为当前 package 声明的 canonical Builtin；该授权 MUST NOT 放宽普通 `sync` 的自动迁移边界或接管 ownership 无法证明的资产。

#### Scenario: 显式恢复未知官方版本的 predecessor
- **WHEN** 当前 package 声明 `task-board` replaces `task-cockpit`，workspace manifest 将 predecessor 登记为相同 target 的 Buildr-managed Builtin，predecessor live 内容不匹配 receipt 或已知 `legacyIntegrities`，且 replacement identity 和 target 不存在
- **THEN** `buildr builtin restore task-board --target <dir>` MUST 在受管 mutation 中删除 predecessor source、将 manifest identity 切换为 `task-board`、物化当前 package source 并写入当前 Builtin receipt
- **AND** 命令 MUST 将 predecessor、replacement 和实际受管变更路径报告为显式恢复结果

#### Scenario: 普通 sync 不继承显式恢复授权
- **WHEN** 相同未知 predecessor 状态仅运行 `buildr sync <agent> --target <dir>`
- **THEN** sync preflight MUST 继续将其报告为用户决策点并保持 workspace 零写入
- **AND** sync MUST NOT 因产品支持显式 restore 而自动删除 predecessor

#### Scenario: predecessor ownership 无法证明
- **WHEN** predecessor 缺少匹配的 Buildr manifest entry、`source` 不是 `buildr`、登记 target 与 package replacement 声明不一致，或 replacement identity/target 已被占用
- **THEN** `builtin restore <replacement>` MUST 在任何 workspace 写入前失败
- **AND** 输出 MUST 标识阻塞 identity、ownership 或冲突路径，且 MUST NOT 删除、覆盖或合并任一 Skill

#### Scenario: restore 不触碰历史任务页面
- **WHEN** workspace 存在 `openspec/knowledge/task-cockpits/*.html` 或其他不属于 package replacement target 的历史用户资产
- **THEN** replacement restore 的 mutation plan MUST NOT 包含这些路径
- **AND** restore 成功或失败后这些资产的内容和路径 MUST 保持不变

#### Scenario: restore 结果必须反映实际状态
- **WHEN** replacement restore 因 modified、missing、ownership、target conflict、receipt 或 mutation 错误而没有建立 canonical source、manifest 和 receipt 状态
- **THEN** CLI MUST 返回失败并 MUST NOT 输出“已恢复 Buildr builtin”成功结论
- **AND** finding 中存在 replacement id MUST NOT 被视为恢复成功的充分条件

#### Scenario: restore 幂等成功
- **WHEN** replacement canonical source、manifest 和 receipt 已经与当前 package 一致，且不存在 predecessor source identity
- **THEN** 再次运行 `builtin restore <replacement>` MUST 成功且不创建重复 identity 或 receipt
- **AND** 成功判断 MUST 基于对象最终状态而不是 changed path 数量

#### Scenario: restore 后同步 runtime
- **WHEN** replacement source restore 已成功且 Agent runtime 仍包含可证明由 Buildr 管理的 predecessor 投射，或缺少 replacement 投射
- **THEN** 后续 `buildr sync <agent> --target <dir>` MUST 清理受管 predecessor runtime、投射 replacement runtime 并运行最终 doctor
- **AND** runtime 未完成或 ownership 无法证明时 MUST 报告未完成，不得把整次 workspace sync 报告为成功

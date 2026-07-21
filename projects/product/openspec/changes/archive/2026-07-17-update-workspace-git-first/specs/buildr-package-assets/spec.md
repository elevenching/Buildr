## ADDED Requirements

### Requirement: 产品验证覆盖 Git-first workspace 更新编排
Buildr product verification MUST 防止产品入口 Buildr Skill 和随包引导退回到只执行本地 `buildr sync` 的 workspace 更新语义。

#### Scenario: 校验 Git 管理 workspace 的更新顺序
- **WHEN** Buildr 验证产品入口 Buildr Skill、bootstrap guide、CLI reference 和 runtime 提示
- **THEN** 验证 MUST 确认“更新 workspace”与“同步 workspace”会先复用 Git Ops 安全更新 Git 管理的 workspace checkout，再执行 `buildr sync <agent> --target <workspace-root>`
- **AND** 验证 MUST 确认该意图不会先运行 `buildr update`
- **AND** 验证 MUST 确认 Git 更新成功后无需再次询问 sync 授权

#### Scenario: 校验 Git 更新失败边界
- **WHEN** Buildr 验证 Git 管理 workspace 的更新决策点
- **THEN** 验证 MUST 确认本地改动、分叉、冲突、缺少 upstream 或其他 Git 决策点会阻止后续 sync
- **AND** 验证 MUST 确认 Agent 不会自动 stash、rebase 或覆盖用户内容

#### Scenario: 校验非 Git workspace 和 CLI 职责边界
- **WHEN** Buildr 验证非 Git workspace 或 `buildr sync` 命令说明
- **THEN** 验证 MUST 确认非 Git workspace 直接执行 sync
- **AND** 验证 MUST 确认 Git 更新属于 Agent 意图编排，而不是 `buildr sync` CLI 的隐式行为

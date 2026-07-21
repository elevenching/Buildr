## Context

Builtin replacement 当前复用 `syncPackageBuiltins`，但 replacement handler 在普通 Builtin 的 `isRestore` 判定之前返回。它只接受 receipt 或 package `legacyIntegrities` 能证明的 predecessor；未知旧版会保持 `modified`，这是普通 `sync` 所需的安全边界。问题在于 `builtin restore <replacement>` 传入的 `restoreId` 没有进入 replacement handler，而 lifecycle 只检查 finding 是否存在便输出成功，导致显式恢复既不迁移又假报完成。

此次修复涉及 replacement preflight、source mutation、manifest/receipt、runtime orphan 诊断和 CLI 结果语义。历史 `task-cockpits/*.html` 是用户内容，不是 Builtin Skill target，必须保持范围隔离。

## Goals / Non-Goals

**Goals:**

- 让 `builtin restore <replacement>` 成为对 Buildr-managed predecessor 内容的显式放弃与恢复入口。
- 在 mutation 前计算并验证完整 source 删除/安装范围，成功后留下单一 canonical Skill identity。
- 让命令结果与实际 mutation 一致；未迁移时失败并保留可执行 diagnostics。
- 保持普通 `sync` 对未知版本、未知文件和 ownership 冲突的零写入行为。
- 让 restore 后的 `sync <agent>` 可继续清理受管旧 runtime、投射新 runtime并通过 doctor。

**Non-Goals:**

- 不扩大为任意 Skill rename、多跳 replacement 图或用户自定义 migration。
- 不用增加更多 `legacyIntegrities` 来掩盖未知版本，也不把未知内容猜测为官方版本。
- 不删除 ownership 无法证明的 predecessor、目标冲突或外部 Skill。
- 不迁移或改写历史任务页面、OpenSpec archive 和其他用户内容。
- 不让 `builtin restore` 隐式完成所有 Agent runtime 的完整 sync。

## Decisions

### 1. 显式 restore 与自动 sync 使用同一 preflight、不同授权模式

replacement handler 接收明确的 operation mode。普通 `sync` 仍要求 receipt 或 `legacyIntegrities` 证明内容；`restore` 只放宽 predecessor 内容完整性判断，不放宽 identity、manifest source、target path 和 ownership 判断。

选择该方式，是因为 restore 对普通 Builtin 已代表“放弃本地内容并恢复官方版本”，replacement 应兑现相同用户意图。备选方案是持续追加所有历史 hash，但无法覆盖未知旧版，也会把发布清单变成不完整的历史数据库。

### 2. restore 只接管声明明确且登记为 Buildr-managed 的 predecessor

允许覆盖必须同时满足：当前 package 明确声明 `replaces`；workspace manifest 存在相同 predecessor id、target 与 `source: buildr`；canonical replacement identity/target 不存在冲突。满足后，preflight 将 predecessor source 目录、manifest entry、receipt 和可证明受管的 runtime orphan 纳入 mutation plan。

如果 predecessor 没有 manifest entry、标为外部来源、路径不一致，或 replacement target 已被占用，restore 仍失败且零写入。这样把“用户允许丢弃旧 Buildr Builtin 内容”与“允许接管未知 ownership”区分开。

### 3. source restore 成功必须可由结果对象证明

`syncPackageBuiltins` 为每个 restore target 返回明确 outcome，例如 `restored`、`blocked` 和实际 changed paths。lifecycle 只有在目标 outcome 为 restored、manifest 已切换到 canonical identity、当前 receipt 已写入时才输出成功；finding 存在不再等于恢复成功。

备选方案是在 lifecycle 层根据 `changed.length` 推断，但幂等 restore 可能没有文件变化，且其他 Builtin 变化会污染集合，因此必须使用对象级 outcome。

### 4. runtime 收敛保持在后续 sync，但 restore 不得制造不可诊断状态

`builtin restore` 完成 workspace source identity 迁移，并删除能够通过投射 receipt 证明是 Buildr-managed 的 predecessor runtime。无法证明 ownership 的 runtime path 不静默删除，命令应报告阻塞或后续动作。随后 `buildr sync <agent>` 使用现有 runtime preflight/render/doctor 管线完成当前 Agent 投射。

这避免给不带 `--agent` 的 restore 命令引入隐式全 runtime render，同时保证用户得到清晰的“source 已恢复、runtime 待 sync”或失败结果。

### 5. 删除范围保持结构化并走 mutation facade

replacement restore 不接受任意路径参数；所有删除路径只能来自 package `replaces.target`、manifest identity、Builtin receipt 和 runtime projection receipt。source 删除、manifest/receipt 更新继续包含在 `withWorkspaceMutation` snapshot 范围内，失败时恢复旧 identity，不直接绕过 mutation facade。

## Risks / Trade-offs

- [用户误用 restore 会丢弃旧 Builtin 中的本地改动] → 命令输出和 doctor 建议必须明确列出 predecessor/replacement 与冲突路径；只有显式 restore 才进入接管模式，普通 sync 永不自动覆盖。
- [manifest 被伪造为 `source: buildr`] → 同时校验 package replacement identity、声明 target 和 manifest target，不允许从名称推导或处理声明外路径。
- [source 已迁移但 runtime 尚未同步] → 返回结构化后续动作并由 doctor 保持 `ready=false`，不得把 workspace sync 报告为完成。
- [幂等 restore 被误判失败] → outcome 以最终 canonical source/manifest/receipt 状态判断，不以文件变更数量判断。
- [实现顺手扩大到历史 HTML] → 测试固定历史页面目录不在 mutation plan，验证前审计删除路径。

## Migration Plan

1. 扩展 replacement plan/outcome 与 restore 授权模式，先补单元和 CLI integration fixture。
2. 在临时旧 workspace 中验证未知 legacy integrity 的 Buildr-managed predecessor 可由显式 restore 迁移，普通 sync 仍零写入。
3. 验证 restore 后重跑 `sync codex` 完成旧 runtime 清理、新 runtime 投射和最终 doctor。
4. 验证所有 ownership/target 冲突和历史页面保护场景保持零写入。
5. 若 mutation 或 runtime 阶段失败，使用现有 transaction rollback/retry 机制恢复或收敛，不提供绕过 ownership 的手工删除路径。

## Open Questions

无。实现阶段若发现现有 runtime receipt 无法区分 Buildr-managed predecessor 与同名外部目录，应保持失败并另行提出 runtime ownership 契约，不在本 change 中扩大授权。

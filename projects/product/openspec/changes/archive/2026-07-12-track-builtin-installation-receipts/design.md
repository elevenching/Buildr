## Context

独立 Builtin 当前只用 package source 与 workspace target 比较。package 更新后，即使 live 内容完全等于上一版官方资产，也会被判为 `modified`。Component 已有 Old/Live/New 模型，但独立 Builtin 没有保存 Old 的安装事实。修复同时影响 package 元数据、workspace 持久状态、sync/doctor/builtin lifecycle 和 mutation 边界。

## Goals / Non-Goals

**Goals:**

- 精确区分官方旧版本与用户修改，包括目录中的额外、缺失和变化文件。
- 无需用户确认即可升级可证明未被修改的官方资产。
- 让旧 workspace 在证据充分时自动采用回执，证据不足时安全停止。
- 保证资产、manifest 和回执原子收敛。

**Non-Goals:**

- 不拆分或独立发布 workspace assets。
- 不把回执用作用户资产的通用版本控制。
- 不改变 Component-owned Builtin 的现有 Component 生命周期。

## Decisions

### 1. 使用 workspace 级独立回执

在 `.buildr/builtin-receipts.json` 保存独立 Builtin 的类型、id、目标、精确文件 inventory 和聚合 SHA-256。回执是 Buildr 管理且可版本控制的 source metadata；manifest 继续保存启用、卸载和可发现性信息。相比把大段 inventory 塞进三个 manifest，独立回执避免污染 Agent 路由索引并提供统一 schema。

### 2. 目录完整性覆盖精确文件集合

完整性输入包含排序后的相对路径及逐文件 SHA-256；任何额外、缺失或变化文件都会改变 inventory 与聚合值。symlink 和越界路径 fail closed，避免把未登记内容误当成官方资产。

### 3. 状态由 Old/Live/New 决定

- `Live == New`：状态为 installed，并采用/修复当前回执。
- `Live == Old` 且 `New != Old`：自动替换为 New 并更新回执。
- `Live != Old`：optional 状态为 modified/missing 并停止覆盖。
- 显式 restore 与 required 修复继续以 New 覆盖，但更新回执。
- `uninstalled` 继续由 manifest 控制，且删除相应安装回执。

Command 的 live 值使用 `commands/manifest.yml` 中规范化后的对应 entry，因此同样可以执行三方判断。

### 4. Legacy adoption 只接受 package 声明的官方摘要

package 为每个独立 Builtin 声明 `legacyIntegrities`。无回执 workspace 只有在 Live 等于 New，或等于该 Builtin 的已知 legacy integrity 时才会自动采用/升级；其他内容保持 modified/missing。`package check` 校验摘要格式、身份唯一性和当前源可计算性。该元数据是随 CLI package 交付的兼容证据，不是独立 assets 版本。

### 5. 单一 source transaction

sync、uninstall、restore 的 mutation snapshot 均包含 `.buildr/builtin-receipts.json`。实现先计算所有状态与预期写集，再在同一 transaction 中替换资产、更新 registries 和回执；失败时一起回滚。

## Risks / Trade-offs

- [新增回执文件会进入既有 workspace Git diff] → 文件是长期恢复安全所需的受管 metadata，sync 输出明确列出，并保持稳定排序以减少噪声。
- [legacy 摘要维护遗漏会阻塞老版本升级] → package check 与迁移 fixture 校验已知摘要，未知来源仍 fail closed。
- [目录整体替换可能删除用户文件] → 仅在精确 Live inventory 等于 Old 时替换；额外文件必然使比较失败。
- [回执损坏导致无法判断] → doctor 报告结构错误，mutation fail closed，不猜测用户意图。

## Migration Plan

1. package 加入当前受支持上一版 Builtin 的 legacy integrity。
2. 首次 sync 读取无回执 workspace：匹配 New 时仅采用，匹配 legacy 时自动升级，其他状态保持不变并报告。
3. 后续 sync 只依赖 workspace 回执执行三方比较。
4. 回滚旧 CLI 时，旧 CLI 忽略该 metadata；新版再次运行时仍可恢复判断。

## Open Questions

无。

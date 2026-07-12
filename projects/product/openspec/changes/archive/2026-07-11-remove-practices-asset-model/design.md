## Context

`practices/` 目前同时出现在 package baseline、Project doctor 基线、核心模型、模板、产品文档和 canonical specs 中，但没有 manifest、CLI 生命周期、发现协议或 runtime 消费者。目录的存在因此只证明“曾被创建”，不能证明内容可发现、可维护或可验证。

本 change 横跨随包契约、CLI 诊断、自然语言资产和多个 capability。已有用户目录可能包含重要内容，且 Buildr 的 managed-data-integrity 边界禁止用产品升级静默删除或重写这些数据。

## Goals / Non-Goals

**Goals:**

- 缩小默认 workspace 和 Project baseline，只创建当前具有明确治理闭环的资产。
- 从产品当前语义、诊断和模板中移除独立 Practices 资产类型。
- 对已有 `practices/` 采取只读识别、保留和非阻塞兼容，并给出可执行但不自动化的迁移分类。
- 保持 package、CLI、OpenSpec 契约和 E2E 对同一资产模型达成一致。

**Non-Goals:**

- 不自动删除、移动、重命名、解析或改写任何已有 `practices/` 内容。
- 不新增 Practices 的 manifest、维护命令或迁移器。
- 不修改 OpenSpec archive 或归档产品文档。
- 不处理 roles/agents 文档、prototype capability、`service create --rules`、内部 `package:<id>`、`package build`、权限门禁或 Component/OpenSpec 生命周期。

## Decisions

### 1. 从声明式 baseline 源头移除目录

从 `package/manifest.yml` 的 `workspaceDirectories` 和 `projectDirectories` 删除 `practices`，让 init、update、sync 和 project create 继续通过同一 package materialization 路径得到新行为。相比在各命令增加条件分支，这能保持声明式发布边界，避免绕过 transaction 和 managed-data-integrity。

### 2. 遗留目录属于用户数据，不属于待清理的旧包资产

Buildr 不把已有 `practices/` 加入 obsolete output 或删除清单。update/sync/project repair 只是不再创建它，也不会因它存在而失败。回滚到旧版本最多重新把空目录列入 baseline，不需要恢复或变换用户数据。

### 3. doctor 使用 information finding，而不是 baseline warning/error

Project baseline 不再检查 `practices/` 是否存在；doctor 在启用 information findings 时输出 `practices.legacy_directory_present`，标记 `userActionRequired: false`，给出人工审阅和分类建议。workspace 根和各已登记 Project 都应用同一策略。这样默认诊断保持紧凑，显式信息诊断可发现遗留目录，且目录不阻塞正常命令或被误报为损坏状态。

未选择 warning，是因为用户无需立即迁移；未选择完全静默，是因为用户需要知道该目录已经退出产品模型及后续内容应该去向何处。

### 4. 迁移是内容语义分类，不是文件格式转换

迁移说明固定为四类：约束和值守边界写入 Rule；可复用专业动作和流程写入 Skill；产品事实、需求和变更写入 OpenSpec；不属于前三类的说明保留为普通 docs。Buildr 不根据文件名或正文自动判断类别，用户审阅并显式移动后自行删除空目录。

### 5. 历史与当前事实分离

只修改 canonical delta 所触达的当前 Requirements、当前产品文档和随包源。`openspec/changes/archive/` 与 `docs/archive/` 保持原样，避免伪造历史。自举 workspace 根的 Buildr 交付资产也不从未合并 checkout 直接更新；合并后再通过正式 update/sync 消费。

## Risks / Trade-offs

- [Risk] 用户把 info finding 误解为必须立即处理。 → 明确 `userActionRequired: false`，说明正常命令不受影响且迁移由用户决定。
- [Risk] 文档中的普通中文“实践”被机械删除，损害自然语言含义。 → 只移除作为资产类型或路径的 Practices；“最佳实践”等普通语义按上下文保留。
- [Risk] package baseline 删除目录后，旧 E2E 仍把目录存在作为成功条件。 → 更新相关断言，并新增“新初始化不创建、遗留目录被保留”的双向测试。
- [Risk] doctor 扫描遗留目录内容带来性能或隐私问题。 → 只用目录存在性判断，不读取内容、不跟随链接。
- [Trade-off] 不自动迁移降低即时整洁度，但换取数据安全和语义准确性。

## Migration Plan

1. 发布新 package baseline 和 doctor 行为；新 workspace/Project 不再创建目录。
2. 已有 workspace update/sync 保留目录并由 doctor 给出 info。
3. 用户按 Rule、Skill、OpenSpec、docs 分类审阅并显式迁移内容；确认目录为空后可自行删除。
4. 若需回滚产品版本，不对用户目录执行任何恢复动作。

## Open Questions

无。

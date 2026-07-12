## Context

Buildr 当前把五个 OpenSpec workflow Skills 复制到 `package/targets/workspace/skills/buildr/openspec-*`，在副本中加入 Buildr 特有的透明度和路径约束，再由 OpenSpec Component 拥有这些副本。虽然 Component 记录了 upstream version，但 workspace 中的资产身份已经变成 Buildr-owned fork；上游更新无法与 sidebar 独立演进。

现有 Skill Contribution 只支持 `target#slot=fragment`，目标 Skill 必须包含 Buildr marker。这适合 Buildr 自有 Skills，却要求外部 Skill 为 Buildr 预留正文 marker，无法满足上游纯净性。Buildr 已具备远端发布型 Skill 的 manifest 和 runtime 安装模型，可以把上游 Skill 作为外部源资产，并在通用 source assembly 后、adapter render 前组合 sidebar。

## Goals / Non-Goals

**Goals:**

- 外部 OpenSpec workflow Skill 在 workspace 中保持上游来源、内容、版本和 integrity 身份。
- Buildr sidebar 由 `openspec-contract-guard` 和 Component-owned contributions 组成，并与上游 Skill 独立升级。
- runtime 派生 Skill 可审计地包含上游正文和启用 sidebar，卸载 Component 后可重建为无 sidebar 状态或被完整移除。
- 旧 `skills/buildr/openspec-*` fork 可通过 update/sync 安全迁移。
- `.buildr/mutations/` 始终从 workspace Git 视图中排除。

**Non-Goals:**

- 不让 Component 注册 runtime adapter、执行 hook 或运行任意代码。
- 不实现按标题、自然语言文本或模糊位置修改上游正文。
- 不自动安装或升级本机 OpenSpec CLI。
- 不改变 Project `openspec/` 的所有权。

## Decisions

### 1. 产品概念使用 Sidebar，实现契约使用 Skill Contribution

“Sidebar”表示 Buildr 对外部能力的独立、可卸载增强；`Skill Contribution` 表示 sidebar 如何进入 runtime Skill。`openspec-contract-guard` 是能力主体，fragments 是连接 OpenSpec actions 与 Buildr task workflow 的编排入口。

不把所有内容统称 contribution，因为独立 Skill 具有自己的 routing 和完整操作手册；也不把底层 manifest 字段命名为 sidebar，因为 contribution 仍可用于非 OpenSpec Component。

### 2. 外部 Skill 作为 resolved source 物化，禁止 Buildr fork 路径

随包 OpenSpec Component 的 workflow Skill member 目标改为 `skills/openspec/<skill-id>`。manifest 条目记录上游 source、确定 resolved source、版本和 integrity；物化正文必须与该 resolved source 匹配。`skills/buildr/` 只保留 Buildr 自有 Skills，包括 `openspec-contract-guard`。

备选方案是继续维护 fork 并保存 patch。它仍会产生第二份事实源和人工 rebase，因此拒绝。

### 3. 对外部 Skill 使用边界组合，对 Buildr Skill保留 slot 组合

Contribution declaration 引入结构化 placement：

- `prepend`：在上游 Skill frontmatter 和 Buildr generated header 后、正文前加入带 provenance marker 的 sidebar fragment。
- `append`：在正文末尾加入 fragment。
- `slot`：只用于显式声明 Buildr slot 的目标 Skill，保持现有精确编排。

外部 Skill 默认只允许 prepend/append，不允许按标题或字符串定位。render 结果使用成对 marker 标识 Component、contribution id 和 placement，runtime check 以完整 source assembly 计算期望内容。

### 4. Component 拥有外部 Skill 的安装回执，不拥有上游发布权

Component 仍统一卸载 OpenSpec workflow Skills、CLI command declaration、contract guard 和 fragments，但 definition 必须区分 `upstreamSkills` 与 Buildr-owned `skills`。前者的 integrity 对应上游物化内容；后者对应 Buildr package 内容。生命周期所有权不改变内容作者身份。

### 5. 迁移使用 Old/Live/New 三方比较

更新时识别旧 `skills/buildr/openspec-*`：只有 live 内容匹配旧 package receipt 时，事务才删除 fork、物化新的 `skills/openspec/*`、更新 manifests/Component definition 并 reconcile runtime。用户修改、缺失或来源冲突时 fail closed，给出保留和卸载范围，不静默覆盖。

### 6. 精确忽略 mutation 临时目录

workspace `.gitignore` 收敛 `/.buildr/mutations/`，但不忽略 `/.buildr/`。init 写入基线；update/sync 对旧 workspace 幂等补齐。该写入进入同一 source transaction，避免 mutation 内容和 ignore 规则部分提交。

## Risks / Trade-offs

- [Risk] 上游 Skill 的 frontmatter 或格式变化导致组合位置不稳定。→ 只在解析出的 frontmatter 边界后 prepend，无法安全解析时 fail closed。
- [Risk] 同一外部 Skill 被用户以不同来源登记。→ Component install/update 校验 id、source、resolved、version 和 integrity，冲突时要求用户决策。
- [Risk] 迁移删除旧 fork 可能误删用户修改。→ 使用 Component receipt 与 Old/Live/New 比较，任何 live drift 都停止集合迁移。
- [Risk] prepend 指令与上游步骤冲突。→ fragment 明确为附加约束，package check 对支持的 upstream version 运行 fixture；不支持版本阻止发布。
- [Trade-off] 不提供按标题插入会降低局部控制精度。→ 使用 action 条件化的前置 sidebar 文案换取稳定、非侵入升级边界。

## Migration Plan

1. 扩展 Skill manifest/source assembly 和 contribution schema，先用通用 fixtures 固定外部 Skill 纯净性与派生 render。
2. 调整 OpenSpec package assets、Component definition 和 integrity，移除 Buildr workflow forks。
3. 实现旧 Component/fork 的事务迁移和卸载行为。
4. 为 init/update/sync 增加 mutation ignore 收敛。
5. 更新 package check、doctor、两种 adapter 和临时 workspace E2E。
6. 发布后由 workspace update/sync 自动迁移；发生用户修改时保留旧状态并输出决策信息。

回滚到旧 Buildr 版本时，新外部 Skill manifest 或 Component schema 可能不被旧 CLI 理解，因此回滚前应卸载新版 Component或恢复旧 package 版本；不自动进行有损降级。

## Open Questions

无。

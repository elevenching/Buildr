## Context

Buildr 当前把 root/Organization 与 Project 都作为 Skill source scope：root `skills/manifest.yml` 先解析，Project `skills/manifest.yml` 后解析，同 ID Project Skill 覆盖 root Skill，再投射到 Agent 的项目级 Skills root。这个模型把四件事耦合在一起：资产在哪里维护、业务上适用于哪个 Project、投射到哪个 Agent 目录、Agent 最终能发现哪些 Skill。

Agent Skills 的实际发现模型并不提供对应的 Project 隔离保证。以 Codex 为例，runtime 从当前工作目录到 repository root 发现 repo Skills，同时发现 user/admin/system Skills；同名 Skill 不合并，也不保证唯一覆盖。若 Agent 从 Buildr workspace 根启动，把 Project Skill投射到 workspace runtime 会让所有 Project 都可见；若从 `projects/<project>` 启动，又会丢失 workspace 级 Project registry、跨 Project 依赖和整体规则语义。因此 Project 只能是业务与能力上下文，不能是 Buildr 承诺的 Skill 安装或访问边界。

本 change 同时涉及 CLI、manifest schema、Project template、capability binding、runtime adapters、receipts、doctor、package baseline 和已有 workspace 迁移。设计必须保留 Agent Skills 开放格式，且不能假设所有 Agent 都提供完整的已加载 Skills API。

## Goals / Non-Goals

**Goals:**

- 将 Workspace 明确定义为 Buildr Skill 的唯一源资产治理根，同时也是本地投射对应的 Agent 工作目录。
- 将 Project 保留为业务、依赖、适用性和 capability requirement/binding 节点，不再伪装为 runtime scope。
- 提供 `user` 与 `workspace` 两种明确 render destination，并保证 `sync`/`init` 不隐式修改用户级 Skills。
- 为 Buildr 受管 Skill 建立稳定 identity、来源、integrity、ownership 和 projection receipt，使幂等、更新、冲突、采用和卸载可区分。
- 在 Buildr 可观测范围内阻止同名不同资产进入同一 Agent 有效发现集合；不依赖 Agent 的安装顺序或未定义 precedence。
- 允许不同 Skill ID 提供同一 capability，通过 binding 确定性选择 provider。
- 为现有 Project Skills、Project bindings 和历史 receipts 提供保守、可恢复、零猜测迁移。

**Non-Goals:**

- 不修改 Agent Skills 开放规范，也不要求 Codex、Claude Code 或其他 Agent 拒绝所有同名 Skill。
- 不承诺枚举 Agent 内部、远端服务或不透明 plugin 中无法由 adapter 证明的完整 Skills 集。
- 不通过 Project applicability 阻止 Agent 阅读已经在 user/workspace runtime 中可见的 Skill。
- 不为每个 Project 创建独立 Agent session、runtime root 或复制的 Skill 包。
- 不用 Skill ID 承担 capability identity；provider 替换继续使用 capability contract 和 binding。
- 不在 `buildr sync`、`init` 或普通 workspace render 中静默安装、更新、采用或删除用户级 Skill。

## Decisions

### 1. Workspace 是唯一 Skill source authority

所有 Buildr 受管 Skill、contract、workspace 默认 binding 和来源信息只登记在：

```text
<workspace>/skills/manifest.yml
<workspace>/skills/<skill-id>/
<workspace>/skills/contracts/**
```

`projects/<project>/skills/` 不再是当前产品资产。Project template 不创建该目录；`skills add/remove` 不再接受 Project scope。这样一份 Skill 只有一个 workspace 权威源，不会因多个 Project 使用而复制内容。

替代方案是保留 Project Skill 作为“作者归属”但不作为投射 scope。该方案仍会产生两个 manifest、同 ID 合并顺序和跨 Project 复用副本，因此拒绝。

### 2. Project 表达适用性和依赖，不表达安装范围

Project 通过 `projects/<project>/capabilities.yml` 声明：

- `requires`：该 Project 工作需要的 capability；
- `bindings`：当任务上下文明确属于该 Project 时选择的 provider Skill ID；
- `skills`：可选的 workspace Skill ID applicability 引用，用于路由说明和 doctor 检查。

这些引用都必须解析到 workspace `skills/manifest.yml`，不得内嵌或复制 Skill 内容。Project binding 选择 provider，但不隐藏其他 Skill，也不宣称限制 Agent runtime 可见性。

跨 Project 任务必须携带明确的 Project 集合。若相关 Project 对同一 capability 绑定不同 provider，Buildr 报告 `cross_project_binding_ambiguous`，由 Agent 将任务拆为各 Project 动作或取得显式选择；不得依据当前目录猜测。

替代方案是继续把 binding 存在 Project `skills/manifest.yml`。这会保留已经失效的“Project 是 Skill scope”术语，因此改用独立 capability context 文件。

### 3. Render destination 只有 user 与 workspace

公开命令收敛为：

```text
buildr skills render <agent> --destination workspace --target <workspace>
buildr skills render <agent> --destination user --target <workspace>
```

- `workspace`：由 adapter 投射到当前工作目录对应的 Skills root，例如 Codex 的 `<workspace>/.agents/skills/`。
- `user`：由 adapter 投射到当前用户级 Skills root，例如 Codex 的 `$HOME/.agents/skills/`。
- `--target` 始终解析 Buildr workspace，用于读取权威源和 Project 图；它不再被同时解释为用户安装根。
- 省略 `--destination` 时兼容为 `workspace` 并输出 canonical receipt。
- 旧 `--scope .` 在过渡期作为 deprecated workspace destination 接受；`--scope projects/<project>` 拒绝并提供迁移动作。
- `init`、`sync` 和组合 `render` 只维护 workspace destination。用户级 render 必须由用户明确表达全局安装意图后单独执行。

替代方案是沿用 `--scope` 同时表示 source 和 destination。该术语无法区分“从哪个 workspace 读取”与“写到用户还是工作目录”，因此拒绝。

### 4. Skill runtime name 与 Buildr asset identity 分离

Buildr 定义：

- `skillId`：与 `SKILL.md` frontmatter `name` 和 runtime 目录名一致，是 Agent Skills 的发现名称。
- `assetIdentity`：Buildr 用于判断同一资产演进线的稳定身份。
- `sourceIdentity`：package、resolved URL/registry identity，或本地作者型 Skill 的 workspace UUID + manifest entry identity。
- `sourceDigest`：受支持源文件 inventory 的摘要。
- `renderDigest`：加入 contributions、binding evidence 和 adapter context 后的完整 runtime inventory 摘要。

同一个 `skillId` 不能代表多个并行实现。需要替代实现时必须使用不同 `skillId`，例如 `git-ops` 与 `acme-git-ops`，并声明同一 capability 的不同 provider。

本地作者型 Skill 在 manifest entry 保留期间改变内容，仍是同一 `assetIdentity` 的更新；删除后用同名重新登记是否继承 identity 必须显式恢复历史 identity，否则视为新资产。远端来源只有在 canonical source identity 连续且版本/integrity 变化合法时视为更新。

### 5. 用户级安装拥有独立 receipt，不由目录内容推断 ownership

每个 user projection 写入 adapter 专属、Skill 目录外的受管 receipt，至少包含：

```yaml
schemaVersion: buildr.skill-projection/v2
agent: codex
destination: user
skillId: git-ops
assetIdentity: ...
sourceIdentity: ...
sourceWorkspaceId: ...
sourceDigest: ...
renderDigest: ...
files: ...
```

`sourceWorkspaceId` 记录本次管理入口和 provenance，不表示该 workspace 可以无条件删除用户资产。另一个 workspace 遇到同一 `assetIdentity` 和相同 digest 时可以把它视为已满足，但不能改写 ownership；更新、采用、转移或删除必须显式披露当前 receipt 和受影响范围。

没有有效 receipt 的现有 Skill 一律视为外部未受管资产。内容相同可以报告 `equivalent_external`，但 Buildr 不自动取得更新或卸载权。

### 6. Effective Skill inventory 是 adapter 能证明的发现集合

每个 supported adapter descriptor 增加 Skills discovery inventory：

- workspace discovery roots；
- user discovery roots；
- 可读取的 admin/system/plugin roots；
- root precedence 是否有官方保证；
- inventory evidence 为 `complete` 或 `partial`；
- activation/reload 行为。

Buildr 在 render preflight 中只对候选 ID 查询全部可观测 roots，并解析 `SKILL.md` name、路径、来源类型、receipt 和 digest。不能枚举的内部来源必须产生 `runtime.skill_visibility_incomplete`，Buildr 不得宣称全局无同名 Skill；但该限制不应阻塞与候选无关的 workspace 维护。

若 adapter 连用户或 workspace 目标根都无法确定，则对应 destination unsupported，禁止投射。若仅 plugin/system inventory 不透明，则允许用户在已披露 partial assurance 下继续受管投射，但顶层隐式路由不得被描述为无歧义已证明。

### 7. 冲突分类与写入策略

Buildr 对每个候选 Skill 产生以下状态：

| 状态 | 条件 | 行为 |
|---|---|---|
| `absent` | 可观测有效集合没有同名 Skill | 正常投射 |
| `already_projected` | 同一 destination、assetIdentity 和 renderDigest | 幂等零写入 |
| `satisfied_by_user` | workspace render 遇到用户层同一 assetIdentity/renderDigest | 不生成 workspace 副本，写 satisfaction evidence |
| `update` | 同一 assetIdentity、合法 ownership、digest 变化 | 受控整包更新 |
| `equivalent_external` | 同名同内容但 receipt/identity 不可证明 | 阻止自动接管，提供 adopt/rename/skip |
| `foreign_owner` | 同名资产由其他 Buildr identity/owner 管理 | 阻止投射，提供 transfer/rename/skip |
| `name_conflict` | 同名但内容或来源不同 | 阻止投射，提供 rename/remove/disable |
| `visibility_partial` | adapter 无法枚举全部来源 | 披露保证边界，不宣称无歧义 |

一次 render/sync 的所有候选先完成 inventory、capability、receipt 和文件冲突预检。任一候选出现未解决的 blocking conflict 时，整次 mutation 零写入；不得先更新无冲突 Skill 再失败。

已存在的外部 Skill 之间发生重复、但本次候选不涉及该 ID 时，doctor 可以报告 warning，不阻塞无关 mutation。

### 8. 同一有效范围内不重复投射 Buildr Skill

Buildr 对自己的投射维护以下不变量：

> 同一 Agent 的当前 workspace 有效发现集合中，同一 `assetIdentity` 最多存在一个 Buildr-managed active projection。

用户层已有相同资产时，workspace destination 以 `satisfied_by_user` 收敛。若用户层与 workspace 希望使用同名不同版本，因为 Agent 不保证覆盖顺序，Buildr 必须阻止并要求统一版本、移除用户投射或为局部变体使用新 Skill ID。

当用户层投射消失时，workspace doctor 将 satisfaction evidence 标为 stale，并建议重新执行 workspace render；Buildr 不在只读 doctor 中自动写入。

### 9. Capability binding 解析从文件 scope 改为业务 context

workspace `skills/manifest.yml` 继续保存 contracts、providers、consumers 和默认 bindings。Project `capabilities.yml` 可以选择不同 provider，但所有 provider 都来自同一 workspace Skill registry。

解析顺序为：

1. 当前任务明确 Project context 的 binding；
2. workspace 默认 binding；
3. 仅有一个兼容、已安装且 runtime 可用 provider 时自动选择；
4. 否则 `ambiguous_provider`。

该顺序只影响 capability 协作，不决定 Agent 顶层意图发现。顶层 provider 仍必须具有不冲突的 Skill ID、明确 description 和有效 runtime 投射。

### 10. Project Skill 迁移是显式事务

新增迁移入口以 check/apply 两阶段处理所有 `projects/<project>/skills/manifest.yml`：

```text
buildr skills migrate-project-assets --target <workspace> --check
buildr skills migrate-project-assets --target <workspace> --apply
```

迁移计划按 Skill ID 分类：

- root 不存在：移动/登记为 workspace Skill，并在 Project `capabilities.yml` 保留 applicability；
- root 存在且 asset identity/content 等价：去重 Project 副本并创建引用；
- root 存在但内容不同：`project_skill_name_conflict`，要求重命名、选择 canonical 或放弃迁移；
- Project contracts/bindings：合并到 workspace registry 或 Project `capabilities.yml`，Requirement identity 和 provider selection 不得丢失；
- 未登记文件、修改的 builtin、symlink、嵌套 repo 或未知内容：保留现场并阻止 apply。

`--apply` 在写入前保存有界 snapshot，使用受管 mutation transaction；全部文件、manifest、Project baseline 和 doctor 验证成功后才删除旧受管 Project Skill 目录。失败时恢复原始状态并保留 recovery evidence。

现有 `buildr.skills/v2` workspace manifest 迁移为 `buildr.skills/v3`，增加 asset identity 和 workspace-only semantics。Project v1/v2 manifests 被标为 legacy，不由普通 sync 静默合并或删除。

## Risks / Trade-offs

- [用户级投射修改 workspace 外路径，风险高于本地 render] → 仅在显式 `--destination user` 下执行，先完整 preflight，使用独立 receipt 和整包事务，不由 sync/init 触发。
- [Agent 无统一 API 暴露 plugin/system Skills] → adapter 声明 inventory evidence；对不可观测来源报告 partial assurance，不作虚假全局唯一承诺。
- [移除 Project Skills 是 breaking change] → 提供 check/apply 迁移、冲突矩阵、snapshot 和 legacy 保留期；普通 sync 不自动删除。
- [用户层相同 Skill 可能让 workspace 依赖外部状态] → satisfaction evidence 记录 identity/digest；doctor 在用户投射消失或变化时明确标 stale。
- [不同 workspace 都想管理同一用户 Skill] → assetIdentity 相同可复用但不静默转移 ownership；不同 identity 一律阻止，显式 adopt/transfer 才能改变。
- [Project binding 不再依附文件路径，任务上下文可能不明确] → Agent 必须从用户目标、Project registry 或明确 task metadata 解析 Project；跨 Project 冲突 fail closed。
- [严格冲突会拒绝 Agent runtime 原本允许的同名共存] → 这是 Buildr 的确定性治理承诺；用户仍可在 Buildr 外自行维护同名 Skill，但 Buildr 不宣称其路由安全。
- [schema v3 和 adapter descriptor 变化影响范围大] → 先实现只读 inventory/迁移计划，再切换写路径；保持 v2 workspace read compatibility，旧 CLI 读取 v3 必须显式失败。

## Migration Plan

1. 增加 adapter discovery inventory、effective Skill scan 和只读 conflict diagnostics，不改变现有写行为。
2. 增加 `buildr.skills/v3` parser、assetIdentity、user/workspace destination plan 与 v2 workspace 兼容读取。
3. 实现 Project Skills 迁移 `--check`，覆盖空 root、等价重复、同名不同内容、binding/contract 和异常文件。
4. 实现 user projection receipt、workspace satisfaction evidence 和统一零写入 preflight。
5. 切换 `skills add/remove/render`、runtime check、doctor、init 和 sync 到 workspace-only source 模型；Project scope 进入 breaking diagnostic。
6. 更新 package baseline 和 Project template，不再创建 Project `skills/`；迁移随包资产和 Components。
7. 对 Buildr 自举 workspace 和临时 fixture 先执行 migration check，再 apply；验证所有 supported adapters。
8. 更新公开文档和 release notes，明确用户级投射是显式动作、Project applicability 不是 runtime 隔离。

回滚时保留旧 Project Skill snapshot、v2 manifests 和 projection receipts；在 v3 写入前失败可直接零写入退出，写入后失败通过 mutation recovery 恢复。已经显式写入用户层的新 receipt/Skill 必须由同一 transaction 回滚，不允许只回滚 workspace 文件。

## Resolved Boundaries

- Project capability context 使用独立 `buildr.project-capabilities/v1` schema，文件固定为 `projects/<project>/capabilities.yml`；Project registry 只登记 Project identity、路径和 repo boundary，不承载频繁变化的 provider requirements/bindings。
- Adapter inventory 为 `partial` 时，render 在输出稳定 warning 后可以继续，但结果只能证明 Buildr 可观测范围内无冲突；该状态不额外询问确认，也不能作为顶层隐式路由无歧义的证据。
- 首个版本不提供自动 `adopt` 或 `transfer` 写命令。外部等价或 foreign-owner 冲突只提供 rename、remove/disable external、skip 和保持现场；后续若增加 ownership transfer，必须通过独立 change 定义授权、依赖披露和回滚，不得复用 `--replace`。
- 用户 receipt 不维护 known consumers 索引，因为单机扫描无法证明所有 workspace。用户级卸载始终是显式动作，必须说明可能存在 Buildr 不可见的其他 workspace 依赖，不能据局部索引自动判断安全。

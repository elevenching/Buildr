## Context

前序 change 已实现 `buildr.skills/v3`、workspace-only source authority、Project `capabilities.yml`、user/workspace destination、有效 Skills inventory 冲突治理和 legacy Project Skill migration。当前实现与主要产品文档已经采用新模型，但 canonical specs 中仍混有三个时代的术语：当前 Project Skill source、Agent 原生 project-level Skills root，以及 legacy Project Skill migration。三者都使用“Project Skill”会让维护者无法判断一句要求是在描述 source、destination 还是历史输入。

本 change 是语义收敛，不重新设计已落地的数据模型。它必须覆盖 canonical requirements、公开文档、产品入口 Skill、adapter research/contribution 文档、错误文案和验证断言；archive 文档保留历史原貌，不作为 current-state 修订目标。

## Goals / Non-Goals

**Goals:**

- 让所有 current-state source contract 只承认 workspace `skills/manifest.yml`、contracts 和 Skill directories。
- 让 Project 只表达 capability requirements、bindings 与 Skill applicability。
- 让 user/workspace 只表达 Agent runtime destination，并把 adapter 的 project-level native path 重述为 workspace destination path。
- 保留 legacy migration 的可识别术语和零写入安全边界。
- 通过静态契约测试阻止旧术语再次进入 current-state requirements。

**Non-Goals:**

- 不改变 `buildr.skills/v3` schema、projection receipt 或冲突分类。
- 不删除 legacy migration CLI，也不自动迁移任何用户 workspace。
- 不修改 archive 文档中的历史叙述。
- 不同时重构 Commands；Commands 由后续独立 change 处理。

## Decisions

### 1. 使用四类规范术语，不再裸用“Project Skill”

current-state 文本只能使用：`workspace Skill source`、`Project capability/applicability context`、`workspace destination`、`user destination`。确实描述历史输入时必须写 `legacy Project Skill source`；描述 Agent 厂商目录时写 `workspace destination Skills root`。

选择显式术语表而不是按上下文容忍“Project Skill”，因为后者无法由静态验证识别 source/destination 混淆。

### 2. 修改冲突 requirement，而不是追加澄清 requirement

对仍规范 Project manifest/source 的 requirement 使用 `MODIFIED`，在 archive 时直接替换旧契约。只增加一个新澄清要求会让新旧要求并存，不能消除冲突。

### 3. Legacy migration 是唯一允许出现 Project Skill source 的 current-state 场景

legacy migration 的命令、诊断 code、fixtures 和 requirements 保留，但所有出现都必须带 `legacy` 或 `migration` 限定。普通 add/remove/render/sync/doctor 路径不得从 Project source 组装当前 Skills。

### 4. 建立跨表面残留扫描

验证以允许清单区分 current-state 与 archive/legacy migration，检查 canonical specs、README、current docs、package runtime Skill、CLI help/error 和测试名称。相比简单禁止字符串，这能保留必要的迁移文案，同时阻止无限定旧模型回归。

## Risks / Trade-offs

- [批量措辞修改误改历史兼容语义] → archive 文档排除在修改范围，legacy migration 使用明确允许清单并保留现有行为测试。
- [只改文字但遗漏真实读取路径] → 对 runtime source assembly、CLI scope rejection 和 package smoke 做代码搜索与聚焦验证；发现当前态 Project source 读取时纳入本 change 删除或隔离。
- [同一句“project-level root”在厂商文档中确实指目录] → 改写为“workspace destination 下的 Agent 原生 Skills root”，不否认目录事实。
- [触及 capability 数量较多导致 delta 漂移] → 每个 delta 只修改包含冲突语义的完整 requirement，实施前建立 baseline 并用 strict/pre-sync 门禁保护。

## Migration Plan

1. 建立 change baseline，确认与 Commands change 不触达相同 requirements。
2. 逐 capability 替换冲突 requirements，并同步 current docs 与产品入口。
3. 清理或隔离实现中的当前态 Project Skill source 分支，仅保留 migration reader。
4. 增加残留扫描和相关 focused tests，运行 OpenSpec strict 与受影响验证。
5. 本 change 先完成 sync/archive；Commands change 在其 canonical baseline 更新后再实施。

回滚时整体回退本 change；不涉及用户数据迁移或 runtime destructive cleanup。

## Open Questions

无。术语和边界已经由前序 Skill scope change 确认。

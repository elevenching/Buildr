## Context

Product Project 当前存在两组未被 package manifest、CLI、runtime adapter 或 canonical current-state knowledge 管理的 Markdown：顶层 `agents/{be,fe,pm,qa}.md` 和 `capabilities/prototype-development.md`。它们保留了有价值的未来产品设想，但路径和正文把它们呈现为当前可加载的角色规则与 Buildr 已提供能力，与现有“README 是入口、产品主文档解释产品、knowledge 记录当前事实、specs 记录行为契约、archive 记录历史”的分层不完整对齐。

本次只调整 Product Project 内的规划资料和叙述契约。现有发布边界只包含产品 `README.md` 与 `package/`，没有任何运行路径引用这些文件；历史 archive 中的角色和原型资料继续作为历史记录保留。

## Goals / Non-Goals

**Goals:**

- 让尚未实现的角色 Agent 与原型开发意图保持可发现，但不能被误认为当前事实或可执行资产。
- 建立稳定、可索引的 `docs/roadmap/` 规划入口，并明确它与 OpenSpec active change、current-state knowledge、canonical specs 和 archive 的关系。
- 保留原有文档中的产品意图，修正现在时承诺和失效引用。
- 用最小验证确认没有当前引用断链，也没有改变 package 或 runtime 边界。

**Non-Goals:**

- 不实现、注册、渲染或路由角色 Agent。
- 不实现 prototype development Skill、CLI 或工作流。
- 不处理 Practices、权限门禁、其他 Roadmap 项或历史 archive。
- 不改变 package manifest、workspace/project baseline、CLI 和 runtime adapter。

## Decisions

### 1. 使用 `docs/roadmap/` 作为未来产品资料的唯一显式语境

新增 `docs/roadmap/README.md` 作为索引；角色资料放在 `docs/roadmap/agent-roles/`，原型资料放在 `docs/roadmap/prototype-development.md`。该结构同时表达资料类型和规划状态，且符合现有“长期产品方向写入 docs、具体实施工作进入 OpenSpec change”的契约。

备选方案是继续只在 `docs/buildr-product.md` 的 Roadmap 列表中保留摘要，但这会丢失已有设计细节；另一个方案是移入 `docs/archive/`，但 archive 表示历史资料，而这些产品意图仍是有效未来方向。

### 2. 移动并改写状态声明，不保留旧路径 redirect

使用 Git 可识别的文件移动保留历史，在每份规划文档顶部明确“尚未实现，不是当前 Rule、Skill、Agent runtime 或能力事实”。角色文件继续保留职责草案，但把“本规则”“必须读取”等当前执行口吻调整为未来设计候选；原型文件把“Buildr 提供”调整为未来目标。

不在 `agents/` 或 `capabilities/` 保留 redirect/index。redirect 仍会留下看似正式的当前资产目录，违背本 change 的主要目的。仓库扫描确认除待移动文件之间的一处相对引用外，没有当前产品入口、实现或 package 引用旧路径；发现性由产品 README、文档索引、产品主文档和 Roadmap 索引提供。

### 3. 当前事实与未来意图使用单向引用

`docs/buildr-product.md` 的 Roadmap 只给出方向摘要并链接 `docs/roadmap/`；`docs/document-index.md` 和产品 `README.md` 将 Roadmap 标注为未来规划。Roadmap 文档可以链接当前产品事实和 OpenSpec 入口来说明实施前置，但 current-state knowledge 不反向收录尚未实现内容。

这样可避免未来意图进入当前事实层。某个方向准备实现时，维护者仍需创建新的 OpenSpec change；本 change 只是资料归位，不代表这些方向已经进入实施。

### 4. 发布边界不增加 Roadmap 文件

不修改 `package/manifest.yml`。Roadmap 是 Buildr 产品仓维护资料，不是用户 workspace baseline、runtime asset 或 npm 包所需操作资料。`package check` 应继续证明现有发布边界未隐式纳入这些文件。

## Risks / Trade-offs

- [外部书签或未被仓库扫描发现的引用可能仍指向旧路径] → 产品 README 和文档索引提供新入口；不以旧路径 redirect 换取语义模糊。Git 历史仍可追踪移动。
- [保留详细角色规范可能再次被误读为已实现] → 每份文件统一放入 Roadmap 路径并增加显著状态说明，同时移除当前执行口吻。
- [Roadmap 文档长期陈旧] → 索引明确其非承诺性质；方向进入实施时必须转为 OpenSpec change，并在实现或放弃后维护 Roadmap。
- [运行完整产品验证看似超过纯文档变更所需] → Product Project 规则要求最终候选完整验证；受影响范围检查先覆盖链接和 OpenSpec，完整验证只在候选冻结后运行一次。

## Migration Plan

1. 创建 Roadmap 索引和目标目录，并移动五份未来资料。
2. 调整规划状态、交叉引用和产品文档导航。
3. 扫描旧路径与当前能力式表述，验证 Markdown 引用和 OpenSpec delta。
4. 冻结候选后运行产品完整验证。

本变更没有运行时或用户数据迁移。若需要回滚，可恢复原文件路径及文档引用；不会涉及 CLI、manifest 或 workspace 状态恢复。

## Open Questions

无。现有仓库事实可唯一确定本 change 不需要 redirect、不改变发布边界，也不应修改 current-state knowledge 或历史 archive。

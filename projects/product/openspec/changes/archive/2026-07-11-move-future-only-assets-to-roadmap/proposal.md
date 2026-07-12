## Why

`agents/{be,fe,pm,qa}.md` 和 `capabilities/prototype-development.md` 当前位于 Product Project 的顶层产品资产目录，正文又使用“角色规则”“Buildr 提供的能力”等现在时表述，容易被维护者和 Agent 误判为已经接入 Buildr 资产模型、CLI 或 runtime 的当前能力。仓库已经明确当前事实、规范契约、未来方向与历史资料的分层，因此现在需要把这些尚未实现但仍有价值的产品意图归入可发现且明确标注的 Roadmap。

本 change 不包含面向用户的破坏性产品行为变更；源文件路径会调整，但当前没有 CLI、package manifest、runtime adapter 或当前文档入口依赖这些路径。

## What Changes

- 新增 `docs/roadmap/` 入口，明确 Roadmap 文档只记录未来产品意图，不是当前事实、行为契约或可直接执行的规则与 Skill。
- 将四份角色文档移入 `docs/roadmap/agent-roles/`，保留角色协作意图，并把现时“角色规则”表述调整为未来设计候选。
- 将原型开发文档移入 `docs/roadmap/prototype-development.md`，保留流程设想，并明确 Buildr 当前尚未提供该能力。
- 更新移动资产之间的引用，以及产品主说明和文档索引中的 Roadmap 导航与事实边界；不为旧路径保留会继续伪装成当前资产的 redirect 文件。
- 不修改 `openspec/knowledge/buildr-current-state.md` 的当前事实，不回改历史 OpenSpec archive，不实现角色 Agent 或原型开发，不改变 CLI、package 发布边界、runtime 行为或权限模型。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `buildr-development-openspec`: 扩展 Buildr 产品文档分层契约，要求未来规划资产位于明确的 Roadmap 语境，并不得伪装成当前事实、规则、Skill 或已实现能力。

## Impact

- 文档路径：`agents/`、`capabilities/`、`docs/roadmap/`、`docs/buildr-product.md`、`docs/document-index.md` 和产品 `README.md`。
- OpenSpec：新增 `buildr-development-openspec` delta spec；canonical spec 仅在后续 sync/archive 阶段更新。
- 发布与运行：`package/manifest.yml` 当前只发布产品 `README.md` 和 `package/`，因此移动文件不改变 npm/package 内容、CLI API、workspace baseline 或 Agent runtime。
- 验证：检查当前事实/未来规划分层、引用有效性、OpenSpec strict validation 和产品完整验证；历史 archive 保持不变。

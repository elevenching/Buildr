## Why

当前 README 先从“组织工作资产”定义和能力分类解释 Buildr，用户需要自行把抽象概念映射到真实工作；“典型场景”也更像功能说明，未直接展示 Agent 如何在同一个窗口中持续完成端到端工作。现有工作原理图还容易让人误解为普通项目事实、文档和 Service 内容都需要经过 runtime adapter 投射，与 Buildr 的真实资产和 runtime 边界不一致。

## What Changes

- 将 README 首屏改为“让 Agent 在一个窗口里把事情做完”，直接说明 Agent 从想法、方案和文档持续推进到执行、验证、集成和交付的用户价值。
- 用 Buildr 自举开发发布、基于同一项目事实的团队协作、跨 Agent 复用 Rules/Skills、人员与团队变化时保留长期资产等具体场景替代抽象角色价值表和能力分类。
- 将团队协作场景明确为：产品岗位维护项目中的产品事实，设计、开发、测试等岗位的 Agent 基于同一事实工作；产品事实更新后，其他岗位后续工作自然使用最新内容。
- 重写“Buildr 如何工作”，用文件系统结构解释 workspace、Project、Service、Rules、Skills、Components、Commands 和 Agent runtime，并区分长期源资产与可重建 runtime 入口。
- 将快速开始改为通过 Agent 使用 Buildr，并用自然语言示例说明如何创建 Project、绑定 Project 资产 Git 仓库和接入已有 Git Service 仓库。
- 保持中英文 README 的产品语义与章节结构一致，合并重复的“为什么需要”“谁会受益”和“典型场景”，并将核心模型压缩为独立的最小说明。
- 不改变 CLI、workspace 数据、runtime adapter 行为或任何现有资产生命周期；不把 MCP 或完整企业权限描述为当前能力。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-first-product-positioning`: 公开 README 必须直接说明同一 Agent 窗口中的端到端工作连续性，通过可代入场景解释个人、团队和组织价值，并按真实 workspace/runtime 边界解释 Agent 如何使用 Buildr。

## Impact

- 公开入口：`README.md`、`README.en.md`。
- 产品契约：`openspec/specs/agent-first-product-positioning/spec.md` 的 delta。
- 不影响 CLI、runtime adapter、package、测试实现、依赖或外部 API。

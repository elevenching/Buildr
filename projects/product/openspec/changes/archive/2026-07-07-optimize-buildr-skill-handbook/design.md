## 设计决策

### 根 AGENTS.md 只写维护原则

根 `AGENTS.md` 是产品仓上下文规则，不重复 Buildr Skill 的正文，也不写成用户手册。只增加一个简短的 Buildr Skill 维护原则章节：

- `package/agent-skills/buildr/SKILL.md` 是 Agent 操作 Buildr 的手册。
- 维护内容要帮助 Agent 判断任务归属、源资产入口、CLI 主路径、诊断入口，以及何时继续读取后续资产。
- `doctor --json` 是默认事实入口；专项检查是后续细查入口。
- 内容按 Workspace、Project、Service、Rules、Commands、Skills、Runtime 七类 Buildr 资产组织，命令说明服务于 Agent 决策。

### Buildr Skill 是 Agent 操作手册

`package/agent-skills/buildr/SKILL.md` 应优化成 Agent 可直接执行的操作指引：

- 从操作流程和决策规则开始，而不是从产品背景开始。
- 按 Workspace、Project、Service、Rules、Commands、Skills、Runtime 七类资产，把相关概念、命令和异常处理放在一起。
- 不单独维护完整命令地图；必要命令主路径放在对应资产章节，详细参数由 CLI 帮助、CLI 错误或当前 manifest 状态补齐。
- Skill 正文不承载实现细节、roadmap 叙述或完整 CLI 参考。

该变更不预设更多僵硬章节结构；但 Buildr Skill 正文必须能清楚呈现 Workspace、Project、Service、Rules、Commands、Skills、Runtime 七类资产。

### doctor 是默认入口

面向 Agent 的引导在初始化后、源资产变更后、runtime 状态不明确时，都应把 `buildr doctor --json` 作为默认结构化事实来源。

专项检查可以继续存在，包括 adapter 相关的 runtime check。但它们不是普通 Agent 决策的第一步；只有当 doctor 输出指向 adapter/runtime 问题，或需要更深排障时才使用。

## 非目标

- 不新增 Skills manifest 模型。
- 不新增 Skill 登记方式或 render 方式。
- 不新增替代 `runtime check` 的命令。
- 不要求删除现有专项检查命令。

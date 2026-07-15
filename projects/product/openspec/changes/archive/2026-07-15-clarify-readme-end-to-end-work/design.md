## Context

当前 README 的首屏以“组织工作资产管理系统”开场，后续再分别解释问题、原理、角色和典型场景。内容事实基本正确，但入口重复且抽象，用户无法快速重建自己遇到的工作断点。现有“Buildr 如何工作”还把全部工作资产放在一条 `runtime render` 流程中，未准确区分 Agent 在 workspace 中直接发现的项目事实、文档、OpenSpec、Commands 和 Service 内容，以及必须通过 runtime adapter 投射到 Agent 原生入口的 Rules、Skills 与产品 Buildr Skill。

本次只调整公开 README 及其定位契约，不改变产品实现。README 仍承担“产品入口、价值理解、快速开始和文档导航”，详细资产模型、adapter 实现和维护契约继续留在产品主说明、current state、OpenSpec specs 与专项文档中。

## Goals / Non-Goals

**Goals:**

- 让首次访问者在首屏理解 Buildr 的直接结果：Agent 能在同一个用户任务窗口中，从想法、方案和文档持续推进到执行、验证、集成和交付。
- 用多个具体场景让个人、团队和组织映射自己的问题，并明确 Agent 如何使用 Buildr 解决。
- 将团队协作表述为不同岗位的 Agent 基于同一套 Project 事实工作；产品事实更新后，后续岗位自然使用最新来源。
- 用简洁的文件系统模型解释 workspace、Project、Service、各类工作资产与 Agent runtime 的关系。
- 保持中英文 README 的核心语义和章节结构一致，删除重复解释。

**Non-Goals:**

- 不新增端到端 workflow engine、多 Agent 编排、自动 context window 填充或固定岗位路由。
- 不改变 Rules、Skills、Commands、Project、Service、Component 或 runtime adapter 的实现和生命周期。
- 不把 MCP、完整企业权限、数据防泄漏或尚未实现的外部工具集成描述为当前能力。
- 不把 README 扩展为全部实现细节和 CLI 参考。

## Decisions

### 1. 首屏先表达结果，再定义工作资产

README 使用“让 Agent 在一个窗口里，把事情做完”作为价值入口，随后用常用语言说明 Buildr 组织事实、规则、能力、项目关系和流程。正式的“工作资产”概念只在这些具体内容已经建立之后出现。

选择该顺序，是因为“工作资产”适合作为长期产品模型，但不足以单独承担首次理解；如果继续以资产分类开场，用户仍需自行推导 Buildr 与当前工作的关系。

### 2. “一个窗口”表示用户任务连续性

README 将同一个 Agent 窗口描述为同一用户任务持续推进，不把它等同于单个模型 context window，也不承诺预先加载全部资产。Agent 根据阶段发现并选择相关内容，完成当前动作后继续下一步。

Buildr 自举开发作为当前事实案例：讨论梳理、OpenSpec 提案/设计/任务、实现测试、Git 集成、GitHub Actions 与 npm 发布可以由 Agent 在同一任务中连续编排；需要登录、审批或业务判断时仍由人确认。

### 3. 场景编号并按工作问题组织

README 使用“场景一”至“场景四”覆盖端到端工作、团队协作、跨 Agent 复用和人员/团队变化。每个场景只保留可识别的问题和 Buildr 的解决形态，不展开重复的角色价值、实现细节或边界说明。

团队场景不归因于 Team Leader。产品岗位维护产品文档、PRD、Specs 和其他产品事实，设计、开发、测试等岗位的 Agent 以同一事实源为基础；发现产品问题后反馈产品修改，后续工作自然使用更新后的内容。各岗位仍维护自身领域资产，Buildr 不引入固定岗位 Agent 或自动权限路由。

### 4. “如何工作”直接解释文件系统模型

README 用一个可见的目录模型说明 Buildr 的真实结构：

- Workspace/Organization Root 是个人或组织的文件系统根，保存共享资产和 Project。
- Project 是业务、产品、系统或长期工作单元，保存项目事实、Specs、Skills 和 Service 关系，不等同于一个代码仓。
- Service 是 Project 下的代码仓、应用、模块或可执行资产，可以接入已有 Git 仓库或本地目录。
- Rules、Skills、Components 和 Commands 分别承载约束、专业动作、可分发资产组合和外部 CLI 声明。
- Agent runtime adapter 把 Agent 需要的 Rules、Skills 和 Buildr Skill 生成到对应 Agent 的原生入口；这些 runtime 文件可重建，不是事实源。

Agent 在 workspace 中读取项目事实和 Service 内容，通过 Buildr Skill 理解用户目标，并使用 Buildr CLI 确定性地创建、维护、诊断和同步资产。README 不展开 Component integrity、RuntimePlan、transaction 和 adapter traits 等实现细节。

### 5. 快速开始以“通过 Agent 使用”为主路径

快速开始首先告诉用户把 README 和目标交给 Agent。发布 package 与开发 checkout 两种来源写成给 Agent 的指令，并保留最小命令参考。随后用自然语言示例说明如何创建 Project、为 Project 绑定资产 Git 仓库，以及把已有 Git 仓库接入为 Service。用户不需要先学习 CLI，Agent 通过 Buildr Skill 理解目标并调用 CLI 完成确定性操作。

“核心模型”保留为独立章节以满足公开 README 结构契约，但只保留 `Organization/Root -> Project -> Service`，其职责在相邻的“Buildr 如何工作”中解释。当前能力、文档导航和自举 workspace 说明继续压缩。

## Risks / Trade-offs

- [“一个窗口把事情做完”被理解为无条件自动完成所有工作] → 明确 Agent 仍依赖当前任务所需资产、工具、权限和人的关键判断，并用阶段性发现而非自动加载描述机制。
- [目录模型被误解为所有 workspace 必须拥有完全相同的目录] → 明确它是核心结构示意，并继续由产品主说明和 adapter 文档承载完整实现。
- [中英文 README 语义漂移] → 同步调整章节结构、场景顺序、边界和当前能力表述，并运行结构与关键短语检查。
- [公开案例包含尚未实现能力] → 端到端自证仅使用 Buildr 已存在的 OpenSpec、开发测试、Git、GitHub Actions 和 npm 发布流程；MCP 与完整企业能力不进入当前能力描述。

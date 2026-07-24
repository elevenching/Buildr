## ADDED Requirements

### Requirement: README 必须直接说明 Buildr 适用的问题和场景
Buildr 公开 README MUST 在要求读者理解内部资产模型之前，用直接、具体、可代入的语言说明 Buildr 适合解决什么问题以及用户可以拿它做什么；场景 MUST 使用真实当前能力，不得把 Roadmap 或 Agent 自身能力表述为 Buildr 已实现功能。

#### Scenario: 首次访问者判断是否需要 Buildr
- **WHEN** 读者第一次查看 README 首屏和快速开始前内容
- **THEN** README MUST 至少覆盖重复解释项目背景、多 repo/Service 关系割裂、工作方法停留在聊天或个人经验、切换 Agent 需要重建环境等具体问题
- **AND** MUST 用一句普通语言说明 Buildr 将项目事实和工作方法组织成 Agent 可持续使用的工作资产
- **AND** 读者 MUST NOT 需要先理解 Rules、Skills、Components、Commands 或 runtime adapter 才能判断产品价值

#### Scenario: README 展示可执行使用场景
- **WHEN** README 举例说明用户可以拿 Buildr 做什么
- **THEN** 场景 MUST 包括组织现有业务与代码仓、让 Agent基于项目事实继续工作、沉淀可复用工作方法或接续长期任务中的至少三类
- **AND** 场景 MUST 使用普通用户可表达的目标，而不是把 `project create`、`service create`、sync 或 capability 参数当作用户价值示例

### Requirement: README 快速开始必须引导第一次有效工作
Buildr 公开 README MUST 将普通用户快速开始从安装延伸到 Workspace、Project、可选 Service 和第一项真实工作，并 MUST 把 runtime discovery、init 和 doctor 描述为 Agent 的确定性执行与验证细节，而不是普通用户必须学习的主流程。

#### Scenario: 用户复制第一次使用指令
- **WHEN** 普通用户阅读 README 快速开始
- **THEN** README MUST 提供一段可以直接交给 Agent 的自然语言指令
- **AND** 该指令 MUST 要求 Agent 检查并安装 Buildr、确认 Workspace、引导 Project/Service、执行和验证必要动作，并在完成后询问第一项工作
- **AND** 指令 MUST NOT 要求用户预先提供 runtime adapter id、CLI 参数或完整 Buildr 资产分类

#### Scenario: README 解释最小用户心智
- **WHEN** 快速开始解释初始化后会发生什么
- **THEN** README MUST 将 Workspace 说明为用户与 Agent 共同工作的顶层目录，将 Project 说明为业务、产品、系统或长期工作，将 Service 说明为 Project 中可选的代码仓、应用、模块或可执行资产
- **AND** MUST 明确三者是帮助用户理解工作范围的最小模型，不是每次对话都必须填写的三个参数

#### Scenario: README 提供两种开始方式
- **WHEN** README 说明如何使用 Buildr
- **THEN** MUST 分别说明通过 local app 建立和查看工作范围、通过 Agent 对话完成 onboarding 的路径
- **AND** MUST 说明 local app 负责认知、低风险维护和交接，Agent 负责理解、执行与验证
- **AND** 任一路径 MUST NOT 成为另一条路径的强制前置条件

#### Scenario: README 后置技术安装细节
- **WHEN** README 展示 Node、npm、development checkout、runtime list、init 或 doctor 命令
- **THEN** 这些内容 MUST 位于普通用户第一次使用指令和成功路径之后，或明确标记为 Agent/手动兜底信息
- **AND** README MUST 链接 CLI Reference、Runtime Adapters 和产品说明承载深入机制
- **AND** MUST NOT 在 README 重复维护完整 CLI 手册

#### Scenario: README 定义第一次成功
- **WHEN** README 说明快速开始的完成结果
- **THEN** MUST 将用户能够确认 Workspace、Project、可选 Service 并向 Agent 提出第一项真实目标作为第一次有效工作的入口
- **AND** MUST 将 doctor ready 保留为 Agent 判断技术 onboarding 完成的证据
- **AND** MUST NOT 把只运行安装命令或 init 描述为用户已经会使用 Buildr

### Requirement: 产品说明必须定义 local app 的人机桥梁边界
Buildr 产品说明 MUST 将 Agent 定义为理解、推理、规划和专业执行入口，将 local app 定义为人的认知与治理入口以及向 Agent 交接 canonical 工作范围的界面；二者 MUST 共享 Workspace 源资产，不得形成两个竞争的任务执行主体。

#### Scenario: 产品说明解释 local app 价值
- **WHEN** README 或产品主说明介绍 local app
- **THEN** MUST 说明 local app帮助人理解 Workspace、Project、Service、真实状态和低风险 metadata，并生成交给 Agent 的受约束 prompt
- **AND** MUST 说明真正的 Project/Service 创建、迁移、修复和专业任务由 Agent 在核对边界与授权后执行

#### Scenario: 评审 local app 新能力
- **WHEN** 产品准备在 local app 增加对话、自动规划、任务执行或 Agent session 管理能力
- **THEN** 设计 MUST 单独证明该能力的长期治理、跨 Agent 复用、确定性约束或可验证诊断价值
- **AND** 如果能力只是复制 Agent 的通用理解、推理、规划、对话或专业执行，MUST 将其保留给 Agent

#### Scenario: local app 与 Agent 状态一致
- **WHEN** Agent 修改 Workspace、Project 或 Service 后用户打开 local app
- **THEN** local app MUST 从同一 source authority 读取最新事实
- **AND** MUST NOT 依赖独立数据库、聊天记录或页面 onboarding 状态解释 canonical 资源关系

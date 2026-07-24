## MODIFIED Requirements

### Requirement: 新增 Project 必须生成可复制 Agent prompt
Buildr MUST 以普通用户可理解的业务意图生成完整 Agent prompt，而不是直接修改 Project registry、创建目录或 clone repo；Project code 与 Git 执行声明 MUST 可以由用户显式提供，也 MUST 可以留给 Agent 提议并确认。

#### Scenario: 生成最小 Project 意图 prompt
- **WHEN** 用户填写 Project 名称和用途，并且没有填写 code、source 或 Git 声明
- **THEN** Application MUST 返回要求 Agent 核对当前 Workspace、提出可读 code、确认 source boundary、执行 canonical Project creation 并验证结果的 prompt
- **AND** 页面 MUST 明确说明复制 prompt 不会创建 Project
- **AND** 页面 MUST NOT 要求用户先理解 Project asset repo、remote 或 integration branch

#### Scenario: 生成 workspace Project prompt
- **WHEN** 用户填写名称、用途和可选 code，并明确选择 workspace source
- **THEN** prompt MUST 保留用户提供的声明并要求 Agent 确认目标 Workspace、物化路径和 root Git boundary
- **AND** prompt MUST 要求 Agent 使用 canonical Project creation 并验证结果

#### Scenario: 生成 Git Project prompt
- **WHEN** 用户提供独立 Project asset Git URL、remote 或 integration branch
- **THEN** prompt MUST 保留已经提供的声明并要求 Agent 校验 remote identity、路径、授权和稳定集成目标
- **AND** 未提供的技术声明 MUST 由 prompt 要求 Agent 解析或询问，不得由页面猜测
- **AND** prompt MUST NOT 要求 Buildr 盲目切换、stash 或重连既有 checkout

### Requirement: 新增 Service 必须生成可复制 Agent prompt
本地应用 MUST 将新增 Service 保持为 prompt-only Agent Action，并 MUST 从当前 Workspace 的 canonical Project 中选择所属关系；用户 MUST 能以名称、用途和可选来源开始，而不需要先填写完整 CLI 参数。

#### Scenario: 生成最小 Service 意图 prompt
- **WHEN** 用户选择一个已登记 Project，填写 Service 名称和用途，并且没有填写 code、type 或 repo ref
- **THEN** 页面 MUST 生成要求 Agent 核对 Project identity、确认是否存在代码仓或可执行资产、补齐必要声明并调用 canonical CLI 的 prompt
- **AND** prompt MUST NOT 假设每个 Project 都必须创建 Service

#### Scenario: 生成本地来源 prompt
- **WHEN** 用户选择 canonical Project 并提供本地目录
- **THEN** 页面 MUST 生成要求 Agent 核对来源、物化路径、Git boundary、code/type 候选、调用 canonical CLI 并验证的完整 prompt
- **AND** 页面 MUST NOT 直接复制目录、创建外部链接或写 registry

#### Scenario: 生成 Git 来源 prompt
- **WHEN** 用户选择 canonical Project 并提供 Git URL、remote 或 integration branch
- **THEN** prompt MUST 保留已经提供的稳定声明并要求 Agent 在写入前检查既有 repo、metadata identity 和授权
- **AND** 未提供的 code、type、remote 或 integration branch MUST 由 Agent 解析或询问，不得由页面猜测

#### Scenario: 拒绝未知所属 Project
- **WHEN** Service prompt 请求中的 Project 不属于当前 Workspace 或已经不存在
- **THEN** Application MUST 在生成 prompt 前拒绝请求
- **AND** MUST NOT 回退到第一个 Project 或其他 Workspace

### Requirement: Workspace 概览必须提供真实且可解释的摘要
Buildr MUST 将 Workspace 概览呈现为“开始”页，根据真实 Workspace、Project 与 Service read model 展示当前工作范围、完整性和一个明确的下一步；页面 MUST NOT 持久化第二套 onboarding 状态或把 Service 数量作为 Workspace readiness 的硬门禁。

#### Scenario: Workspace 没有 Project
- **WHEN** Workspace 与 Project read model 可读取且 Project registry 为空
- **THEN** 开始页 MUST 用普通语言说明 Workspace 与 Project 的关系
- **AND** MUST 将“让 Agent 创建第一个 Project”作为主要下一步
- **AND** MUST NOT 优先展示 Change、Rules、Skills 或技术 identity

#### Scenario: Workspace 有多个 Project
- **WHEN** Project read model 返回多个 Project 且用户尚未选择当前 Project
- **THEN** 开始页 MUST 展示可理解的 Project 选择入口
- **AND** MUST NOT 猜测当前业务范围或把任一 Project 标记为唯一正确选择

#### Scenario: 当前 Project 没有 Service
- **WHEN** 用户已选择 Project 且该 Project 的 Service read model 为空
- **THEN** 开始页 MUST 解释 Service 是代码仓、应用、模块或可执行资产
- **AND** MUST 同时提供“让 Agent 接入 Service”和“该 Project 暂不需要 Service，直接开始工作”的路径
- **AND** MUST NOT 将该 Workspace 显示为未完成或不可用

#### Scenario: 已有可用工作范围
- **WHEN** Workspace、选定 Project 和可选 Service 均可读取
- **THEN** 开始页 MUST 展示当前 Workspace、Project 和可选 Service 范围
- **AND** MUST 将“用 Agent 开始”作为主要动作
- **AND** Project 数、Service 数、identity、schema 和 revision MUST 保持为次级摘要或技术信息

#### Scenario: 部分 Service 汇总不可用
- **WHEN** 至少一个 Project 的 Service read model 无法读取
- **THEN** 开始页 MUST 将 Service 汇总和 onboarding completeness 标识为部分不可用
- **AND** MUST NOT 将未知数量显示为完整事实
- **AND** Workspace 与可用的 Project 信息 MUST 继续展示

#### Scenario: 存在迁移要求
- **WHEN** Workspace、Project 或 Service read model 报告 migration required
- **THEN** 开始页 MUST 展示需要 Agent 执行显式 update 或 sync 的提示和可复制 Agent Action
- **AND** 打开开始页 MUST NOT 触发任何迁移写入

### Requirement: 项目与服务创建必须使用抽屉式 Agent Action
Buildr MUST 通过资源页面中的创建按钮触发统一的“交给 Agent”抽屉，并 MUST 使用“基础意图 + 高级声明”的渐进表单；页面正文 MUST NOT 平铺创建表单，抽屉 MUST NOT 把 canonical CLI 参数作为普通用户的默认必填项。

#### Scenario: 从项目区域创建项目
- **WHEN** 用户点击项目区域的“创建项目”按钮
- **THEN** 应用 MUST 打开以名称和用途为默认必填信息的 Project Agent Action
- **AND** code、source、Git remote 和 integration branch MUST 为可选或高级声明
- **AND** 表单 MUST 使用 Project prompt Application 用例

#### Scenario: 从服务区域创建服务
- **WHEN** 用户点击服务区域的“创建服务”按钮
- **THEN** 应用 MUST 打开以所属 Project、名称和用途为默认必填信息的 Service Agent Action
- **AND** 所属 Project MUST 从当前 Workspace canonical Project 列表选择，当前已选 Project MUST 自动带入
- **AND** code、type、repo ref、remote 和 integration branch MUST 为可选或高级声明
- **AND** 表单 MUST 使用 Service prompt Application 用例

#### Scenario: 用户未提供技术声明
- **WHEN** Project 或 Service Agent Action 缺少 code、type、source、remote 或 integration branch
- **THEN** 页面 MUST 允许生成 prompt
- **AND** prompt MUST 要求 Agent 根据真实目录、Git 与用户目标提出候选并只询问必要信息
- **AND** Application MUST NOT 为缺失字段编造声明

#### Scenario: 从全局入口选择创建类型
- **WHEN** 用户点击 App Shell 的“交给 Agent”按钮
- **THEN** 抽屉 MUST 优先展示创建 Workspace、Project、Service 和开始工作等核心动作
- **AND** Change 等后续能力 MUST 作为次级动作呈现
- **AND** 生成与复制结果 MUST 明确说明对象或任务尚未创建或开始

### Requirement: 全局应用必须提供 Workspace 级应用外壳与路由
Buildr MUST 提供解释 Workspace 心智的全局 Workspace 页面，并 MUST 在选定 Workspace 下提供“开始”、设置、Project、Service 和 Change 等既有稳定路由；应用外壳 MUST 将 Workspace、Project、Service 作为核心路径，并将 Change 与后续资产能力放入次级区域。

#### Scenario: 打开全局首页
- **WHEN** 用户打开根路由
- **THEN** 页面 MUST 展示全部已登记 Workspace 的真实身份和可用状态
- **AND** MUST 用普通语言说明 Workspace 是用户与 Agent 共同工作的顶层目录
- **AND** MUST 提供登记已有 Workspace、让 Agent 创建 Workspace、移除登记和进入 Workspace 的明确操作
- **AND** MUST 说明登记只保存本机入口，不移动或修改 Workspace 源资产

#### Scenario: 进入 Workspace
- **WHEN** 用户选择一个可用 Workspace
- **THEN** 页面 MUST 导航到 `/workspaces/:workspaceId/` 下的 Workspace“开始”页
- **AND** Workspace 内导航 MUST 保持该 `workspaceId` 上下文

#### Scenario: 展示核心导航层级
- **WHEN** 用户在选定 Workspace 中浏览
- **THEN** App Shell MUST 将“开始”“项目”“服务”展示为核心区域
- **AND** Service 视图 MUST 显示当前所属 Project，breadcrumb MUST 表达 Workspace、Project 与 Service 层级
- **AND** Change 与未来 Rules、Skills 等能力 MUST 进入次级区域但保持既有路由可访问

#### Scenario: 保持既有深链接
- **WHEN** 用户直接访问合法的 Project、Service、Change 详情或编辑 URL
- **THEN** HTTP interface MUST 继续返回本机应用 shell并恢复同一 canonical 上下文
- **AND** 本变更 MUST NOT 因导航重组破坏既有 `/projects`、`/services?project=`、详情或编辑路由

#### Scenario: 切换 Workspace
- **WHEN** 用户从 Workspace 内选择另一个已登记 Workspace
- **THEN** 页面 MUST 切换到目标 Workspace 的 canonical route
- **AND** MUST NOT 改变任一 Workspace 源资产

#### Scenario: 恢复最近使用项
- **WHEN** 全局实例启动且最近使用的 Workspace 仍可用
- **THEN** Buildr MUST 允许启动入口直接打开该 Workspace 的“开始”页
- **AND** 最近使用状态 MUST NOT 写入 Workspace 源资产

### Requirement: Buildr App 首次启动必须引导建立 Workspace 上下文
Buildr MUST 在用户级 Workspace Registry 为空时提供可理解的首次运行页面，解释 Workspace → Project → Service 最小模型，并 MUST 复用全局 Web 应用而不是在 installer 中维护第二套 Workspace 流程。

#### Scenario: 首次打开空 Registry
- **WHEN** 用户第一次打开 Buildr App 且 Workspace Registry 为空
- **THEN** 页面 MUST 说明 Workspace、Project 与 Service 分别代表什么以及三者关系
- **AND** MUST 将“添加已有工作空间”作为主操作，将“让 Agent 创建工作空间”作为次操作
- **AND** MUST NOT 首先展示 Change、Rules、Skills、runtime 或 CLI 教学

#### Scenario: 选择已有 Workspace
- **WHEN** 首次运行用户选择一个包含合法 Buildr Workspace identity 的目录
- **THEN** Buildr MUST 登记该 Workspace 并进入其“开始”页
- **AND** MUST NOT 复制、迁移或修改 Workspace 源资产

#### Scenario: 选择未初始化目录
- **WHEN** 用户通过 native directory picker 选择可读取但尚未初始化的目录
- **THEN** Buildr MUST 保持 Registry 不变并显示该目录尚不是 Buildr Workspace
- **AND** 页面 MUST 提供重新选择和生成带该 candidate 位置的 Workspace 初始化 Agent Action
- **AND** 页面 MUST NOT 自动执行 init

#### Scenario: 选择需要迁移或修复的目录
- **WHEN** picker 选择的目录存在 migration required、invalid metadata 或可恢复诊断
- **THEN** Buildr MUST 保持 Registry 不变并展示稳定、可理解的诊断类别
- **AND** 页面 MUST 提供重新选择和生成 canonical sync/repair Agent Action
- **AND** MUST NOT 自动选择 identity、覆盖文件或执行迁移

#### Scenario: 选择不可读或 identity 冲突目录
- **WHEN** picker 选择的目录不可读或与已登记 Workspace identity 冲突
- **THEN** Buildr MUST 保持 Registry 不变并说明不能登记的原因
- **AND** MUST NOT 生成声称可以安全自动修复的结果

#### Scenario: 暂不登记 Workspace
- **WHEN** 用户选择稍后处理
- **THEN** Buildr MUST 保持全局应用可退出
- **AND** MUST NOT 创建虚构 Workspace 或自动扫描磁盘

## ADDED Requirements

### Requirement: Workspace onboarding 状态必须由真实资产派生
Buildr MUST 通过 Application 组合现有 Workspace、Project 与 Service read model 生成只读 Getting Started projection，并 MUST 区分完整、部分可用和需要处理的事实；该 projection MUST NOT 成为 Workspace readiness 或资源关系的第二事实源。

#### Scenario: 生成派生 onboarding phase
- **WHEN** 本机应用请求当前 Workspace 的 Getting Started projection
- **THEN** Application MUST 根据实际 Project 数、当前选择、Service 数和诊断生成 phase、primary action 与 completeness
- **AND** MUST 返回 primary action 所需的 canonical entity references
- **AND** MUST NOT 写入 Workspace、Project、Service 或用户级 Registry

#### Scenario: 资产状态随后变化
- **WHEN** Agent、Git 或另一个页面创建、删除、迁移或修改 Project/Service 后重新请求 projection
- **THEN** Application MUST 从最新 read model 重新计算结果
- **AND** MUST NOT 依赖已完成步骤、dismissed flag 或旧缓存决定下一步

#### Scenario: Service 对当前 Project 不适用
- **WHEN** 用户选择直接开始不含 Service 的 Project 工作
- **THEN** 页面 MUST 允许生成 Project-scoped 开始工作 prompt
- **AND** MUST NOT 创建虚构 Service 或持久化“跳过 Service”状态

### Requirement: 本机应用必须提供范围明确的开始工作 Agent 交接
Buildr MUST 允许用户从当前 Workspace 选择 canonical Project、可选 Service 并填写工作目标，生成可复制的开始工作 prompt；该能力 MUST 只完成范围交接，不得连接、启动或托管 Agent 会话。

#### Scenario: 生成 Project-scoped 开始工作 prompt
- **WHEN** 用户选择当前 Workspace 中存在的 Project、未选择 Service并填写非空目标
- **THEN** Application MUST 生成包含 Workspace 与 Project 可读身份和用户目标的 prompt
- **AND** prompt MUST 要求 Agent 读取适用工作资产、确认必要歧义、推进任务并按 Project policy 验证

#### Scenario: 生成 Service-scoped 开始工作 prompt
- **WHEN** 用户选择当前 Project 下存在的 Service 并填写非空目标
- **THEN** Application MUST 生成包含 Workspace、Project、Service 可读身份和用户目标的 prompt
- **AND** prompt MUST NOT 把 current branch、dirty 或其他瞬时 observation 写成稳定声明

#### Scenario: 开始工作范围无效
- **WHEN** Project 不属于当前 Workspace、Service 不属于当前 Project或任一 entity 已不存在
- **THEN** Application MUST 在生成 prompt 前拒绝请求
- **AND** MUST NOT回退到其他 Workspace、Project 或 Service

#### Scenario: 复制开始工作 prompt
- **WHEN** 浏览器成功复制开始工作 prompt
- **THEN** 页面 MUST 提示用户回到 Agent 对话中粘贴该指令
- **AND** MUST 明确任务尚未在 local app 中开始或完成

#### Scenario: 开始工作写安全边界
- **WHEN** prompt 请求包含 filesystem path、未知字段、无效 session、错误 Origin、非 JSON 或超限 body
- **THEN** HTTP interface MUST 在 Application 处理前拒绝请求
- **AND** MUST 保持 Workspace 源资产和用户级 Registry 零写入

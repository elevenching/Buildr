# Local Workspace Application

## Purpose

定义 Buildr Workspace 产品切片在新源码分层中的职责、本机应用入口、受控 metadata 修改、并发保护和 Agent prompt 边界。
## Requirements
### Requirement: Workspace 产品能力必须遵守新源码分层
Buildr MUST 将 Workspace 实体与纯约束放入 Domain，将用例和 ports 放入 Application，将 Manifest 持久化放入 filesystem Infrastructure，并将 CLI、HTTP 和 Web 放入 Interfaces。

#### Scenario: interface 读取 Workspace
- **WHEN** CLI、本机 HTTP 或 Web 请求读取 Workspace
- **THEN** interface MUST 调用 Application 暴露的 Workspace 用例
- **AND** interface MUST NOT 直接解析 `.buildr/workspace.yml` 或 `skills/manifest.yml`

#### Scenario: Domain 保持存储无关
- **WHEN** 架构 verifier 检查 Workspace Domain imports
- **THEN** Domain MUST NOT 导入 YAML、filesystem、HTTP、CLI、process、runtime、test 或 repository implementation
- **AND** Domain MUST 只表达 Workspace entity、identity 格式和字段约束

#### Scenario: filesystem adapter 持久化 Workspace
- **WHEN** Workspace Application 通过 repository port 读取或保存 Workspace
- **THEN** filesystem adapter MUST 负责 Manifest path、YAML parse/render 和 canonical bytes revision
- **AND** adapter MUST NOT 自行决定页面字段白名单、identity 冲突取舍或 Agent prompt 内容

### Requirement: Workspace 页面必须支持查看和低风险修改
Buildr MUST 提供 Workspace 总览与编辑页面，只允许修改 `name` 和 `description`。

#### Scenario: 查看 Workspace
- **WHEN** 用户打开 Workspace 总览
- **THEN** 页面 MUST 展示 Workspace `id`、`name`、`description`、root path 和当前 revision
- **AND** `id`、root path 与 schema identity MUST 为只读信息

#### Scenario: 修改 Workspace metadata
- **WHEN** 用户基于当前 revision 提交合法的 `name` 或 `description`
- **THEN** Application MUST 使用 Workspace transaction 和 atomic writer 更新 `.buildr/workspace.yml`
- **AND** 写后 MUST 重新校验 canonical schema
- **AND** 响应 MUST 返回更新后的 Workspace 和新 revision

#### Scenario: 拒绝非白名单字段
- **WHEN** 页面或调用方尝试修改 Workspace `id`、root path、schemaVersion 或任意未知字段
- **THEN** Application MUST 在写入前拒绝整个请求
- **AND** `.buildr/workspace.yml` MUST 保持不变

### Requirement: 页面修改必须防止覆盖外部变化
Buildr MUST 返回基于 canonical Manifest bytes 的 revision，并对页面修改执行 compare-and-swap。

#### Scenario: revision 匹配
- **WHEN** 修改请求携带的 revision 与写入前实际 revision 相同
- **THEN** Application MUST 继续执行字段校验和受控写入

#### Scenario: revision 冲突
- **WHEN** Agent、Git、编辑器或另一个页面会话已经改变 Manifest，导致请求 revision 过期
- **THEN** Application MUST 返回稳定 conflict 结果
- **AND** MUST NOT 自动 merge 或覆盖实际文件
- **AND** 页面 MUST 提示用户刷新后重新判断

### Requirement: 新增 Workspace 必须生成可复制 Agent prompt
Buildr MUST 让 Workspace 新增页面生成完整 prompt，而不是直接初始化目标目录或声称 Workspace 已创建。

#### Scenario: 生成 Workspace 新增 prompt
- **WHEN** 用户填写 Workspace 名称、说明和可选目标位置并请求生成
- **THEN** Application MUST 返回可直接复制到 Agent 对话框的 prompt
- **AND** prompt MUST 要求 Agent 读取 Buildr Skill、核对目标位置和授权、补充必要信息、执行 canonical init/sync 并验证结果
- **AND** prompt MUST NOT 猜测用户未提供的路径、runtime 或权限

#### Scenario: 复制 prompt
- **WHEN** 用户点击复制且浏览器复制成功
- **THEN** 页面 MUST 显示复制成功反馈
- **AND** 页面 MUST 明确说明复制不等于 Workspace 已创建

### Requirement: 本地应用写 API 必须使用最小安全边界
Buildr MUST 保护本地页面的写操作，避免其他网页或任意路径输入利用本地应用修改 Workspace。

#### Scenario: 合法同源写请求
- **WHEN** 写请求来自当前应用 Origin，携带有效 session token、JSON content type、允许大小的请求体和当前 revision
- **THEN** Buildr MUST 将请求交给对应 Application 用例

#### Scenario: 非法写请求
- **WHEN** 写请求缺少有效 session token、Origin 不匹配、content type 不合法、请求体超限或包含任意目标 path
- **THEN** Buildr MUST 在 Application mutation 前拒绝请求
- **AND** Workspace 文件 MUST 保持不变

#### Scenario: 离线静态资源
- **WHEN** 用户加载本地应用页面
- **THEN** 页面 MUST 使用 Buildr npm package 内的静态资源
- **AND** MUST NOT 依赖 CDN、远程字体、远程脚本或远程图片

### Requirement: 本地应用必须提供 Project 列表与详情
Buildr MUST 在固定 Workspace 的本地应用中提供 Project read model，且 Interfaces MUST 通过 Project Application 查询。

#### Scenario: 查看 Project 列表
- **WHEN** 用户打开本地应用的 Projects 视图
- **THEN** 页面 MUST 展示每个 Project 的 code、name、description、source type 和 path
- **AND** 页面 MUST 标识 registry migration state

#### Scenario: 查看 Project 详情
- **WHEN** 用户选择一个 Project
- **THEN** 页面 MUST 展示 id、workspaceId、code、name、description、source declaration 和 registry revision
- **AND** Git Project MUST 展示可用的实时 Git observation 与 declared/observed diagnostics

#### Scenario: Git 状态不可用
- **WHEN** Git adapter cannot observe a Project within its bounded query
- **THEN** page MUST show an unavailable diagnostic without treating guessed values as facts
- **AND** Workspace and other Project information MUST remain readable

### Requirement: Project 页面必须支持低风险 metadata 修改
Buildr MUST allow Project `name` and `description` edits while keeping identity and source read-only.

#### Scenario: 保存 Project metadata
- **WHEN** 用户基于当前 registry revision 保存合法 name 或 description
- **THEN** HTTP interface MUST invoke Project Application update with compare-and-swap
- **AND** page MUST refresh the returned canonical Project and revision

#### Scenario: Project revision 冲突
- **WHEN** Agent、Git、编辑器或另一个页面会话 changed `projects/manifest.yml` after the page loaded
- **THEN** API MUST return conflict without write
- **AND** page MUST ask the user to refresh and reassess

#### Scenario: v1 registry 只读
- **WHEN** registry requires migration
- **THEN** page MUST keep Project data readable and disable mutation
- **AND** page MUST show a copyable Agent instruction for canonical update or sync

### Requirement: 新增 Project 必须生成可复制 Agent prompt
Buildr MUST generate a complete Agent prompt for Project creation rather than directly mutating files from the page.

#### Scenario: 生成 workspace Project prompt
- **WHEN** 用户填写 code、name、description and chooses workspace source
- **THEN** Application MUST return a prompt that asks Agent to confirm target Workspace and source boundary, run canonical Project creation and verify the result
- **AND** the page MUST state that copying does not create the Project

#### Scenario: 生成 Git Project prompt
- **WHEN** 用户填写 Git URL、remote and integration branch
- **THEN** prompt MUST preserve those declarations and ask Agent to validate remote identity, path, authorization and branch before mutation
- **AND** prompt MUST NOT ask Buildr to switch an existing checkout blindly

### Requirement: Project HTTP 写操作必须复用本地应用安全边界
Project write routes MUST use the same fixed-target, same-origin, token, JSON and body-size controls as Workspace writes.

#### Scenario: 合法 Project 写请求
- **WHEN** request comes from the current Origin with valid token, JSON body, allowed size and current revision
- **THEN** server MUST pass only Project code, allowed metadata and revision to Application

#### Scenario: 非法 Project 写请求
- **WHEN** request contains target path, filesystem path, invalid token/origin/content type, oversized body or unknown mutation fields
- **THEN** server MUST reject it before Application mutation
- **AND** Project registry MUST remain unchanged
### Requirement: 本地应用必须提供 Service 列表与详情
固定 Workspace 的本地应用 MUST 按 Project 展示 Service Domain、声明 source 与实时观察状态。

#### Scenario: 查看 Service 列表
- **WHEN** 用户选择一个 Project
- **THEN** 页面 MUST 展示该 Project 的 Service code、name、type、description 与 source 类型

#### Scenario: 查看 Git Service 详情
- **WHEN** 用户选择 Git Service
- **THEN** 页面 MUST 分开展示 Domain 声明和 current branch、HEAD、dirty、upstream、ahead/behind、remote URL 与 comparison findings

### Requirement: Service 页面必须支持低风险 metadata 修改
本地应用 MUST 只允许修改 Service `name`、`description` 与 `type`。

#### Scenario: 保存 Service metadata
- **WHEN** 用户提交允许字段和当前 revision
- **THEN** HTTP API MUST 通过 Service Application 原子保存并刷新真实结果

#### Scenario: Service registry 需要迁移
- **WHEN** 当前 registry 是 legacy schema
- **THEN** 页面 MUST 保持修改只读并展示由 Agent 执行显式 update/sync 的提示

### Requirement: 新增 Service 必须生成可复制 Agent prompt
本地应用 MUST 将新增 Service 保持为 prompt-only Agent Action，不得直接写 registry、复制目录或 clone repo。

#### Scenario: 生成本地来源 prompt
- **WHEN** 用户填写 Project、Service Domain 信息与本地路径
- **THEN** 页面 MUST 生成要求 Agent 核对来源、物化路径、Git boundary、调用 canonical CLI 并验证的完整 prompt

#### Scenario: 生成 Git 来源 prompt
- **WHEN** 用户填写 Git URL、remote 与 integration branch
- **THEN** prompt MUST 明确这些稳定声明并要求 Agent 在写入前检查既有 identity

### Requirement: Service HTTP 写操作必须复用本地应用安全边界
Service API MUST 复用 fixed target、loopback、session token、Origin、JSON、body size 与 revision conflict 约束。

#### Scenario: 非法写请求
- **WHEN** Service PATCH 或 prompt 请求缺少任一写安全条件
- **THEN** server MUST 拒绝请求且零写入

### Requirement: Workspace 概览必须提供真实且可解释的摘要
Buildr MUST 在 Workspace 概览中展示当前 Workspace 身份、Project 与 Service 汇总以及迁移状态，且摘要 MUST 来自现有 Application read model，不得持久化为第二事实源。

#### Scenario: 汇总读取成功
- **WHEN** Workspace、Project 和各 Project 的 Service read model 均可读取
- **THEN** 概览 MUST 展示 Workspace 名称、说明、Project 数和 Service 数
- **AND** MUST 提供进入 Workspace 设置、项目和服务视图的明确入口

#### Scenario: 部分 Service 汇总不可用
- **WHEN** 至少一个 Project 的 Service read model 无法读取
- **THEN** 概览 MUST 将 Service 汇总标识为部分不可用
- **AND** MUST NOT 将未知数量显示为完整事实
- **AND** Workspace 与可用的 Project 信息 MUST 继续展示

#### Scenario: 存在迁移要求
- **WHEN** Workspace、Project 或 Service read model 报告 migration required
- **THEN** 概览 MUST 展示需要 Agent 执行显式 update 或 sync 的提示
- **AND** 打开概览 MUST NOT 触发任何迁移写入

### Requirement: Workspace 设置必须承载受控 metadata 修改
Buildr MUST 将当前 Workspace 的 metadata 编辑与只读技术事实放在 Workspace 设置页面，并继续复用现有白名单、迁移只读和 revision compare-and-swap 契约。

#### Scenario: 查看 Workspace 设置
- **WHEN** 用户打开 `/settings/workspace`
- **THEN** 页面 MUST 展示可编辑的 `name`、`description`
- **AND** MUST 将 `id`、root path、schema identity 和 revision 显示为只读事实

#### Scenario: 保存 Workspace 设置
- **WHEN** 用户基于当前 revision 保存合法的 `name` 或 `description`
- **THEN** 页面 MUST 调用 Workspace Application 写入并刷新新 revision
- **AND** App Shell 中的当前 Workspace 名称 MUST 同步刷新

#### Scenario: Workspace 设置发生 revision conflict
- **WHEN** 外部 Agent、Git、编辑器或其他页面会话已改变 Workspace manifest
- **THEN** 设置页 MUST 提示用户刷新后重新判断
- **AND** MUST NOT 自动 merge 或覆盖真实文件

### Requirement: 项目与服务独立视图必须保留现有能力
Buildr MUST 为项目与服务提供独立管理视图和稳定的项目详情上下文，且二者现有 read、metadata update、diagnostic 和 prompt-only 行为 MUST 保持可用。

#### Scenario: 打开项目视图
- **WHEN** 用户访问 `/projects`
- **THEN** 页面 MUST 以表格只展示当前工作空间的项目目录和项目管理入口
- **AND** 每个项目 MUST 在操作栏提供进入其 canonical 详情 URL 和按项目过滤的服务管理入口
- **AND** PC 表格整行 MUST NOT 作为默认操作入口
- **AND** MUST NOT 同时渲染服务管理内容

#### Scenario: 直接打开项目详情
- **WHEN** 用户访问或刷新合法的 `/projects/:projectCode`
- **THEN** HTTP interface MUST 返回本机应用 shell
- **AND** 页面 MUST 展示对应项目的身份、说明、来源声明、实时观察和诊断状态
- **AND** 浏览器历史导航 MUST 能恢复同一项目上下文

#### Scenario: 项目详情展示所属服务
- **WHEN** 对应 Project 与 Service read model 均可读取
- **THEN** 项目详情 MUST 展示该项目的服务数量与服务列表
- **AND** MUST 提供进入服务管理和创建服务 Agent Action 的入口
- **AND** 创建服务 MUST 自动携带当前项目 code

#### Scenario: 项目没有服务
- **WHEN** 项目详情中的 Service read model 返回空列表
- **THEN** 页面 MUST 展示当前项目尚未登记服务的空状态
- **AND** MUST NOT 渲染虚构的服务详情或状态

#### Scenario: 项目不存在
- **WHEN** 项目详情 API 对 URL 中的 projectCode 返回 not found
- **THEN** 页面 MUST 展示项目不存在的明确错误状态
- **AND** MUST 提供返回项目目录的入口
- **AND** MUST NOT 回退展示其他项目

#### Scenario: 展示后续项目资产入口
- **WHEN** 项目详情展示 OpenSpec、规则、验证或命令入口但本阶段尚未提供对应 read model
- **THEN** 页面 MUST 明确标记该能力属于后续阶段
- **AND** MUST NOT 展示未经真实来源证明的数量、健康度或可编辑状态

#### Scenario: 打开服务视图
- **WHEN** 用户访问 `/services` 或携带合法项目查询参数
- **THEN** 页面 MUST 以表格明确展示当前所属项目并只列出该项目的服务
- **AND** 用户 MUST 能切换已登记项目来查看对应服务
- **AND** 每个服务 MUST 通过明确的“详情”操作进入现有详情与 metadata 修改能力
- **AND** PC 表格整行 MUST NOT 作为默认操作入口

#### Scenario: 窄屏查看管理表格
- **WHEN** 用户在窄屏查看项目或服务管理视图
- **THEN** 页面 MUST 保持信息可读且关键操作可用
- **AND** MAY 使用表格横向滚动而无需提供独立移动端管理流程

#### Scenario: 当前项目没有服务
- **WHEN** 当前所属项目的 Service read model 返回空列表
- **THEN** 页面 MUST 展示该项目尚未登记服务的空状态与创建服务入口
- **AND** MUST NOT 渲染空的服务详情表单

#### Scenario: 使用项目或服务写操作
- **WHEN** 用户在独立视图修改项目或服务 metadata 或生成创建 prompt
- **THEN** HTTP API MUST 继续执行已有 session、Origin、JSON、body size、字段白名单和 revision conflict 约束

### Requirement: 新 Workspace 动作必须统一表达为交给 Agent
Buildr MUST 在 App Shell 中提供“交给 Agent”入口来生成新 Workspace prompt，并 MUST 明确该动作不会切换当前 Workspace 或直接完成创建。

#### Scenario: 生成新 Workspace prompt
- **WHEN** 用户从 App Shell 打开 Agent Action 并填写名称、说明和可选目标位置
- **THEN** 页面 MUST 调用现有 Workspace prompt Application 用例
- **AND** MUST 展示可复制的完整 prompt

#### Scenario: 复制新 Workspace prompt
- **WHEN** prompt 成功复制
- **THEN** 页面 MUST 提示指令已复制但 Workspace 尚未创建
- **AND** 当前 App Shell MUST 继续显示原 Workspace 上下文

### Requirement: 项目与服务创建必须使用抽屉式 Agent Action
Buildr MUST 通过资源页面中的创建按钮触发统一的“交给 Agent”抽屉，并 MUST NOT 在项目或服务页面正文中平铺创建表单。

#### Scenario: 从项目区域创建项目
- **WHEN** 用户点击项目区域的“创建项目”按钮
- **THEN** 应用 MUST 打开项目创建 Agent Action 表单
- **AND** 表单 MUST 继续使用现有 Project prompt Application 用例

#### Scenario: 从服务区域创建服务
- **WHEN** 用户点击服务区域的“创建服务”按钮
- **THEN** 应用 MUST 打开服务创建 Agent Action 表单
- **AND** 当前已选择的项目 MUST 自动填入所属项目上下文
- **AND** 表单 MUST 继续使用现有 Service prompt Application 用例

#### Scenario: 从全局入口选择创建类型
- **WHEN** 用户点击 App Shell 的“交给 Agent”按钮
- **THEN** 抽屉 MUST 允许用户选择创建工作空间、项目或服务
- **AND** 生成与复制结果 MUST 明确说明对应对象尚未创建

### Requirement: 界面领域名词必须使用中文主称
Buildr 本机应用 MUST 在用户可见界面中使用“工作空间”“项目”“服务”作为领域对象的主要名称，英文名称只能作为首次解释或技术辅助信息。

#### Scenario: 展示导航和页面标题
- **WHEN** 应用展示主导航、面包屑、页面标题、按钮、状态或说明
- **THEN** 领域对象 MUST 分别使用“工作空间”“项目”“服务”
- **AND** MUST NOT 只使用 Workspace、Project 或 Service 作为用户可见主称

#### Scenario: 展示技术字段
- **WHEN** 应用展示 Workspace ID、Schema、Revision、Git 或 API 等技术标识
- **THEN** 应用 MAY 保留不可误译的英文标识
- **AND** 对象本身仍 MUST 使用中文主称或“中文（English）”形式

### Requirement: 本机应用必须使用统一的资源目录与独立详情模型
Buildr 本机应用 MUST 将已登记工作空间作为全局目录；进入工作空间后，Project、Service 和 Change MUST 分别提供资源目录和可刷新、可返回的独立详情 URL。资源目录 MUST NOT 承载完整详情或主编辑表单。

#### Scenario: 从服务目录进入详情
- **WHEN** 用户在 `/services` 中选择某个服务的“详情”操作
- **THEN** 页面 MUST 导航到 `/services/:projectCode/:serviceCode`（在工作空间 URL 前缀内）
- **AND** 服务目录 MUST NOT 在表格下方展开详情或编辑表单

#### Scenario: 直接打开服务详情
- **WHEN** 用户访问或刷新合法的 `/services/:projectCode/:serviceCode`
- **THEN** HTTP interface MUST 返回本机应用 shell，页面 MUST 读取并展示对应 Service
- **AND** 浏览器历史导航 MUST 恢复相同 Project 与 Service 上下文

#### Scenario: 详情页承载低风险编辑
- **WHEN** 用户在 Service 详情页保存合法的 name、description 或 type
- **THEN** 页面 MUST 使用既有 Service metadata API 和 revision CAS
- **AND** 保存、冲突和迁移只读反馈 MUST 明确且不得影响目录页

### Requirement: 本机应用必须以控制台级信息层级呈现资源
Buildr 本机应用 MUST 使用紧凑的工作控制台信息层级：中文为主语言、技术身份与 Git observation 为次级信息、稳定 metadata 编辑与资源目录分离，且所有创建动作 MUST 明示为交给 Agent 的 prompt-only 行为。

#### Scenario: 查看资源列表
- **WHEN** 用户打开 Project、Service 或 Change 目录
- **THEN** 页面 MUST 提供一致的标题、数量、过滤控件与“交给 Agent 创建”主操作
- **AND** 表格操作 MUST 使用一致的低强调详情链接或按钮，资源行本身不得同时承担主编辑流程

#### Scenario: 查看资源详情
- **WHEN** 用户打开 Project、Service 或 Change 详情
- **THEN** 页面 MUST 按页头、概览、稳定 metadata、技术信息和关联资源的层级展示真实 read model
- **AND** UUID、revision、路径、source 和 Git observation MUST 不占用主标题或主概览视觉

#### Scenario: 反映真实导航层级
- **WHEN** 用户在工作空间内浏览目录或详情
- **THEN** 应用 shell MUST 显示可理解的工作空间、资源与当前资源层级
- **AND** 侧边栏当前工作空间 MUST 只展示名称和截断路径，并提供返回工作空间目录的明确入口

### Requirement: 工作空间目录与资源视图必须在窄屏保持可用
Buildr 本机应用 MUST 在桌面、约 1024px 和 390px 宽度保持可读且主要操作可用，不让页面主容器发生横向溢出。

#### Scenario: 查看工作空间目录
- **WHEN** 用户在宽屏、中屏或窄屏打开工作空间目录
- **THEN** 工作空间卡片 MUST 分别以 2–3 列、2 列和 1 列等宽网格显示
- **AND** 同一张卡内的状态、路径和操作位置 MUST 保持一致，整卡可进入工作空间，移除操作为次级行为

#### Scenario: 在窄屏查看和编辑资源
- **WHEN** viewport 宽度为 390px
- **THEN** 资源目录、详情、稳定 metadata 表单与“交给 Agent”操作 MUST 可见并可操作
- **AND** 必要的表格横向滚动 MUST 限定在表格容器内

### Requirement: 资源详情与修改必须使用独立操作
Buildr 本机应用 MUST 将 Project 与 Service 的详情呈现保持为只读，并以统一的标签和值展示资源身份、稳定 metadata 与来源事实；技术信息 MUST 在折叠区内沿用相同的标签和值形式。修改稳定 metadata MUST 通过明确、独立的编辑操作和 URL 进入。Project 与 Service 详情 MUST NOT 内嵌所属关联资源的目录、卡片或跳转入口；关联资源跳转 MUST 由相应资源目录行的操作列提供。

#### Scenario: 查看只读资源详情
- **WHEN** 用户打开 Project 或 Service 详情
- **THEN** 页面 MUST 展示资源身份、说明、稳定 metadata 与技术信息
- **AND** 主事实与展开的技术信息 MUST 使用统一的标签和值形式
- **AND** 页面 MUST NOT 直接展示可编辑 input、textarea、保存按钮或关联资源跳转入口

#### Scenario: 从资源目录开始修改
- **WHEN** 用户在 Project 或 Service 目录中选择“编辑”操作
- **THEN** 页面 MUST 导航到对应资源的独立编辑 URL
- **AND** 编辑页面 MUST 保持现有 metadata 白名单、revision CAS、迁移只读与反馈语义

#### Scenario: 从资源目录访问关联资源
- **WHEN** 用户查看任一 Project 行
- **THEN** 操作列 MUST 提供该项目的服务目录和变更目录入口
- **WHEN** 用户查看任一 Service 行
- **THEN** 操作列 MUST 提供所属 Project 详情入口
- **AND** Project 与 Service 详情 MUST NOT 重复提供这些关联资源跳转

#### Scenario: 侧边栏指示当前资源
- **WHEN** 用户打开项目、服务、变更目录或其详情/编辑页
- **THEN** 相应侧边栏资源项 MUST 显示明显的当前状态
- **AND** 资源分组状态 MUST NOT 取代当前资源项的高亮

### Requirement: 本机应用必须提供 Change 管理视图
Buildr 本机应用 MUST 在资源导航中提供独立的变更（Change）管理视图，并 MUST 使用明确的表格操作栏、过滤和详情入口展示真实 Project Change。

#### Scenario: 打开 Change 表格
- **WHEN** 用户访问 `/changes`
- **THEN** 页面 MUST 展示 Change 名称、所属项目、生命周期、任务进度、更新时间和操作栏
- **AND** 页面 MUST 提供项目与 active/archived 生命周期过滤

#### Scenario: 使用表格操作栏
- **WHEN** 用户查看任一 Change 行
- **THEN** 操作栏 MUST 提供详情和交给 Agent 的明确行为
- **AND** 表格行本身 MUST NOT 是唯一的信息或行为入口

#### Scenario: 创建 Change
- **WHEN** 用户点击“创建变更”
- **THEN** 页面 MUST 使用抽屉或弹窗收集所属项目与目标说明
- **AND** MUST 展示可复制的 Agent prompt，不得直接写入 OpenSpec

### Requirement: 本机应用必须提供可链接的 Change 详情页
Buildr 本机应用 MUST 使用稳定独立路由展示 Change 详情，并 MUST 将长 artifact 内容与短 prompt 交互分离。

#### Scenario: 打开 Change 详情
- **WHEN** 用户访问 `/changes/<projectCode>/<changeRef>`
- **THEN** 页面 MUST 展示 identity、lifecycle、任务进度、artifact availability 和可用的 proposal、design、specs、tasks 内容
- **AND** 页面刷新后 MUST 保持同一 Change 上下文

#### Scenario: Change 不存在
- **WHEN** 详情 API 返回 not found
- **THEN** 页面 MUST 显示明确空状态并提供返回 Change 表格的入口

#### Scenario: 详情中的 Agent 行为
- **WHEN** 用户在详情中选择继续或审阅
- **THEN** 页面 MUST 打开短交互抽屉并生成可复制 prompt
- **AND** MUST NOT 叠加承载第二份完整 Change 详情的二级抽屉

### Requirement: 项目详情必须展示所属 Change 摘要
Buildr 本机应用 MUST 在项目详情中展示该 Project 的 Change 数量、有限列表和进入过滤后 Change 表格的稳定入口。

#### Scenario: Project 存在 Change
- **WHEN** 项目详情读取到 active 或 archived Change
- **THEN** 页面 MUST 展示总数和最近 Change 摘要
- **AND** “管理变更” MUST 进入带 Project filter 的 Change 表格

#### Scenario: Project 没有 Change
- **WHEN** Change read model 返回空集合
- **THEN** 项目详情 MUST 显示明确空状态
- **AND** MUST 保留创建 Change 的 Agent 入口

### Requirement: 本机应用必须管理多个已登记 Workspace
Buildr MUST 在现有 Workspace 产品能力中维护本机登记 root 列表，并 MUST 以各 root 的 `.buildr/workspace.yml` 作为 Workspace 信息的事实来源。

#### Scenario: 登记已有 Workspace
- **WHEN** 用户选择包含有效 canonical `.buildr/workspace.yml` 的目录进行登记
- **THEN** Application MUST 将规范化 root 原子加入本机登记列表
- **AND** 页面 MUST 使用目标 Workspace 的真实 id、name 和 description 展示该项
- **AND** 登记 MUST NOT 修改目标 Workspace

#### Scenario: 重复登记同一路径
- **WHEN** 用户再次登记已经存在的同一规范化 root
- **THEN** Application MUST 返回已有 Workspace 并保持登记列表幂等

#### Scenario: 移除 Workspace 登记
- **WHEN** 用户确认从 Buildr App 移除已登记 Workspace
- **THEN** Application MUST 只删除本机 root 记录
- **AND** MUST NOT 修改或删除目标目录及其中任何资产

#### Scenario: 已登记路径不可用
- **WHEN** 已登记 root 不存在、不可读取或不再包含有效 Workspace
- **THEN** 全局页面 MUST 显示可解释的不可用状态
- **AND** 其他已登记 Workspace MUST 继续可用

#### Scenario: Workspace identity 冲突
- **WHEN** 不同已登记 root 解析为相同 canonical Workspace id
- **THEN** Buildr MUST 报告 identity conflict
- **AND** MUST NOT 自动选择、合并或改写任一 Workspace

### Requirement: 全局应用必须通过已登记 Workspace 身份隔离请求
Buildr MUST 让 Workspace 内页面和 API 使用已登记 `workspaceId` 作为上下文，并 MUST 在调用既有 Application 用例前由 server 解析和重新验证真实 root。

#### Scenario: 访问已登记 Workspace
- **WHEN** 请求包含已登记且 identity 匹配的 `workspaceId`
- **THEN** HTTP interface MUST 只把该 Workspace 的 root 交给对应 Application 用例
- **AND** 返回结果 MUST NOT 混入其他 Workspace 的事实

#### Scenario: 普通请求提交路径
- **WHEN** Workspace、Project、Service 或 Change 请求包含 target、root、path 或其他 filesystem path
- **THEN** HTTP interface MUST 在读取或修改 Workspace 前拒绝请求

#### Scenario: 访问未知 Workspace
- **WHEN** 请求中的 `workspaceId` 未登记、不可用或与 root 中的 canonical identity 不匹配
- **THEN** HTTP interface MUST 返回稳定的不可用或冲突结果
- **AND** MUST NOT 回退到当前目录或其他 Workspace

### Requirement: 全局应用必须提供 Workspace 级应用外壳与路由
Buildr MUST 提供全局 Workspace 页面，并 MUST 在选定 Workspace 下提供原有概览、设置、Project、Service 和 Change 路由。

#### Scenario: 打开全局首页
- **WHEN** 用户打开根路由
- **THEN** 页面 MUST 展示全部已登记 Workspace 的真实身份和可用状态
- **AND** MUST 提供登记已有 Workspace、移除登记和进入 Workspace 的明确操作

#### Scenario: 进入 Workspace
- **WHEN** 用户选择一个可用 Workspace
- **THEN** 页面 MUST 导航到 `/workspaces/:workspaceId/` 下的 Workspace 概览
- **AND** Workspace 内导航 MUST 保持该 `workspaceId` 上下文

#### Scenario: 切换 Workspace
- **WHEN** 用户从 Workspace 内选择另一个已登记 Workspace
- **THEN** 页面 MUST 切换到目标 Workspace 的 canonical route
- **AND** MUST NOT 改变任一 Workspace 源资产

#### Scenario: 恢复最近使用项
- **WHEN** 全局实例启动且最近使用的 Workspace 仍可用
- **THEN** Buildr MUST 允许启动入口直接打开该 Workspace
- **AND** 最近使用状态 MUST NOT 写入 Workspace 源资产

### Requirement: Buildr App 必须以单实例本机 Web 服务运行
Buildr MUST 启动或复用一个只监听 loopback 的全局本机 Web 服务，并 MUST 在服务就绪后打开默认浏览器。

#### Scenario: 首次启动 App
- **WHEN** 当前用户没有健康的 Buildr App 实例
- **THEN** `buildr app` MUST 启动一个全局实例、记录可验证的 runtime state 并打开默认浏览器

#### Scenario: 重复启动 App
- **WHEN** 当前用户已经存在通过 Buildr health handshake 的实例
- **THEN** 启动入口 MUST 复用已有实例并重新打开浏览器
- **AND** MUST NOT 再启动一个 server

#### Scenario: 恢复陈旧实例状态
- **WHEN** runtime state 指向不存在或无法通过带实例 secret 的 health handshake 的进程
- **THEN** Buildr MUST 安全替换陈旧状态并启动新实例
- **AND** MUST 保留持久 Workspace 登记列表

#### Scenario: 开发环境不打开浏览器
- **WHEN** 调用方使用 `buildr app --no-open`
- **THEN** Buildr MUST 启动或复用实例但 MUST NOT 打开浏览器

#### Scenario: 兼容指定 Workspace 启动
- **WHEN** 调用方使用 `buildr app --target <workspace>`
- **THEN** Buildr MUST 验证并登记该 Workspace、启动或复用全局实例，并打开其 Workspace route

### Requirement: 普通用户必须能够启动和退出本机 Web 应用
Buildr MUST 提供无需用户理解命令行、端口或进程的可双击启动入口，并 MUST 在 Web 页面提供明确的安全退出操作。

#### Scenario: macOS 双击启动入口
- **WHEN** 普通用户双击已安装的 macOS `Buildr.app` launcher
- **THEN** launcher MUST 启动或复用 Buildr App 并在默认浏览器打开页面
- **AND** launcher MUST NOT 创建 Desktop WebView 或第二套 UI
- **AND** macOS application bundle MUST 声明并携带可识别的 Buildr application icon

#### Scenario: Windows 双击启动入口
- **WHEN** 普通用户点击 Windows 开始菜单或桌面的 Buildr 图标
- **THEN** Windows launcher MUST 启动或复用同一个 Buildr App 并在默认浏览器打开页面
- **AND** launcher MUST NOT 要求用户预先配置 Node、npm 或 PATH
- **AND** 桌面和开始菜单快捷方式 MUST 使用随包交付的 Buildr icon

#### Scenario: 关闭浏览器页面
- **WHEN** 用户关闭 Buildr 浏览器标签页或窗口
- **THEN** Buildr server MUST 继续运行
- **AND** 用户再次使用启动入口时 MUST 能重新打开已有实例

#### Scenario: 从页面退出 Buildr
- **WHEN** 当前同源页面携带有效 session 发起退出并得到用户确认
- **THEN** server MUST 停止接受新请求、清理当前 runtime state 并退出进程
- **AND** MUST 保留 Workspace 登记列表和所有 Workspace 源资产

#### Scenario: 非法退出请求
- **WHEN** 退出请求缺少有效 Origin、session token 或允许的请求格式
- **THEN** server MUST 拒绝退出并继续运行

### Requirement: 全局 Workspace 登记必须使用最小本机安全边界
Buildr MUST 将任意目录选择限制在显式登记用例中，并 MUST 保护登记文件和 Workspace 源资产不被普通 Web 请求越权访问。

#### Scenario: 合法登记请求
- **WHEN** 当前同源 session 通过受控目录选择或兼容 CLI 提供候选 root
- **THEN** Application MUST 在写登记列表前验证候选目录的 canonical Workspace identity

#### Scenario: 非法登记目录
- **WHEN** 候选目录不是有效 Buildr Workspace、不可读取或与已有 identity 冲突
- **THEN** Application MUST 拒绝登记或返回明确冲突
- **AND** 登记列表和候选目录 MUST 保持不变

#### Scenario: 并发修改登记列表
- **WHEN** 登记或移除请求携带的 registry revision 已过期
- **THEN** Application MUST 返回 conflict
- **AND** MUST NOT 覆盖另一页面或进程已经完成的修改
### Requirement: 平台安装必须提供完整且可解释的 Buildr App
Buildr MUST 为 macOS 和 Windows 提供不依赖用户预装 Node、npm 或 PATH 的平台安装产物，并 MUST 将安装、启动和后台常驻保持为不同动作。

#### Scenario: macOS 安装 Buildr App
- **WHEN** 普通用户完成 macOS 平台安装
- **THEN** 系统 MUST 提供带正确名称、图标、版本和独立 runtime 的 `Buildr.app` 启动入口
- **AND** 安装 MUST NOT 无提示启动 Buildr 或注册登录启动

#### Scenario: Windows 安装 Buildr App
- **WHEN** 普通用户完成 Windows 平台安装
- **THEN** 系统 MUST 提供带正确名称、图标、版本和独立 runtime 的开始菜单入口
- **AND** 桌面快捷方式 MUST 由安装选择明确决定
- **AND** 安装 MUST NOT 要求用户配置命令行环境

#### Scenario: 安装完成后显式打开
- **WHEN** 安装完成界面提供“打开 Buildr”且用户明确选择该动作
- **THEN** installer MUST 通过已安装 launcher 启动 Buildr
- **AND** 后续行为 MUST 与用户日常点击同一 launcher 一致

### Requirement: Buildr App 首次启动必须引导建立 Workspace 上下文
Buildr MUST 在用户级 Workspace Registry 为空时提供可理解的首次运行页面，并 MUST 复用全局 Web 应用而不是在 installer 中维护第二套 Workspace 流程。

#### Scenario: 选择已有 Workspace
- **WHEN** 首次运行用户选择一个包含合法 Buildr Workspace identity 的目录
- **THEN** Buildr MUST 登记该 Workspace 并进入其应用上下文
- **AND** MUST NOT复制或迁移 Workspace 源资产

#### Scenario: 选择无效目录
- **WHEN** 用户选择的目录不是可登记的 Buildr Workspace
- **THEN** Buildr MUST 保持 Registry 不变并显示可操作诊断
- **AND** 页面 MUST 提供重新选择和生成新 Workspace Agent Action 的入口

#### Scenario: 暂不登记 Workspace
- **WHEN** 用户选择稍后处理
- **THEN** Buildr MUST 保持全局应用可退出
- **AND** MUST NOT 创建虚构 Workspace 或自动扫描磁盘

### Requirement: Launcher 必须暴露可诊断的运行身份和失败反馈
Buildr launcher MUST 携带版本、channel、构建来源和平台 identity，并 MUST 在启动失败或版本不兼容时提供普通用户可见的反馈。

#### Scenario: Launcher 成功启动
- **WHEN** launcher 启动或复用兼容的 Buildr 单实例
- **THEN** launcher MUST 使用实例返回的实际 loopback URL 打开默认浏览器
- **AND** 随机端口 MUST 保持为内部状态而不是用户配置

#### Scenario: Launcher 启动失败
- **WHEN** runtime 缺失、bundle 不完整、实例未就绪或浏览器打开失败
- **THEN** launcher MUST 显示简短错误、日志位置和重新尝试动作
- **AND** MUST NOT 仅静默退出

#### Scenario: 已运行实例版本不兼容
- **WHEN** launcher 发现的现有实例与自身 App protocol 或 runtime identity 不兼容
- **THEN** launcher MUST 拒绝静默复用
- **AND** MUST 安全退出旧实例后启动当前版本，或明确告知用户阻塞原因

### Requirement: 开发 launcher 必须支持安全的重复构建和本机更新
Buildr MUST 为 development checkout 提供 canonical launcher 安装入口，并 MUST 使用 stage、verify、switch 流程更新独立的开发 launcher。

#### Scenario: 首次安装开发 launcher
- **WHEN** 开发者从 Buildr Service checkout 执行 canonical 开发 launcher 安装入口
- **THEN** Buildr MUST 在新 staging 目录构建带 checkout commit 和 dirty fingerprint 的 bundle
- **AND** MUST 验证 bundle 后安装为与正式版隔离的 `Buildr Dev` 入口
- **AND** macOS 默认目标 MUST 为 `/Applications/Buildr Dev.app`
- **AND** macOS launcher MUST 作为不驻留 Dock 的后台入口运行，本机服务生命周期不得表现为应用持续启动

#### Scenario: 更新正在使用的开发 launcher
- **WHEN** 已安装的开发 launcher 或其服务实例仍在使用旧 bundle
- **THEN** 更新流程 MUST 先构建并验证新版本，再安全退出旧实例并等待释放
- **AND** MUST NOT 原地覆盖运行中的 bundle

#### Scenario: 开发 launcher 切换失败
- **WHEN** 新 bundle 验证、退出、安装切换或启动核对失败
- **THEN** 更新流程 MUST 保留或恢复上一已验证版本
- **AND** MUST 返回失败阶段、旧版本状态、staging 位置和可执行恢复建议

#### Scenario: 开发 launcher 更新成功
- **WHEN** 新 bundle 已原子安装且可选启动核对通过
- **THEN** 诊断 MUST 显示新 bundle 的 checkout identity、安装目标和运行 identity
- **AND** 旧 staging 产物 MUST 按保留策略清理而不影响正式 Buildr App

### Requirement: Launcher 卸载必须保留用户工作资产
Buildr MUST 按安装渠道提供 launcher 卸载能力，并 MUST 默认保留 Workspace Registry、日志和全部 Workspace 源资产。

#### Scenario: 卸载官方 launcher
- **WHEN** 用户通过平台卸载入口移除 Buildr App
- **THEN** installer MUST 移除其拥有的 bundle、快捷方式和卸载登记
- **AND** MUST NOT 删除任何已登记 Workspace 或其中的源资产

#### Scenario: 清理开发 launcher
- **WHEN** 开发者执行 canonical 开发 launcher 清理入口
- **THEN** Buildr MUST 只停止并移除 development channel 拥有的实例、bundle、快捷方式和 staging 产物
- **AND** MUST NOT 修改正式 launcher、npm CLI 或 Workspace 源资产

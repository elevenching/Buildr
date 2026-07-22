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

### Requirement: 本地应用入口必须受限于单个 Workspace
Buildr MUST 提供 public `buildr app --target <workspace> [--port <port>]` 入口，并把一次应用进程固定到一个已初始化 Workspace。

#### Scenario: 启动本地应用
- **WHEN** 用户或 Agent 对有效 Buildr Workspace 运行 `buildr app --target <workspace>`
- **THEN** Buildr MUST 只监听 loopback 地址
- **AND** Buildr MUST 输出实际本地 URL 和目标 Workspace
- **AND** 省略端口时 Buildr MUST 选择可用端口

#### Scenario: 旧 Workspace 只读启动
- **WHEN** 目标 Workspace 有效但 canonical metadata 需要迁移
- **THEN** Buildr MUST 允许只读展示真实 Workspace 信息和迁移提示
- **AND** 应用启动 MUST NOT 静默修改目标目录
- **AND** 修改请求 MUST 在 Application mutation 前被拒绝

#### Scenario: 页面尝试切换目标目录
- **WHEN** 浏览器请求包含另一个 Workspace path 或任意 filesystem path
- **THEN** Buildr MUST 拒绝该请求
- **AND** 应用进程 MUST 继续只服务启动时固定的目标 Workspace

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

### Requirement: 本机应用必须提供固定 Workspace 的应用外壳与路由
Buildr MUST 为固定目标 Workspace 提供一致的 App Shell、主导航和可直接访问的页面路由，且路由切换不得改变应用进程绑定的 Workspace。

#### Scenario: 打开 Workspace 概览
- **WHEN** 用户打开 `/` 或通过主导航返回概览
- **THEN** 页面 MUST 在 App Shell 中展示当前 Workspace 概览
- **AND** 导航 MUST 将概览标识为当前页面

#### Scenario: 直接打开 Workspace 设置
- **WHEN** 用户直接访问或刷新 `/settings/workspace`
- **THEN** HTTP interface MUST 返回带当前 session token 的本机应用 shell
- **AND** 客户端 MUST 渲染当前 Workspace 设置

#### Scenario: 浏览器历史导航
- **WHEN** 用户在本机应用页面之间导航后使用浏览器前进或后退
- **THEN** 应用 MUST 根据当前 URL 恢复对应页面
- **AND** MUST NOT 重载或切换目标 Workspace

#### Scenario: 展开与折叠资源导航
- **WHEN** 用户操作主导航中的“资源”分组
- **THEN** 应用 MUST 允许展开或折叠该分组
- **AND** 展开状态 MUST 明确列出“项目”和“服务”子入口
- **AND** 折叠操作 MUST NOT 改变当前工作空间或任何源资产

#### Scenario: 从资源子入口进入独立视图
- **WHEN** 用户选择“项目”或“服务”子入口
- **THEN** 应用 MUST 分别打开项目或服务独立视图
- **AND** 两类资源 MUST NOT 通过同一页面中的区段定位来模拟独立导航

#### Scenario: 未知页面路由
- **WHEN** 用户请求未声明的页面路径或任意未知静态资源
- **THEN** HTTP interface MUST 返回 not found
- **AND** MUST NOT 用应用 shell 掩盖未知 API 或资源错误

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

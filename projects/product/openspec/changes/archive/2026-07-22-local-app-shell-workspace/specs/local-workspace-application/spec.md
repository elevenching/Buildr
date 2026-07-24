## ADDED Requirements

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
Buildr MUST 为项目与服务提供独立管理视图，且二者现有 read、metadata update、diagnostic 和 prompt-only 行为 MUST 保持可用。

#### Scenario: 打开项目视图
- **WHEN** 用户访问 `/projects`
- **THEN** 页面 MUST 只展示当前工作空间的项目列表与选中项目详情
- **AND** MUST NOT 同时渲染服务管理内容

#### Scenario: 打开服务视图
- **WHEN** 用户访问 `/services`
- **THEN** 页面 MUST 明确展示当前所属项目并只列出该项目的服务
- **AND** 用户 MUST 能切换已登记项目来查看对应服务

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

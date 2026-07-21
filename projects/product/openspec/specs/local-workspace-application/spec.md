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

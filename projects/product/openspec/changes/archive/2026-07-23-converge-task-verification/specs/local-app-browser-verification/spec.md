## MODIFIED Requirements

### Requirement: 浏览器冒烟验证必须覆盖三个资源管理主流程
Buildr Product MUST 将本机应用浏览器验证作为 integration 测试，并 MUST 提供 Project、Service、Change 与 Shell 四个稳定、可独立选择的流程；共享 fixture MAY 复用，但任一局部改动 MUST NOT 因单体测试结构被迫执行无关资源流程。

#### Scenario: 验证 Project 流程
- **WHEN** changed planner 识别 Project 列表、详情、保存或相关用户操作受到影响
- **THEN** 验证 MUST 只选择 Project browser integration 及其真实依赖
- **AND** MUST NOT 因此自动执行 Service 或 Change browser integration

#### Scenario: 验证 Service 流程
- **WHEN** changed planner 识别 Service 过滤、详情、保存或相关用户操作受到影响
- **THEN** 验证 MUST 只选择 Service browser integration 及其真实依赖
- **AND** MUST NOT 因此自动执行 Project 或 Change browser integration

#### Scenario: 验证 Change 流程
- **WHEN** changed planner 识别 Change 过滤、详情或 Agent Action 用户路径受到影响
- **THEN** 验证 MUST 只选择 Change browser integration 及其真实依赖
- **AND** MUST 继续证明 Agent Action 只生成 prompt、不直接修改 Change 文件

#### Scenario: 验证 Shell 流程
- **WHEN** app bootstrap、router、公共导航或全局浏览器错误处理受到影响
- **THEN** 验证 MUST 选择 Shell browser integration
- **AND** 只有具体资源流程也受到影响时才 MUST 组合对应 Project、Service 或 Change browser integration

### Requirement: 浏览器冒烟能力必须提供可诊断结果并渐进成熟
Buildr Product MUST 使用机器已有 Chrome/Chromium、随机 loopback 端口和独立临时 Workspace 执行 browser integration，并 MUST 在环境与稳定性未确认前保持非阻断成熟度；本次执行能力拆分 MUST NOT 自动修改 Project `verification.yml` 的 maturity 或 enforcement。

#### Scenario: 浏览器环境可用
- **WHEN** 环境具备 Node、npm 和受支持的 Chrome/Chromium 可执行文件
- **THEN** 验证 MUST 自动创建隔离 fixture、收集 `pageerror` 与 `console.error`、关闭浏览器和服务器并清理测试拥有的临时目录

#### Scenario: 浏览器环境不可用
- **WHEN** 无法解析或启动受支持的浏览器
- **THEN** 验证 MUST 明确失败或由编排标记为环境阻塞
- **AND** MUST NOT 下载浏览器、访问外部系统或回退操作真实 Workspace

#### Scenario: 暂不更新测试声明
- **WHEN** 本 change 交付 browser selector、registry step 和测试实现
- **THEN** `projects/product/verification.yml` MUST 保持内容不变
- **AND** browser capability 的声明拆分、成熟度或门禁调整 MUST 等待后续团队确认

## ADDED Requirements

### Requirement: Browser 与低层 integration 必须保持职责互补
Buildr Product MUST 由快速检查或 HTTP integration 持有 API 参数、状态、session、revision、路径和错误分支，并 MUST 由 browser integration 持有用户可见接线、路由、DOM 交互与浏览器运行错误；同一行为没有不同边界价值时 MUST NOT 通过读取前端实现源码文本重复断言。

#### Scenario: 只修改底层 API 行为
- **WHEN** 改动只影响已有低层 owner 覆盖的 API handler、参数或响应映射，且用户可见接线不变
- **THEN** changed planner MUST 选择对应快速检查或 HTTP integration
- **AND** MUST NOT 仅因文件位于 local-app 子树而自动选择整页 browser integration

#### Scenario: 修改用户可见接线
- **WHEN** 改动影响按钮绑定、路由目标、DOM 状态或用户操作结果
- **THEN** changed planner MUST 选择对应资源 browser integration
- **AND** browser MUST 使用真实交互和可见结果断言，不得以实现源码包含特定函数调用文本作为替代

## Context

Buildr 当前有两种可执行形态：npm 安装的 CLI 可以运行 `buildr app`，平台 launcher bundle 则携带 Node runtime 和 Web 资源，通过图标启动同一个本机 Web 应用。二者尚未形成正式安装生命周期；launcher 构建器只生成目录，普通用户需要人工放置，开发者更新 launcher 时也容易直接覆盖仍在运行的 `.app`，造成资源混用、启动无反馈或文件锁问题。

本设计覆盖 CLI package、平台 launcher、单实例状态、Workspace Registry 和发布验证，必须同时适用于 macOS 与 Windows。

## Goals / Non-Goals

**Goals:**

- 让不使用命令行的用户通过平台安装产物获得图标、独立 runtime 和可见的首次启动流程。
- 让 Agent-facing 安装默认一次完成 CLI 与 launcher，同时保持底层安装事实可独立诊断和修复。
- 让官方 launcher 与开发 launcher 都携带可诊断的版本和来源身份。
- 为开发 checkout 提供一条可重复执行的安全更新命令，避免原地覆盖运行中的 bundle。
- 让安装、更新、卸载和失败恢复可自动验证。

**Non-Goals:**

- 不提供 Desktop WebView、系统托盘、登录启动、自动后台常驻或远程服务。
- 不要求图形用户安装 npm、Node 或配置 PATH。
- 不让系统 installer 修改 Workspace 源资产；Workspace 仍在首次运行时由用户选择、登记或交给 Agent 创建。
- 不在本 change 中建立静默自动更新服务。

## Decisions

### 1. Agent-facing 安装组合两个交付渠道

Buildr 底层保留平台 launcher 与 npm CLI 两个交付渠道，但提供 canonical 统一安装入口。用户要求 Agent“安装 Buildr”时，Agent 默认调用该入口同时安装 CLI 和当前平台 launcher，并分别验证命令、系统图标与版本身份；单项安装只作为显式修复或高级场景。图形产物继续服务没有 Node 的普通用户。

统一入口负责组合两个 owner，不让 npm lifecycle hook 隐式写入 Applications 或开始菜单。这样既符合“安装 Buildr”的用户心智，也保留权限提示、失败归因和单项恢复能力。

开发 checkout 使用同一组合模型：canonical 开发准备入口同时把 CLI 链接到当前 checkout，并安全安装隔离的 `Buildr Dev`。launcher 相关实现变化后重复执行该入口即可更新两者。

### 2. 安装不等于启动或常驻

系统安装只放置 bundle、快捷方式和卸载信息。安装完成界面可以提供显式“打开 Buildr”，但不得无提示启动进程；Buildr 也不注册登录启动。用户首次点击后，launcher 启动或复用随机 loopback 端口上的单实例并打开默认浏览器。

随机端口继续作为内部实现，launcher 通过单实例状态获得实际 URL，用户界面和安装契约不暴露固定端口。

### 3. 首次运行在 Web 中收敛

首次运行若 Registry 为空，显示选择已有 Workspace、生成新 Workspace Agent Action 和稍后处理三个明确入口。选择目录后才登记；无效目录保持零写入并显示恢复建议。Registry 已有内容时直接进入全局 Workspace Catalog。

这样 macOS、Windows 与 CLI 启动共用同一首次运行状态机，不在 installer 中复制 Workspace 逻辑。

### 4. Launcher bundle 必须自描述并提供可见失败

每个 bundle 写入 Buildr 版本、构建来源、构建 identity、平台和构建时间；运行日志放入用户可定位的 Buildr 日志目录。启动失败时平台入口必须显示短错误和日志位置，成功时不弹出额外窗口。

官方 bundle 标记 `release` 来源；开发 bundle 标记 checkout commit、dirty/fingerprint 和 `development` channel。单实例发现到不兼容版本时不得静默复用，必须先安全退出旧实例或给出明确阻塞。

### 5. 开发 launcher 使用 stage、verify、switch 流程

Service 提供单一开发入口，例如 `npm run launcher:install:dev`，内部完成：

1. 从当前 checkout 构建到新的版本化 staging 目录，禁止把输出目录指向当前安装目标。
2. 对 staging bundle 执行结构、runtime、图标、来源 identity 和无浏览器模式启动检查。
3. 检查已安装开发 launcher 与当前单实例；如旧实例正在使用旧 bundle，先通过受保护的退出能力停止并等待，不能直接覆盖。
4. 将 staging bundle 原子切换到独立的开发目标：macOS 使用 `/Applications/Buildr Dev.app`，Windows 使用当前用户 LocalAppData Programs 下独立的 Buildr Dev 目录和快捷方式。官方 `Buildr` 安装不被开发命令覆盖。
5. 保留一个已验证的上一版本用于失败回滚；切换后可选择启动新版本并核对 health/identity。

备选方案是原地执行 `cp -R`。它会让运行进程读取到混合版本资源，并在 Windows 遇到文件锁，因此明确禁止。

### 6. 更新和卸载按渠道负责

官方图形安装由平台 installer 更新和卸载；npm CLI 继续由 npm/`buildr update` 管理；开发 launcher 由开发安装命令更新并提供对应清理命令。卸载 launcher 默认保留 Workspace Registry、日志和所有 Workspace 源资产，并明确提供可选的本机状态清理动作。

### 7. Buildr Skill 由 Workspace 生命周期负责

全局安装时尚无可靠的目标 Workspace、Agent 或 runtime destination，因此统一安装入口不得向任意 Agent runtime 写入 Buildr Skill。`buildr init --agent <agent>` 在目标 Workspace 首次安装源资产并投射 Buildr Skill；`buildr sync <agent>` 更新源资产并收敛 runtime；`buildr render <agent>` 从已有源资产重建投射。安装完成页或全局 App 只引导用户选择/创建 Workspace，不复制 Skill 安装逻辑。

## Risks / Trade-offs

- [两个渠道可能版本不同] → 在页面和诊断输出中展示实际 launcher/CLI/App identity，不以 PATH 猜测当前运行来源。
- [退出旧实例会中断已打开页面] → 更新前给出明确状态，等待安全退出完成后再切换；失败则保留旧安装。
- [平台签名、公证或 SmartScreen 尚未接入] → 把签名作为官方发布产物的独立门禁；开发 launcher 使用明确的 development identity，不伪装正式签名。
- [开发安装脚本具有本机写权限] → 默认只写用户级应用目录；写系统级目录必须显式请求权限并在写入前报告目标。
- [随机端口让地址不稳定] → 由单实例状态与 launcher 解析 URL；不把端口作为用户配置或持久产品身份。

## Migration Plan

1. 先为现有 launcher 写入 identity 与日志契约，并保持现有双击行为兼容。
2. 增加开发 launcher 的 stage/verify/switch/rollback 工具与测试，开发目标使用独立名称。
3. 增加组合 CLI 与 launcher 的 Agent-facing 统一安装入口，以及 macOS、Windows 官方安装和卸载产物，再接入发布候选验证。
4. 更新公开安装文档，分别说明图形用户、Agent/CLI 用户和 Buildr 开发者路径。
5. 现有手工复制的 launcher 可以由新 installer 覆盖；更新失败时回滚到安装前或上一已验证版本。

## Open Questions

- 正式发布阶段采用 macOS DMG/PKG 与 Windows MSI/EXE 中的具体容器，由实现阶段结合签名和发布基础设施选择；无论选择哪种容器，都必须满足本 change 的安装生命周期契约。
- 首批发布是否启用平台签名与公证，可以独立形成发布 change，但未签名状态必须在交付说明中如实披露。

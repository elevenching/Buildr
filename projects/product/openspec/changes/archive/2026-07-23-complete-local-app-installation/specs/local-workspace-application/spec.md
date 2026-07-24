## ADDED Requirements

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

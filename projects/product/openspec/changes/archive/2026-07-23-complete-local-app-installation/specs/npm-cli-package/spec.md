## ADDED Requirements

### Requirement: CLI 与平台 Launcher 必须共享产品身份但保持安装事实独立
Buildr MUST 让 npm CLI、官方平台 launcher 和开发 launcher 共享可比较的产品版本与 App protocol identity，并 MUST 分别报告各渠道真实的安装来源和位置。

#### Scenario: Agent 安装 Buildr
- **WHEN** 用户要求 Agent 在受支持的 macOS 或 Windows 主机安装 Buildr，且未明确限制安装范围
- **THEN** Agent MUST 使用 canonical 统一安装入口同时安装 CLI 与对应平台 launcher
- **AND** MUST 分别验证 `buildr` 命令、系统图标入口、版本身份和启动能力
- **AND** 任一部分失败时 MUST 报告部分完成状态和精确恢复动作

#### Scenario: 只安装 npm CLI
- **WHEN** 调用方显式选择只安装 npm CLI 作为修复或高级安装动作
- **THEN** `buildr app` MUST 可以启动或复用本机 Web 应用
- **AND** Buildr MUST NOT 声称系统 Applications、开始菜单或桌面 launcher 已安装

#### Scenario: 只安装平台 Launcher
- **WHEN** 普通用户安装携带 runtime 的平台 launcher
- **THEN** 用户 MUST 能通过图标运行 Buildr App
- **AND** launcher MUST NOT 要求或声称 PATH 中存在 `buildr` 命令

#### Scenario: 多渠道同时存在
- **WHEN** CLI、官方 launcher 或开发 launcher 的多个版本同时存在
- **THEN** Buildr 诊断 MUST 分开展示各安装来源、版本、位置和当前运行实例身份
- **AND** MUST NOT 仅根据 PATH 或文件名猜测当前 App 来源

#### Scenario: 开发者准备 Buildr checkout
- **WHEN** 开发者从 Buildr Service checkout 执行 canonical 开发准备入口
- **THEN** Buildr MUST 同时将开发 CLI 指向当前 checkout，并安装或更新隔离的 `Buildr Dev` launcher
- **AND** MUST 分别验证两个入口都来自同一 checkout identity

### Requirement: Buildr Skill 必须由目标 Workspace 生命周期投射
Buildr 全局安装 MUST NOT 猜测 Agent runtime destination 或安装 Buildr Skill；Buildr Skill MUST 由目标 Workspace 的 `init`、`sync` 或 `render` 生命周期管理。

#### Scenario: 全局安装尚无 Workspace
- **WHEN** canonical 安装入口完成 CLI 与 launcher 安装，但用户尚未选择目标 Workspace 和 Agent
- **THEN** Buildr MUST NOT 修改任意 Agent runtime Skill 目录
- **AND** MUST 引导用户选择、登记或初始化 Workspace

#### Scenario: 初始化目标 Workspace
- **WHEN** Agent 执行 `buildr init --agent <agent>` 初始化目标 Workspace
- **THEN** Buildr MUST 安装 Workspace 源资产并将 Buildr Skill 首次投射到指定 Agent runtime
- **AND** 最终 doctor MUST 验证投射状态

#### Scenario: 收敛已有 Workspace runtime
- **WHEN** Agent 对已有 Workspace 执行 `buildr sync <agent>` 或 `buildr render <agent>`
- **THEN** Buildr MUST 从该 Workspace 的受管源资产更新或重建指定 Agent runtime
- **AND** 全局 CLI 与 launcher 安装状态 MUST NOT 被该动作隐式改变

### Requirement: 各安装渠道必须拥有明确的更新责任
Buildr MUST 让 npm、平台 installer 和开发 launcher 工具只更新各自拥有的安装，并 MUST 在跨渠道版本不一致时提供可解释诊断。

#### Scenario: 更新 npm CLI
- **WHEN** registry 安装的 CLI 执行 `buildr update`
- **THEN** Buildr MUST 只更新同一 npm package 安装
- **AND** MUST NOT 静默覆盖平台或开发 launcher bundle

#### Scenario: 更新官方平台 Launcher
- **WHEN** 用户运行官方平台 installer 的新版本
- **THEN** installer MUST 更新正式 launcher 并保留用户级 Workspace Registry
- **AND** MUST NOT 覆盖 `Buildr Dev` 或改变 npm prefix

#### Scenario: 更新开发 Launcher
- **WHEN** 开发 checkout 执行 canonical launcher 更新入口
- **THEN** Buildr MUST 从当前 checkout 构建 development identity
- **AND** MUST 只切换 development channel 的本机安装

### Requirement: Launcher 发布产物必须接受安装生命周期验证
Buildr product Candidate MUST 验证 macOS 和 Windows launcher 的结构、identity、安装、首次启动、重复更新、回滚与卸载边界。

#### Scenario: 验证平台安装产物
- **WHEN** Product Candidate 构建 launcher 发布产物
- **THEN** verification MUST 证明 bundle 包含匹配版本的 runtime、应用依赖、Web 资源、图标和安装 metadata
- **AND** MUST 证明启动不依赖 development checkout、系统 Node 或 PATH

#### Scenario: 验证开发替换流程
- **WHEN** verification 模拟连续安装两个不同 checkout identity 的开发 launcher
- **THEN** verification MUST 证明新版本在独立 staging 通过后才替换旧版本
- **AND** MUST 证明运行中覆盖被阻止、失败可回滚且正式 launcher 保持不变

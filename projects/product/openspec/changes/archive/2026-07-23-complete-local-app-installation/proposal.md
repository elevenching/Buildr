## Why

Buildr 已具备全局本机 Web 应用和 macOS、Windows launcher，但 CLI 安装、系统 launcher 安装、首次启动与开发版 launcher 更新仍是分散动作，普通用户无法获得完整安装体验，开发者也缺少安全替换正在使用的本机 launcher 的标准流程。现在需要把这些入口收敛为可交付、可更新、可验证的完整生命周期。

## What Changes

- 提供 Agent-facing 统一安装入口：用户要求 Agent“安装 Buildr”时，默认同时安装 CLI 与对应平台 launcher，并验证两个入口；图形安装产物仍允许不使用终端的普通用户独立安装。
- 明确安装与启动分离：安装完成后可以显式首次打开，但不注册登录启动或长期后台常驻；后续由 launcher 或 `buildr app` 启动或复用单实例。
- 让首次启动完成 Workspace 选择、登记或创建引导，并为失败提供可见反馈、日志与恢复动作。
- 建立 launcher 与 CLI/package 的版本、更新和卸载边界，避免两套独立且不可解释的 Buildr 安装状态。
- 明确 Buildr Skill 不属于全局软件安装；它只在目标 Workspace `init` 时首次投射，并由后续 `sync` 或 `render` 收敛到指定 Agent runtime。
- 提供开发 checkout 的 launcher 工作流：构建带来源和版本身份的新产物、在独立临时位置验证、停止或切换旧实例后原子安装到开发目标，并支持重复更新与回滚。
- 为 macOS 与 Windows 补齐安装、首次启动、更新、卸载和开发替换的自动验证边界。
- 不引入 Desktop WebView、登录启动或系统托盘常驻；本次没有破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `local-workspace-application`: 扩展普通用户 launcher 的安装、首次启动、可见失败、版本更新、卸载和开发替换契约。
- `npm-cli-package`: 明确 CLI package、系统 launcher bundle 与开发 checkout 之间的交付身份、安装入口和更新关系。

## Impact

- 影响 Buildr launcher 构建器、统一安装脚本、系统安装脚本、CLI 安装/更新入口、Buildr Skill 指引、本机单实例状态与用户级 Workspace Registry。
- 影响 macOS `.app` 和 Windows bundle/快捷方式的打包、版本 metadata、日志、卸载及发布产物。
- 需要新增安装生命周期测试、launcher 更新测试、开发 checkout 替换测试和发布候选验证。

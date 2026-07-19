# npm CLI package 规范

## Purpose

定义 Buildr CLI 作为 npm package 本地打包、安装和验证的行为，确保用户不依赖开发 checkout 也能通过安装后的 `buildr` 命令完成 Buildr workspace onboarding。
## Requirements
### Requirement: npm tarball exposes buildr command
Buildr MUST 在 product root 下提供 npm package metadata，使维护者能够创建暴露 `buildr` executable command 的本地 npm tarball。

#### Scenario: Build local tarball
- **WHEN** a maintainer runs `npm pack` from the Buildr product root
- **THEN** npm MUST create a tarball for the Buildr CLI package
- **AND** the tarball MUST declare a `buildr` bin entry

#### Scenario: Install tarball locally
- **WHEN** a user installs the tarball with `npm install -g ./<tarball>` or an equivalent temporary `--prefix`
- **THEN** the installed environment MUST provide an executable `buildr` command

### Requirement: installed CLI uses package assets
已安装的 `buildr` command MUST 使用 npm package 中包含的 assets，而不是要求访问 development checkout。

#### Scenario: Initialize workspace from installed command
- **WHEN** the installed `buildr` command runs `buildr init --target <dir> --name <name> --profile <profile>`
- **THEN** Buildr MUST create the default workspace baseline from the package assets
- **AND** the workspace MUST NOT require files outside the installed npm package

#### Scenario: Complete onboarding from installed command
- **WHEN** the installed `buildr` command runs `buildr init --agent <agent> --target <dir> --name <name> --profile <profile>`
- **THEN** Buildr MUST create the workspace baseline, install the product Buildr Skill, reconcile the selected Agent runtime, and run final doctor using only packaged assets
- **AND** the command MUST behave consistently with the checkout-based CLI for the same inputs

#### Scenario: Run onboarding commands from installed command
- **WHEN** the installed `buildr` command runs `project create`, `service create`, `doctor`, `sync`, `runtime check`, `rules render`, `skills render`, `package check`, and `bootstrap guide`
- **THEN** each command MUST behave consistently with the checkout-based CLI for the same inputs

### Requirement: npm package excludes private workspace assets
Buildr npm package MUST 仅包含已安装命令所需的 product CLI 和明确可发布的 product assets。

#### Scenario: Inspect packed file list
- **WHEN** verification inspects the `npm pack --json` file list
- **THEN** the package MUST include product package metadata, CLI tools, package assets, and publishable rules
- **AND** the package MUST NOT include private business projects, root workspace rules, local runtime directories, or service repositories

### Requirement: product verification covers npm installation
Buildr product verification MUST 测试从 product root 开始的 npm package installation path，并证明安装后的单命令 onboarding 可用。

#### Scenario: Verify installed package
- **WHEN** standalone release smoke 或完整 Candidate verification 从 Buildr product root 验证正式 tarball 生命周期
- **THEN** release smoke MUST pack Buildr npm package 或复用该次 Candidate 提供的不可变 tarball，安装到临时 prefix，并执行安装后的 `buildr` command
- **AND** release smoke MUST 使用 `buildr init --agent <agent>`、独立 `sync` 和 `doctor --json` 证明核心 onboarding loop 与最终 runtime 状态有效
- **AND** Workspace E2E MUST NOT 重复持有 tarball inventory 或安装后 lifecycle

### Requirement: npm package 具备公开发布基线 metadata
Buildr npm package MUST 声明非占位版本、开源 License、可执行 bin、Node engine 和运行依赖，并且 MUST NOT 使用阻止打包发布的 private 状态。

#### Scenario: 检查公开 package metadata
- **WHEN** 维护者从 product root 运行 `npm pack --dry-run --json`
- **THEN** package identity MUST 使用非 `0.0.0` 的语义版本
- **AND** package metadata MUST 声明开源 License
- **AND** package MUST 允许公开打包
- **AND** tarball MUST 包含 License、CLI runtime modules 和 package assets

#### Scenario: npm package 安装后由 Agent 使用
- **WHEN** Agent 安装本地 tarball 或后续公开 registry package
- **THEN** 已安装的 `buildr` MUST 能列出 runtime，并用 `buildr init --agent <agent>` 完成 workspace 初始化、runtime reconcile 与最终 doctor
- **AND** 已安装 package MUST 继续支持独立 `sync <agent>` 和 `doctor --agent <agent> --json` 维护已有 workspace
- **AND** 已安装 package MUST NOT 依赖 development checkout 或仓库级验证脚本

### Requirement: registry package 支持 CLI 自更新
从支持的 npm registry 安装的 Buildr package MUST 支持 `buildr update` 检查和更新同一 package identity，且不得隐式维护 workspace。

#### Scenario: 检查 registry 更新
- **WHEN** registry 安装的 CLI 运行 `buildr update check --json`
- **THEN** Buildr MUST 查询当前配置 registry 中同一 package identity 的可用版本
- **AND** Buildr MUST NOT 修改 package、workspace 或 Agent runtime

#### Scenario: 更新 registry package
- **WHEN** registry 安装的 CLI 运行 `buildr update` 且存在可安全安装的新版本
- **THEN** Buildr MUST 更新承载当前 executable 的 package
- **AND** Buildr MUST 保持安装 prefix、registry、scope 和 tag
- **AND** Buildr MUST NOT 执行 workspace sync 或 doctor

#### Scenario: registry update 回归验证
- **WHEN** 产品验证构造包含旧版与新版 Buildr package 的临时 registry 或等价隔离 fixture
- **THEN** verifier MUST 证明旧版 installed executable 能检查并更新到新版
- **AND** verifier MUST 证明更新动作没有修改测试 workspace，后续显式 sync 才完成 workspace reconcile

### Requirement: 公开 registry package identity 必须稳定
Buildr 公开 npm package MUST 使用 `@buildr-ai/buildr` identity、`buildr` executable 和指向 `https://github.com/elevenching/Buildr` 的完整 registry metadata。

#### Scenario: 检查准备发布的 package
- **WHEN** 维护者运行 package check 或 `npm pack --json`
- **THEN** package name MUST 是 `@buildr-ai/buildr`
- **AND** repository、homepage 和 bugs MUST 指向 canonical GitHub repository
- **AND** `publishConfig.access` MUST 是 `public`
- **AND** package MUST 声明用于发现 CLI、Agent workspace 和开发工具的 keywords

### Requirement: npm 版本必须映射明确 dist-tag
Buildr release automation MUST 将 prerelease 版本发布到 `next`，将稳定版本发布到 `latest`，并 MUST 拒绝 tag 与 package version 不一致的候选。

#### Scenario: 发布 0.1.0 RC
- **WHEN** package version 是 `0.1.0-rc.1` 且 Git tag 是 `v0.1.0-rc.1`
- **THEN** release automation MUST 选择 npm dist-tag `next`

#### Scenario: 发布 0.1.0 正式版
- **WHEN** package version 是 `0.1.0` 且 Git tag 是 `v0.1.0`
- **THEN** release automation MUST 选择 npm dist-tag `latest`

#### Scenario: tag 与 package version 不一致
- **WHEN** release tag 去除 `v` 后不等于 `package.json#version`
- **THEN** release automation MUST 在 npm publish 前失败

## MODIFIED Requirements

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

### Requirement: product verification covers npm installation
Buildr product verification MUST 测试从 product root 开始的 npm package installation path，并证明安装后的单命令 onboarding 可用。

#### Scenario: Verify installed package
- **WHEN** `tools/verify-buildr-product-mvp` runs from the Buildr product root
- **THEN** it MUST pack the Buildr npm package from the product root, install it into a temporary prefix, execute the installed `buildr` command, and use `buildr init --agent <agent>` to verify the core onboarding loop succeeds
- **AND** verification MUST inspect final doctor state and runtime artifacts

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

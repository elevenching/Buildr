## ADDED Requirements

### Requirement: npm tarball 暴露 buildr 命令
Buildr MUST 提供 npm package metadata，使维护者能够创建暴露 `buildr` 可执行命令的本地 npm tarball。

#### Scenario: 构建本地 tarball
- **WHEN** 维护者从 Buildr 根目录运行 `npm pack`
- **THEN** npm MUST 创建 Buildr CLI package 的 tarball
- **AND** tarball MUST 声明 `buildr` bin entry

#### Scenario: 本地安装 tarball
- **WHEN** 用户使用 `npm install -g ./<tarball>` 或等价的临时 `--prefix` 安装 tarball
- **THEN** 安装后的环境 MUST 提供可执行的 `buildr` 命令

### Requirement: 已安装 CLI 使用 package assets
已安装的 `buildr` 命令 MUST 使用 npm package 中包含的 assets，而不是要求访问开发 checkout。

#### Scenario: 从已安装命令初始化 workspace
- **WHEN** 已安装的 `buildr` 命令运行 `buildr init --target <dir> --name <name> --profile <profile>`
- **THEN** Buildr MUST 从 package assets 创建默认 workspace baseline
- **AND** workspace MUST NOT 要求已安装 npm package 之外的文件

#### Scenario: 从已安装命令运行 onboarding commands
- **WHEN** 已安装的 `buildr` 命令运行 `project create`、`service create`、`doctor`、`runtime check`、`rules render`、`skills render`、`package check` 和 `bootstrap guide`
- **THEN** 每个命令对相同输入 MUST 与 checkout-based CLI 的行为保持一致

### Requirement: npm package 排除私有 workspace assets
Buildr npm package MUST 仅包含 CLI 和已安装命令所需的明确可发布 assets。

#### Scenario: 检查 packed file list
- **WHEN** verification 检查 `npm pack --json` file list
- **THEN** package MUST 包含 `buildr`、CLI tools、package assets 和可发布 rules
- **AND** package MUST NOT 包含私有业务 projects、`rules/AGENTS.acme.md`、本地 runtime directories 或 service repositories

### Requirement: product verification 覆盖 npm installation
Buildr product verification MUST 测试 npm package installation path。

#### Scenario: 验证已安装 package
- **WHEN** `product/tools/verify-buildr-product-mvp` 运行
- **THEN** 它 MUST 打包 Buildr npm package、将其安装到临时 prefix、执行已安装的 `buildr` 命令，并验证核心 onboarding loop 成功

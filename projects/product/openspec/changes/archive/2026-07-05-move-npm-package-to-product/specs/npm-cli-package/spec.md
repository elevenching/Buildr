## MODIFIED Requirements

### Requirement: npm tarball 暴露 buildr 命令
Buildr MUST 在 product root 下提供 npm package metadata，使维护者能够创建暴露 `buildr` 可执行命令的本地 npm tarball。

#### Scenario: 构建本地 tarball
- **WHEN** 维护者从 Buildr product root 运行 `npm pack`
- **THEN** npm MUST 创建 Buildr CLI package 的 tarball
- **AND** tarball MUST 声明 `buildr` bin entry

#### Scenario: 本地安装 tarball
- **WHEN** 用户使用 `npm install -g ./<tarball>` 或等价的临时 `--prefix` 安装 tarball
- **THEN** 安装后的环境 MUST 提供可执行的 `buildr` 命令

### Requirement: npm package 排除私有 workspace assets
Buildr npm package MUST 仅包含已安装命令所需的 product CLI 和明确可发布 product assets。

#### Scenario: 检查 packed file list
- **WHEN** verification 检查 `npm pack --json` file list
- **THEN** package MUST 包含 product package metadata、CLI tools、package assets 和可发布 rules
- **AND** package MUST NOT 包含私有业务 projects、root workspace rules、本地 runtime directories 或 service repositories

### Requirement: product verification 覆盖 npm installation
Buildr product verification MUST 测试从 product root 开始的 npm package installation path。

#### Scenario: 验证已安装 package
- **WHEN** `product/tools/verify-buildr-product-mvp` 运行
- **THEN** 它 MUST 从 `product/` 打包 Buildr npm package、将其安装到临时 prefix、执行已安装的 `buildr` 命令，并验证核心 onboarding loop 成功

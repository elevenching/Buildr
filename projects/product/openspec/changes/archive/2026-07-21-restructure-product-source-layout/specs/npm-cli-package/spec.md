## MODIFIED Requirements

### Requirement: npm tarball exposes buildr command
Buildr MUST 在 Product root 下提供 npm package metadata，使维护者能够创建以 `bin/buildr.mjs` 暴露 `buildr` executable command 的本地 npm tarball。

#### Scenario: Build local tarball
- **WHEN** a maintainer runs `npm pack` from the Buildr product root
- **THEN** npm MUST create a tarball for the Buildr CLI package
- **AND** the tarball MUST declare `buildr` bin as `bin/buildr.mjs`
- **AND** the bin MUST delegate to the packaged `src/interfaces/cli` implementation

#### Scenario: Install tarball locally
- **WHEN** a user installs the tarball with `npm install -g ./<tarball>` or an equivalent temporary `--prefix`
- **THEN** the installed environment MUST provide an executable `buildr` command
- **AND** the executable MUST NOT require `tools/`, `test/` or `scripts/`

### Requirement: npm package excludes private workspace assets
Buildr npm package MUST 仅包含已安装命令所需的 `bin/`、产品 `src/` runtime、明确可发布的文档和 `package/` 交付资产，并 MUST 排除仓库测试、维护脚本、active changes 和私有 Workspace 内容。

#### Scenario: Inspect packed file list
- **WHEN** verification inspects the `npm pack --json` file list
- **THEN** the package MUST include package metadata、`bin/buildr.mjs`、安装后可达的 `src/` dependency closure、package assets 和 publishable docs
- **AND** the package MUST NOT include `test/`、`scripts/`、`tools/`、active OpenSpec changes、private business projects、root workspace rules、local runtime directories or service repositories

#### Scenario: Product verifier belongs to installed runtime
- **WHEN** `buildr package check` or another installed command requires a verifier
- **THEN** that verifier MUST be owned by `src/` and included in the runtime dependency closure
- **AND** package metadata MUST NOT include `test/verification/` merely to satisfy an installed command dependency

## ADDED Requirements

### Requirement: npm runtime inventory 必须与源码生命周期边界一致
Buildr package inventory MUST 从静态入口和 import graph证明安装后命令的完整依赖闭包，并 MUST 将 checkout-only tests、verification orchestration 和 maintenance scripts 排除在 runtime inventory 之外。

#### Scenario: Verify candidate tarball inventory
- **WHEN** Candidate 构建 npm tarball
- **THEN** verifier MUST 证明每个 `bin` 和 `src` runtime dependency 已包含
- **AND** verifier MUST 证明 `test/`、`scripts/` 和旧 `tools/` 未包含
- **AND** package parity MUST 在无 development checkout 的临时目录执行代表性命令

## ADDED Requirements

### Requirement: 开发 checkout 必须从 Buildr Service package root 运行并保留 Project bridge
Buildr MUST 将 `projects/product/services/buildr` 作为 development checkout 的 npm package root，并 MUST 保留 `projects/product/buildr` 作为稳定兼容入口；source discovery、安装、自更新和诊断必须识别二者属于同一 Product checkout。

#### Scenario: 从 Service package root 打包
- **WHEN** 维护者从 `projects/product/services/buildr` 运行 `npm pack`
- **THEN** tarball MUST 使用既有 `@buildr-ai/buildr` identity 和 `bin/buildr.mjs`
- **AND** package inventory MUST 只包含 Service root 内声明的发布文件

#### Scenario: 从 Project bridge 启动开发 CLI
- **WHEN** 用户运行 `projects/product/buildr <command>`
- **THEN** CLI MUST 从 `projects/product/services/buildr` 解析 package identity、runtime dependencies 和交付资产
- **AND** 输出的 development checkout source MUST 关联当前 workspace 和 Product Service

#### Scenario: 安装本机开发入口
- **WHEN** 维护者运行 Buildr Service 的 `scripts/install-buildr-cli`
- **THEN** 安装链接 MUST 指向 Service `bin/buildr.mjs`
- **AND** 冲突检查 MUST 识别旧 Project package root 与新 Service package root 的 Buildr-managed identity

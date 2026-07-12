## ADDED Requirements

### Requirement: tools 内部实现必须按职责目录组织
Buildr `tools/` MUST 将 runtime、renderer、shared helper 和专项 verification 实现组织到职责明确的下级目录，并 MUST 只在顶层保留稳定 executable facade 和明确的 checkout 安装入口。

#### Scenario: 维护者检查 tools 顶层
- **WHEN** 架构 verifier 扫描 `tools/` 顶层
- **THEN** 顶层 MUST 保留 `buildr`、checkout install/uninstall、产品总验证和 MVP 聚合入口
- **AND** runtime/check/render 实现 MUST 位于 `tools/runtime/`
- **AND** 专项 verifier MUST 位于 `tools/verification/<area>/`
- **AND** 通用非领域 helper MUST 位于 `tools/shared/`

#### Scenario: 内部文件迁移后发布 npm package
- **WHEN** 维护者构建并安装 npm tarball
- **THEN** package runtime inventory MUST 包含安装后 CLI 所需的全部新路径
- **AND** package MUST NOT 依赖旧内部文件路径
- **AND** 公开 `buildr` bin 和已记录 executable facade MUST 保持兼容

#### Scenario: 内部路径不是公开 API
- **WHEN** 使用者查看 package metadata 和 CLI 文档
- **THEN** Buildr MUST 继续只承诺公开 CLI surface
- **AND** `tools/runtime/`、`tools/verification/` 和 `tools/shared/` MUST NOT 被声明为稳定 package exports

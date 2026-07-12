## ADDED Requirements

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
- **THEN** 已安装的 `buildr` MUST 能列出 runtime、初始化 workspace、执行 `sync <agent>` 并通过 `doctor --agent <agent> --json`
- **AND** 已安装 package MUST NOT 依赖 development checkout 或仓库级验证脚本

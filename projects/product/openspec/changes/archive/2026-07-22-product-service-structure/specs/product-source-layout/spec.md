## ADDED Requirements

### Requirement: Product Project 治理根与可执行 Service 根必须分离
Buildr 自举 Product MUST 将项目治理资产保留在 Product Project root，并 MUST 将 npm package、CLI、运行源码、测试、维护脚本和交付源资产放入已登记的 Buildr Service root，二者不得形成双重实现事实源。

#### Scenario: 检查 Product Project root
- **WHEN** 架构 verifier 扫描 `projects/product/`
- **THEN** Project root MUST 保留 `AGENTS.md`、OpenSpec、Project capabilities、Command requirements、Service registry 和项目级文档
- **AND** Project root MUST NOT 继续拥有 npm package metadata、`src/`、`bin/`、`test/`、`scripts/` 或 `package/` 实现目录

#### Scenario: 检查 Buildr Service root
- **WHEN** verifier 扫描 `projects/product/services/buildr/`
- **THEN** 该目录 MUST 是 `@buildr-ai/buildr` package、运行源码、验证、维护脚本和交付源资产的唯一源码根
- **AND** Service root MUST 提供 Service-level `AGENTS.md`

#### Scenario: 从旧开发入口运行 Buildr
- **WHEN** 用户或 Agent 执行 `projects/product/buildr`
- **THEN** 该入口 MUST 作为薄兼容 bridge 调用 Buildr Service 的 CLI
- **AND** bridge MUST NOT 复制运行实现或建立第二份 package root

## Why

Buildr 已具备本地 tarball 与完整产品验证，但公开 JSON 尚无统一兼容标识，CI 只覆盖单一 Linux/Node 组合，release lifecycle 与验证耗时也没有独立、可观察的门禁。最小开源前需要补齐这些发布质量边界，并整理 `tools/` 内部实现目录，避免验证和发布能力继续以顶层散文件演进。

## What Changes

- 为全部公开 `--json` 输出增加稳定的顶层 `schemaVersion`，定义同一 schema major 内的兼容扩展和破坏性升级策略。
- 将公开 JSON 的 schema identity 集中维护并由自动测试覆盖，保持 checkout 与 npm tarball 输出一致。
- 将 CI 扩展为 Linux Node 20/22 完整验证，并增加 macOS、Windows Node 22 的跨平台 release smoke。
- 新增独立 release smoke：从候选 tarball 安装 CLI，完成 `init`、`sync`、`doctor`、optional Component 卸载和最终 `doctor`。
- 为产品总验证的每个阶段和整体输出 elapsed time，生成机器可读 timing summary；第一阶段只观测，不设置性能失败阈值。
- 将 `tools/` 顶层内部 renderer、runtime helper 和 verifier 下沉到职责目录；保留 `tools/buildr`、安装脚本、产品总验证和 MVP 聚合入口等稳定 executable facade。
- 更新 package runtime inventory、内部 imports、文档、CI 与架构门禁，确保目录迁移不改变公开命令、输出语义或 npm 安装闭包。
- 不建立 0.1.x workspace upgrade fixture；该项等待 0.1.0 正式发布后再实施。
- JSON 顶层新增 `schemaVersion` 是兼容性新增字段，不删除或重命名现有字段，不包含破坏性变更。

## Capabilities

### New Capabilities

- `public-json-contracts`: 定义公开 CLI JSON 的 schema identity、兼容演进和自动验证契约。
- `product-verification-quality`: 定义 Node/OS CI 覆盖、release smoke 和分阶段耗时观测契约。

### Modified Capabilities

- `cli-modular-architecture`: 将内部 runtime、renderer 和 verification 工具下沉到职责目录，同时保留稳定 executable facade、发布闭包和行为兼容。

## Impact

- 影响公开 `--json` 命令的顶层输出，但只增加字段。
- 影响 `.github/workflows/verify.yml`、产品验证入口、release smoke、文档和测试。
- 影响 `tools/` 内部文件路径、imports、package inventory 和架构门禁；不扩大公开 JavaScript API。
- 不新增生产运行时依赖，不改变 manifest schema，不承诺本轮建立历史 workspace fixture。

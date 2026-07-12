## Why

Buildr 的主 CLI 实现已经增长到约 7,745 行、315 个顶层函数，命令路由、领域逻辑、文件系统写入、事务、诊断和发布校验共享同一模块作用域；继续在该文件叠加能力会扩大回归面，并让领域边界、依赖方向和专项测试难以审阅。现在应在不改变公开 CLI 契约的前提下建立可演进的模块边界，为后续命令与资产模型扩展降低耦合。

## What Changes

- 将 `tools/buildr` 收敛为薄 executable 入口，把帮助与命令路由、领域 command handlers、共享基础设施和组合型诊断/发布逻辑拆入明确模块。
- 建立单向依赖边界：入口和组合层可以依赖领域模块，领域模块可以依赖共享基础设施；共享基础设施不得反向依赖命令入口或具体领域。
- 按现有产品领域拆分 Project/Service、Rules、Skills、Commands、Components、OpenSpec contract、runtime、doctor、package/update 等职责，并避免仅按文件长度机械切片。
- 拆分 `packageCheck`，将规则检查、可复用校验和临时 E2E 场景分离，使单个方法不再同时承担全部发布验证。
- 调整 npm 发布清单、mutation verifier 和产品验证入口，使全部运行时模块被发布、直接写入边界仍受审计，并增加 CLI 路由与 checkout/npm 行为等价性验证。
- 保持现有命令、参数、帮助文本、stdout/stderr、退出码、文件结果、事务与 fail-closed 语义；本 change 不新增或删除公开命令，也不引入新的参数解析框架。
- 本变更不包含破坏性变化。

## Capabilities

### New Capabilities

- `cli-modular-architecture`: 定义 Buildr CLI 的薄入口、领域模块、共享基础设施、依赖方向、发布完整性和行为兼容门禁。

### Modified Capabilities

无。

## Impact

- 主要影响 `projects/product/tools/buildr` 及新建的 CLI runtime 模块目录。
- 影响 `projects/product/package.json` 的 npm `files` 发布边界，以及 `tools/verify-managed-mutations.mjs`、`tools/verify-buildr-product*` 等验证入口。
- `buildr` bin 路径、公开命令表面、workspace 数据格式和 Agent runtime 契约保持不变。
- 不新增生产依赖；继续使用当前 Node.js ESM、`yaml` 和现有 runtime adapter 模块。

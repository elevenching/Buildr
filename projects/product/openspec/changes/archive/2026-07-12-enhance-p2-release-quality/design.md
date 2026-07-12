## Context

Buildr 0.1 的产品验证当前只在 Ubuntu + Node 20 运行完整入口。MVP 已从本地 tarball 安装 CLI，但该场景与发布生命周期耦合在大型 Bash E2E 中，无法直接在 Windows/macOS 复用；验证入口也只显示阶段名称，不记录耗时。公开 JSON 命令已经是 Agent 和自动化的事实入口，但顶层输出没有统一 schema identity。`tools/` 顶层同时容纳稳定 executable、runtime 实现和十余个 verifier，内部边界虽已模块化，目录所有权仍不清晰。

本变更需要保持现有 JSON 字段、CLI 命令和 npm package 行为兼容。Windows/macOS 只承担可移植 release smoke，Linux 继续承担完整 Bash E2E。0.1.x 历史 workspace fixture 明确不在范围内。

## Goals / Non-Goals

**Goals:**

- 让每个公开 JSON payload 都携带稳定、可测试的 schema identity。
- 明确 JSON v1 的 additive compatibility 和 breaking change 边界。
- 在 Linux Node 20/22 验证完整产品，在 macOS/Windows Node 22 验证安装后 release lifecycle。
- 从候选 tarball 验证 init、sync、doctor、optional Component uninstall 和最终 doctor。
- 输出每个产品验证阶段和总计耗时的机器可读 summary，不因耗时波动失败。
- 将 runtime 与 verification 内部实现下沉，顶层仅保留稳定 executable facade。

**Non-Goals:**

- 不承诺当前所有 Bash E2E 可在 Windows 原生运行。
- 不建立 0.1.x workspace upgrade fixture，也不模拟尚未发布的历史版本。
- 不设置验证耗时硬预算或性能回归失败阈值。
- 不删除或重命名任何现有 JSON 字段，不改变 manifest schema。
- 不将内部模块路径声明为公开 JavaScript API。

## Decisions

### 1. JSON schema identity 由命令家族显式声明

新增共享 JSON envelope helper，但不把所有结果包入新的 `data` 字段；在现有对象顶层增加 `schemaVersion`，例如 `buildr.doctor/v1`。这样现有消费者仍可读取原字段，新增消费者可以 fail-fast 判断 schema。

每个公开 JSON 命令家族使用独立 identity，避免一个命令的破坏性变化迫使所有 payload 同时升级。v1 内允许新增字段；删除、重命名、类型变化或既有语义变化必须使用新的 major identity，并通过独立 OpenSpec change 迁移。消费者必须忽略未知字段。

替代方案是使用 package version，但软件发布版本与 payload 结构生命周期不同，无法准确表达兼容性。

### 2. release smoke 使用 Node 实现并直接测试 packed artifact

新增跨平台 Node verifier：执行 `npm pack` 到临时目录，以临时 prefix 安装 tarball，通过安装后的 bin 运行完整 lifecycle。命令调用使用 `process.execPath`/npm CLI 和平台相关 bin 路径，不依赖 Bash、`mktemp`、`grep` 或 Unix symlink。

Linux 完整验证继续覆盖深层业务场景；macOS/Windows CI 只运行 unit tests 和 release smoke，控制成本并验证真实用户安装路径。

### 3. CI 使用分层 matrix

完整 job 使用 Ubuntu Node 20/22；跨平台 smoke 使用 Ubuntu、macOS、Windows 的 Node 22。Node 20 证明最低 engine，Node 22 和三平台证明当前主流运行环境。OpenSpec CLI 只在完整 job 安装，release smoke 不依赖开发 workflow 工具。

### 4. timing 是观测数据，不是门禁

产品验证 facade 为每个 step 记录 wall-clock milliseconds，并在成功或失败时写出 JSON summary；人类输出同时显示阶段耗时。当前不比较历史基线、不上传遥测、不因慢而失败。CI 可以保存 summary artifact，后续有数据后再定义预算。

### 5. tools 顶层保留稳定 facade

保留 `tools/buildr`、`install-buildr-cli`、`uninstall-buildr-cli`、`verify-buildr-product` 和 `verify-buildr-product-mvp`。runtime renderer/checker/helper 下沉到 `tools/runtime/`；专项 verifier 下沉到 `tools/verification/<area>/`；通用 fetch helper 下沉到 `tools/shared/`。所有内部 imports、package inventory、mutation whitelist、文档和 verifier 同步更新。

不为旧内部路径保留 facade，因为文档已经明确内部模块不是公开 API；只有 executable 入口保持稳定。

## Risks / Trade-offs

- [新增 schemaVersion 使严格对象比较失败] → 保留所有既有字段并把变化声明为 additive；更新内置消费者和 parity fixture，文档要求忽略未知字段。
- [Windows npm bin 路径与 Unix 不同] → release smoke 按 `process.platform` 解析 `.cmd`，所有子进程使用参数数组。
- [移动 tools 文件导致 npm 漏发或 import 断裂] → package inventory、架构 verifier、tarball parity 和 release smoke共同验证依赖闭包。
- [matrix 显著增加 CI 成本] → 完整 E2E 只运行两次 Linux；macOS/Windows 运行短 smoke。
- [timing summary 在失败时缺失] → orchestrator 在每个 step 后立即写入临时结果，并使用 exit trap/finalizer生成 summary。

## Migration Plan

1. 建立 JSON schema registry/helper，覆盖全部当前 `--json` 输出及测试。
2. 新增跨平台 release smoke，在本地候选 tarball上验证 lifecycle。
3. 为完整验证增加 timing summary，再调整 CI matrix 和 artifact 上传。
4. 机械移动 runtime/verifier/shared 文件并更新全部引用、package inventory 和架构门禁。
5. 更新文档，冻结候选后运行 Node 20 可用的完整产品验证、release smoke 和 OpenSpec strict validation。

回滚可整体恢复内部路径和 CI；新增 JSON 字段是 additive，无需 workspace 数据迁移。

## Open Questions

无。Windows/macOS 的支持承诺限定为 release smoke 覆盖，完整 E2E 仍以 Linux 为准。

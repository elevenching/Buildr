## Why

Buildr 已经用 Component ownership、integrity 和 OpenSpec Requirement baseline 保护资产集合与产品契约，但 CLI 的通用文件写入仍可能因 `.` / `..` 标识、任意 `package build --out`、连续直接写入或手写 YAML 解析而删除错误目录、写入错误 scope，或在失败后留下半完成源资产。随着 Component 和 OpenSpec sidebar 成为默认交付能力，现在需要把路径、所有权、预检和提交安全收敛为所有 Buildr mutation 始终启用的核心保证。

## What Changes

- 新增统一的受管数据完整性契约：严格资产 id、scope 内路径解析、符号链接拒绝、保护根与集合根保护、mutation plan、全量预检、单写者锁、staging、原子文件替换和失败回滚。
- 为进程异常留下的 transaction/staging/backup 提供 fail-closed diagnostics 和人工可执行恢复动作；不声称跨机器事务或断电后自动恢复。
- 将 Rules、Skills、Builtins、Components、Project/Service 创建、legacy convergence、OpenSpec sidecar 和 runtime 清理迁移到统一安全写入入口。
- 将 Component 现有 ownership、Old/Live/New integrity 与集合级预检接入通用 transaction；源资产提交成功后的 runtime reconcile 仍保持独立失败边界。
- 让 `package build --out` 只替换不存在、空或带有效 Buildr receipt 且未被修改的输出目录，并始终拒绝保护根、集合根及其祖先。
- 使用成熟 YAML parser 取代手写标量解析，在封闭 schema 校验后确定性写回，避免 escape 和合法 YAML 值被静默改写。
- Project/Service 目标已存在时验证 repo identity；来源不一致则零写入并要求显式解决，不提供危险的隐式 replace。
- **BREAKING**：此前能够接受的 `.`、`..` 资产 id、跨 scope/符号链接目标、非空无 receipt 的 package output，以及来源不一致的重复 Project/Service create 将被拒绝。

## Capabilities

### New Capabilities

- `managed-data-integrity`: 定义 Buildr mutation 的身份、路径、所有权、预检、事务提交、恢复诊断、YAML 语义和安全输出目录契约。

### Modified Capabilities

- `managed-components`: Component 源资产生命周期改为通过统一事务完整提交或失败回滚，同时保持 runtime reconcile 的既有边界。
- `buildr-package-assets`: package build 输出目录增加 Buildr receipt、integrity 三方比较和安全替换规则。
- `project-registry`: Project create 对已存在 repo 执行来源 identity 检查并在冲突时零写入。
- `service-asset-indexing`: Service create 对已存在 repo 执行来源 identity 检查并在冲突时零写入。
- `agent-readable-doctor`: doctor 增加不完整 transaction、staging、backup 和 mutation lock 的机器可读诊断。
- `openspec-contract-guard`: Buildr 自有 baseline 与 receipt sidecar 改为原子安全写入，不改变 Requirement 门禁语义。

## Impact

- 主要影响 `tools/buildr` 的 manifest 解析、路径解析和全部 mutation 命令，并新增可复用的 mutation transaction、安全路径与 YAML 基础能力。
- package manifest 和 npm package 将增加成熟 YAML parser 运行时依赖；发布校验需要验证依赖和打包结果。
- 临时 workspace E2E 将增加 traversal、symlink、保护根、fault injection、repo identity、package output 和 transaction recovery 场景。
- 不引入权限系统、审批、系统 Hook、可执行 Component Hook、远程 registry、跨机器锁或对用户手工文件编辑的拦截。

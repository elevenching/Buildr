## Why

Buildr 的内部 MVP 已能通过完整验证，但当前 GitHub 仓库的首次安装说明指向不存在的根目录脚本，开发 checkout 入口也不会准备运行依赖；新用户和 Agent 无法仅依据公开仓库完成“安装 CLI、初始化 workspace、同步当前 runtime”的闭环。与此同时，Service 指定分支契约尚未实现，远端 Skill 拉取也可能无限等待，这些问题会直接破坏开源试用体验。

现在需要把产品从“已有自举环境可用”推进到“干净 clone 或 npm 包安装后可由 Agent 使用”，并补齐最小开源治理和自动验证材料。本 change 不移除现有 public CLI，也不包含破坏性变更。

## What Changes

- 提供从 GitHub 仓库根目录可执行的安装入口，并由安装流程确定性准备锁定的运行依赖。
- 将 Agent 首次使用路径收敛为：安装 CLI、确认 runtime、初始化 workspace、执行 `sync <agent>`、通过 `doctor --agent`。
- 将 npm package metadata 调整为可公开打包的首个版本，并补充 License、贡献指南、安全策略、CLI reference、示例和 GitHub Actions 验证。
- 修复 `service create` 指定 Git 分支的既有契约，并验证 branch intent 与实际 checkout/metadata 一致。
- 为远端 resolved Skill 下载增加超时和受控失败，避免 render、sync 或 doctor 因不可达来源无限阻塞。
- 收敛发布清单和 Roadmap 中已过期的自然语言事实；将首次安装 smoke test 纳入完整产品验证。
- 清理确认未被主 CLI 使用的打包表面，减少公开 tarball 中的维护脚本和旧 adapter 入口；不在本 change 中进行高风险的全量 CLI 重写。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `human-agent-onboarding`: 新增从公开开发仓库安装并让当前 Agent runtime 可用的规范路径。
- `npm-cli-package`: 要求公开包 metadata、License 和安装后 onboarding smoke test 构成可发布基线。
- `workspace-first-runtime-projection`: 要求远端 resolved Skill 拉取在有限时间内成功或给出可执行失败，不得无限阻塞 runtime 操作。
- `root-organization-workspace`: 将 canonical 组织和 legacy 路径示例从历史私有名称泛化为公开占位名称，不改变行为语义。

## Impact

- 受影响实现：仓库根安装入口、`projects/product/tools/install-buildr-cli`、Service CLI、runtime Skill resolver、产品验证脚本和 package metadata。
- 受影响自然语言资产：root/product README、产品文档、current-state knowledge、release checklist、CLI reference、OpenSpec specs。
- 受影响交付：npm tarball 文件边界、GitHub Actions、公开 License 和贡献/安全文档。
- 兼容性：现有命令保持可用；`service create` 仅新增可选 `--branch`；远端请求只新增超时失败边界。

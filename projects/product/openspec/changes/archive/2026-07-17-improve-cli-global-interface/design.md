## Context

Buildr 的 command registry 已集中分发命令，help 模块也维护了完整主题表，但目前 root-level 特殊输入只识别无参数、`--help`、`-h` 和单独的 `help`。版本只能从 package metadata 或 update diagnostics 间接获得；未知命令统一落入整页 `usage()` 并退出 2。JSON schema registry 已覆盖现有业务命令，却没有适用于路由阶段错误的 payload。

## Goals / Non-Goals

**Goals:**

- 让 checkout 与 npm tarball CLI 从各自 package metadata 报告同一候选 identity。
- 让 flag、command 和 help topic 三种入口共享一个确定性命令目录。
- 让文本与 JSON 错误均简洁、稳定、可测试，并保持失败退出码。
- 保持现有命令实现和既有 JSON schema 不变。

**Non-Goals:**

- 不实现 bash、zsh 或 fish completion。
- 不把所有命令改造成全局 `--json`，只定义 version 和路由错误的新 JSON 表面。
- 不引入新的 CLI framework 或运行时依赖。
- 不把 `-v` 占用为 version alias。

## Decisions

### 1. 从 Product package metadata 读取版本

CLI composition root 解析与自身实现相邻的 `package.json`，返回 package name 和 version。checkout、全局 npm prefix 与 tarball 安装都携带同一 metadata，因此无需硬编码或调用 registry。`--version`、`-V` 和 `version` 共用该 identity provider。

相比从 Git tag、npm registry 或 `update check` 推导版本，package metadata 不依赖网络，也能准确表示当前实际执行的候选。

### 2. 特殊 root 输入在 command dispatch 前处理

dispatch 先识别 version 与 help，再进入普通 command registry。`help <topic...>` 通过规范化后复用既有 `commandTopic()` 和 `HELP_TOPICS`，不维护第二套帮助正文。未知 help topic 与未知普通命令都进入统一 diagnostic builder。

### 3. 命令建议来自公开 registry key

建议只基于用户可执行的 command keys 和 root 特殊入口，使用小规模确定性编辑距离与前缀匹配；最多输出少量候选。不得把 internal function 名、legacy alias 或 Agent runtime id 当作顶层命令建议。

### 4. 路由错误支持文本与 JSON 两种 renderer

默认 renderer 向 stderr 输出一行错误、可选建议和 `Run 'buildr --help' for usage.`，退出 2。输入包含 `--json` 时 stdout 只输出 `buildr.cli-error/v1` 对象，stderr 保持为空，仍退出 2。version JSON 使用 `buildr.version/v1`。

JSON schema registry 显式登记两类 payload；compatibility 与 tarball parity 覆盖成功和失败路径，避免只验证 checkout。

## Risks / Trade-offs

- [Risk] package metadata 路径在不同安装布局下解析错误。→ 复用 CLI source identity 已覆盖的 checkout/tarball/global prefix fixture，并增加实际入口 parity。
- [Risk] `--json` 出现在未知命令参数中时被误当业务参数。→ 只有路由最终无法匹配时才使用它选择 error renderer，已匹配命令仍由命令自身参数校验负责。
- [Risk] suggestion 算法产生误导。→ 限制候选目录、阈值和数量；没有高置信候选时只输出根帮助提示。
- [Risk] 改变未知命令 stderr 会影响依赖整页 usage 的非正式脚本。→ 退出码保持 2；完整 usage 仍可通过 `--help` 获得，属于有意的非破坏性诊断收敛。

## Migration Plan

无需 workspace 数据迁移。发布后新入口立即可用；旧的 `--help`、`-h` 和主题 help 行为保持兼容。回滚只需恢复上一 CLI package。

## Open Questions

无阻塞问题。

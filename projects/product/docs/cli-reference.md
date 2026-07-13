# Buildr CLI Reference

本文列出 Buildr 0.1.x 的公开命令和稳定用途。以 `buildr <topic> --help`、`buildr runtime list --json` 和 `buildr doctor --agent <agent> --json` 的当前输出为最终参数事实。

支持 `--json` 的命令在顶层输出 `schemaVersion`。该字段及兼容规则见 [公开 JSON 契约](json-contracts.md)；消费者应按 schema identity 判断格式，而不是依赖未声明的内部实现。

## 首次使用

```bash
buildr runtime list --json
buildr init --agent <claude-code|codex|cursor|qoder|trae|trae-work|workbuddy> --target <workspace> --name <name> --profile <personal|team|company>
```

`init --agent` 是默认首次 onboarding 入口：它先初始化源资产，再复用完整 `sync` 执行 source update、产品 Buildr Skill 安装、workspace/project Skills 投射和最终 doctor。已有 workspace 的产品能力与 runtime 更新继续使用 `sync`。

`buildr update` 只更新 CLI 自身：开发 checkout 使用 Git 安全更新，registry package 使用 npm 更新。它不接收 `--target`，也不读取 workspace。用户要求完整“更新 Buildr”时，Agent 在 update 成功后重新解析入口，再执行 `buildr sync <agent> --target <workspace>`。

## Workspace 与资产

| 命令 | 用途 |
|---|---|
| `buildr init [--agent <agent>]` | 初始化 Organization/Root；传入 `--agent` 时一次完成 runtime 与最终 doctor，不传时只写源资产。 |
| `buildr project create <project>` | 创建或登记 Project；`--repo` 接入 Project 资产 Git repo。 |
| `buildr service create <project>/<service> <repo-ref>` | 接入本地目录或 Git Service；Git 来源可用 `--branch <branch>` 指定 checkout intent。 |
| `buildr rules add/remove` | 维护 root Rules manifest 和文件生命周期。 |
| `buildr skills add/remove/render` | 维护本地或远端 Skills 源资产并投射 runtime。 |
| `buildr commands add/remove/check` | 声明并诊断外部 CLI；Buildr 不代替用户安装。 |
| `buildr component list/check/install/uninstall` | 管理 workspace 级 Rules、Skills、Command collections 与声明式 Skill Contribution。 |
| `buildr builtin list/uninstall/restore` | 查看或维护 Buildr 内置能力；required 能力不能卸载。 |
| `buildr update [check]` | 检查或更新 Buildr CLI 自身；不维护 workspace。 |

`service create --branch` 只适用于 Git 来源。Manifest 使用 `repo.branch` 保存显式 checkout intent，`repo.defaultBranch` 保存远端 HEAD 事实。

## Runtime 与诊断

| 命令 | 用途 |
|---|---|
| `buildr runtime list` | 查看 supported adapters、capabilities 和推荐命令。 |
| `buildr doctor` | 聚合 workspace、registries、Components、Commands 和 runtime 状态。Agent 默认传 `--agent` 与 `--json`。 |
| `buildr render <agent>` | 组合投射 Rules entry 与 workspace/project Skills，不安装产品入口 Skill。 |
| `buildr sync <agent>` | 同步 workspace 产品源能力并准备完整当前 Agent runtime；不更新 CLI。 |
| `buildr runtime check <agent>` | 专项比较某个 scope 的 runtime 期望状态。 |
| `buildr skill install <agent>` | 只安装产品入口 Buildr Skill。 |
| `buildr mutation recover <id>` | 从完整 transaction journal/backup 恢复未完成 source mutation。 |

当前支持 `claude-code`、`codex`、`cursor`、`qoder`、`trae`、`trae-work` 和 `workbuddy`。其他 runtime 不使用 fallback adapter；各 adapter 的文件路径、刷新方式和证据状态见 [Agent Runtime Adapters](agent-runtime-adapters.md)。

## Product maintenance / workflow internal

- `buildr package check/build`：产品 package 维护和构建，不是普通 workspace 日常命令。
- `buildr openspec baseline create/check`：Buildr OpenSpec workflow 契约门禁，由相关 Skills 编排。
- `buildr bootstrap guide`：产品 Skill 不可用时的纯文本兜底说明。

这些命令可执行，但不构成普通用户需要记忆的 public asset API。

## 内部实现边界

`tools/buildr` 是稳定 npm bin 路径，实际命令通过内部 `tools/cli/` runtime 和唯一 command registry 执行。该模块树随 tarball 发布以保证命令可运行，但不是公开 JavaScript API，不承诺文件级 import 兼容；维护约定见 [CLI 内部架构](cli-architecture.md)。

## 远端 Skill 请求

resolved `skill-url` 默认具有有限请求时间。维护者可设置：

- `BUILDR_REMOTE_SKILL_INACTIVITY_TIMEOUT_MS`
- `BUILDR_REMOTE_SKILL_TOTAL_TIMEOUT_MS`

值必须是 `1..120000` 的整数毫秒。生产环境建议为 resolved source 提供 `sha256-<hex>` integrity。

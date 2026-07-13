# Agent Runtime Adapter 接入指南

本文说明如何为 Buildr 增加一个 Agent runtime adapter。已接入 adapter 的使用方式、限制和证据状态见 [Agent Runtime Adapters](agent-runtime-adapters.md)；当前支持状态仍以 `buildr runtime list --json` 为准。

## 正确顺序

```text
Buildr trait contract
        ↓
向目标 Agent 收集 trait intake
        ↓
为该 Agent 创建独立 OpenSpec change
        ↓
实现 descriptor、必要 primitive、checker 与 tests
```

不要先调查目标 Agent 的所有功能。只收集 Buildr adapter descriptor 无法自行推导的 runtime 事实。

## 1. 取得目标 Agent intake

在目标 Agent 自己的 IDE、CLI 或 desktop 中运行 [调研 Prompt](agent-runtime-adapter-research-prompt.md)。同一品牌的 IDE、CLI、Solo、Work 或 cloud 如果使用不同文件和刷新机制，应分别调查。

目标 Agent 只需回答五组信息：

| Trait | 需要知道什么 |
|------|--------------|
| Identity / surface | adapter id、产品版本、`ide`/`cli`/`desktop`/`cloud` |
| Rules | `native-recursive`、`native-root`、`reference-bridge` 或 `vendor-rule-files`；入口与作用域 |
| Skills | `.agents/skills` 兼容或 vendor root；项目路径与同名优先级 |
| Activation | `immediate`、`path-read`、`session-start` 或 `explicit-reload` |
| Checker | 安装和版本的命令探测，或必须人工确认 |

只保留实际版本的观察结果和官方文档链接。未知项使用 `null`，不要用“兼容某 Agent”代替验证。

路径证据必须按用途分类。安装包中出现 `.vendor/skills` 字符串，只能证明这个路径被某段代码提到；它可能是用户目录、builtin 资源、编辑器特殊视图或 sandbox 可写白名单，不等于 project Skill discovery root。project root 只有在以下至少一项成立时才能认证：当前会话实际列出该目录中的测试 Skill、产品自带文档明确声明该目录，或 discovery 源码明确把 workspace 与该目录拼接后扫描 `SKILL.md`。当多项证据冲突时，以真实 discovery smoke 为准，并保留冲突说明。

如果桌面产品随包提供稳定的 headless/print CLI，优先用只读临时 workspace 执行同一 runtime 的 marker smoke，并记录为具体 surface（例如 `desktop-bundled-cli`）；不能把普通文件生成、索引成功或内部 tool-host 启动当成 Agent 已加载 Rules/Skills。

证据等级只有两种：`documented` 表示官方资料、随包资料、明确的 discovery 源码或可重复本机观察已经认证路径；`verified` 表示又完成了真实 runtime marker smoke。supported descriptor 至少必须达到 `documented`。没有足够证据的候选不注册为 supported；真实 smoke 明确失败时也必须停止该能力声明，而不是继续保留 `documented`。

## 2. 判断能否成为 adapter

正式 adapter 必须完整覆盖：

- `rules-entry`
- `product-buildr-skill`
- `workspace-project-skills`
- `skill-install-plans`
- `runtime-check`

如果产品只读取根 Rules，必须再有能覆盖嵌套 scope 的投射方式；`native-root` 不能单独认证完整 `rules-entry`。

如果产品只能通过 UI 上传 Skill，且 Buildr 无法检查、更新和删除，则应做 connector 或手工安装说明，不应伪装成 runtime adapter。

## 3. 交给 Buildr 开发 Agent

把目标 Agent 返回的 JSON 原样交给 Buildr 开发 Agent，并说明要增加的 adapter id。开发 Agent应：

1. 运行 `runtime list --json`，从当前 trait catalog 选择组合。
2. 使用 `task-triage`；新增 adapter 属于 `change-flow`。
3. 在 task worktree 中创建独立 OpenSpec change。
4. 为具体 runtime 保留独立 descriptor、capability evidence 和 contract tests，不做 alias/fallback。
5. 只在现有 primitive 无法表达目标 runtime 时增加新的静态 implementation。

## 4. 实现范围

新增 adapter 通常只需要：

- 用 trait composer 声明 adapter identity 与 traits。
- 如有新 Rules 格式，增加受控的 Rules planning primitive。
- 配置 Skills root、activation 与 checker probe。
- 为五项 capabilities 增加 contract/parity/smoke tests。
- 更新 Buildr Skill、current state、公开说明和 known limitations。

Buildr 通用 RuntimePlan、路径保护、零写入冲突预检、ownership 和 orphan cleanup 不需要向目标 Agent 重新调查，也不应在每个 adapter 重写。

## 完成标准

- descriptor 通过 trait validation。
- 五项 required capabilities 均有独立 evidence。
- 自动 contract/parity tests 证明投射格式、scope、兄弟隔离、Skills root、冲突保护、清理和 checker。
- adapter 的 Rules、Skills 与 activation 路径至少达到 `documented`；真实 smoke 作为把等级提升为 `verified` 的独立证据，不是所有 GUI adapter 的强制实现门槛。
- 需要 smoke 时只运行一次 Buildr 生成的 `SMOKE_PROMPT.md`。不要把 GUI 自动点击、应用私有数据库抓取或重复 reload 测试纳入常规流程。
- smoke 只验证 traits 无法从投射测试证明的行为：scoped Rules/bridge traversal 与 project Skill discovery。activation/reload 默认依据官方资料和 checker guidance，只有存在稳定 reload 命令或证据冲突时才额外实测。
- 若记录 sibling isolation，smoke 证据应包含实际工具调用或等价可审计记录，不能只采信 Agent 自述。
- `runtime list`、doctor/check、Buildr Skill 和产品文档一致。
- OpenSpec 与产品验证通过。

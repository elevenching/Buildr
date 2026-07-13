# Agent Runtime Adapter 接入指南

本文说明如何为 Buildr 增加一个 Agent runtime adapter。当前支持状态仍以 `buildr runtime list --json` 为准；本文不是 supported adapter 清单。

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
- Rules scope、兄弟目录隔离、Skills 安装与 reload 行为通过真实产品 smoke test。
- `runtime list`、doctor/check、Buildr Skill 和产品文档一致。
- OpenSpec 与产品验证通过。

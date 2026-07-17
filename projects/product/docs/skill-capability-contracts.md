# Skill Capability Contracts

Capability contract 用来描述多个 Skills 之间稳定、可替换的行为边界。它类似代码里的 interface：consumer 依赖 capability，Skill 通过 `provides` 成为 provider，manifest binding 选择当前实现。Contract 不规定命令、工具或内部步骤；这些仍由 provider 和组织习惯决定。

面向用户的完整机制称为“Agent 工作能力适配（Agent-managed Capability Adaptation）”。用户只需要表达“采用内部流程”“改成 feature 分支模式”“替换默认工作方式”等目标；Agent 使用 `capability-adaptation` 分析相关 Skill 和依赖、开发候选资产、验证 consumers，并在成功后完成 binding、sync 和 doctor。下面的 manifest 与 CLI 是 Agent 使用的底层实现原语，不是普通用户必须学习的操作步骤。

普通独立 Skill 不需要声明 capability。只有当一项动作确实需要被其他 Skill 组合、替换或诊断时，才应增加 contract。

Agent 判断的不是用户是否说出 capability 名字，而是目标行为是否满足以下任一条件：被其他 Skill 调用或编排、需要允许实现替换、consumer 依赖稳定保证或结果证据、修改或卸载需要跨 Skill 影响诊断。触达已有 contract 时优先在 `Allowed Variations` 内调整 provider；只有产生新的稳定协作边界时才创建 contract。

产品入口 Buildr Skill 是能力路由者：只有“提交”“更新 workspace”“收尾”等具体意图命中时，才把相应 capability 作为本次动作的 required dependency。`task-finish` 则是编排型 consumer，其 manifest `requires` 参与整体 `ready`、`blocked` 或 `degraded` 计算。单项 Git capability 不可用不会阻塞 Buildr 的 init、doctor 或 Project 管理等无关能力。

这里有两个不同的版本概念：

- “v1 事务化迁移”指旧的 `buildr.skills/v1` manifest 升级为 `buildr.skills/v2`。Buildr 先完整读取并校验旧数据，再通过 workspace mutation 的临时文件、原子替换和恢复记录一次性提交；失败时不得留下半份 v2，也不得丢失 Skill metadata、远端来源、builtin 卸载状态或用户 binding。
- contract 路径中的 `v1.md` 和 frontmatter 中的 `version: 1` 表示该 capability contract 的第 1 个主版本。它不会因为 manifest 升级到 v2 而自动变成 `v2.md`；只有 contract 出现不兼容语义变化时才提升主版本。

## Contract 文档

Contract Markdown 使用最小 frontmatter：

```markdown
---
schemaVersion: buildr.capability-contract/v1
id: example.git-task-integration
version: 1
---

# Git 任务集成

## Purpose
...

## Consumer Obligations
...

## Minimum Guarantees
...

## Effects and Authorization
...

## Result Evidence
...

## Decision Points
...

## Allowed Variations
...
```

`Purpose`、`Consumer Obligations`、`Minimum Guarantees`、`Effects and Authorization`、`Result Evidence`、`Decision Points`、`Allowed Variations` 是供解析器识别的固定字段标识，不表示正文必须使用英文；章节正文和标题应使用 workspace 的主要语言。`Examples` 可选且不具规范性。Manifest 注册的 id/version 必须与 frontmatter 完全一致。

Contract 只写 consumer 安全组合所必需的行为信封：前置披露、授权类别、允许的副作用、必须停止的决策点和结果证据。命令、算法、默认 merge/rebase policy、组织分支规则及案例应留在 provider 或 `Examples`，避免把 interface 变成复制的操作手册。

## Manifest v2

```yaml
schemaVersion: buildr.skills/v2
contracts:
  - id: example.git-task-integration
    version: 1
    path: contracts/example/git-task-integration/v1.md
bindings:
  - capability: example.git-task-integration
    version: 1
    provider: internal-git
skills:
  - id: internal-git
    path: internal-git
    provides:
      - capability: example.git-task-integration
        version: 1
  - id: task-finish
    path: task-finish
    requires:
      - capability: example.git-task-integration
        version: 1
        mode: required
```

Skill entry 的 `required` 与 `requires[].mode` 是两件事：

- `required` 控制该 builtin 资产能否卸载。
- `requires[].mode: required` 表示依赖不可用时 consumer 必须 blocked。
- `requires[].mode: optional` 表示 consumer 保持可用但 degraded，并由正文说明降级行为。

Workspace binding 是默认选择；Project 可以用更近的显式 binding 覆盖。没有显式 binding 时，只有 scope 链上恰好一个兼容 provider 才能自动解析。多个 provider 必须显式选择，安装新 provider 不会静默改绑，卸载 builtin 也不会让 Buildr 偷偷恢复默认实现。

## 声明与替换

Provider 和 consumer 声明可通过重复参数写入：

```bash
buildr skills add internal-git --source ./internal-git --scope . --target <workspace> \
  --provides example.git-task-integration@1

buildr skills add task-finish --source ./task-finish --scope . --target <workspace> --replace \
  --requires example.git-task-integration@1:required
```

替换 provider 必须使用 capability binding，而不是冒用 builtin Skill id：

```bash
buildr skills bind example.git-task-integration@1 \
  --provider internal-git --scope . --target <workspace>

buildr skills unbind example.git-task-integration@1 \
  --scope . --target <workspace>
```

`skills add --replace` 只替换同一 Skill 资产条目，不表示 provider substitution。会移除或改绑当前 selected provider 的 mutation 会先披露受影响的 required/optional consumers，并在写入后由 doctor 收敛结构状态。

## Conformance 的三个层次

Buildr 刻意不把 Agent contract 过度约束成调用协议：

1. `ready` 只表示 contract、scope、version、binding、provider dependency 和 runtime projection 在结构上可路由。
2. 官方 fixture 或组织自己的 tests、examples、审查记录，表示 provider 曾针对场景验证；Buildr v1 不提供通用行为认证框架。
3. 本次动作只有在 Agent 按 contract 完成披露与授权，并返回规定的 result evidence 后，才算执行成功。

用户 provider 的 `provides` 是组织对 conformance 的声明，不是 Buildr 对自然语言行为的证明。`Allowed Variations` 应明确 provider 可以自由选择的工具、步骤和 policy；contract 只保留跨实现不可丢失的安全与协作语义。

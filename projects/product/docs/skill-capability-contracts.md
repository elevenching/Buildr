# Skill Capability Contracts

Capability contract 用来描述多个 Skills 之间稳定、可替换的行为边界。它类似代码里的 interface：consumer 依赖 capability，Skill 通过 `provides` 成为 provider，manifest binding 选择当前实现。它更接近 interface + dependency injection，而不是 Skill-to-Skill 方法调用：consumer 不调用某个固定 Skill，Agent 根据当前 scope 和 binding 解析 provider，再结合 contract、provider playbook 和任务上下文完成真实协作。Contract 不规定命令、工具或内部步骤；这些仍由 provider 和组织习惯决定。

面向用户的完整机制称为“Agent 工作能力适配（Agent-managed Capability Adaptation）”。用户只需要表达“采用内部流程”“改成 feature 分支模式”“替换默认工作方式”等目标；Agent 使用 `capability-adaptation` 分析相关 Skill 和依赖、开发候选资产、验证 consumers，并在成功后完成 binding、sync 和 doctor。下面的 manifest 与 CLI 是 Agent 使用的底层实现原语，不是普通用户必须学习的操作步骤。

普通独立 Skill 不需要声明 capability。只有当一项动作确实需要被其他 Skill 组合、替换或诊断时，才应增加 contract。

Agent 判断的不是用户是否说出 capability 名字，而是目标行为是否满足以下任一条件：另一工作流无法在缺少其稳定保证或结果证据时安全继续、需要允许实现替换、修改或卸载需要跨 Skill 影响诊断。Agent 在执行期间同时读取多个 Skills，不足以单独构成 capability dependency。触达已有 contract 时优先在 `Allowed Variations` 内调整 provider；只有产生新的稳定协作边界时才创建 contract。

用户意图首先由 Agent runtime 的原生 Skill 发现机制处理：runtime 暴露 Skill description，Agent 根据用户目标选择并加载入口 Skill。Buildr CLI 不拦截 prompt，也不存在一个始终先于所有 Skills 运行的全局 capability dispatcher。入口 Skill 加载后，才读取 Buildr 注入的 binding evidence 解析其 capability dependencies。

产品入口 Buildr Skill 只在自身因 Buildr 管理意图被 Agent 命中后充当内部能力路由者，例如更新 workspace、调整工作方式或诊断 Buildr 能力。它不是“收尾”等所有专业意图的统一前置入口。`task-finish` 是编排型 consumer，其 manifest `requires` 参与整体 `ready`、`blocked` 或 `degraded` 计算。单项 Git capability 不可用不会阻塞 Buildr 的 init、doctor 或 Project 管理等无关能力。

## 五种相关但不同的关系

| 关系 | 事实来源 | 表达什么 | 不表达什么 |
|---|---|---|---|
| Agent Skill 意图发现 | Agent runtime 暴露的 Skill description、用户目标和任务上下文 | 本次首先加载哪个入口 Skill | 不解析 capability provider，也不形成 manifest dependency edge |
| 能力目录 | manifest `contracts`、`provides`、`bindings` | 当前有哪些可声明、选择和替换的能力 | 不要求每项能力都存在 manifest consumer |
| Consumer dependency graph | installed Skills 的 `requires` | 哪些 consumer 缺少保证时 blocked，哪些可以 degraded | 不包含 description 命中或 Agent 临时读取多个 Skills |
| 产品入口内部路由 | 已加载的 Buildr Skill、routing evidence、当前 doctor graph | Buildr 管理意图在产品入口内部应交给哪项 selected capability | 不在所有用户意图之前运行，也不把产品入口登记成依赖全部 capabilities 的 consumer |
| Agent 执行协作 | contract、provider playbook、授权和任务上下文 | Agent 实际如何使用工具、判断结果并继续或停止 | 不等价于确定性函数调用，也不由结构 `ready` 证明成功 |

因此，一个 capability 可以已经登记、提供和绑定，只作为顶层可替换入口存在，而不出现在 consumer dependency graph 中。但 binding 只选择 provider，不会让 provider 自动被 Agent 命中：顶层 provider 还必须通过自己的 Skill description，或通过一个已经被加载的明确产品入口保持可发现。只有 manifest `requires` 才形成静态 consumer dependency edge。

## 完整实例：`buildr.git-task-integration/v1`

这项能力负责“将已验证任务安全集成到目标分支”。它的完整结构如下：

```text
用户说“收尾”
  ↓ Agent runtime 根据 Skill description 发现入口
加载 task-finish
  ↓ 读取 task-finish runtime 中的 Buildr Capability Bindings
required dependency = buildr.git-task-integration/v1
  ↓ workspace binding
selected provider = git-ops
  ↓ Agent 读取 contract + git-ops playbook + 当前 Git 状态
提交、集成、推送或在需要语义决策时停止
  ↓ result evidence
commit、目标 ref、候选 tree、远端结果、treeChanged
```

### 1. Contract

`skills/contracts/buildr/git-task-integration/v1.md` 固定的是跨 provider 不可丢失的行为信封：

- consumer 必须提供任务范围、目标分支、远端、验证证据和授权范围；
- provider 必须保留无关改动、比较候选 tree，并在语义冲突时停止；
- force push、改写共享历史和删除远端分支需要额外授权；
-结果必须包含 commit、目标 ref、远端状态、tree identity 和 `treeChanged`；
- merge、rebase、fast-forward、PR 和分支策略属于 `Allowed Variations`。

### 2. Manifest 注册、provider、consumer 与 binding

```yaml
contracts:
  - id: buildr.git-task-integration
    version: 1
    path: contracts/buildr/git-task-integration/v1.md

skills:
  - id: git-ops
    provides:
      - capability: buildr.git-task-integration
        version: 1

  - id: task-finish
    requires:
      - capability: buildr.git-task-integration
        version: 1
        mode: required

bindings:
  - capability: buildr.git-task-integration
    version: 1
    provider: git-ops
```

这里 `task-finish` 没有声明“调用 `git-ops`”。它只声明：缺少 `buildr.git-task-integration/v1` 的最低保证和结果证据时，完整收尾不能安全继续。

### 3. Resolver 与 readiness

Buildr 从当前 scope 向 workspace root 查找最近的显式 binding，校验 contract version、provider `provides`、runtime 可用性和 provider 自身的 required dependencies。当前 binding 选择 `git-ops`，所以 `task-finish` 的这条 dependency 为 `ready`；binding 缺失、歧义、版本不兼容或 provider blocked 时，`task-finish` 相应变为 `blocked`。

### 4. Runtime evidence

render/sync 会在 `task-finish` 的 runtime 派生版本中注入受管 binding block，记录 contract path/digest、dependency mode、selected provider、provider runtime path、scope、readiness、reason 和 provenance。源 `task-finish/SKILL.md` 与 `git-ops/SKILL.md` 不会被写入这段接线信息。

### 5. Agent 实际执行

当用户说“收尾”时，Agent runtime 先根据 description 命中并加载 `task-finish`；这一步不经过产品入口 Buildr Skill。`task-finish` 随后读取受管 binding block，执行 Git 集成阶段前再读取已解析 contract 和 selected `git-ops` provider。Agent 根据当前仓库、授权和验证 tree 执行专业动作，并把 provider 返回的 evidence 交还给收尾编排决定继续、重验或停止。这个过程是 Agent 调解的工作协作，不是 `task-finish.gitOps()` 一类方法调用。

### 6. 用户替换实现

若组织创建 `internal-git` 并声明提供同一 contract，安装它不会改变当前流程。Agent 先验证 `internal-git` 与 `task-finish` 的组合，再把 binding 显式切换为 `internal-git`。只要 contract guarantees 和 result evidence 保持兼容，内部实现可以使用 feature + PR、merge queue 或其他组织策略，`task-finish` 无需修改。

这里替换的是 `task-finish` 加载后的依赖 provider，所以不需要修改“收尾”意图的入口 description。如果替换的是 `buildr.task-finish/v1` 自身，binding ready 仍不代表用户说“收尾”时一定能命中新 provider；能力适配还必须确认新 provider 已投射到当前 runtime、description 覆盖“收尾”意图，并处理旧 `task-finish` 或其他入口造成的触发歧义。

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

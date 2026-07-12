> Archived historical note. Not a current Buildr product source of truth.

# Buildr 上下文与记忆模型

本文面向 Buildr 使用者和维护者，解释 Buildr 如何组织项目上下文、记忆和资产边界。它是人类理解文档，不是 Agent 日常执行任务时必须读取的强规则。

Agent 执行时的强规则入口仍然是各层 `AGENTS.md`；本文用于解释这些规则背后的结构设计。

## 设计目标

Buildr 要解决的问题不是“把文档放到一个目录里”，而是让开发者和 Agent 都能稳定回答三个问题：

1. **我现在在哪个项目上下文里？**
2. **这个项目当下是什么状态？**
3. **我应该按什么方式把事情做好？**

因此 Buildr 把项目上下文拆成层级、记忆和 runtime 三条线：

- 层级决定上下文边界。
- 记忆决定信息应该写在哪里。
- runtime adapter 决定如何把 Buildr 资产投影给具体 Agent。

## 层级模型

Buildr 按以下层级组织上下文：

```text
框架 → 组织 → 项目 → 代码服务
```

| 层级 | 关注点 | 典型内容 |
|------|--------|----------|
| 框架 | Buildr 自身规则、通用流程和平台能力 | 根 `AGENTS.md`、`package/`、`tools/`、`docs/`、`openspec/` |
| Root / Organization context | 当前 root 内默认规则、项目索引、通用实践和共享能力 | `AGENTS.md`、`projects.yml`、`practices/`、`skills/` |
| 项目 | 业务上下文、项目规则、项目实践和项目 Skills | `projects/<project>/AGENTS.md`、`openspec/`、`practices/`、`skills/` |
| 服务 | 具体代码仓或服务的构建、模块和特例 | 服务目录下的 `AGENTS.md` |

越上层越通用，越下层越具体。Agent 进入一个任务时，应该按任务涉及范围读取对应层级及其上层的规则入口。

## 三类记忆

Buildr 采用三类项目记忆：

| 记忆类型 | 回答什么 | Buildr 载体 |
|----------|----------|-------------|
| 情景记忆 | 发生了什么 | `openspec/changes/` |
| 语义记忆 | 当下是什么 | `openspec/specs/`、`openspec/knowledge/`、代码实现事实 |
| 程序记忆 | 如何做得好 | `AGENTS.md`、`rules/`、`package/`、`practices/`、`skills/`、templates |

### 情景记忆

情景记忆记录一个需求、问题或决策的演进过程。

适合写入：

- 需求变更提案。
- 任务拆解和执行记录。
- 关键设计取舍。
- 归档后的变更结果。

典型位置：

```text
projects/<project>/openspec/changes/
```

### 语义记忆

语义记忆描述系统当下是什么。

适合写入：

- 业务能力说明。
- 领域知识。
- 当前系统行为的 SHALL/规范描述。
- 从代码中提取出的实现事实。

典型位置：

```text
projects/<project>/openspec/specs/
projects/<project>/openspec/knowledge/
```

代码本身也是实现层语义记忆。Buildr 不替代代码事实；Agent 在行动前仍应读取当前代码。

### 程序记忆

程序记忆描述如何把事情做好。

适合写入：

- Agent 工作规则。
- 编码规范。
- Git/worktree 流程。
- 研发、产品、测试、交付实践。
- 可复用 Skills。
- 模板和反例经验。

典型位置：

```text
AGENTS.md
rules/
package/
tools/
practices/
skills/
projects/<project>/practices/
projects/<project>/skills/
```

## 资产对象与边界

| 对象 | 位置 | 是否是长期资产 | 说明 |
|------|------|----------------|------|
| 运行规则 | `AGENTS.md`、各层 `AGENTS.md` | 是 | Agent 执行任务时的强规则入口 |
| 平台规则 | `rules/` | 是 | Buildr 平台级流程和约束 |
| 平台能力 | `package/`、`tools/`、`agents/` | 是 | OpenSpec 集成、Agent 模板、流程和模板 |
| 设计文档 | `docs/` | 是 | 给人看的设计、治理和路线图，不是日常运行时规则入口 |
| 项目索引 | `projects.yml` | 是 | workspace 管理哪些 Project，以及 Project 资产 repo 来源 |
| 项目记忆 | `openspec/` | 是 | 业务知识、能力规范、需求变更和归档 |
| 实践经验 | `practices/` | 是 | 可复用做法、方法论和反例 |
| Skills | `skills/` | 是 | 可被 Agent 读取或渲染到 runtime 的能力源 |
| Agent runtime | `.claude/`、`.cursor/`、`.qoder/`、`.codex/`、`CLAUDE.md` | 否 | 本地生成产物，可重建，默认不提交 |

核心边界：

```text
Buildr 资产是源头，Agent runtime 是投影。
```

不要把 `.claude/skills/` 或 `CLAUDE.md` 当成规则和 Skills 的来源。它们应该由 Buildr 根据 `scope` 和 `target` 重新生成。

## scope 与 target

Buildr 渲染时必须区分两个概念：

| 概念 | 含义 | 示例 |
|------|------|------|
| `scope` | 本次开发任务所属的上下文，用于解析资产 | `projects/meat` |
| `target` | 当前 Agent 打开的目录，用于输出 runtime | `.` |

例如：

```bash
buildr runtime check claude-code --scope projects/meat --target .
```

含义是：以 `meat` 项目为上下文，检查当前目录下的 Claude Code runtime 是否已经同步了对应规则和 Skills。

## 渐进式披露

Buildr 不要求 Agent 一次读完所有文档，而是通过 `AGENTS.md` 做渐进式路由：

1. 先读当前层级及上层的 `AGENTS.md`。
2. 根据任务类型读取相关 `rules/`、`package/`、`openspec/`、`practices/` 或 `skills/`。
3. 执行前再读取具体代码、规范或模板。

这样可以避免上下文过载，也能让不同任务读取不同深度的信息。

## 与 runtime adapter 的关系

本文解释 Buildr 资产如何组织；runtime adapter 负责把这些资产转换为具体 Agent 可消费的格式。

Claude Code 当前支持：

```bash
buildr runtime check claude-code --scope <scope> --target <target>
buildr rules render claude-code --scope <scope> --target <target>
buildr skills render claude-code --scope <organization-or-project-scope> --target <target>
```

详细命令语义、managed marker 和冲突处理见 [buildr-agent-runtime-adapters.md](buildr-agent-runtime-adapters.md)。

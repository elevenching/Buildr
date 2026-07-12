## Context

Buildr 当前已经有两类入口：

- `buildr bootstrap guide`：Agent 首次发现 Buildr 后读取的 CLI 文本指南。
- `buildr skills render claude-code`：把 workspace/root/project 的 Skills 源投射到 Agent runtime。

这两者之间还缺一个产品化连接点：Buildr 自身应该能作为一个随产品发布的 Agent Skill，被渲染到支持 Skills 的 Agent runtime 中，让 Agent 在后续任务中直接具备“如何使用 Buildr”的操作能力。

这个 Skill 不能混入用户 workspace 的 `skills/`，因为它不是用户组织或项目沉淀的资产，而是 Buildr 产品随包 runtime 能力。用户 workspace 的 `skills/` 仍然只表达用户或项目自己的长期 Agent Skills。

## Goals / Non-Goals

**Goals:**

- 定义 Buildr 产品内置 Agent Skill 的资产位置和发布边界。
- 将 Buildr Skill 纳入现有 `buildr skills render <agent>` 体系。
- 复用 bootstrap guide 的 Agent-facing 流程，形成可渲染的 `SKILL.md`。
- 保持 `buildr init` 只生成 workspace 源资产，不自动写入 Agent runtime。
- 让 package check 能校验内置 Skill 的路径、内容和 forbidden patterns。

**Non-Goals:**

- 不新增 `buildr bootstrap install-skill` 或其他独立安装命令。
- 不实现新的 `buildr use` 高层入口。
- 不把 Buildr Skill 复制到用户 workspace `skills/` 作为用户源资产。
- 不在本变更中新增 Codex Skills adapter；Codex 仍通过 `AGENTS.md` 原生规则入口使用 Buildr。
- 不设计远程 Skill registry、版本解析或依赖管理。

## Decisions

### Decision 1: 产品内置 Skill 放在 `product/package/agent-skills/`

采用：

```text
product/package/agent-skills/buildr/SKILL.md
```

原因：

- `product/package/` 表示 Buildr 发布包内置资产，符合现有发布边界。
- `agent-skills/` 明确这是面向 Agent runtime 的产品内置 Skill，不是用户 workspace `skills/`。
- `buildr/` 目录名对应 Skill id，后续可以增加其他产品内置 Skill。

备选方案：

- `product/package/skills/buildr/SKILL.md`：容易和用户 workspace `skills/` 混淆，拒绝。
- `product/package/bootstrap/buildr/SKILL.md`：bootstrap 是指南入口，不应承载 runtime Skill 源，拒绝。
- root `skills/buildr/`：会变成当前产品开发 org 的资产，而不是明确的产品随包资产，拒绝。

### Decision 2: package manifest 显式声明内置 Agent Skills

在 `product/package/manifest.yml` 中增加一个专门字段，例如：

```yaml
agentSkills:
  - id: buildr
    path: product/package/agent-skills/buildr
    runtimes:
      - claude-code
```

`agentSkills` 只声明产品随包内置 Skill，不参与 `buildr init` 的 workspace 文件生成。这样可以让发布和校验知道 Buildr Skill 属于产品包，也能让 `skills render` 明确合并来源。

### Decision 3: `skills render` 合并产品内置 Skills 和 workspace Skills

`buildr skills render <agent>` 的解析顺序应区分来源：

1. 产品内置 Agent Skills：来自 package manifest 的 `agentSkills`。
2. root/workspace Skills：来自当前 scope 可见的 workspace `skills/manifest.yml`。
3. project Skills：来自项目 scope 的 `skills/manifest.yml`，按现有覆盖规则处理。

Buildr Skill 的 id 建议固定为 `buildr`。如果用户 workspace 也定义同 id 的 Skill，CLI 必须报冲突，而不是静默覆盖产品内置 Skill。这样可以避免用户无意覆盖 Buildr 使用指南。

### Decision 4: `buildr init` 不自动 render Skill

`buildr init` 继续只创建标准 workspace 源资产：`AGENTS.md`、`README.md`、`.buildr/workspace.yml`、`rules/`、`projects/`、`practices/`、`skills/` 等。

Agent runtime 写入仍由 guide 或 Buildr Skill 引导：

- Codex：原生读取 `AGENTS.md`，当前无 Codex Skills adapter 时跳过 Skills render。
- Claude Code：运行 `runtime check claude-code`，缺失或过期时按提示执行 `rules render` 和 `skills render`。

### Decision 5: Buildr Skill 复用 bootstrap guide 的操作流程，但面向 runtime 使用

`bootstrap guide` 和 Buildr Skill 的关系是：

- `bootstrap guide`：Agent 首次发现 Buildr 的命令式说明入口。
- Buildr Skill：Agent runtime 中可发现、可复用的 Buildr 操作能力。

两者内容可以共享相同的流程语义，但 Skill 文案应更像运行规则：遇到用户说“使用 Buildr 管理项目”或需要维护 Buildr workspace 时，如何确认 target、执行 `init`、读取 `doctor --json`、创建 Project、接入 Service、判断 runtime、保存可复用信息。

### Decision 6: 用 onboarding contract 防止 guide 与 Skill 漂移

新增 `product/package/bootstrap/onboarding.contract.yml` 作为轻量同步契约，声明 bootstrap guide 和 Buildr Skill 都必须覆盖的命令、Agent 分支和禁用入口。`buildr package check` 读取该契约并校验两个 artifact。

这个契约不生成正文，也不替代文档维护；它只表达最低同步要求。这样 guide 可以保持完整说明，Skill 可以保持简短可执行，但二者不会遗漏关键流程。

## Risks / Trade-offs

- [Risk] Buildr Skill 与用户 workspace Skill 同名导致覆盖语义不清。 → Mitigation：产品内置 Skill id 与 workspace Skill id 冲突时报错，要求用户改名或显式处理。
- [Risk] bootstrap guide 和 Buildr Skill 内容漂移。 → Mitigation：`onboarding.contract.yml` 声明最低同步契约，`buildr package check` 和验证脚本检查两者都包含核心命令和 Agent-aware runtime 分支；产品手册记录二者职责。
- [Risk] `skills render` 解析来源增加后行为变复杂。 → Mitigation：在 doctor/runtime check 输出中区分 `product`、`workspace`、`project` 来源，并在测试中覆盖最小 workspace。
- [Risk] 用户误以为 `buildr init` 会自动安装 Skill。 → Mitigation：guide、README 和 CLI next steps 明确 init 不写 runtime，Claude Code 需要显式 runtime check/render。

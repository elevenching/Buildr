## Context

Buildr 已支持 `claude-code` 和 `codex` runtime adapter，并通过 `sync`、`render`、`runtime check` 和 `doctor` 维护 Agent runtime 渲染结果。当前问题是支持矩阵隐含在 CLI usage、package manifest 和实现代码里，Agent 需要猜测自身是否受支持；同时 `doctor` 会聚合所有 runtime adapter 状态，导致 Codex 已就绪时仍因 Claude Code 缺失报告 warning。

用户期望的产品路径是：Agent 先探索 Buildr 支持哪些 Agent，判断自己是否受支持；受支持时使用对应 `<agent>` 参数执行 render/sync/doctor；不受支持时明确停止自动渲染，不猜测相近 adapter，并提示联系 Buildr 作者反馈该 Agent。

## Goals / Non-Goals

**Goals:**

- 提供结构化、Agent-readable 的 runtime adapter 发现入口。
- 让 `doctor` 支持按当前 Agent runtime 过滤 runtime 检查和 nextSteps。
- 对不支持的 Agent 给出明确 warning，并要求 Agent 不使用 fallback adapter。
- 把 adapter 必须实现的 runtime render 能力清单固化为产品契约，降低新增 Agent adapter 的成本。
- 更新 Buildr Skill 和 bootstrap guide，使 Agent onboarding 先识别自身 runtime，再执行 runtime-specific 命令。

**Non-Goals:**

- 不在本变更中新增 Trae、Cursor、Qoder 等 adapter 实现。
- 不支持没有 adapter 的 Agent 自动渲染。
- 不为 unsupported Agent 设计手动完整渲染流程。
- 不导出 `.buildr/skills/buildr/SKILL.md` 或其他 unsupported Agent bootstrap 文件。
- 不让 `init` 自动写入 runtime 渲染结果。
- 不把 Commands、Project registry、Service registry、OpenSpec、knowledge、practices 或 docs 默认复制到 Agent runtime。
- 不设计更高层 `buildr use` 入口。

## Decisions

### 1. 使用 `buildr runtime list --json` 作为强制支持矩阵发现入口

新增 `buildr runtime list [--json]`，输出 Buildr 当前支持的 runtime adapter。Agent 在执行 `doctor --agent`、`sync <agent>`、`render <agent>`、`skills render <agent>`、`skill install <agent>` 或 `runtime check <agent>` 前，必须先通过该输出确认当前 Agent id 是否受支持。

JSON 使用 map 结构方便 Agent 按 id 索引：

```json
{
  "supportedAgents": ["claude-code", "codex"],
  "requiredRenderCapabilities": [
    "rules-entry",
    "product-buildr-skill",
    "workspace-project-skills",
    "skill-install-plans",
    "runtime-check"
  ],
  "agents": {
    "codex": {
      "id": "codex",
      "displayName": "Codex",
      "renderCapabilities": {
        "rules-entry": {
          "supported": true,
          "mode": "native",
          "writesFiles": false
        }
      },
      "recommendedCommands": {
        "doctor": "buildr doctor --agent codex --target <dir> --json",
        "syncWorkspaceEntry": "buildr sync codex --target <dir>",
        "renderScope": "buildr render codex --scope <scope> --target <dir>",
        "renderSkillsScope": "buildr skills render codex --scope <scope> --target <dir>",
        "runtimeCheckScope": "buildr runtime check codex --scope <scope> --target <dir>",
        "installProductSkill": "buildr skill install codex --target <dir>"
      }
    }
  },
  "unsupportedAgentGuidance": {
    "message": "Buildr 暂不支持未列出的 Agent runtime 自动渲染。",
    "nextStep": "请联系 Buildr 作者反馈该 Agent。",
    "mustNotUseFallbackAdapter": true
  }
}
```

备选方案是让 Agent 解析 `buildr --help` 或 `package/manifest.yml`。这两种方式都不够稳定：help 面向人类扫描，manifest 是产品内部发布边界，不应该成为 Agent runtime 选择的主要 API。

`recommendedCommands` 是给 Agent 的 runtime-specific 建议命令模板，目的是减少拼错命令、漏传 `--agent` 或 `--scope` 的概率。它不是完整 CLI schema，也不替代 `buildr --help` 和子命令 help。

### 2. Agent id 严格匹配支持矩阵

`--agent` 只接受 asset id 风格的值：字母、数字、点、下划线和短横线。值必须大小写敏感地匹配 `runtime list --json.supportedAgents` 才算支持。`Codex` 不自动归一为 `codex`，而是 unsupported Agent。

如果 Agent 无法可靠识别自身 runtime，它不得构造 `unknown`、`generic` 等通用 id，也不得猜测 adapter。它可以运行不带 `--agent` 的 `doctor --json` 做兼容诊断，但不得执行 runtime render/sync/check。

### 3. `doctor` 使用 `--agent <agent>` 过滤 runtime 诊断

`buildr doctor --agent codex --json` 只运行 Codex runtime checker；`--agent claude-code` 只运行 Claude Code runtime checker。非当前 Agent 的 runtime 状态不进入 `findings` 和 `nextSteps`，避免把团队中其他 Agent 的未渲染状态误报给当前 Agent。

`--agent` 只过滤 adapter，不改变 scope 发现逻辑。不传 `--scope` 时仍按现有规则检查 workspace root 和已发现 Project scopes；传 `--scope projects/foo` 时只检查该 Buildr scope 的 runtime 覆盖闭包。修复建议必须带精确 scope，例如 `buildr skills render codex --scope projects/foo --target .`。

未传 `--agent` 时保留兼容行为，仍可聚合所有已实现 adapter；但 Buildr Skill 和 bootstrap guide 的推荐路径应优先传入当前 Agent。

### 4. 不支持 Agent 不运行 adapter checker

当 `doctor --agent <unsupported>` 收到格式合法但不受支持的 adapter id 时，doctor 不尝试执行任何 runtime checker，也不因为缺少该 runtime 文件而失败。它输出 warning，整体 summary 计入 warning，退出码保持 0，并进入 `nextSteps`。

unsupported finding 使用面向用户和 Agent 的短文案：

```text
Buildr 暂不支持当前 Agent runtime 的自动渲染。请联系 Buildr 作者反馈该 Agent。
```

JSON finding 还必须包含：

- `userActionRequired: true`
- `mustNotUseFallbackAdapter: true`
- 当前请求的 `agent`
- 支持的 Agent 列表或可供 Agent 读取的支持矩阵引用

### 5. Adapter render 能力清单固定为五类

每个 Agent adapter 必须围绕以下能力声明实现情况：

1. `rules-entry`：规则入口渲染或原生读取声明。Codex 可用 `native` mode 表示原生读取 `AGENTS.md`，不需要写规则桥接文件；Claude Code 通过 bridge 文件实现。
2. `product-buildr-skill`：产品入口 Buildr Skill 安装。继续使用现有 `buildr skill install <agent>`，不新增安装入口。
3. `workspace-project-skills`：根据 workspace/project `skills/manifest.yml` 渲染 Skills。`--scope projects/foo` 表示 root + project foo 的 Skill 闭包。
4. `skill-install-plans`：对 Buildr 不能直接安装、需要 Agent action 的 Skill，生成 Agent-readable 安装计划。Agent 能安装就安装，安装不了再反馈给用户。
5. `runtime-check`：检查上述 runtime 渲染结果的 missing/stale/conflict/warning 状态，并提供精确 scope 的 repair commands。

Capability 可以是 `native`、`rendered`、`install`、`plan`、`diagnostic` 等模式，不要求每类能力都写文件。

### 6. `sync` 语义收窄到 Buildr 产品能力和 workspace 入口

`buildr sync <agent> --target .` 表示同步 Buildr 产品能力，并准备当前 Agent 的 workspace 入口 runtime。它不是 Project scope 同步工具。

Project scope 的 rules/Skills runtime 覆盖缺失时，由 `doctor --agent <agent>` 发现，并建议显式运行 `render`、`skills render` 或 `runtime check` 的 `--scope projects/foo` 命令。

如果 `sync` 保留 `--scope` 参数，该参数只影响 sync 内部 runtime render 阶段，不改变 Buildr 产品能力同步范围。

### 7. runtime render 资产范围明确化

Buildr runtime render 只覆盖 Agent 为了消费 Buildr workspace 所需的运行入口：

- 规则入口或桥接：例如 Codex 原生读取 `AGENTS.md`；Claude Code 生成 `CLAUDE.md` reference bridge。
- 产品入口 Buildr Skill：让支持 Skills runtime 的 Agent 学会维护 Buildr。
- workspace/project Skills：由 `skills/manifest.yml` 和 Skill 源资产渲染到 Agent runtime。
- Agent 安装型 Skill 计划：当某个 Skill 需要 Agent 手动解析或安装时，render 生成 Agent-readable 安装计划。
- runtime check：对当前 adapter 的渲染结果进行专项检查。

Commands、Project registry、Service registry、OpenSpec、knowledge、practices 和 docs 是 Buildr 源资产。Agent 通过规则和 workspace 路径读取它们，不作为默认 runtime render 结果复制。

术语上统一使用 registry 指索引清单，例如 root `projects/manifest.yml` 是 Project registry，Project 下 `services/manifest.yml` 是 Service registry；registry 条目内部描述 title、description、repo、path 等 metadata。这样避免把同一层级的 manifest 一处叫 registry、一处叫 metadata。

### 8. 支持矩阵集中声明

实现上应集中维护 runtime adapter 描述，避免 `usage()`、`doctor`、`sync`、`render`、`skill install`、runtime checker 和文档各自硬编码支持列表。最小实现可以先在 `tools/buildr` 内集中声明常量；后续再抽出模块。

### 9. 所有命令 help 必须有效且无副作用

Agent 会用 `--help` 探索 CLI 能力。所有已支持命令和多级子命令的 `--help` 都必须有有效输出，并以成功状态退出；不得执行初始化、创建 Project、render、sync 或其他状态变更。

这条规则直接修复已观察到的 onboarding 摩擦：Agent 为了确认 `buildr init` 参数而运行 `buildr init --help`，结果触发了 workspace 初始化。这个行为会破坏 Agent 谨慎探索命令的假设，必须纳入当前 change 的 CLI 可用性范围。

实现时应整理当前 CLI surface，并为每个公开入口提供针对性 help，而不是全部回退到一段总 usage。最小验证范围包括 `init`、`project create`、`service create`、`doctor`、`runtime list`、`runtime check`、`sync`、`render`、`skill install`、`skills add/remove/render`、`commands add/remove/check`、`builtin list/uninstall/restore`、`update/check`、`package check/build` 和 `bootstrap guide`。

## Risks / Trade-offs

- [Risk] `--agent` 和现有 `runtime check <agent>` 的概念重复。→ Mitigation：`doctor --agent` 是聚合诊断过滤；`runtime check <agent>` 仍是专项 adapter 细查入口。
- [Risk] 未传 `--agent` 时继续聚合所有 runtime，仍可能吵。→ Mitigation：保持兼容，同时把 README、Skill、bootstrap 和 init next steps 改为推荐传入当前 Agent。
- [Risk] Agent 身份无法自动可靠识别。→ Mitigation：Buildr 不强行探测运行时进程；让 Agent 根据自身产品上下文选择 `<agent>`，并用 `runtime list --json` 校验是否支持。
- [Risk] 不支持 Agent 的用户无法继续自动渲染。→ Mitigation：明确“不支持”，提示联系 Buildr 作者反馈该 Agent；新增 adapter 的工作以 render 能力清单为准，避免设计复杂手工流程。

## Migration Plan

1. 新增 runtime adapter 发现入口和集中支持矩阵。
2. 扩展 doctor 参数解析与 JSON 输出，支持 `--agent <agent>`。
3. 更新 Buildr Skill、bootstrap guide、README 和 init/sync 文案。
4. 更新 CLI help 行为，确保所有公开命令和子命令 help 有有效输出且无副作用。
5. 更新验证脚本覆盖 `runtime list`、`doctor --agent codex`、`doctor --agent claude-code`、`doctor --agent unsupported-agent` 和全 CLI help surface。
6. 保留未传 `--agent` 的兼容行为，避免现有脚本立刻失效。

## Resolved Decisions

- 不约定通用 unsupported id；Agent 如果无法识别自身 runtime，应直接说明无法匹配支持矩阵，而不是构造 `generic` 或 `unknown` 作为标准 id。
- `doctor --agent <unsupported>` 的整体 summary 计为 warning，因为用户需要明确知道当前 Agent 不支持自动 runtime render。
- 不支持没有 adapter 的 Agent 自动渲染；unsupported 场景不做 `.buildr/skills/buildr/SKILL.md` 导出，也不设计手工完整渲染路径。

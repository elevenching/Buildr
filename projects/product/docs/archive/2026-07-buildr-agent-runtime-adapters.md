> Archived historical note. Not a current Buildr product source of truth.

# Buildr Agent Runtime Adapters

本文定义 Buildr 资产如何渲染为各类 Agent 的本地 runtime。它是设计文档，不是日常运行规则。

## 原则

```text
Install to Buildr, render to Agent runtime.
```

- Buildr 资产是源头；Agent runtime 是消费端产物。
- 规则、记忆、实践和 Skills 长期保存在 Buildr root 或项目资产目录。
- `.claude/`、`CLAUDE.md`、`.cursor/`、`.qoder/`、`.codex/` 等 runtime 默认不提交。
- 手写 runtime 与 Buildr managed 文件冲突时，先把长期内容迁移回 Buildr 资产源，再重新 render。
- Buildr workspace 是 Agent 工作入口；service repo 是 workspace 管理的代码资产，不作为 MVP 的独立 runtime 入口。

## 三阶段模型

| 阶段 | 含义 | 示例 |
|------|------|------|
| Install | 安装到 Buildr 资产源或产品内置 Skill 到 runtime | 产品内置 `package/agent-skills/`、根 `skills/`、项目 `skills/`、`buildr skill install claude-code` |
| Resolve | 按 scope 解析有效资产 | 产品内置 Skills + root 层 < 项目层 |
| Render | 输出到当前 Agent runtime | `.claude/skills/`、`CLAUDE.md` |

## Agent-aware onboarding

Bootstrap guide 不应把某个 adapter 的 render 命令当成所有 Agent 的固定步骤。Agent 完成 `buildr init` 和 `doctor --json` 后，先判断自己如何读取规则：

| Agent 类型 | 规则读取方式 | Buildr runtime 动作 |
|------------|--------------|---------------------|
| 原生读取 `AGENTS.md` 的 Agent，例如 Codex | 直接消费 Buildr 标准规则资产 | 跳过 rules render；如存在该 Agent 的 Skills adapter，只处理 Skills runtime |
| 需要桥接文件的 Agent，例如 Claude Code | 通过 adapter 生成桥接文件 | 先 runtime check，缺失或过期时按提示执行 skill install / rules render / skills render |
| 尚无 adapter 的 Agent | 只能读取标准资产 | 使用 `AGENTS.md`、`doctor --json` 和 Buildr workspace 资产继续工作，不生成未知 runtime |

Codex 当前不需要 `CLAUDE.md`，因此 Codex Agent 不应执行 `buildr rules render claude-code`。Claude Code adapter 仍然维护 `CLAUDE.md` 和 `.claude/skills/`。

## scope 与 target

| 概念 | 含义 | 示例 |
|------|------|------|
| scope | 本次任务所属 root、项目或服务 | `.`、`projects/meat`、`projects/foundation/openapi` |
| target | 当前 Agent 打开的目录 | `.`、`projects/meat` |

## Claude Code adapter

当前命令：

```bash
buildr skill install claude-code --target <target>
buildr runtime check claude-code --scope <scope> --target <target>
buildr rules render claude-code --scope <scope> --target <target>
buildr skills render claude-code --scope <organization-or-project-scope> --target <target>
```

使用顺序：

1. 先运行 `runtime check`。
2. `missing` 或 action-required `stale` 时按提示执行 `skill install`、`rules render` 或 `skills render`。
3. `conflict` 时先迁移手写内容，再按提示修复。

### rules render

- scope 支持 root、项目和项目服务。
- 为当前 scope 涉及的每个 `AGENTS.md` 生成同目录 `CLAUDE.md`。
- `CLAUDE.md` 只导入同目录 `AGENTS.md`，不复制规则全文，不聚合上下级规则。
- 只覆盖 `CLAUDE.md` 中的 Buildr managed block；用户可以在 managed block 外添加 Claude Code 专属内容。

生成模板保持极简：managed block 边界、`type: reference`、`source: AGENTS.md` 和 `@AGENTS.md`。reference bridge 不写规则内容 hash。

### skill install

- `buildr skill install claude-code --target <target>` 只安装 Buildr 产品内置 Skill。
- 该命令不需要 workspace 已初始化，也不读取 workspace/project `skills/manifest.yml`。
- 输出到 `<target>/.claude/skills/buildr/SKILL.md`。
- 目标文件存在且不是 Buildr managed 文件时拒绝覆盖。

### skills render

- 产品内置 Agent Skills 位于 `package/agent-skills/`，由 `package/manifest.yml` 的 `agentSkills` 声明。
- 产品内置 Buildr Skill 是 Buildr 产品随包 runtime 能力，不会复制到用户 workspace `skills/` 作为源资产。
- `skills render` 只渲染 workspace/project Skills；产品内置 Buildr Skill 使用 `skill install` 安装或修复。
- `buildr init` 默认带出 OpenSpec workspace Skills 源资产，供支持 Skills runtime 的 Agent 通过 `skills render` 使用。
- Skills 源只支持 root 层和项目层。
- root 层先加载，项目层覆盖 root 层；同层重复 `id` 报错。
- 产品内置 Skill 与 workspace/project Skill 的 `id` 冲突时报错，不静默覆盖。
- 输出到 `<target>/.claude/skills/<manifest-path>/SKILL.md`，保留 workspace/project `skills/manifest.yml` 中声明的目录结构。
- 没有声明 workspace/project Skills 时不生成文件，并输出明确提示。
- 当 target 是服务目录时，输出只是 runtime 投射，不表示服务层拥有 Skills 源。
- `SKILL.md` frontmatter 必须在文件开头；managed 标记放在 frontmatter 后。

最小 manifest：

```yaml
skills:
  - id: openspec-explore
    path: openspec/openspec-explore
```

### runtime check

- 只读检查，不写 runtime 文件。
- 检查当前 scope 的规则桥接 managed block 与 Skills runtime 是否存在、managed、最新。
- `@AGENTS.md` reference bridge 只校验引用结构、引用路径和目标文件存在；`AGENTS.md` 内容变化不会让 reference bridge stale。
- 旧 reference bridge 中的 hash 过期只输出 `runtime.reference_bridge_metadata_stale` info，不影响 exit code，也不产生必需修复命令。
- exit code：`0` ok，`1` missing/stale，`2` conflict/配置错误。
- 服务 scope 的 skills 建议回退到所属项目。

修改 root/项目 Skills 或 manifest 后，先运行 runtime check；缺失或过期再 render。修改参与当前 scope 的 `AGENTS.md` 后，reference bridge 会实时读取最新内容，不需要仅为刷新 hash 执行 render；只有引用结构缺失、损坏或指向错误时才 render。未来系统级 hook 完成后，迁移这条手动规则。

`buildr init` 不自动写入 `.claude/skills/` 或其他 Agent runtime。Buildr Skill 是支持 Skills runtime 的首选入口；`buildr bootstrap guide` 作为 Skill 不可用、未安装或 runtime 损坏时的兜底入口。支持 Skills 的 runtime 可以通过 `buildr skill install <agent>` 获得 Buildr 产品内置 Skill。

## Git 目录调整

目录重构必须保证 Git 仓库继续可用：

1. 移动前确认普通目录、独立 Git 仓库和 submodule。
2. Buildr 自身跟踪文件用 `git mv`。
3. 独立 Git 仓库不要当普通目录盲移。
4. 同步更新 README、AGENTS、docs、templates 和 OpenSpec 路径。
5. runtime 目录必要时删除后重新 render。

## 暂不支持

- Cursor、Qoder adapters。
- Codex Skills adapter；Codex 当前通过原生 `AGENTS.md` 使用 Buildr 规则。
- lockfile、版本解析、远程 registry。
- 用户级 `~/.claude/skills` 安装。
- 系统级 hook 自动 render。
- 权限裁剪。
- service 级 Skills 源。
- Maven 式传递依赖解析。

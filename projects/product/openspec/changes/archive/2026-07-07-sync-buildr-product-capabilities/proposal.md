## 背景

用户使用 Agent 升级 Buildr 时，目标应该只有一个：把最新 Buildr 产品入口和最新 Buildr 产品能力交付到当前 workspace，并让当前 Agent runtime 可以直接使用。

当前 Buildr 已经有 `buildr skill install claude-code`、`rules render`、`skills render` 和 `doctor --json`，但产品入口和产品能力仍分散在 CLI、产品内置 Buildr Skill、默认规则、默认 Skills、Commands 清单和不同 Agent runtime 中。随着 Codex 支持当前打开项目根目录下的 `.agents/skills`，Buildr 需要把 Claude Code 和 Codex 都视为一等 adapter，通过统一同步和投射流程交付最新产品能力。

用户对 Agent 说“使用 Buildr 管理项目”时，本质是把 README 或说明入口交给 Agent，Agent 应完成 Buildr CLI 安装、Buildr Skill 安装和 workspace 初始化。用户对 Agent 说“更新 Buildr”时，应由 Buildr Skill 的 description 和正文感知该意图，引导 Agent 先更新 Buildr CLI，再重新安装产品内置 Buildr Skill，最后同步 Buildr 内置能力并 render 当前 Agent runtime。

Buildr 内置能力分两类：基础能力和推荐能力。基础能力维系 Buildr workspace 正常运行，不能卸载；推荐能力是默认工作流，可卸载、可保留本地修改。规则、技能和命令都应通过 manifest 管理，让 update、sync 和 doctor 能解释当前状态。

## 变更内容

- `AGENTS.md` 继续作为每个 scope 的规则入口，不改名；Codex 可原生读取它。
- 根 `AGENTS.md` 只保留 Buildr required block，引用 `rules/buildr/core.md`。
- `rules/buildr/core.md` 是唯一 required Rule，不能卸载；损坏或缺失时 update/sync 恢复。
- 新增 manifest-first 资产模型：
  - `rules/manifest.yml` 管理内置和用户 Rules。
  - `skills/manifest.yml` 管理内置和用户 Skills。
  - `commands/manifest.yml` 管理内置和用户 Commands 声明。
- `rules/manifest.yml` 必须声明规则 metadata，尤其是 `description`，用于说明规则适用场景，支持 Agent 像 Skill 一样渐进式读取规则。
- Buildr 内置能力使用 `source: buildr` 标记，内置项排在用户项之前。
- 内置 Rules 和 Skills 的源文件放在 `rules/buildr/`、`skills/buildr/`；Commands 只有 `commands/manifest.yml`，不新增 `commands/buildr/` 文件层。
- 非每次会话都必须遵守的流程、工作流和操作手册应迁入 Skills；Rules 只保留约束、边界、安全规则和资产读取规则。
- `buildr update --target <dir>` 同步 Buildr 产品入口和内置能力：
  - CLI 更新/检查入口。
  - 产品内置 Buildr Skill。
  - Buildr 内置 Rules、Skills、Commands。
  - required 能力缺失或损坏时恢复。
  - optional 内置能力卸载后不还原；修改后不静默覆盖。
- `doctor --json` 报告内置能力、manifest 对齐、兼容状态和 runtime 状态。
- 新增统一 runtime adapter 主路径：
  - `buildr render codex --target <dir>`
  - `buildr render claude-code --target <dir>`
  - `buildr sync <agent> --target <dir>` 作为 Agent 常用组合入口：update check、doctor、必要兼容提示、render。
- Codex adapter 支持：
  - 原生读取 scope `AGENTS.md`。
  - Skills 投射到 Codex 当前打开项目根目录的 `.agents/skills/`。
- Claude Code adapter 继续支持：
  - `CLAUDE.md` 使用 Claude Code runtime 格式桥接 scope `AGENTS.md`。
  - Skills 投射到 `.claude/skills/`。
- 已有 workspace 升级兼容：
  - 新 workspace 直接使用 `AGENTS.md` required block、`rules/buildr/core.md` 和 manifest-first 模型。
  - MVP 阶段不实现专门的 `migrate` 命令。
  - 已有 `AGENTS.md` 只修复 required block，不覆盖用户正文。

## Capabilities

### New Capabilities

- `buildr-product-capability-sync`: 定义 Buildr 内置能力层、update/sync 主路径、manifest 状态、可卸载 optional builtins、升级兼容和 Agent adapter 投射目标。

### Modified Capabilities

- `workspace-first-runtime-projection`: 明确 `AGENTS.md` 是 scope 规则入口；adapter render 只负责按 Agent 能力桥接规则并投射 Skills。
- `product-agent-skills`: 扩展产品内置 Buildr Skill 同步语义，并支持 Codex `.agents/skills` runtime。
- `buildr-package-assets`: package manifest 需要声明内置 Rules、Skills、Commands、required/optional 和目标 runtime；version/hash 是可选元数据。
- `agent-readable-doctor`: doctor 需要报告 builtins、manifest 对齐、兼容状态和 adapter runtime 状态。
- `root-organization-workspace`: init 和已有 workspace 升级需要兼容新版 `AGENTS.md` required block 与 manifest 模型。

## Impact

- 影响 `package/manifest.yml`、`package/workspace/` baseline、`package/agent-skills/buildr/SKILL.md`、`package/bootstrap/guide.md` 和 `package/bootstrap/bootstrap.contract.yml`。
- 影响 `buildr update`、`doctor`、`render`、`sync` 相关 CLI 设计。
- 影响 Claude Code runtime adapter，并新增 Codex runtime adapter。
- 需要调整 `package/workspace/AGENTS.md`：其主体迁入 `rules/buildr/core.md`，根 `AGENTS.md` 保留 required block 和用户可编辑正文。
- 需要新增或调整 `rules/manifest.yml`，并将现有产品发布的 workspace rules 迁入 `rules/buildr/`。
- Buildr 产品能力包含内置命令行工具声明，但不包含默认安装或升级外部命令行工具本体；Commands 仍只做声明、检查和安装提示，安装/升级必须由用户授权。

## 1. OpenSpec 与产品契约

- [x] 1.1 增加 Buildr 内置能力层、update/sync 和 adapter render 的规格。
- [x] 1.2 更新 workspace-first runtime projection，明确 `AGENTS.md` 是 scope 规则入口，adapter 只做 runtime 桥接和 Skills 投射。
- [x] 1.3 更新 package assets 规格，声明 builtins 发布边界和 package manifest 校验规则。
- [x] 1.4 更新 doctor 规格，增加 builtins、manifest 对齐、required block 和 adapter runtime 状态。
- [x] 1.5 更新 product-agent-skills 规格，明确产品内置 Buildr Skill 与 builtins Skills 的同步和冲突边界。

## 2. Package 与 Builtins

- [x] 2.1 设计 `package/manifest.yml` 的 builtins 声明字段，兼容现有 `agentSkills` 和 `skillSources`。
- [x] 2.2 将现有 package workspace baseline rules 迁入 `rules/buildr/`，并把 `runtime.md` 内化进 `core.md`。
- [x] 2.3 为 Rules manifest entry 定义 metadata 字段和校验规则，尤其是用于渐进读取的 `description`。
- [x] 2.4 将 Buildr 内置 Commands 设计为 `commands/manifest.yml` 中的 `source: buildr` entries。
- [x] 2.5 扩展 package check，校验 builtins 源路径、required/optional、可选 hash/version、runtime 支持和 forbidden patterns。
- [x] 2.6 新增或整理 Buildr 内置 Skills 到 package builtins 源。

## 3. Builtin 状态与 CLI

- [x] 3.1 在 `rules/manifest.yml`、`skills/manifest.yml` 和 `commands/manifest.yml` 中记录 builtin 状态。
- [x] 3.2 实现 builtin 状态识别：installed、modified、uninstalled、missing，并禁止卸载 required 能力。
- [x] 3.3 实现 `buildr builtin list/uninstall/restore`。
- [x] 3.4 实现 `buildr update check --json`。
- [x] 3.5 实现 `buildr update --target <dir>`，同步产品入口和内置能力，恢复 required 能力，不静默覆盖 optional 修改。
- [x] 3.6 实现 optional Rule/Skill 卸载时删除源文件和 runtime 投射，Command 卸载只更新 manifest。

## 4. Codex 适配器

- [x] 4.1 新增 `buildr render codex --target <dir> [--scope <scope>]`。
- [x] 4.2 Codex 规则使用 scope `AGENTS.md` 原生入口，不生成 managed AGENTS runtime。
- [x] 4.3 将 Skills 投射到当前 Codex 打开项目根目录的 `.agents/skills/<skill-id>/`。
- [x] 4.4 增加 Codex runtime check，校验根 `AGENTS.md` required block 和 `.agents/skills`。
- [x] 4.5 在 doctor 中报告 Codex runtime 缺失、过期、冲突和兼容提示。

## 5. Claude Code 适配器

- [x] 5.1 调整 Claude Code render，使其从同一投射计划读取内置能力和用户资产。
- [x] 5.2 保持 `CLAUDE.md` 只桥接 scope `AGENTS.md`，并投射 `.claude/skills`。
- [x] 5.3 明确 `@` 只属于 Claude Code adapter runtime 输出格式。
- [x] 5.4 在 doctor 中报告 Claude Code builtins/runtime 状态。

## 6. AGENTS.md 与 Rules Manifest

- [x] 6.1 为新 workspace 调整 init baseline：生成根 `AGENTS.md` required block、`rules/buildr/core.md` 和 `rules/manifest.yml`。
- [x] 6.2 识别已有 `AGENTS.md`，在 update/sync 时只修复 required block，不覆盖用户正文。
- [x] 6.3 实现 Rules manifest 对齐检查：未登记文件、登记缺文件、缺少 `description` 和 `rules/buildr/` 污染 warning。
- [x] 6.4 暂不实现 `buildr migrate agents`，只保留为后续能力方向。
- [x] 6.5 明确 Rules/Skills 分界：每次会话必须遵守的内容留在 Rules，任务流程迁入 Skills。

## 7. Sync 主路径

- [x] 7.1 实现 `buildr sync codex --target <dir>`。
- [x] 7.2 实现 `buildr sync claude-code --target <dir>`。
- [x] 7.3 遇到 modified optional builtin、manifest 对齐问题、外部 command 安装需求时停止自动修复并提示用户决策。
- [x] 7.4 sync 完成后运行 doctor，并输出 Agent-readable 下一步。

## 8. 文档与 Skill

- [x] 8.1 更新 `package/agent-skills/buildr/SKILL.md` 和 description，使其能感知“更新 Buildr”意图，并将 update/sync/render 作为 Buildr 产品升级主路径。
- [x] 8.2 更新 `package/bootstrap/guide.md`，说明 Skill 不可用时如何恢复和同步最新 Buildr 产品。
- [x] 8.3 更新 `package/bootstrap/bootstrap.contract.yml`。
- [x] 8.4 更新 `openspec/knowledge/buildr-current-state.md` 和产品文档。

## 9. 验证

- [x] 9.1 新增 Codex adapter MVP 验证：`AGENTS.md` 和 `.agents/skills`。
- [x] 9.2 新增 builtins 状态验证：installed、modified、uninstalled、missing。
- [x] 9.3 新增已有 workspace 兼容验证：已有 AGENTS 只修复 required block，不覆盖用户正文。
- [x] 9.4 新增 sync 主路径验证：Codex 和 Claude Code。
- [x] 9.5 运行 `tools/verify-buildr-product`。

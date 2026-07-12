## 1. 产品随包资产

- [x] 1.1 创建 `product/package/agent-skills/buildr/SKILL.md`，沉淀 Buildr Agent 使用流程。
- [x] 1.2 更新 `product/package/manifest.yml`，新增 `agentSkills` 声明 Buildr Skill id、路径和适用 runtime。
- [x] 1.3 确认 `buildr init` 不会把 `agent-skills/` 复制到目标 workspace `skills/` 目录。

## 2. CLI 解析与渲染

- [x] 2.1 扩展 package manifest 读取逻辑，解析并校验 `agentSkills`。
- [x] 2.2 扩展 `buildr skills render claude-code`，将适用的产品内置 Agent Skills 渲染到 `.claude/skills/`。
- [x] 2.3 保持 workspace/root/project Skills 的现有解析和渲染行为。
- [x] 2.4 在产品内置 Skill id 与 workspace/project Skill id 冲突时输出明确错误。

## 3. Runtime 检查与诊断

- [x] 3.1 更新 Claude Code runtime check，让输出能识别产品内置 Buildr Skill 的 missing/stale/conflict 状态。
- [x] 3.2 确认无 Codex Skills adapter 时，Codex 路径不会尝试渲染 Buildr Skill。
- [x] 3.3 确认 `doctor --json` 或 runtime check 输出能引导 Agent 使用现有 render 命令，而不是新增 bootstrap install 命令。

## 4. 文档与指南

- [x] 4.1 更新 `product/package/bootstrap/guide.md`，说明 Buildr Skill 是 runtime 能力，`bootstrap guide` 是首次发现入口。
- [x] 4.2 更新产品手册和 runtime adapter 文档，解释 `product/package/agent-skills/` 与 workspace `skills/` 的边界。
- [x] 4.3 更新 README 或 help 文案，保持 `buildr init` 纯粹、不自动写 runtime 的说明。

## 5. 验证

- [x] 5.1 更新 `buildr package check`，校验 `agentSkills` 源路径、`SKILL.md` 和 forbidden patterns。
- [x] 5.2 更新 `tools/verify-buildr-product-mvp`，覆盖 Buildr Skill 随包、render 和 init 不复制 Skill 的行为。
- [x] 5.3 运行 `openspec validate buildr-agent-skill --strict`。
- [x] 5.4 运行 `./buildr package check`、`./tools/verify-buildr-product-mvp` 和相关 Node 语法检查。

## 6. Guide 与 Skill 同步

- [x] 6.1 新增 `product/package/bootstrap/onboarding.contract.yml`，声明 guide 和 Buildr Skill 必须共同覆盖的 onboarding 关键内容。
- [x] 6.2 更新 `buildr package check`，按 onboarding contract 校验 guide 和 Buildr Skill。
- [x] 6.3 在 guide 与 Buildr Skill 中标明二者共同遵循 onboarding contract。

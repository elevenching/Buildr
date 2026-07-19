# Changelog

本项目遵循语义化版本。正式发布前的变更可以在 `0.1.x` 内调整，但会在 release notes 中说明用户可观察差异。

## Unreleased

- Breaking：Skill source 只在 workspace `skills/` 治理；Project 改用 `capabilities.yml` 表达 requirements、bindings 与 applicability，不再创建或合并 Project Skill source。
- `skills render` 新增 `--destination workspace|user`；`--target` 始终表示 source workspace，`init`/`sync` 只维护 workspace destination。
- Skills manifest 升级为 `buildr.skills/v3`，新增稳定 asset/source identity、v2 projection receipts、有效 Skills inventory、同名冲突零写入 preflight，以及 legacy Project assets 的 `--check/--apply` 事务迁移。

## 0.1.0-rc.5 - 2026-07-17

- 统一 Buildr 更新与 workspace 同步意图：Agent 能明确区分 CLI/Skill 更新和 `buildr sync`，并在 Git tree 变化后用 doctor 判断是否需要同步当前工作环境。
- 加固候选版发布流程：发布准备绑定 canonical worktree、最终候选 tree 和历史衔接门禁，GitHub Release 说明改为从对应 CHANGELOG 章节生成。
- 新增任务驾驶舱：复杂、长期或跨阶段任务可维护稳定的只读 HTML 全景，持续呈现目标、进度、结论、下一步和阻塞。
- 移除随包最小 workspace 示例，减少与公开文档重复的维护入口。
- 修正 `0.1.0-rc.4` 的发布范围，暂不发布任务资产审查能力。

## 0.1.0-rc.3 - 2026-07-15

- 强化 Agent 端到端工作引导：在 pull、rebase、checkout 和 worktree 切换等 Git tree 变化后先运行 doctor，再按诊断结果决定是否同步当前 Agent 工作环境。
- 重写中英文公开 README，以“让 Agent 越做越多，越做越好”直接表达产品价值，并明确从产品、开发到发布的端到端工作场景。
- 收敛发布 worktree 生命周期：远端已安全承载候选提交且无后续本地动作时，自动清理本地发布 worktree 和任务分支。

## 0.1.0-rc.2 - 2026-07-14

- 将 Buildr 的公开定位收敛为面向组织和 Agent 的工作资产治理系统，明确 Buildr 管理有组织的项目信息，而不是模型 context window。
- 新增 Cursor、Qoder、TRAE、TRAE Work 和 WorkBuddy runtime adapter，并用 trait catalog 统一 adapter 能力、检查与投射模型。
- 修复 Project scoped Rules render 可能清理无关 Project 投射的问题，并补充不同 cleanup 实现族的隔离回归。
- 将产品验证拆分为 fast、affected 和 candidate 三层入口；候选验证复用 npm tarball 并采用有界并行，显著缩短完整验证耗时。
- 增加 Buildr 候选版/稳定版发布 Skill，完善 GitHub trusted publishing、发布后 registry 与 GitHub Release 核验流程。

## 0.1.0-rc.1 - 2026-07-13

- 建立 Organization/Root、Project 和 Service 资产模型。
- 提供 Rules、Skills、Commands、Components、OpenSpec、doctor 和 source transaction 能力。
- 支持 Codex 与 Claude Code runtime projection。
- 支持从干净开发 checkout 或 npm tarball完成 Agent onboarding。
- 支持 Service 显式 branch intent 与远端 Skill 有界读取。
- 补齐 MIT License、公开 CLI reference、已知限制、贡献与安全说明及 GitHub Actions 验证。
- 固定官方源码为 `elevenching/Buildr`、npm identity 为 `@buildr-ai/buildr`，并提供中文/英文 README。
- 增加开源候选安全扫描、tag/version/dist-tag 契约和 OIDC-ready release workflow。

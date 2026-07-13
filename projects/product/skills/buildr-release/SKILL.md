---
name: buildr-release
description: 准备、检查、发布和验证 Buildr 候选版或稳定版时使用，覆盖版本与发布材料更新、dev 到 main 候选收敛、release tag、GitHub Actions、npm dist-tag、GitHub Release、失败恢复和发布后验证；用户提到准备发布、发布 RC、发布候选版、发布稳定版、检查是否可发布、继续或排查 Buildr 发布时触发。
---

# Buildr Release

本 Skill 只编排 Buildr 自举 workspace 的产品发布，不作为 Buildr 内置能力分发。发布事实以当前仓库、GitHub、npm 官方 registry 和实际 workflow 状态为准，不把本文中的示例版本当成当前版本。

## 解析意图与授权

先把用户意图固定为以下一种，不在阶段之间自动升级：

- `检查候选版` 或 `检查稳定版`：只读检查发布条件和阻塞项，不修改文件、分支、tag 或外部状态。
- `准备候选版` 或 `准备稳定版`：形成已验证并进入 `main` 的发布候选；允许维护版本和发布材料、完成开发任务收尾及 `dev -> main` PR，但必须停在创建 tag 之前。
- `发布候选版` 或 `发布稳定版`：在对应准备状态成立后创建并推送 release tag，跟踪受保护发布 workflow，并验证 npm 与 GitHub Release。
- `继续发布` 或 `排查发布`：先查询 Git、GitHub Actions、GitHub Release 和 npm 状态，再从可证明的中断点继续；不得重复已经成功的不可逆步骤。

候选版与稳定版是不同授权。用户只说“发布”但无法从当前上下文唯一确定类型或版本时，停止并确认；不得默认选择稳定版。

## 建立发布事实

1. 从 Buildr workspace root 解析 Product Project，不根据当前目录猜测。
2. 读取 root 与 Product scope 的 `AGENTS.md`、Buildr Core、`projects/product/docs/release-checklist.md`、`projects/product/package.json`、`projects/product/package-lock.json`、CHANGELOG 和 `.github/workflows/publish.yml`。
3. 检查工作区、worktree、`dev`、`main`、远端、现有 tags、对应 GitHub Releases 和最近 publish workflow。
4. 使用 npm 官方 registry 查询 package 版本和 dist-tags；本机 install 镜像不能替代发布状态事实。
5. 确认当前版本、目标版本、发布类型和预期 npm tag：prerelease 使用 `next`，稳定版使用 `latest`。
6. 证明目标 package version、Git tag 和 GitHub Release 尚不存在。已经发布的版本不得覆盖或复用。

版本不明确时，根据现有版本提出下一合法版本并让用户确认。RC 问题使用新的 prerelease 序号；稳定版本问题使用新的 patch，不把 unpublish 当作常规回滚。

## 检查发布条件

只读检查至少覆盖：

- 目标版本与 tag、npm tag 的映射一致。
- 目标提交可从 `dev` 收敛到 `main`，没有未处理改动或未完成发布范围。
- CHANGELOG、README 当前版本入口、known limitations 和 release checklist 与目标类型一致。
- CI、trusted publisher、`npm-production` Environment 和 publish workflow 仍存在。
- 候选版没有误用 `latest`；稳定版没有误用 `next`。
- 稳定版的 RC 反馈、发布阻塞 Issue 和已知限制已经明确评估。

输出 `ready`、`blocked` 或 `already-published`，并列出证据和下一步。检查意图不得顺带修复。

## 准备发布

准备阶段是普通开发任务，遵循 `task-triage`、`task-worktree`、项目验证和 `task-finish`：

1. 创建独立 task worktree；不得在 `main` 直接准备发布材料。
2. 使用无 tag 的版本更新方式同步 `package.json` 和 `package-lock.json`。
3. 更新 CHANGELOG、README 当前发布入口、known limitations 和 release checklist；只记录真实发布范围和仍存在的限制。
4. 确认 lockfile 不因本机 install 镜像写入私有或非 canonical registry URL，`publishConfig.registry` 保持 npm 官方 registry。
5. 运行受影响验证，再对冻结候选运行一次完整产品验证；读取 timing summary 并报告总耗时、最慢阶段、失败阶段和路径。
6. 使用 `task-finish` 把准备改动集成并推送到 `dev`。
7. 创建 `dev -> main` PR，等待必须的 CI 和 branch protection，通过后按仓库策略合入 `main`。
8. 确认 `main` 指向已验证内容，版本和发布材料一致。
9. 明确报告“准备完成，尚未创建 tag，尚未触发 npm 发布”，然后停止。

准备候选版时使用 prerelease 版本并声明 `next`；准备稳定版时移除 prerelease 后缀，确认稳定发布日期和 `latest`，并额外复核 RC 反馈是否收敛。

## 发布版本

只有用户明确要求发布对应候选版或稳定版时执行：

1. fetch 远端并确认本地 `main`、`origin/main` 和已准备的候选提交一致；工作区必须干净。
2. 再次执行只读发布检查，确认目标 npm version、Git tag 和 GitHub Release 不存在。
3. 确认 `package.json` version 与将创建的 `v<version>` 完全一致。
4. 在已验证的 `main` 提交创建 annotated 或仓库约定的 release tag，并普通 push 该 tag；不得 force push 或移动已有 tag。
5. tag push 后只使用 GitHub-hosted publish workflow。不得因为 workflow 等待、失败或 npm 认证问题改为本机 `npm publish`。
6. workflow 等待 `npm-production` Environment 审批时，向用户报告审批入口并暂停；审批必须由用户完成。
7. 审批后继续跟踪同一 workflow，直到验证、registry check、publish 和 GitHub Release 步骤结束。
8. 使用 npm 官方 registry 验证目标版本存在且 dist-tag 正确；验证 GitHub Release 指向相同 tag，RC 必须是 prerelease，稳定版必须不是 prerelease。
9. 用明确版本或正确 dist-tag 执行正式 tarball 安装 smoke；不得用本地 checkout 冒充发布后验证。

发布候选版不得主动把 `latest` 当作稳定版更新。发布稳定版后确认 `latest` 指向稳定版本，并报告 `next` 的当前状态，不擅自移动或删除它。

## 中断与失败恢复

- tag 尚未 push：修复候选后重新验证；不要沿用内容已变化的验证结果。
- tag 已 push、workflow 未开始或失败：保留 tag，检查 workflow 和 Environment，不删除 tag 后重发。
- npm 版本已经存在：不得再次 publish；确认内容和 provenance，再恢复尚未完成的 GitHub Release 或验证步骤。
- GitHub Release 已存在：不得重复创建；核对它与 npm version、tag 和 prerelease 状态。
- push、PR merge、workflow、npm 或 GitHub 状态不一致：停止后续不可逆动作，报告已完成步骤、当前事实和最小恢复路径。
- 发布后发现问题：候选版发布新 RC；稳定版发布 patch，必要时 deprecate 或移动 dist-tag，不默认 unpublish。

## 完成报告

报告以下事实：

- 发布类型、version、Git tag、npm dist-tag 和 commit。
- 准备阶段是否停在 tag 前，或发布阶段的 workflow run 与 Environment 审批状态。
- 完整验证结果和 timing summary。
- npm 官方 registry、GitHub Release 和安装 smoke 结果。
- 未完成步骤、阻塞项、回滚或后续版本建议。

不要把“PR 已创建”“tag 已推送”“workflow 已启动”单独视为发布完成。

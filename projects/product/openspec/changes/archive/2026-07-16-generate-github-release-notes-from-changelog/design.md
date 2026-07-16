## Context

Buildr 根 `CHANGELOG.md` 已按版本维护具体发布范围，但 `.github/workflows/publish.yml` 当前在 npm publish 后单独调用 `gh release create --generate-notes`。GitHub 自动说明依赖 tag 间识别到的 PR；当整个候选通过一个 squash release PR 合入 `main` 时，Release body 只剩发布 PR 标题，无法反映 changelog 中的用户可观察变化。

本变更跨越 release verifier、GitHub Actions、低成本契约测试、发布检查清单和 Product Project 的发布 Skill。发布 workflow 已包含不可逆的 npm publish，因此 release notes 的生成与校验必须位于 publish 之前。

## Goals / Non-Goals

**Goals:**

- 将根 `CHANGELOG.md` 中与目标 package version 精确匹配的章节作为 GitHub Release body 的事实来源。
- 对缺失、重复、空内容或版本错配 fail closed，并保证失败发生在 npm publish 之前。
- 保持 prerelease、stable、npm dist-tag 和现有 Environment/OIDC 发布边界不变。
- 让发布准备阶段可以本地预览 workflow 将使用的最终 notes，并用低成本测试固定契约。

**Non-Goals:**

- 不改变 `dev -> main` 的 squash 合并策略。
- 不引入 changesets、release-please、changelog fragment 或新的第三方依赖。
- 不回写或重新发布历史 GitHub Release。
- 不保证从 Git 提交或 PR 标签自动推导用户可观察变化；这些内容继续由维护者在 `CHANGELOG.md` 中编写。

## Decisions

### 1. `CHANGELOG.md` 是具体发布说明的唯一人工维护来源

release notes 生成器只读取根 `CHANGELOG.md`，不复制维护第二份 release body 模板。目标章节使用现有 `## <version> - <YYYY-MM-DD>` 格式，提取范围从匹配标题开始，到下一个二级标题之前结束。

选择这一方式是因为 changelog 已在发布准备阶段接受审阅，并且不受 squash 历史粒度影响。继续单独使用 `--generate-notes` 或只增加 `.github/release.yml` 仍只能分类 GitHub 已识别的 PR，无法恢复版本级内容；把完整说明写在 release PR body 则会形成重复事实来源。

### 2. 使用无新增依赖的 Node.js 提取器并提供纯函数接口

在 `tools/verification/release/` 增加模块，导出可由 `node:test` 直接覆盖的提取函数，并提供 CLI：接收目标 version 和 changelog path，将最终 Markdown 写入 stdout。

提取器要求匹配章节恰好一个，并要求章节正文存在非空内容。错误只报告版本与结构问题，不吞掉诊断，也不静默回退到 GitHub 自动说明。

### 3. workflow 在 npm publish 前生成临时 notes file

publish workflow 在 release contract 解析后、registry check 与 npm publish 前生成 `${RUNNER_TEMP}` 下的 notes file。GitHub Release 使用 `--notes-file` 消费该文件，并增加 `--verify-tag`，避免 `gh` 在异常状态下自动创建新 tag。

prerelease 继续使用 `--prerelease`，并显式使用 `--latest=false`；stable release 保持 GitHub 的稳定版 Latest 判定。workflow 不再把 `--generate-notes` 作为 Release body 来源。

### 4. 测试同时覆盖内容提取和 workflow 顺序

单元测试覆盖正常提取、相邻版本隔离、缺失版本、重复版本和空章节。现有 open-source release workflow 测试增加静态契约，确认 notes 生成发生在 npm publish 之前，Release 使用 notes file 与远端 tag 校验，并且 prerelease 不会成为 Latest。

### 5. 发布 Skill 与检查清单暴露相同预览入口

发布准备阶段使用同一个提取器预览目标版本 notes；发布后核对 GitHub Release body 包含目标版本的 changelog 内容。这样人工审阅、workflow 输入和发布后验证共享同一语义，不由 Skill 另行拼装发布说明。

## Risks / Trade-offs

- [严格章节格式可能阻止原本可发布的候选] → 在错误中明确期望标题、目标版本和 changelog 路径，并在 fast/affected release gate 中提前反馈。
- [只使用 changelog 会失去 GitHub 自动生成的 contributor/PR 列表] → 具体版本变化优先于粗粒度 PR 摘要；Release 页面仍保留 tag、commit 和 Compare 入口，后续如需附加元数据可在不改变 changelog 主来源的前提下扩展。
- [workflow 在 package 已存在的恢复场景仍需生成 notes] → 生成步骤保持幂等；即使 registry check 发现版本已发布，也能继续创建尚缺失且内容正确的 GitHub Release。
- [历史 changelog 格式不一致] → 提取器只校验当前目标版本章节，不要求迁移全部历史章节。

## Migration Plan

1. 在 task worktree 中加入提取器、测试、workflow 与发布文档调整。
2. 运行 release 受影响验证，再对冻结候选运行一次完整产品验证。
3. `projects/product/skills/buildr-release/SKILL.md` 会影响自举 workspace 的 Codex runtime 副本；change 收尾并集成后，从保留的 Product checkout 运行 `projects/product/buildr sync codex --target .` 和 doctor。workflow、release verifier 与检查清单不需要独立 runtime sync。
4. 下一次 release tag 自动采用新流程；已有 Release 保持不变。
5. 如 workflow 创建 Release 失败，保留已推送 tag和已发布 package，修复 workflow 后从可证明的中断点恢复，不移动或删除既有 tag。

## Open Questions

无。

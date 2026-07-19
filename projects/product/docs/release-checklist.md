# Buildr 发布检查清单

本文用于区分“Buildr 产品 MVP 已完成”和“公开发布前还需要补齐的事项”。MVP 完成表示本地产品闭环成立；公开发布需要额外的开源、分发和示例材料收口。

`package check/build` 是 Buildr 产品 maintenance 命令，`openspec baseline/check` 是 change workflow internal 命令；它们仍可直接执行并在 CLI help 中明确分区，但不属于普通 workspace onboarding 的日常命令。该分类描述产品用途，不是权限或安全限制。

## 已完成 MVP

- Buildr root-as-Organization workspace 初始化。
- Project registry、Project 资产骨架创建，并默认内嵌 OpenSpec。
- 本地路径或 Git URL service repo 接入，并维护 project `services/manifest.yml`。
- `doctor --agent <agent> --json` 输出面向当前 Agent runtime 的 Agent-readable 诊断结果。
- `commands add/remove/check` 维护 root 级命令行工具清单。
- `component list/check/install/uninstall` 管理 workspace 级统一生命周期资产；OpenSpec Component、嵌套 Commands collection、Buildr 自有契约门禁 sidebar 与声明式 Skill Contribution 已纳入 package 与 E2E 验证。
- `buildr openspec baseline create` 与 `buildr openspec check` 保护 OpenSpec change 的 proposal、同步前和同步后契约边界；fixture corpus 覆盖并行冲突、陈旧基线和破坏性同步结果。
- `skills add/remove/render` 维护 workspace/project Skills 源资产，并按需渲染到 Agent runtime。
- Skill Contribution 只在 runtime render 时组合自然语言 fragments；检查安装后注入、卸载后移除、通用 Skill 源不变，以及无效 slot/integrity fail closed。
- `skill install <agent>` 为七个 supported adapters 安装 Buildr 产品内置 Agent Skill。
- `sync <agent>` 同步 Buildr 产品能力并准备当前 Agent 的 workspace 入口 runtime。
- `rules render`、`runtime check` 和 `skills render` 支持当前 adapter 主路径。
- Supported runtime adapter 由静态 registry 和声明式 RuntimePlan contract 管理；Component 必须验证自身完整性但不能扩展 adapter。
- `package check` 和 `package build` 校验、构建 Buildr 产品随包资产。
- `npm run test:package -- <static|workspace|commands|rules|skills|runtime>` 用于维护期间定点重跑 package verifier；正式候选仍由 `test:candidate` 编排全部 selectors。
- Buildr mutation 具备严格 identity、scope/ownership 路径保护、atomic writer、workspace transaction、失败回滚和 doctor recovery；package output 使用 receipt/integrity 安全替换。
- bootstrap guide 在 Skill 不可用时提供纯文本兜底入口。

## 开源 TODO

### 必须完成

- [x] 使用 MIT License，并在仓库根目录和 npm package root 补充 `LICENSE`；README 已同步 License 入口。
- [x] 补充 `CONTRIBUTING.md`，说明本仓目录结构、开发命令、验证命令、OpenSpec 变更流程和 PR 要求。
- [x] 补充 `SECURITY.md`，说明漏洞报告渠道、支持版本和敏感信息处理边界。
- [x] 将 `projects/product/package.json` 调整为可打包状态，使用 `0.1.0` 和 MIT metadata。
- [x] 补充 CLI reference，覆盖当前公开命令、参数、典型输出和不支持的边界。
- [x] 准备公开 example workspace，展示 Organization/Root、Project、Service、Rules、Skills 和 runtime 投射的最小路径。
- [x] 完成去私有化检查，覆盖模板、默认目录、归档文档、示例内容、作者信息、URL、邮箱和组织内部术语。
- [x] 建立 GitHub Actions 最小 CI，运行 `projects/product/tools/verify-buildr-product`。
- [x] Linux Node 20/22 执行完整验证，Linux/macOS/Windows Node 22 验证正式 tarball 生命周期。
- [x] 明确 npm registry 发布流程：`@buildr-ai/buildr`、RC 使用 `next`、稳定版使用 `latest`、tag/version fail closed、GitHub Environment 审批和 OIDC trusted publishing。
- [x] 将干净候选快照推到 `elevenching/Buildr`，在真实 GitHub runner 通过 CI，并配置 `main`/`dev` branch protection 与 Private Vulnerability Reporting。
- [x] 通过 2FA 首次发布 `0.1.0-rc.1`，随后为 `@buildr-ai/buildr` 配置 GitHub trusted publisher。
- [ ] 完成 RC 试用和反馈收敛后发布 `0.1.0` 稳定版。

### 建议完成

- [x] 补充 `CHANGELOG.md`，持续记录各候选版的发布范围和日期。
- [x] 补充 issue / PR 模板，降低外部反馈成本。
- [x] 补充公开试用指南和已知限制，明确支持的 Agent runtime 与试用范围；反馈渠道随 GitHub repository URL 确定后补链接。
- [ ] 评估是否提供 Homebrew tap、standalone install script 或 release binary。
- [ ] 评估是否需要 `CODE_OF_CONDUCT.md`。

### 当前不作为开源阻塞

- Project/Service Component、其他 Agent runtime adapter、权限裁剪、远程 Component registry、依赖求解和系统级 Hook 仍属于后续能力。

## 发布前验证

开发期间只在单任务后做最小反馈检查，在相关任务组完成后做一次受影响范围验证；不要逐任务运行本节的完整验证。验证命令仍在运行或暂时无输出时继续等待同一进程，不重复启动。

普通任务默认运行 fast gate；该入口并行聚合 unit、静态契约、fast integration、架构、canonical spec quality/strict 和全部 runtime adapter 低成本契约，不创建完整临时用户 workspace，也不执行 npm pack/install 或 Workspace E2E：

```bash
npm test
# 等价于 npm run test:fast
```

需要定位 Node test 层级或观察真实 unit coverage 时使用独立入口；coverage summary 是观察证据，不是当前 Candidate 的全局百分比硬门禁：

```bash
npm run test:unit
npm run test:contract
npm run test:integration:fast
npm run test:coverage:unit -- --summary /tmp/buildr-unit-coverage.json
```

已知改动路径时优先让统一 planner 自动选择受影响 DAG。无路径时读取当前分支相对 upstream（fallback `origin/dev`）以及 staged、unstaged、untracked 改动；`--plan` 只解释计划，`--json` 输出机器可读计划。普通文档改词通常只运行 docs quality；未映射路径直接失败，要求补 owner，不能静默跳过：

```bash
npm run test:changed -- --plan
npm run test:changed -- --base origin/dev
npm run test:changed -- docs/buildr-product.md
npm run --silent test:changed -- --json docs/buildr-product.md
```

受影响范围验证可按改动类型组合执行；该入口始终先运行一次 fast gate，并按 verifier identity 去重多个 group 共享的检查，但不能替代最终候选完整验证：

```bash
npm run test:affected -- public
npm run test:affected -- cli
npm run test:affected -- runtime
npm run test:affected -- package
npm run test:affected -- openspec
npm run test:affected -- release
```

开发期间需要复现跨组件 workspace 生命周期问题时，可列出并定点运行独立 Workspace E2E suites；selector 只用于反馈和失败重跑，不能替代最终 Candidate：

```bash
npm run test:workspace -- --list
npm run test:workspace -- workspace-lifecycle
npm run test:workspace -- ownership-recovery runtime-reconciliation
```

以下完整验证在所有 rebase、冲突解决和内容修改结束后，对 task worktree 的最终候选 Git tree 执行。commit、相同 tree 集成、push 和 worktree 清理复用该结果，不在主开发分支重复执行；tree 改变时才重新运行受影响的验证。仓库 CI/publish 继续调用兼容入口 `tools/verify-buildr-product`，其语义与 `test:candidate` 相同。

```bash
npm run test:candidate
```

完整产品验证会把每个阶段和总耗时写入 `BUILDR_TIMING_OUTPUT` 指定的 JSON 文件（默认写入系统临时目录），CI 总是上传该文件。每个 step 的 stdout/stderr 写入 `BUILDR_DIAGNOSTICS_OUTPUT`，summary 记录日志路径以及 Node、平台、架构和 CI 环境；CI 在失败时上传 diagnostics。Workspace E2E 直接运行失败时默认保留失败 fixture 并打印位置，成功时清理；需要主动保留成功 fixture 时可设置 `BUILDR_WORKSPACE_E2E_KEEP=1`。

Candidate 总耗时、Workspace E2E suites 和已识别的高耗时专项阶段声明目标预算；summary 使用 `budgetMs` / `budgetStatus` 标记目标内或超预算，超预算只输出 warning。0.1 不因环境波动或单纯超出目标预算阻塞发布。

完成报告必须读取 timing summary，并说明总耗时、最慢阶段、失败阶段（如有）和 summary 路径。

验证层级、旧 MVP 覆盖迁移与必要交叉以 [验证覆盖职责矩阵](verification-ownership.md) 为维护依据；发现重复时先确认主 owner，再迁移或删除断言。

## npm Release 流程

1. 日常改动集成到 `dev`；准备 `<version>` 前 fetch 并记录最新 `origin/dev` 为不可变 candidate base，再从该 commit 创建 `release-<version>` task id、`tasks/release-<version>` 分支和 `<workspace-root>/.worktrees/release-<version>` canonical worktree。需要排除 dev 内容时先在 dev 独立撤销，不得从旧 ancestor 挑选发布候选。新建发布 worktree 后先在 `projects/product` 执行 `npm ci`，成功后才修改版本和发布材料。
2. 根 `CHANGELOG.md` 必须包含唯一的 `## <version> - <YYYY-MM-DD>` 章节和非空正文。冻结候选前从 workspace root 运行 `node projects/product/tools/verification/release/release-notes.mjs <version> CHANGELOG.md`，预览 GitHub Release 将使用的最终 Markdown。
3. 对冻结候选完成完整验证并记录 candidate tree identity；release task 必须先通过 task-finish fast-forward 集成到 `dev`，再运行 `release-convergence.mjs --stage pre-main`。通过 PR 将 `dev` squash merge 到 `main` 后，只有 main/dev version 与 tree 均匹配候选时才运行带 `--version` 的 history bridge，随后运行 `--stage post-main` 证明 main 已是 dev ancestor。任一 base、version、tree、task ref、远端竞争或 push finding 都停止 tag 动作。
4. package version 与 Git tag 必须完全一致。当前 `0.1.0-rc.5` 对应 `v0.1.0-rc.5` 和 `next`，稳定版 `0.1.0` 对应 `v0.1.0` 和 `latest`。
5. 首个 `@buildr-ai/buildr` package 已由 npm Organization owner `elevenching2` 使用 2FA 执行 `npm publish --access public --tag next`，于 2026-07-13 完成。
6. npm trusted publisher 已配置为 GitHub user `elevenching`、repository `Buildr`、workflow `publish.yml`、Environment `npm-production`、allowed action `npm publish`。
7. 后续发布只由 release tag 触发 GitHub-hosted workflow；workflow 在 registry write 和 npm publish 前使用同一提取器生成临时 notes file，缺失、重复或空的目标版本章节会 fail closed。Environment 人工批准后运行完整验证、候选安全检查、publish，并使用该 notes file、已有远端 tag 和正确 prerelease/Latest 状态创建 GitHub Release。
8. 已发布版本不覆盖。RC 问题发布新的 prerelease；正式版本问题优先发布 patch，必要时 deprecate 或移动 dist-tag，不把 unpublish 当作常规回滚。
9. tag、npm version/dist-tag、GitHub Release 和安装 smoke 全部验证成功后，查询远端 `tasks/release-<version>`。如存在，先展示 ref、commit 和稳定发布证据并取得用户明确授权，再删除并复核远端 ref 不存在；未授权或清理失败只记录 follow-up，不回滚或重做发布。

`0.1.0-rc.1`、`0.1.0-rc.2` 和 `0.1.0-rc.3` 已完成 npm 发布和 GitHub prerelease 创建；`0.1.0-rc.4` 因发布范围错误已弃用；`0.1.0-rc.5` 继续使用同一 trusted publishing 流程，发布事实以 npm 官方 registry 和对应 GitHub prerelease 为准。后续发布仍需每次具有明确发布意图。

实际自举 workspace 如需消费新版产品资产，可独立执行 sync，并在状态变更后运行当前 Agent doctor；CLI update 只更新当前 Product checkout 或 registry package。这不是第二轮产品 E2E。上述验证只证明当前本地产品包和 MVP 主路径成立；公开发布仍需要完成上面的发布材料和分发流程。

使用 `task-finish` 自动收尾时，canonical specs sync 前必须通过 pre-sync 契约检查，sync 后、archive 前必须通过 post-sync 检查；之后运行 `git diff --check`。只有本次 OpenSpec Markdown 变更的 `new blank line at EOF` 可以自动规范为恰好一个结尾换行，其他格式问题必须停止。归档后的相关校验通过后，后续相同 tree 的 commit、fast-forward、push 和本地清理复用已有验证结果。

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
- `skill install claude-code` 和 `skill install codex` 安装 Buildr 产品内置 Agent Skill。
- `sync claude-code` 和 `sync codex` 同步 Buildr 产品能力并准备当前 Agent 的 workspace 入口 runtime。
- `rules render`、`runtime check` 和 `skills render` 支持当前 adapter 主路径。
- Supported runtime adapter 由静态 registry 和声明式 RuntimePlan contract 管理；Component 必须验证自身完整性但不能扩展 adapter。
- `package check` 和 `package build` 校验、构建 Buildr 产品随包资产。
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
- [ ] 通过 2FA 首次发布 `0.1.0-rc.1`，随后为 `@buildr-ai/buildr` 配置 GitHub trusted publisher；完成试用后再发布 `0.1.0`。

### 建议完成

- [x] 补充 `CHANGELOG.md`，记录首个 `0.1.0` 未发布版本范围。
- [x] 补充 issue / PR 模板，降低外部反馈成本。
- [x] 补充公开试用指南和已知限制，明确支持的 Agent runtime 与试用范围；反馈渠道随 GitHub repository URL 确定后补链接。
- [ ] 评估是否提供 Homebrew tap、standalone install script 或 release binary。
- [ ] 评估是否需要 `CODE_OF_CONDUCT.md`。

### 当前不作为开源阻塞

- Project/Service Component、更多 Agent runtime adapter、权限裁剪、远程 Component registry、依赖求解和系统级 Hook 仍属于后续能力。

## 发布前验证

开发期间只在单任务后做最小反馈检查，在相关任务组完成后做一次受影响范围验证；不要逐任务运行本节的完整验证。验证命令仍在运行或暂时无输出时继续等待同一进程，不重复启动。

以下完整验证在所有 rebase、冲突解决和内容修改结束后，对 task worktree 的最终候选 Git tree 执行。commit、相同 tree 集成、push 和 worktree 清理复用该结果，不在主开发分支重复执行；tree 改变时才重新运行受影响的验证。

```bash
projects/product/buildr package check
(cd projects/product && npm run test:unit)
(cd projects/product && npm run test:release)
node tools/verification/release/open-source-candidate.mjs
node tools/verification/onboarding/init.mjs
node tools/verification/cli/architecture.mjs
node tools/verification/cli/compatibility.mjs
node tools/verification/cli/package-parity.mjs
tools/verification/onboarding/repository.mjs
tools/verification/onboarding/service-branch.mjs
tools/verification/network/remote-text.mjs
tools/verify-buildr-product-mvp
tools/verification/integrity/managed-mutations.mjs
tools/verification/integrity/managed-data-integrity.mjs
tools/verification/openspec/contract-audit.mjs
tools/verification/openspec/spec-quality.mjs
openspec validate --all --strict
npm pack --dry-run
```

完整产品验证会把每个阶段和总耗时写入 `BUILDR_TIMING_OUTPUT` 指定的 JSON 文件（默认写入系统临时目录），CI 总是上传该文件。0.1 仅记录趋势，不设置会因环境波动阻塞发布的耗时阈值。

完成报告必须读取 timing summary，并说明总耗时、最慢阶段、失败阶段（如有）和 summary 路径。

## npm Release 流程

1. 日常改动集成到 `dev`；准备发布时通过 PR 将已验证候选合入 `main`。
2. package version 与 Git tag 必须完全一致。`0.1.0-rc.1` 对应 `v0.1.0-rc.1` 和 `next`，`0.1.0` 对应 `v0.1.0` 和 `latest`。
3. 首个 `@buildr-ai/buildr` package 由 npm Organization owner `elevenching2` 使用 2FA 执行一次 `npm publish --access public --tag next`。
4. package 存在后，在 npm 配置 trusted publisher：GitHub user `elevenching`、repository `Buildr`、workflow `publish.yml`、Environment `npm-production`、allowed action `npm publish`。
5. 后续发布只由 release tag 触发 GitHub-hosted workflow；Environment 人工批准后运行完整验证、候选安全检查、publish 和 GitHub Release 创建。
6. 已发布版本不覆盖。RC 问题发布新的 prerelease；正式版本问题优先发布 patch，必要时 deprecate 或移动 dist-tag，不把 unpublish 当作常规回滚。

第一阶段只准备上述代码和门禁，不授权向公开 GitHub push、创建 tag 或执行 npm publish。

实际自举 workspace 如需消费新版产品资产，可独立执行 sync，并在状态变更后运行当前 Agent doctor；CLI update 只更新当前 Product checkout 或 registry package。这不是第二轮产品 E2E。上述验证只证明当前本地产品包和 MVP 主路径成立；公开发布仍需要完成上面的发布材料和分发流程。

使用 `task-finish` 自动收尾时，canonical specs sync 前必须通过 pre-sync 契约检查，sync 后、archive 前必须通过 post-sync 检查；之后运行 `git diff --check`。只有本次 OpenSpec Markdown 变更的 `new blank line at EOF` 可以自动规范为恰好一个结尾换行，其他格式问题必须停止。归档后的相关校验通过后，后续相同 tree 的 commit、fast-forward、push 和本地清理复用已有验证结果。

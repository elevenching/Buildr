## Context

Buildr 当前内部 `dev` 已有完整产品验证、跨平台 CI 配置和 release tarball smoke，公开 GitHub 仓库 `elevenching/Buildr` 也已存在，但本地产品仍使用 `@buildr/cli`、README 占位 URL 和不完整的公开 metadata。npm Organization `buildr-ai` 已由维护者创建，公开包目标确定为 `@buildr-ai/buildr`；日常开发继续使用 `dev`，稳定发布使用 `main`。

第一阶段需要让最终候选本身具备公开资格，但不能把“准备发布”误当成已经完成外部 push、GitHub 设置或 npm publish。安全检查还必须可重复运行，避免只依赖一次人工搜索。

## Goals / Non-Goals

**Goals:**

- 固化 GitHub、npm、CLI、README 语言和 License 公开身份。
- 让 package metadata、公开文档、tarball inventory 与 `@buildr-ai/buildr` 一致。
- 提供确定性开源安全 verifier，并把它接入产品总验证和 GitHub CI。
- 准备 tag 驱动、Environment 审批、OIDC-ready 的 release workflow，同时阻止错误 tag/version/dist-tag 组合。
- 让 Buildr 产品开发的最终验证报告主动呈现 timing 信息。

**Non-Goals:**

- 不向 `elevenching/Buildr` 推送代码，不修改 GitHub repository settings、branch protection 或 vulnerability reporting。
- 不创建 release tag，不发布 `0.1.0-rc.1`，不配置 npm trusted publisher，也不保存 npm token。
- 不翻译 README 之外的产品、开发、OpenSpec 或治理文档。
- 不公开内部仓库历史；当前 change 只准备可作为干净公开快照的 tree。

## Decisions

### 1. 分离源码 owner、npm scope 和 CLI identity

源码 canonical URL 使用 `https://github.com/elevenching/Buildr`，npm package 使用已创建组织的 `@buildr-ai/buildr`，bin 继续为 `buildr`。GitHub 与 npm owner 不强求同名，README 明确二者的官方关系。

未采用 `@elevenching2/buildr`，因为 npm 登录账号不应成为长期品牌；也不继续使用未确认所有权的 `@buildr/cli`。

### 2. 中文 README 为 canonical 内容，英文 README 是完整翻译

根 `README.md` 继续承载中文产品入口，`README.en.md` 对应同一章节和命令，并在顶部互链。其他文档遵循当前 Project 管理语言，不建立全仓双语复制。

为防止翻译显著漂移，自动检查两份 README 必须包含相同的 canonical install/package/CLI links 和主要章节锚点；自然语言逐句一致由 review 保留，不引入翻译依赖。

### 3. 安全扫描针对候选 tree 与 tarball，而不是本机或完整内部历史

新增 Node verifier 扫描 Git tracked files 和 `npm pack --json` inventory：检查占位符、内部 remote/domain、常见 secret/private-key 形态、工作区绝对路径、异常大文件、禁止路径和 package metadata。只扫描 tracked candidate，避免读取 `.git`、`node_modules`、task worktree、用户 home 或 runtime 登录态。

完整历史扫描属于公开快照创建阶段；第一阶段 verifier 不声称证明内部历史可公开。

### 4. Release workflow 是可审计入口，不自动发布任意提交

workflow 只接受 `v<version>` tag，校验 tag 与 `package.json#version` 完全一致：prerelease 使用 `next`，稳定版使用 `latest`。job 使用 GitHub-hosted Node 22、`id-token: write` 和 `npm-production` Environment，先执行完整验证和 pack inspection，再执行 `npm publish --access public --tag <tag>`，成功后创建对应 GitHub Release。

首次 package 尚不存在时仍需维护者通过 2FA 完成 bootstrap publish；workflow 为 package 建立 trusted publisher 后的后续发布准备。workflow 中不加入长期 `NODE_AUTH_TOKEN`。

### 5. Timing 报告是完成沟通约束，不是性能门禁

`projects/product/AGENTS.md` 要求最终验证后汇报 total、最慢阶段、失败阶段和 summary 路径。数据来自 `buildr.verification-timing/v1`，不重复定义第二份计时格式，也不设阈值。

## Risks / Trade-offs

- [扫描规则误报示例或归档文本] → 使用窄而明确的模式、允许带理由的文件级 allowlist，并用 fixtures 覆盖允许/拒绝情形。
- [扫描未覆盖完整 Git 历史] → 文档明确这是候选 tree gate；公开 push 前另做全历史或干净快照证明。
- [workflow 被误触发] → 仅 tag 触发、Environment 人工批准、tag/version 校验和无 token 默认配置共同 fail closed。
- [首次 npm package 无法直接使用 trusted publisher] → 把首次 2FA bootstrap publish 留到第二阶段之后，并禁止本 change 执行 publish。
- [README 中英文漂移] → 共享 canonical 命令与链接的自动断言，加人工 review；不扩大为所有文档双语。
- [package rename 影响 update check] → 在正式 registry 发布前完成 identity 变更，并用 package/release smoke 验证 checkout 与 tarball；没有既有公开 package 用户需要迁移。

## Migration Plan

1. 在内部 `dev` 集成本 change，保持公开仓库和 npm 无外部变化。
2. 运行候选安全扫描和完整产品验证，生成可公开快照。
3. 后续显式授权后，将快照推到 `elevenching/Buildr` 的 `dev`，在真实 Actions 上验证，再通过 PR 合入 `main`。
4. 将版本设为 `0.1.0-rc.1`，完成首次 2FA bootstrap publish；随后在 npm 配置 trusted publisher。
5. 后续 tag 发布使用 release workflow；若 RC 有问题，发布新的 prerelease，不覆盖已发布版本。

## Open Questions

无。GitHub、npm、语言、署名、分支和安全响应策略均已由维护者确认。

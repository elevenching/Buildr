## MODIFIED Requirements

### Requirement: Release workflow 必须按版本和渠道受控发布
Buildr MUST 提供 tag 驱动、GitHub-hosted、Environment 审批且 OIDC-ready 的 release workflow，并 MUST 在发布前校验候选来源、版本、main/dev 收敛、dist-tag 和 tarball。

#### Scenario: 发布 prerelease tag
- **WHEN** `v<version>` tag 对应的 package version 包含 prerelease 标识
- **THEN** workflow MUST 使用 `next` dist-tag
- **AND** workflow MUST 在 `npm-production` Environment 中执行完整验证和公开候选检查后才允许 publish

#### Scenario: 发布稳定 tag
- **WHEN** `v<version>` tag 对应稳定 package version
- **THEN** workflow MUST 使用 `latest` dist-tag
- **AND** tag version MUST 与 package version 完全一致
- **AND** workflow MUST NOT 从长期 npm publish token 获得默认写权限

#### Scenario: 第一阶段只准备发布能力
- **WHEN** 本 change 完成并集成内部 `dev`
- **THEN** Buildr MUST NOT 因此自动推送公开 GitHub、创建 release tag 或执行 npm publish
- **AND** 外部发布 MUST 等待后续显式授权和账号侧配置完成

#### Scenario: 候选必须来自最新 dev
- **WHEN** 维护者准备目标版本 release candidate
- **THEN** release task MUST 记录准备时的 `origin/dev` commit 并从该基线形成候选
- **AND** 版本与发布材料提交 MUST 先通过 task finish 集成并推送到 `dev`
- **AND** 如需排除已有 dev 内容，维护者 MUST 先通过独立 change 在 dev 撤销，不得从旧 ancestor 直接发布

#### Scenario: main 合入前验证 dev 候选
- **WHEN** release task 准备创建 `dev` 到 `main` 的发布 PR
- **THEN** convergence gate MUST 证明 `origin/dev` 的 package version 和 tree 等于已验证候选
- **AND** release task branch 无法 fast-forward 集成 dev 时 MUST 停止发布准备

#### Scenario: main 合入后验证历史收敛
- **WHEN** 发布 PR 已 squash merge 到 `main`
- **THEN** convergence gate MUST 证明 `origin/main` 与 `origin/dev` tree 等于已验证候选
- **AND** history bridge 后 `origin/main` MUST 是 `origin/dev` 的 ancestor
- **AND** 任一 ref、tree、version 或 release task 状态不一致时 MUST 在创建 tag 前停止

## 1. Identity、schema 与只读 inventory 基础

- [x] 1.1 为 `buildr.skills/v3` 定义 parser/validator、workspace-only source semantics、稳定 `assetIdentity`/`sourceIdentity` 和 v2 workspace 兼容读取，补齐 unit fixtures。
- [x] 1.2 扩展 runtime adapter descriptor，分别声明 user/workspace destination roots、可观测 discovery roots、inventory evidence 和 activation/reload metadata。
- [x] 1.3 实现只读 effective Skill inventory，按候选 ID 汇总 `SKILL.md` name、路径、来源类别、receipt、source/render digest 和可见性边界。
- [x] 1.4 运行 schema、adapter contract 和 inventory unit/contract tests，确认只读 inventory 不修改 workspace 或用户目录。

## 2. Workspace-only Skill source lifecycle

- [x] 2.1 将 `skills add/remove`、manifest writer 和 source resolver 收敛到 workspace 根，移除 Project source merge/override，并为旧 `--scope .` 输出 deprecated canonical guidance。
- [x] 2.2 为 `--scope projects/<project>` 实现结构化 breaking diagnostic 和 migration nextAction，确保所有拒绝路径零写入。
- [x] 2.3 更新本地作者型、远端信息源、resolved source、package source、Component-owned Skill 和 capability declarations，使其在 v3 workspace manifest 中保持完整。
- [x] 2.4 运行 Skills source lifecycle 与 manifest migration focused tests，覆盖 add、replace、remove、unsupported source 和 ownership 保护。

## 3. Project capability context 与 legacy Project Skill 迁移

- [x] 3.1 实现 `buildr.project-capabilities/v1` 与固定 `projects/<project>/capabilities.yml`，支持 `requires`、`bindings` 和 workspace Skill applicability 引用而不存储 Skill 内容。
- [x] 3.2 实现 `skills migrate-project-assets --check`，生成 Project 独有、等价重复、同名不同内容、contracts/bindings、未知文件和 Git boundary 的完整迁移计划。
- [x] 3.3 实现 `skills migrate-project-assets --apply` 的 snapshot、事务写入、Project context 转换、v3 manifest 写入、旧源安全删除和 recovery evidence。
- [x] 3.4 更新 Project create/repair/template，停止创建 `projects/<project>/skills/`，并保持已有 legacy 目录在未迁移前不被 sync 静默删除。
- [x] 3.5 运行 Project registry、Project template 和 migration integration tests，覆盖冲突零写入、失败回滚和重试收敛。

## 4. User/workspace render destinations 与 receipts

- [x] 4.1 为 `skills render` 增加 `--destination user|workspace`，保持省略时默认 workspace，并让 `--target` 始终表示 source workspace。
- [x] 4.2 为每个 supported adapter 实现 user/workspace destination plan，确保 `init`、`sync` 和组合 `render` 只写 workspace destination。
- [x] 4.3 实现 user projection receipt v2，记录 adapter、destination、asset/source identity、source workspace、digests 和完整文件 inventory。
- [x] 4.4 实现 `satisfied_by_user` 计划与 satisfaction evidence；当用户投射缺失或漂移时由 checker/doctor 报告 stale，不在只读检查中自动修复。
- [x] 4.5 运行所有 supported adapters 的 destination parity 与隔离测试，证明 workspace render 不写用户层、user render 不写 workspace runtime。

## 5. Skill 冲突分类与统一零写入 preflight

- [x] 5.1 实现 `absent`、`already_projected`、`satisfied_by_user`、`update`、`equivalent_external`、`foreign_owner`、`name_conflict` 和 `visibility_partial` 分类器。
- [x] 5.2 将 source plan、capability graph、effective inventory、旧 receipts、目标文件和完整 Skill directory inventory 纳入同一 preflight。
- [x] 5.3 对 blocking conflict 实现整次 mutation 零写入，并输出稳定 JSON fields、reason、provenance、digests、inventory evidence 和 nextActions。
- [x] 5.4 将 adopt/transfer 保持为首版 unsupported ownership action，输出 rename、remove/disable external、skip 和保持现场，并验证 `--replace` 不能隐式接管外部 ownership。
- [x] 5.5 运行 conflict matrix integration tests，覆盖同 ID 同内容、同资产更新、外部等价、跨 workspace owner、plugin/system 可观测冲突、partial visibility 和不相关重复。

## 6. Capability routing 从 scope chain 迁移到业务 context

- [x] 6.1 将 provider graph 改为只从 workspace Skill registry 读取 contracts/providers/consumers，并按 Project task context、workspace default、唯一 provider 顺序解析 binding。
- [x] 6.2 实现 `cross_project_binding_ambiguous`，保留 required/optional 的 blocked/degraded readiness、dependency cycle 和 result evidence 语义。
- [x] 6.3 强制不同 provider 使用不同 Skill ID；同 ID 不同 source identity 在 capability 解析前进入 Skill name conflict。
- [x] 6.4 更新 runtime binding evidence 和 doctor 输出，移除 provider Project source scope，增加 Project business context 与 destination provenance。
- [x] 6.5 运行 capability graph unit/integration tests，覆盖 workspace default、Project context、跨 Project 冲突、provider replacement 和顶层 routing ambiguity。

## 7. Product lifecycle、package 与文档收敛

- [x] 7.1 更新 `init`、`sync`、runtime check、doctor、Component lifecycle 和 mutation recovery，统一使用 workspace source、destination plan 和 conflict preflight。
- [x] 7.2 更新 package manifest、workspace baseline、Project template、builtin descriptors 和 package checks，移除 Project Skill baseline/mappings。
- [x] 7.3 更新产品入口 Buildr Skill、Buildr Core、Project `AGENTS.md` 模板和相关 Skills，使创建、全局安装、本地 render、Project applicability、迁移与冲突说明一致。
- [x] 7.4 更新 README、产品主文档、CLI reference、adapter 文档、capability contract 文档、known limitations、bootstrap guide 和 release migration notes。
- [x] 7.5 运行 package static/workspace/commands/rules/skills/runtime focused verification，修复所有由新模型引起的 fixture 和 contract drift。

## 8. 自举迁移、完整验证与交付准备

- [x] 8.1 在隔离 fixture 和 Buildr 自举 workspace 上先运行 Project Skill migration check，审阅所有同名内容、ownership、bindings 和 Git boundary，再执行获准的 apply。
- [x] 8.2 使用当前 Product checkout render/sync 所有受影响的 Buildr workspace runtime assets，并验证用户层未被隐式修改。
- [x] 8.3 运行 `openspec validate --all --strict`、Buildr OpenSpec proposal check、受影响验证和 `npm run test:candidate`，在最后一次代码/文档/生成资产修改后重跑最终候选验证。
- [x] 8.4 审查 breaking CLI、schema、migration/recovery、external Skill visibility 和所有 supported adapters 的最终证据，更新 release notes 与实施完成记录。

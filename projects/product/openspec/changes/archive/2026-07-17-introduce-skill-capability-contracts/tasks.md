## 1. Capability contract 与 manifest v2 基础

- [x] 1.1 为 `buildr.skills/v2` 定义 contract、binding、`provides` 和 `requires` 的数据模型，实现最小 `buildr.capability-contract/v1` frontmatter、固定语义章节及 manifest identity 一致性校验
- [x] 1.2 实现 `buildr.skills/v1`、无 schemaVersion manifest 的事务化 `buildr.skills/v2` 迁移，保留 Skill metadata、远端来源、builtin uninstall state 和用户 binding，并拒绝未知 schema 与静默降级
- [x] 1.3 实现 workspace/Project scope provider resolver，覆盖最近显式 binding、scope 链唯一 provider、版本/runtime 兼容、递归 required readiness、cycle detection，以及 `ready`、`blocked`、`degraded` 与标准 reason
- [x] 1.4 为 schema、migration 和 resolver 增加最小单元测试与 fixtures，覆盖 contract identity conflict、同 scope 多 provider、显式 Project override、不同 Skill id 替换 builtin、安装 provider 不静默改绑、transitive blocked、dependency cycle 和卸载 builtin 不回退
- [x] 1.5 扩展 `skills add/replace` 的 `--provides` / `--requires`，实现事务化 `skills bind/unbind`，确保每个 mutation 保留无关 v2 数据并通过最终 doctor 验证
- [x] 1.6 运行 manifest/capability parser、migration、resolver 和 capability mutation CLI 受影响测试，集中修复本组失败

## 2. Doctor、runtime projection 与生命周期

- [x] 2.1 扩展 doctor JSON 与人类可读输出，报告 consumer、capability、scope、readiness/reason、候选 providers、selected provider 和可执行 `nextActions`，并明确 `ready` 只表示结构可路由
- [x] 2.2 扩展 sync/render plan，在 consumer runtime `SKILL.md` 注入 contract path/SHA-256 digest、provider runtime path、readiness 和 provenance；blocked consumer 保留安全停止与修复指引，产品入口 Buildr Skill 在完整 sync 中获得按 scope routing evidence
- [x] 2.3 让独立 Product Skill install 在缺少或不适用 routing evidence 时通过当前 doctor graph 解析 provider，不新增 capability dispatch 命令或独立 runtime registry
- [x] 2.4 仅在 Skill mutation 会移除、禁用或改绑 selected provider 时做写前 dependency impact 披露，并在其他 lifecycle 完成后统一用 doctor 收敛
- [x] 2.5 为所有 supported runtime adapters 增加 ready/blocked/degraded projection、现有 managed hash 的 routing stale/fallback、optional degradation 和 source immutability 的专项测试
- [x] 2.6 运行 doctor、render/sync 和 Skill lifecycle 受影响测试，确认 JSON 契约与各 adapter 解析结果一致

## 3. 首批 contracts 与内置工作流迁移

- [x] 3.1 在 package assets 和默认 workspace baseline 中发布首批六个 versioned contracts、initial default bindings、Skill `provides`/`requires` 与 v2 manifest，并扩展 package check
- [x] 3.2 精简 required Core，只加入 installed binding 与 workspace tree transition 两条 invariant；更新产品入口 Buildr Skill，让 workspace update、单项 Git、worktree、finish 和 review 意图按 capability binding 路由
- [x] 3.3 更新 `git-ops` 提供三个 Git capabilities，并将默认 rebase/fast-forward-only/merge policy 保留在 provider 内，同时保留 tree-change 结果证据与现有高风险授权边界
- [x] 3.4 更新 `task-worktree`、`task-finish` 和 `task-asset-review` 的 provides/requires 与正文；让 Task Finish required 依赖 worktree lifecycle 和 Git task integration，删除 Task Worktree 对 Git identity 的无效依赖及 Task Finish 复制的 Git/worktree policy，落实 blocked provider 和 optional review 降级
- [x] 3.5 更新产品文档、manifest schema 示例和 Skill 作者指南，说明 contract 最小 frontmatter、固定语义章节、`Allowed Variations`、required lifecycle 与 dependency mode、显式 provider 替换及 conformance 分层
- [x] 3.6 扩展 package/behavior fixtures，验证默认工作流、内部 Git provider 完整替换、同 scope 歧义、版本冲突、blocked consumer safety guidance、optional review degradation 和 Core 不复制操作手册
- [x] 3.7 运行 package assets 与 Git/task 工作流受影响测试，确认首批六个 capability 范围内的产品入口和跨 Skill 引用均已迁移，并确认未迁移 builtins 仍保持现有 identity routing

## 4. 端到端迁移与最终候选验证

- [x] 4.1 在隔离临时 workspace 验证无 schemaVersion / `buildr.skills/v1`→`buildr.skills/v2` upgrade、初始默认 binding、显式 Project override、provider install 不静默改绑、builtin uninstall、blocked consumer、optional degradation、multiple providers、contract identity conflict 和全部 supported adapters
- [x] 4.2 运行 `openspec validate --all --strict`、`git diff --check` 及本 change 契约基线检查，修复规范与实现漂移
- [x] 4.3 对最终实现范围运行一次 `npm run test:affected -- <changed-paths...>`，记录实际耗时并只针对失败项迭代
- [x] 4.4 完成代码与自然语言资产 review 修订，冻结最终候选 tree 后运行一次 `npm run test:candidate`，不得在相同 tree 重复已覆盖的产品验证
- [x] 4.5 CLI 变更验证通过后从最终候选 checkout 执行 `tools/install-buildr-cli`，确认 `command -v buildr`、CLI help 与隔离目标 doctor；任务收尾时先迁移指向待清理 worktree 的入口
- [x] 4.7 在完成报告中汇总总耗时、实现/验证/收尾阶段耗时、最慢任务、重复验证情况、自动化程度和剩余风险
- [x] 4.8 将 capability CLI 真实 workspace 流程从单元测试层移到 candidate 独立集成步骤，与临时 workspace E2E 并行运行，并验证 fast 层不再承担该固定成本

## 5. Agent 工作能力适配

- [x] 5.1 更新 proposal、design 和 delta specs，统一“Agent 工作能力适配”术语，区分编排型 consumer 与能力路由者，并定义 Agent 判断已有/新增跨 Skill 稳定依赖边界的规则
- [x] 5.2 在 required Core 增加 Skill 变更前影响检查不变量，更新产品入口 Buildr Skill 的自然语言意图路由
- [x] 5.3 新增 optional `capability-adaptation` 管理 Skill 及 Agent metadata，覆盖影响基线、变化分类、候选开发、组合验证、安全激活、sync/doctor 和普通用户交付
- [x] 5.4 更新 package/default manifests、bootstrap contract、产品文档和静态验证，使新 Skill 随全部 supported runtimes 发布且不声明空洞 capability
- [x] 5.5 增加自然语言意图、已有 contract 内适配、新 contract 判断、consumer 影响和失败不激活的产品 fixtures；运行受影响测试并修复
- [x] 5.6 更新任务驾驶舱，重新运行 OpenSpec proposal contract check、strict validation 和 `git diff --check`

## 6. 新候选验证与自举

- [x] 6.1 冻结扩展后的最终候选 tree，运行一次 `npm run test:candidate` 并记录新的 timing summary；只针对失败项迭代
- [x] 6.2 CLI/Skill 变更验证通过后重新安装当前候选 Buildr CLI，并确认隔离 workspace 的能力适配资产与 doctor
- [x] 6.3 集成到保留的产品 checkout 后执行自举 sync/render/doctor，确认当前 workspace 使用已集成资产而不是 task checkout

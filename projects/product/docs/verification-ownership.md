# Buildr 验证覆盖职责矩阵

本文记录各类产品契约的主 verifier、允许的边界交叉，以及旧 MVP shell 删除后的覆盖归属。目标不是让每个行为只能出现一次，而是让重复验证具有明确理由。

## 证据层与执行入口

| 层级 | 主职责 | 不承担 |
| --- | --- | --- |
| test:unit | 同进程直接调用 parser、validator、planner、diagnostics 和 domain 纯逻辑；允许受控小型文件 fixture | 真实 CLI/Git/npm 子进程、静态文档契约和产品生命周期 |
| test:contract | 源码结构、manifest、docs、Skills、schema 与 entrypoint declaration 的静态一致性 | 把聚合执行覆盖率标记为 unit coverage |
| test:integration:fast | 真实 CLI/Git 子进程或多模块组合的低成本集成 | 完整用户 workspace、npm pack/install、网络和发布生命周期 |
| focused integration | 单领域完整状态变化，包括 package、runtime、OpenSpec、onboarding、network 和 integrity | 跨多个组件且必须共享连续状态的黄金路径 |
| system acceptance | Workspace E2E、候选 tarball、package parity 和 release lifecycle | 开发期低成本反馈 |

证据层由以下执行策略组合，不再把 selector 描述为新的测试层：

| 入口 | 用途 |
| --- | --- |
| `npm test` / `test:fast` | 固定聚合三个低成本 Node 层、架构、OpenSpec 和 runtime contract |
| `test:changed` | 根据 Git diff 或显式 Product 路径生成最小可解释 DAG |
| `test:candidate` | 无条件选择完整 candidate profile，不读取 diff |
| `test:focus` | 按 step id 或 `group:<group>` 定位和重跑失败，不自动附加 Fast |

所有入口共享 `tools/verification/registry.mjs` 中的 step identity、executor、inputs、真实依赖、profile/group、预算和并发类别。`test:changed` 对未被任何 input 或显式 ignore 覆盖的 Product 路径 fail closed；Candidate 的完整性按 required gate identity 验证，不冻结 step 数量。

Candidate 与 Changed 也共享 `tools/verification/timing/evidence.mjs`：默认每次 run 使用唯一 transient evidence 目录，summary 记录 run/source identity、候选 fingerprint 和 `evidenceLifecycle`，并在终端直接输出 total、budget、slowest、failed、绝对路径、retention 与 cleanup 状态。显式输出路径标记为 caller-managed；默认 transient run 只保留到 consumer 使用完毕，并由 `cleanup-evidence.mjs` 在严格目录边界内删除。Changed 是开发反馈证据；只有最终 Candidate summary 可以作为 task-finish 的完整验证 timing evidence。

Task Finish 消费 Candidate evidence 时，provider 的 `inspect`、`execute`、`cleanup` operation 与 verifier executor invocation 分开计数。已有 Candidate 对应 `same-content` 或可归因的 `closeout-metadata-only` transition 时，OpenSpec strict、contract guard、diff check 等 closeout checks 保持各自主 owner，不升级为新的 Candidate run；只有 `implementation-changed` 或无法证明仅为收尾元数据时才启动一次新的 Candidate executor。

最终 Candidate task checkbox 是一个更窄的 closeout 分支：Candidate 先验证 source implementation identity A，随后同一会话只把 active change 中唯一对应任务由 `- [ ]` 改为 `- [x]`，形成 delivery identity B。consumer 将它记录为 `verification-result-metadata-only`，保留 A 的 Candidate evidence，并以 `session-only` transition evidence 单独记录 A/B identity、change/task identity 与精确 marker；不得说 Candidate 验证了 B。若还有其他 diff、候选任务不唯一、A 无法匹配或会话证据丢失，则不能仅凭 `tasks.md` 路径或 checkbox 状态放行，必须重跑 Candidate。

## Unit coverage 与核心 owner

`npm run coverage:unit -- --summary <path>` 只执行 `test/unit/*.test.mjs`，使用 Node 内置 coverage 输出人类报告和 `buildr.unit-coverage/v1` JSON。它是观测入口，不是额外发布门禁。分层后的首个 unit-only 基线为 30 tests、25 个实际加载的产品模块，line 46.16%、branch 68.42%、function 48.90%；它与分层前 84 tests 的 fast 聚合 line 53.55% 不可直接比较。

| 核心区域 | 当前直接 unit owner | 其他必要 owner | 后续缺口 |
| --- | --- | --- | --- |
| verification planner / DAG / registry | `verification-planner`、`verification-dag-scheduler`、`unit-coverage` | entrypoint contract、Candidate timing | 已具备直接 owner，继续按新分支补测 |
| runtime Skills / capability resolver | `runtime-skills`、`capability-contracts`、`capability-runtime` | runtime contract/parity、Workspace reconciliation | checker/projection 生命周期保留 focused integration |
| package validation | package verifier selector unit | package static 与六个 package focused verifiers | `static-validation` 大模块后续按纯 validator 提取再补，不伪造 unit |
| doctor diagnostics | runtime/scope diagnostics unit | CLI compatibility、Workspace final doctor | capability、service diagnostics 可按风险继续补直接 owner |
| CLI Commands domain | collection、manifest、version 纯逻辑 unit | package Commands integration、workspace lifecycle | mutation、filesystem ownership 保留 focused integration |
| 其他 CLI domains | 暂无完整直接 owner | package Rules/Skills/runtime、CLI compatibility、Workspace E2E | 优先提取稳定 parser/validator；不直接把 command handler 生命周期塞入 unit |
| remote/runtime checker | argument/manifest/render-plan 间接 owner | remote timeout、runtime adapter contract/parity | network 和真实 runtime filesystem 保留专项；纯结果归一化可继续提取 |

当前不设置全局覆盖率发布阈值。先以 unit-only summary 观察趋势和核心 owner；未来阈值应基于新增代码或稳定风险区域，而不是要求所有薄 wrapper、platform adapter 和生命周期编排达到同一百分比。

## 旧 MVP section 迁移归属

| 旧类别 | 当前主 verifier | Workspace E2E 代表覆盖 | 迁移判断 |
| --- | --- | --- | --- |
| Workspace / Project / Service | onboarding integration、service branch、package workspace smoke | workspace-lifecycle | E2E 只保留组合黄金路径；异常、幂等和 branch contract 由 focused verifier 持有 |
| Commands | package Commands integration | workspace-lifecycle 只做代表性 add | CRUD 和 manifest 细节不继续扩展进 Workspace E2E |
| Rules | package Rules integration、package runtime integration、runtime adapter parity | lifecycle 代表性 add；reconciliation 验证投射 | CRUD、recursive discovery 和 adapter 投射分属不同 verifier identity |
| Skills | package Skills integration、runtime adapter parity、remote timeout | lifecycle 代表性 add；ownership 验证拒绝 | source/resolved/remote 与 runtime projection 由 focused verifier 持有 |
| Builtins | capability CLI integration、managed data integrity、runtime adapter parity | ownership-recovery | E2E 只证明 required 拒绝和 optional uninstall/restore |
| Components inventory / lifecycle | package static、release smoke、managed data integrity | ownership-recovery、runtime-reconciliation | package 内容、安装后 lifecycle、冲突恢复是不同边界 |
| Component contributions / upgrades / migration | package static、runtime parity、managed data integrity | reconciliation 只验证 drift 与恢复 | 内容文本、运行时组合、事务/迁移冲突分别由专项持有 |
| Registry convergence / legacy | package workspace smoke、service branch、managed data integrity | 最终 doctor 仅证明收敛 | schema/迁移属于 focused contract |
| Runtime discovery / help / doctor filter | CLI compatibility、runtime adapter contract | 黄金路径最终 doctor | help 和 JSON surface 只由 compatibility/contract 全量持有 |
| Runtime install / projection / reconciliation | runtime adapter parity、adapter smoke fixture contract | reconciliation 保留 Codex 与 Claude bridge | 全实现族 parity 不进入 Workspace E2E |
| OpenSpec audit fixture | OpenSpec contract fixtures、candidate audit | 无 | fixture 验证算法，candidate audit 验证真实 artifacts |
| npm tarball / install / onboarding / help | open-source candidate、CLI package parity、release smoke | 无 | inventory、parity、安装后 lifecycle 各有独立 owner |
| Runtime conflict safeguards | runtime parity、managed data integrity | reconciliation 代表性 drift | adapter 冲突和 transaction 冲突属于不同失败面 |

## 有意保留的边界交叉

- repository onboarding 验证干净开发 checkout、开发 CLI 安装和 update source；init onboarding 持有 checkout CLI 的参数、幂等和冲突恢复；release smoke 独占正式 tarball 安装后生命周期。
- CLI package parity 比较 checkout 与安装包；release smoke 证明安装后生命周期。
- OpenSpec fixtures 验证算法和破坏性样本；candidate audit 验证当前候选。
- capability integration 验证 capability/provider/binding；ownership recovery 验证资产拒绝与恢复。
- Workspace E2E 的最终 doctor 是收敛断言，不替代 doctor JSON 和 finding contract。

## Package verifier 分层

`buildr package check` 继续是完整产品维护入口，但内部覆盖由稳定 registry 组合；Candidate 与 `npm run test:focus -- package-<selector>` 可分别执行和诊断以下 owner：

| Selector | Candidate step | 主职责 | 明确不承担 |
| --- | --- | --- | --- |
| static | package static validation | manifest、inventory、随包 baseline、Skill/Rule/Component 内容契约、支持工具存在性 | 临时 workspace、真实 CLI mutation |
| workspace | package workspace smoke | init/Project baseline、遗留 practices 保留、existing `AGENTS.md` 兼容、最终收敛 | Commands/Rules/Skills CRUD、全 runtime adapter 矩阵 |
| commands | package Commands integration | 默认 collection、add/check/remove 数据契约 | Workspace 黄金路径和 help 全量兼容 |
| rules | package Rules integration | add/remove/keep-file、required 保护、doctor 未注册 finding | recursive discovery 和 adapter reconcile |
| skills | package Skills integration | local/remote/resolved source add/remove | 网络下载和全部 adapter projection |
| runtime | package runtime integration | recursive Rules discovery、Codex native check、Claude bridge reconcile/metadata | 其他实现族 parity、runtime help |

无 selector 的 `buildr package check` 在一个兼容 fixture 中聚合相同断言，避免维护命令因隔离 steps 增加重复初始化；Candidate 使用隔离 fixture 并行执行，保留每步 timing、budget 和 stdout/stderr diagnostics。拆分前基线为 14.77 秒，兼容聚合拆分后为 14.66 秒；隔离 steps 并行实测墙钟约 9.4 秒。

新增测试时先确定主 owner：同进程单函数和错误分支优先 `test/unit`；源码/manifest/docs 一致性进入 `test/contract`；真实 CLI/Git 子进程但仍低成本的组合进入 `test/integration:fast`；单领域完整状态变化进入 focused integration；只有跨多个命令和组件、且必须共享连续 workspace 状态时才进入 Workspace E2E。

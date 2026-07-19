# Buildr 验证覆盖职责矩阵

本文记录各类产品契约的主 verifier、允许的边界交叉，以及旧 MVP shell 删除后的覆盖归属。目标不是让每个行为只能出现一次，而是让重复验证具有明确理由。

## 分层职责

| 层级 | 主职责 | 不承担 |
| --- | --- | --- |
| test:fast | Node tests、架构、canonical spec quality/strict、runtime adapter 低成本契约 | 临时用户 workspace、npm pack/install、网络和完整生命周期 |
| test:affected | 人工选择领域专项，复用一次 fast，并按 step identity 去重 | 根据 Git diff 自动推断范围、证明最终候选完整 |
| test:changed | 根据 Git diff 或显式 Product 路径从统一 registry 生成最小 DAG，并解释选择原因 | 替代正式 Candidate、猜测未声明路径的影响 |
| test:workspace | 必须依赖同一真实 workspace 连续状态演进的跨组件黄金路径 | 全量 help、全 adapter parity、onboarding 分支和 tarball inventory |
| test:candidate | 聚合全部发布、安全、package、runtime、OpenSpec、managed data 和 Workspace E2E 门禁 | 开发期最小反馈 |

所有入口共享 `tools/verification/registry.mjs` 中的 step identity、executor、inputs、依赖、profile/group、预算和并发类别。`test:changed` 对未被任何 input 或显式 ignore 覆盖的 Product 路径 fail closed；`test:candidate` 固定选择完整 30-step profile，不读取 Git diff。

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

- repository onboarding 验证干净开发 checkout；release smoke 验证正式 tarball。
- CLI package parity 比较 checkout 与安装包；release smoke 证明安装后生命周期。
- OpenSpec fixtures 验证算法和破坏性样本；candidate audit 验证当前候选。
- capability integration 验证 capability/provider/binding；ownership recovery 验证资产拒绝与恢复。
- Workspace E2E 的最终 doctor 是收敛断言，不替代 doctor JSON 和 finding contract。

## Package verifier 分层

`buildr package check` 继续是完整产品维护入口，但内部覆盖由稳定 registry 组合；Candidate 与 `npm run test:package -- <selector>` 可分别执行和诊断以下 owner：

| Selector | Candidate step | 主职责 | 明确不承担 |
| --- | --- | --- | --- |
| static | package static validation | manifest、inventory、随包 baseline、Skill/Rule/Component 内容契约、支持工具存在性 | 临时 workspace、真实 CLI mutation |
| workspace | package workspace smoke | init/Project baseline、遗留 practices 保留、existing `AGENTS.md` 兼容、最终收敛 | Commands/Rules/Skills CRUD、全 runtime adapter 矩阵 |
| commands | package Commands integration | 默认 collection、add/check/remove 数据契约 | Workspace 黄金路径和 help 全量兼容 |
| rules | package Rules integration | add/remove/keep-file、required 保护、doctor 未注册 finding | recursive discovery 和 adapter reconcile |
| skills | package Skills integration | local/remote/resolved source add/remove | 网络下载和全部 adapter projection |
| runtime | package runtime integration | recursive Rules discovery、Codex native check、Claude bridge reconcile/metadata | 其他实现族 parity、runtime help |

无 selector 的 `buildr package check` 在一个兼容 fixture 中聚合相同断言，避免维护命令因隔离 steps 增加重复初始化；Candidate 使用隔离 fixture 并行执行，保留每步 timing、budget 和 stdout/stderr diagnostics。拆分前基线为 14.77 秒，兼容聚合拆分后为 14.66 秒；隔离 steps 并行实测墙钟约 9.4 秒。

新增测试时先确定主 owner：单函数和错误分支优先 Node unit；单命令/单领域状态变化进入 focused integration；只有跨多个命令和组件、且必须共享连续 workspace 状态时才进入 Workspace E2E。

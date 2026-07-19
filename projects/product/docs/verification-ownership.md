# Buildr 验证覆盖职责矩阵

本文记录各类产品契约的主 verifier、允许的边界交叉，以及旧 MVP shell 删除后的覆盖归属。目标不是让每个行为只能出现一次，而是让重复验证具有明确理由。

## 分层职责

| 层级 | 主职责 | 不承担 |
| --- | --- | --- |
| test:fast | Node tests、架构、canonical spec quality/strict、runtime adapter 低成本契约 | 临时用户 workspace、npm pack/install、网络和完整生命周期 |
| test:affected | 人工选择领域专项，复用一次 fast，并按 step identity 去重 | 根据 Git diff 自动推断范围、证明最终候选完整 |
| test:workspace | 必须依赖同一真实 workspace 连续状态演进的跨组件黄金路径 | 全量 help、全 adapter parity、onboarding 分支和 tarball inventory |
| test:candidate | 聚合全部发布、安全、package、runtime、OpenSpec、managed data 和 Workspace E2E 门禁 | 开发期最小反馈 |

## 旧 MVP section 迁移归属

| 旧类别 | 当前主 verifier | Workspace E2E 代表覆盖 | 迁移判断 |
| --- | --- | --- | --- |
| Workspace / Project / Service | onboarding integration、service branch、package workspace smoke | workspace-lifecycle | E2E 只保留组合黄金路径；异常、幂等和 branch contract 由 focused verifier 持有 |
| Commands | package workspace smoke | workspace-lifecycle 只做代表性 add | CRUD 和 manifest 细节不继续扩展进 Workspace E2E；批次二迁出 package monolith |
| Rules | package workspace smoke、runtime adapter parity | lifecycle 代表性 add；reconciliation 验证投射 | CRUD、discovery 和 adapter 投射分属不同契约 |
| Skills | package workspace smoke、runtime adapter parity、remote timeout | lifecycle 代表性 add；ownership 验证拒绝 | source/resolved/remote 与 runtime projection 由 focused verifier 持有 |
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

## 已知待收缩重复

buildr package check 当前仍在一个临时 workspace 内组合 init、Project、Commands、Rules、Skills、doctor 和 runtime Rules smoke。它是旧 MVP 删除后最大的剩余聚合热点。批次二应拆分 package static validation、package asset smoke 和领域 integration；拆分前不得直接删除现有断言。

新增测试时先确定主 owner：单函数和错误分支优先 Node unit；单命令/单领域状态变化进入 focused integration；只有跨多个命令和组件、且必须共享连续 workspace 状态时才进入 Workspace E2E。

## Context

当前 `npm test` 直接调用 `tools/verify-buildr-product`，在 Node 22 CI 上约耗时 129 秒；其中 fine-grained unit tests 约 2 秒，MVP E2E 约 65 秒。完整入口串行启动大量 CLI、Git 和 npm 子进程，并在 open-source candidate、package parity、MVP package lifecycle 和 release smoke 中重复生成 tarball。runtime adapter 的低成本 descriptor 契约已经覆盖全部 adapter，但昂贵 parity 和 smoke generator 仍按 adapter 品牌重复相近生命周期。

现有 Product Project 规则已经要求“单任务最小反馈、任务组 affected、冻结候选 full”三层验证，因此本 change 主要把命令入口和 verifier 结构调整为该模型，并修改与当前 workflow 不一致的跨平台契约。

## Goals / Non-Goals

**Goals:**

- 让普通实现任务在数秒内获得覆盖 unit、架构、spec 和 adapter descriptor 的反馈。
- 保留最终候选的全部安全、安装、数据完整性、OpenSpec 和用户旅程门禁，同时显著缩短 wall-clock 时间。
- 让 affected 组合不重复运行同一 verifier。
- 对全部 supported adapter 保留低成本契约覆盖，只对不同投射实现族运行昂贵 CLI 生命周期。
- 复用同一候选 run 生成的 npm tarball，保持 standalone release smoke 的跨平台可执行性。

**Non-Goals:**

- 不减少 supported adapter、Node 版本或 macOS/Windows release smoke 平台。
- 不删除 symlink、事务回滚、managed data、真实 tarball 安装或 scoped projection 隔离等安全覆盖。
- 不修改 Buildr 对外 CLI、workspace schema 或 package 发布内容。
- 不把耗时阈值升级为阻塞发布的硬门禁。

## Decisions

### 1. 默认入口只承担快速反馈

新增 `tools/verify-buildr-product-fast`，包含 unit tests、CLI architecture、OpenSpec spec quality/strict 和 runtime adapter contract。`npm test` 与 `npm run test:fast` 指向该入口；当前完整入口由 `npm run test:candidate` 显式调用。

没有选择让 `npm test` 保持 full 并仅靠文档提醒，因为 Agent 和贡献者会自然地把默认脚本视为普通任务验证入口，继续产生两分钟误用。

### 2. affected 以 verifier identity 去重

`verify-buildr-product-affected` 每次先运行 fast，然后由 `run_once` 按稳定 step id 执行领域 verifier。多个 group 共享 open-source candidate 等步骤时只执行一次。

没有为每个 group 建立独立复合脚本，因为这会继续复制命令清单并使 full、affected 和文档漂移。

### 3. 完整候选只生成一个不可变 tarball

完整 orchestrator 在安全候选检查前创建一次 tarball 和 npm pack metadata，通过 `BUILDR_CANDIDATE_TARBALL` 与 `BUILDR_CANDIDATE_PACK_METADATA` 传给 open-source inventory、package parity、MVP package lifecycle 和 release smoke。各 verifier 在没有这两个变量时仍自行 pack，因此跨平台 standalone release smoke 保持独立。

共享对象只读，安装 prefix 和 workspace 仍由各 verifier 隔离，避免为了节省 install 而引入测试间可变状态耦合。

### 4. 独立候选阶段采用有界并行批次

完整 orchestrator 保持快速失败门禁和候选 tarball 准备串行，然后把使用独立临时 workspace 的昂贵阶段分批并行。每个并行 step 写独立 log/result，批次结束后按声明顺序合并 timing；任一 step 失败时整体失败并保留准确 step、exitCode 和 diagnostics。

没有把全部阶段一次性并发，避免在两核 GitHub runner 上发生 npm/Git/Node 进程风暴。也没有立即拆散共享可变 fixture 的 MVP shell suite，先用跨 verifier 并行获得主要 wall-clock 收益。

### 5. adapter 昂贵验证按实现族而非品牌抽样

`adapter-contract` 继续遍历全部 adapter 的 descriptor、traits、plan、target、evidence 和安全约束。CLI parity 只对以下具有不同实现语义的代表执行重复 render/check/idempotency/orphan 生命周期：native recursive、per-source reference、same-directory vendor、central vendor 和 root-index bridge。TRAE/Cursor、TRAE Work/WorkBuddy 等共享机制的品牌差异由直接契约断言覆盖。

smoke workspace generator 只对 scoped-rule-files 与 reference-bridge 等不同 fixture profile 选代表。scoped render 保留无关 Project 投射的回归测试，并按 cleanup/projection 实现族覆盖。

### 6. 平台 CI 只验证平台相关边界

Ubuntu Node 20/22 继续运行完整候选验证，已经覆盖 Linux unit 和 release lifecycle。macOS/Windows Node 22 仅运行 standalone release smoke，验证 npm executable、installed bin、路径和文件系统差异；不再重复平台无关 unit tests，也不建立额外 Linux smoke job。

### 7. 删除重复 installed maintenance 生命周期

MVP 已安装 package 路径保留真实 install、init、doctor、Project/Service 和 runtime projection；checkout `package check`、package parity 与 release smoke 已覆盖 maintenance 和安装后行为，因此不再从 MVP 内再次运行完整 installed `package check`，只保留安装后的 bootstrap/help 可用性检查。

## Risks / Trade-offs

- [并行步骤隐藏输出顺序] → 每个 step 使用独立日志，批次结束后按声明顺序输出并合并 timing。
- [共享 tarball 掩盖重新打包不一致] → tarball 只在同一冻结候选 run 内复用；standalone verifier 仍自行 pack，CI release smoke 继续验证独立打包。
- [adapter 品牌特有分支遗漏] → 全 adapter descriptor/plan/evidence 仍逐项覆盖；只有共享实现的重复 CLI 生命周期被抽样。
- [删除 installed package check 降低覆盖] → 保留 checkout package check、真实 packaged CLI parity、installed release lifecycle 和 MVP installed bootstrap，覆盖从重复生命周期转为职责互补。
- [`npm test` 语义迁移造成误用] → Product 文档明确三层入口；CI、publish workflow 和 PR template 继续调用完整入口 wrapper，避免产品目录外迁移和历史 required context 改名。

## Migration Plan

1. 先新增 fast/candidate 脚本和文档，不删除现有 `tools/verify-buildr-product` 文件入口。
2. 调整 affected 去重、tarball 复用、并行 timing 和 adapter 抽样，并用专项验证确认覆盖。
3. Product 文档切换为 `npm run test:candidate`；CI/publish/PR template 保持调用兼容 wrapper。仓库集成时单独删除分支保护中已不存在的独立 Ubuntu smoke required context。
4. 对最终候选运行一次完整验证并比较 timing；若并行 orchestration 不稳定，可回退为同一 verifier 清单的串行执行，不回退三层入口和去重契约。

## Open Questions

无。

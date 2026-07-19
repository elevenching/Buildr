## Context

前三批已经把验证步骤统一到 registry/DAG，并将 Workspace E2E、package、onboarding 和 release 拆为明确 owner。低成本入口仍只有一个名为 `unit` 的 Node test 聚合：其中既有直接调用模块的单元测试，也有扫描源码/文档的静态契约，以及启动 Git 或真实 CLI 子进程的快速集成。Node coverage 因而显示的是 fast 聚合执行覆盖，不是单元测试直接覆盖。

当前探索基线为 17 个测试文件、84 个测试；所有生产模块都可能在聚合执行中被间接触达，但仅 10/49 个生产模块由测试直接导入。Runtime 和 verification 核心已有较好直接 owner，CLI application/domain、doctor diagnostics、package validation 和 remote/runtime checker 的直接 owner 较弱。

## Goals / Non-Goals

**Goals:**

- 让测试入口名称与实际隔离边界一致，失败时能立即判断属于纯逻辑、静态资产还是进程/仓库集成。
- 在不缩小 fast/Candidate 覆盖的前提下完成原子迁移。
- 提供独立 unit coverage 观察入口，支持按核心模块 owner 审阅缺口。
- 为高风险且可隔离的核心逻辑补直接单元测试。

**Non-Goals:**

- 不把所有使用临时文件系统的测试机械判为 integration；同进程、受控 fixture、单模块边界仍可属于 unit。
- 不把 Workspace E2E、package integration 或 release lifecycle 移入 fast。
- 不在本次建立全局覆盖率硬阈值，也不为了提高数字给薄 wrapper 编写低价值测试。

## Decisions

### 1. 三类稳定 Node 测试入口

采用 `test:unit`、`test:contract` 和 `test:integration:fast`：

- `unit` 直接调用同进程模块，覆盖 parser、validator、planner、状态转换和错误分支；可以使用小型临时文件 fixture，但不得启动真实 CLI、Git、npm 或跨产品生命周期。
- `contract` 检查源码结构、manifest、docs、Skills、schemas 和 entrypoint declaration，证明静态事实一致。
- `integration:fast` 启动真实 CLI/Git 子进程或组合多个产品层，但保持低成本且不承担完整 workspace/package/release 生命周期。

备选方案是保留平铺目录并维护手写文件列表；这容易在新增测试时再次误归类。目录即 owner，Node glob 直接发现，更易审查。

### 2. fast profile 显式聚合三层

registry 将三层注册为独立 step；架构和 runtime adapter contract 依赖三层低成本基础门禁。`npm test` 与 `test:fast` 的用户语义保持不变，Candidate 仍包含全部三层。

备选方案是让 `test:fast` 内部脚本串行调用三个 npm script，但会绕过统一 DAG 的并发、diagnostics 和 step identity。

### 3. Unit coverage 独立观察而非发布硬门禁

`test:coverage:unit` 仅执行 `test/unit/**/*.test.mjs` 并输出 Node 内置 coverage；coverage summary 可通过显式路径保存，供 CI/Agent 比较。fast 聚合覆盖率可以用于诊断，但不得标记为 unit coverage。

本次记录基线与核心 owner，不设置全局百分比阈值。后续阈值应以稳定的模块级基线、新增代码或风险区域为依据。

### 4. 先补可隔离核心逻辑

优先选择已有明确导出、无外部副作用或可依赖注入的核心模块。若 domain 仍是大命令 handler，不为追求覆盖率直接把整条 CLI 生命周期塞回 unit；先测试其已抽取的 parser/selector/diagnostic 逻辑，后续再独立重构。

## Risks / Trade-offs

- [迁移后 `test:unit` 覆盖率明显下降] → 将其解释为更真实的直接单元覆盖，并同时保留 fast/Candidate 生命周期证据。
- [测试分类发生争议] → 以进程/外部系统边界和 owner 为准，不以是否使用临时文件作为唯一标准，并在职责矩阵记录例外。
- [三个 registry step 增加少量启动成本] → 允许 DAG 并行；若实测退化明显，再合并执行器但保留独立 diagnostics identity。
- [物理移动导致 imports 或 planner inputs 漏配] → 使用相对路径更新、entrypoint contract test 和完整 Candidate 验证原子迁移。

## Migration Plan

1. 创建新目录和 scripts，先让 `test:fast` 同时覆盖三层。
2. 按边界移动现有测试并修复 imports；用 entrypoint contract 锁定发现规则。
3. 新增 unit coverage 入口和核心模块直接测试。
4. 更新 registry inputs、依赖、文档和驾驶舱，运行三层专项、affected 与完整 Candidate。

回滚时可恢复单一 `test/*.test.mjs` glob 和原 `unit` step；测试内容没有删除，因此不会丢失验证资产。

## Open Questions

无。本次不决定覆盖率硬阈值；以实施后的稳定 unit-only 基线作为下一次阈值讨论输入。

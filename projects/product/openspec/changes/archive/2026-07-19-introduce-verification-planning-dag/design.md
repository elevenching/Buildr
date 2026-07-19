## Context

前两批已完成 Candidate/Workspace 分层和 package verifier 拆分，但验证事实仍存在五处来源：fast shell 固定命令、affected shell group mapping、Candidate 内联数组、Workspace suite registry、package registry 与独立 budget map。相同 step 的 identity、命令和预算容易漂移；开发者仍需人工判断 affected group，普通文档改一个词也缺少可靠的轻量入口。

第三批需要统一“声明与规划”，同时保留两个边界：正式 Candidate 永远完整；Product 外的普通项目不继承 Buildr 自身的验证命令。

## Goals / Non-Goals

**Goals:**

- 用一个纯数据 registry 持有全部 step facts，并由自动测试证明唯一性、输入覆盖和 Candidate 完整性。
- 用同一 planner 支持 fast profile、affected groups、changed paths 和 candidate profile。
- 用有全局/类别上限的 DAG scheduler 替代无边界 `Promise.all`。
- 让 `test:changed --plan` 精确解释为什么选择或跳过步骤，并对未映射 Product 路径 fail closed。
- 保持现有 npm scripts、affected groups、Workspace/package selectors 和 timing diagnostics 兼容。

**Non-Goals:**

- 不让 diff-aware plan 替代发布前 Candidate。
- 不在本批次采集或提高 unit coverage；覆盖率属于第四批。
- 不引入通用 CI workflow engine、远程缓存、增量测试数据库或第三方 glob/DAG 依赖。
- 不根据代码 import graph 自动猜测业务影响；inputs 是审阅过的声明契约。

## Decisions

### 1. Registry 使用 Product 相对路径和结构化 executor

registry 位于 `tools/verification/registry.mjs`，step 至少声明 `id`、`name`、`executor`、`inputs`、`dependsOn`、`profiles`、`groups`、`concurrencyClass`，按需声明 `budgetMs`、`args` 和 `artifacts`。executor 使用 `node`、`npm`、`openspec`、`package-selector`、`workspace-suite`、`candidate-artifact` 等受支持类型，不保存任意 shell 字符串。

结构化 executor 避免 quoting 与平台差异，也让 registry validation 能证明命令文件存在。备选方案是 YAML 配置，但当前 registry 需要复用已有 JavaScript constants 和平台路径，YAML 会增加解析层及类型漂移。

### 2. Planner 与 executor 分离

planner 只输入 registry 加 selection request，输出不可变 plan：changed paths、selected ids、reasons、dependency expansion 和拓扑层级，不执行进程。runner 消费 plan、解析 executor 并调用 scheduler。`--plan`/`--json` 因此天然无副作用且易于 unit test。

### 3. Git diff 以 workspace Git root 为事实源，路径规范化到 Product

默认 base 优先使用当前分支 upstream 的 merge-base；没有 upstream 时使用 `origin/dev`，仍不可解析则要求 `--base`。规划合并 `<base>...HEAD`、staged、unstaged 和 untracked paths，过滤到 `projects/product/` 并转换为 Product 相对 POSIX 路径。显式路径直接以 Product root 为边界，不读取 Git diff。

删除路径即使文件已不存在也必须参与匹配；绝对路径、`..` 越界和 Product 外显式路径 fail closed。

### 4. 输入匹配必须完整而非静默 fallback

实现 Node 20 可用的受限 glob matcher，支持 `*`、`**`、`?` 和目录前缀。每个 Product changed path 必须匹配至少一个 step input 或 registry 顶层 `ignoredInputs`；未映射路径整体 fail closed。这样新增目录不会被“没有测试”误判为“无需测试”。

普通 Markdown 由新的轻量 docs quality step 持有；发布 README、package docs、OpenSpec artifacts、CLI/runtime/package 源各有更强 owner。

### 5. DAG 调度使用全局上限与 concurrency class

scheduler 默认全局上限 4，并为 `cpu-heavy`、`workspace-heavy`、`network`、`exclusive` 等类别配置容量。ready step 按 registry 顺序启动；exclusive step 只在当前无其他任务时运行。失败会阻断传递依赖，但不会取消已启动的无关 step。

备选方案继续使用阶段数组和 `Promise.all`，无法表达依赖、资源竞争或 blocked 状态；引入第三方 scheduler 则超出当前复杂度。

### 6. Candidate artifact 是 DAG 中的特殊 step

`candidate-tarball` 使用受支持的 `candidate-artifact` executor，成功后向运行上下文发布 tarball/metadata 环境。inventory、CLI package parity 与 release smoke 显式依赖该 step 并声明 artifact consumption。Candidate profile 固定选择全部强制 gates；changed/affected 永不隐式创建 tarball，除非所选 focused step 明确需要它并由 standalone verifier 自建制品。

### 7. 兼容入口逐步迁移，先保留 wrapper

`verify-buildr-product-fast`、`verify-buildr-product-affected` 和 `verify-buildr-product` 保留为稳定 executable，内部转交 Node runner。Workspace/package 的用户可见 selector 继续保留，registry adapter 通过现有实现执行；旧局部 registry 在迁移完成后只保留 CLI 产品行为所需的 domain runner 映射，不再重复预算、group 或 Candidate membership。

## Risks / Trade-offs

- [inputs 声明过宽导致仍运行太多] → `--plan` 输出匹配原因，测试文档-only、CLI、runtime、package 和 OpenSpec 代表 diff。
- [inputs 声明过窄漏测] → 未映射路径 fail closed，并用 tracked Product inventory 审计 registry coverage。
- [DAG 重构改变 Candidate gate] → 冻结现有 30-step baseline，迁移测试逐项比较 id、依赖和 artifact consumer，最终跑完整 Candidate。
- [并发上限导致耗时回退] → 沿用阶段预算，记录新旧 Candidate timing；先保证资源边界，再根据证据调整 class capacity。
- [Git base 推断不稳定] → 输出实际 base；无法证明时要求显式 `--base`，不猜任意提交。
- [docs quality 变成低价值形式检查] → 最低覆盖 Markdown 相对链接、尾随空白和已登记术语/入口一致性，发布/OpenSpec 文档仍触发更强 verifier。

## Migration Plan

1. 用 tests 固化现有 profiles/groups/30 个 Candidate steps 和 selector identity。
2. 建立 registry validation、glob/path matcher、planner 和 scheduler unit tests。
3. 迁移 fast、affected 与 selectors，再迁移 Candidate artifact/steps；每组完成后跑受影响验证。
4. 新增 changed CLI、docs quality 与 representative diff fixtures。
5. 更新文档和驾驶舱，冻结最终树运行 `test:changed --plan`、affected、聚合入口和完整 Candidate。

若迁移导致 gate 缺失或 Candidate 不稳定，wrapper 可临时切回旧 orchestrator；registry/planner 不作为完成状态，直到完整 step parity 和 Candidate 通过。

## Open Questions

- 默认 Git base 在本地无 upstream 的任务分支上优先 `origin/dev` 还是 main workspace 当前分支，需要结合 worktree 创建契约和 CI 环境测试决定。
- `test:changed` 的 JSON schema 是否在本批次登记为内部稳定 schema，还是先作为 maintenance-only machine output；实现时优先保持可测试字段稳定，但不扩大公共 CLI JSON surface。

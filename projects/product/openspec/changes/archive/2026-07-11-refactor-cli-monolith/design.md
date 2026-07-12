## Context

`tools/buildr` 同时是 npm `bin`、命令帮助来源、参数分发器和几乎全部产品逻辑的容器。当前文件约 7,745 行，包含 315 个顶层函数；职责大致按追加顺序形成连续区域，但所有区域共享同一模块作用域。现有 `runtime-adapter-contract.mjs`、`runtime-projection.mjs` 和 render/check 模块证明了按稳定契约抽取模块可行，但 Project/Service、Rules、Skills、Commands、Components、OpenSpec contract、doctor、package/update 仍留在主文件中。

风险最大的耦合有三类：

- `main`、`usage` 与各 handler 通过隐式函数名和 `process.argv` 相连，新增命令需要同时修改多处分支。
- doctor、package/update 和 Component 编排直接调用多个领域的内部函数，当前没有可审阅的依赖方向。
- `packageCheck` 既验证发布清单，又在临时 workspace 中执行 Rules、Skills 等 smoke 场景；`verify-managed-mutations.mjs` 还按单文件函数白名单审计写操作，导致移动代码本身会改变验证边界。

本次重构必须保持 checkout CLI 与 npm 安装 CLI 的外部可观察行为一致，保留所有数据完整性、transaction、atomic write、runtime adapter 和 OpenSpec guard 语义，并保持 `tools/buildr` 为稳定 bin 路径。

## Goals / Non-Goals

**Goals:**

- 让 `tools/buildr` 只承担 executable bootstrap，命令发现、帮助和 dispatch 由可验证的 CLI 层负责。
- 让每个产品领域拥有自己的解析、校验、读写和 command handlers，跨领域编排只出现在显式 application/composition 模块。
- 建立可自动检查的单向依赖层级，避免拆分后形成循环依赖或“多个小文件共享同一个隐式全局”的分布式巨石。
- 将 `packageCheck` 的发布清单校验、领域校验和 smoke 执行拆成独立职责，同时保持 `buildr package check` 的统一入口与输出契约。
- 保持全部公开/兼容/maintenance 命令的参数、帮助、输出通道、退出状态、写入结果和失败回滚行为。
- 确保 npm tarball 递归包含新的 CLI runtime 模块，并用 checkout/npm 双入口验证证明发布完整性。

**Non-Goals:**

- 不新增、删除或重命名 CLI 命令和参数，不调整产品表面分类。
- 不引入 Commander、yargs 等新参数解析依赖，也不借机统一改写全部错误文案。
- 不改变 workspace manifest schema、OpenSpec sidecar、Component definition 或 runtime projection 数据模型。
- 不重构 `verify-buildr-product-mvp` 的全部测试组织；只抽取或新增证明模块化重构所需的验证入口。
- 不把领域模块设计成第三方插件 API；这些模块仍是 Buildr package 内部实现。

## Decisions

### 1. 使用四层依赖结构，而不是按行数切文件

新的 CLI runtime 位于 `tools/cli/`，采用以下依赖方向：

```text
tools/buildr
    │
    ▼
cli bootstrap / help / command registry
    │
    ▼
application composition
(doctor, sync/update, package maintenance)
    │
    ▼
domain modules
(workspace registry, rules, skills, commands,
 components, openspec contract, runtime)
    │
    ▼
shared infrastructure
(args, paths, yaml, git, filesystem, mutation)
```

下层不得导入上层；领域模块之间的组合由 application 层完成。允许一个领域模块内部继续拆分 model、repository、command，但不要求为每个函数单独建文件。

选择该方案而不是“每个命令一个自包含文件”，是因为许多命令共享同一资产模型和 transaction 边界；完全按命令复制 helpers 会制造漂移。也不选择只把连续代码块搬到少数大文件，因为那只会把单文件巨石变成互相循环依赖的多文件巨石。

### 2. 保留稳定 executable，使用显式 command registry

`tools/buildr` 保持 shebang 和 npm bin identity，只导入 CLI bootstrap 并传入 `process.argv`。command registry 以显式的命令路径、帮助 topic 和 handler 组成唯一 dispatch 事实源；根帮助的产品表面分组仍由现有契约控制。

registry 不成为可扩展插件系统，也不允许 Component 注入 handler。这样既消除 `main` 中长条件链，又不扩大执行边界或改变 Component 的“非可执行资产”定位。

### 3. 先建立行为特征测试，再机械迁移领域

在移动实现前补充 CLI compatibility verifier，覆盖：

- 根帮助与每个 topic help 的 stdout、无副作用和退出状态。
- 未知命令、缺参、非法 option、unsupported adapter 等代表性失败路径的 stderr 与退出状态。
- 代表性只读 JSON 命令和 source mutation 命令的结果。
- checkout `tools/buildr` 与 npm tarball 安装后 `buildr` 的同输入等价性。

迁移按共享基础设施、基础领域、组合层、入口的顺序进行。每一阶段只移动一个闭合职责组并运行对应专项验证；最终候选再运行产品完整验证。与现有行为不一致时以迁移前特征和 canonical specs 为准，不在重构中顺手接受行为变化。

### 4. 将直接写入审计从“单文件函数白名单”升级为“模块边界白名单”

保留 `verify-managed-mutations.mjs` 的 fail-closed 意图，但让它扫描全部发布 runtime modules，并按模块与导出 mutation primitive/command 的明确清单审计直接 `fs` 写入。共享 atomic writer 和 mutation transaction 仍是受管 source mutation 的唯一基础设施；领域模块不得自行绕过。

相比放宽或删除现有白名单，这能在拆分后继续证明写入边界；相比要求所有 I/O 立即改为完整 dependency injection，此方案迁移风险更低，也不改变同步文件 API 的现有执行模型。

### 5. `packageCheck` 保持命令入口，内部拆成校验器与 smoke runner

`buildr package check` 仍输出统一问题集合并保持退出语义，但实现拆为：发布 metadata/inventory 校验、workspace baseline/manifest 校验、runtime/Component 校验以及临时 workspace smoke runner。可复用的解析和领域校验由对应模块导出，package 层只组合结果，不复制领域规则。

不在本 change 中把所有 smoke 场景迁出到 shell verifier，因为 package check 本身是正式 maintenance 契约；完全移除内部 smoke 会缩小现有保障范围。

### 6. npm 发布整个内部模块树，但不公开其 API

`package.json#files` 增加 `tools/cli/`，package check 和 npm E2E 同时验证入口依赖闭包完整。内部模块不通过 package `exports` 暴露，使用者仍只依赖 `buildr` bin；文件布局不构成对外兼容承诺。

## Risks / Trade-offs

- [机械移动时出现细微输出或退出码漂移] → 先冻结代表性兼容测试，逐领域迁移，并在最终 npm E2E 中比较双入口行为。
- [模块拆分产生循环依赖] → 用分层目录和 import-boundary verifier 阻止下层反向导入；跨领域调用提升到 application composition。
- [共享模块成为新的“杂物箱”] → shared 只容纳无产品领域语义的 args/path/YAML/Git/filesystem/mutation primitives；manifest 语义留在所属领域。
- [一次性大重构难以定位失败] → 按闭合职责组迁移，每组运行最小/专项反馈，避免在移动期间改变行为。
- [npm tarball 漏发新模块，checkout 通过但安装后失败] → 发布整个 `tools/cli/` tree，并保留 clean npm install onboarding E2E。
- [函数导出增加内部耦合面] → 领域模块只导出 command handler、组合层需要的 service 和明确的 pure validator；不把内部导出记录为 public API。
- [结构约束过度依赖行数阈值] → 不使用硬编码文件行数作为主要门禁，改为检查薄入口、层级依赖、命令唯一登记和 mutation 边界。

## Migration Plan

1. 在现有实现上建立 CLI compatibility 与模块边界 verifier，确认基线通过。
2. 抽取 shared infrastructure，并保持旧入口调用路径可运行。
3. 按领域迁移 registry/assets/OpenSpec/runtime 逻辑，再迁移 doctor、sync/update 与 package composition。
4. 将 help/dispatch 切换到显式 registry，使 `tools/buildr` 只保留 bootstrap。
5. 更新 npm files、package check、开发安装入口所需路径，并运行 checkout/npm 专项与产品完整验证。
6. 若迁移中无法保持兼容，可在同一 task branch 回退到上一个领域迁移点；不需要 workspace 数据迁移或用户侧回滚步骤。

## Open Questions

无。实现中若发现某个 helper 同时携带多个领域语义，应优先把调用提升到 composition 层，而不是新建跨领域循环依赖。

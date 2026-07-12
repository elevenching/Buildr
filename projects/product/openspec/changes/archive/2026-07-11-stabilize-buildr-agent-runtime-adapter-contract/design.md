## Context

当前 `codex` 与 `claude-code` 已实现完整 runtime 能力，但 adapter 描述位于 `tools/buildr`，Skill renderer 和 Rule renderer 分散在独立模块，`render`、`sync` 与 doctor 仍包含 Agent-specific 分支，两个 runtime checker 也重复实现来源解析、受管标记和状态判断。结果是 metadata、写入行为和诊断行为可以独立变化；新增 Trae 这类与 Codex 共享 `AGENTS.md` 和 `.agents/skills/` 投射原语的 runtime，仍需复制整个控制流。

与此同时，Component 已能拥有 Rules、Skills、Command collections 和自然语言 Skill Contribution。Component 必须验证自己的 definition 和全部成员完整性，但它是 workspace 源资产生命周期边界，不是执行任意代码或扩展 runtime adapter 的插件系统。

## Goals / Non-Goals

**Goals:**

- 用一个静态 registry 定义 supported runtime adapter 的身份、能力和实现入口。
- 让 adapter 只负责 runtime-specific 描述与纯计划生成，让通用 core 负责确定性 reconcile 和诊断。
- 让所有 runtime 命令从同一 contract 派生，并保持现有 `codex`、`claude-code` 行为兼容。
- 提供共享投射原语，使未来 Trae 一类 adapter 可以复用布局或 native Rule 行为而不成为 fallback alias。
- 保持 Component 完整性校验职责，同时封闭 Component 向 adapter 执行层注入代码的路径。

**Non-Goals:**

- 本 change 不把 Trae 或其他第三种 runtime 列为 supported。
- 不提供动态 adapter discovery、workspace JavaScript 插件、外部 registry 或 Component adapter member。
- 不改变 Component 当前 workspace-only scope，也不引入权限或门禁系统。
- 不重新设计 Rules、Skills、Component Contribution 或受管数据 transaction 的源资产模型。

## Decisions

### 1. 静态内置 registry 是 supported adapter 的唯一事实源

每个 adapter descriptor 至少包含稳定 `id`、required capabilities、runtime targets、推荐命令以及一个计划生成入口。CLI 参数校验、帮助、`runtime list`、doctor filter、render、sync 和 Skill 安装从 registry 查询 adapter，不再分别维护 allowlist 或 switch。

选择静态 registry，而不是扫描 Components 或 workspace modules，是因为 adapter 会参与文件写入和清理边界。静态内置代码可以随 Buildr 版本审阅和测试；动态加载会把受管自然语言资产升级为任意代码执行接口，并使 supported contract 无法由 package 验证证明。

### 2. Adapter 生成纯 `RuntimePlan`，通用 core 唯一执行副作用

通用 source assembly 先解析 canonical scope、Rules discovery、产品 Buildr Skill、workspace/Project Skills、远端安装计划和已验证的 Component Contributions。adapter 接收不可变上下文并返回声明式计划，包括预期 writes、native assets、managed removals、capability evidence 和 runtime-specific findings/repair hints。

adapter 不直接写文件、删除文件、修改源 manifest、运行 doctor 或执行 Component 代码。计划生成期间检测到的问题以结构化 finding 返回；任何计划本身违反路径、ownership、重复 target 或 capability 约束时，由通用 validator 在零写入状态拒绝。

相较让每个 adapter 各自实现 render/check，这一选择牺牲少量局部自由度，但可以让 render 与 check 比较同一个期望计划，并让所有 runtime 共享原子预检、managed marker、冲突检测、apply 和 orphan cleanup。

### 3. `render`、`sync`、`runtime check` 和 doctor 复用同一 planning/reconcile 管线

管线按以下阶段执行：

```text
canonical scope discovery
  -> source assembly + verified Component Contributions
  -> adapter.planRuntime(context)
  -> validate RuntimePlan
  -> preflight current target state
  -> apply or compare-only
  -> structured findings + repairs
```

`runtime check` 和 doctor 使用 compare-only 模式；render 与 sync 使用 apply 模式；Component lifecycle 在源 transaction 成功后调用同一 apply 管线。`sync` 仍负责编排产品 update、Buildr Skill 安装、runtime render 和最终 doctor，但不自行实现 Agent-specific 文件行为。

### 4. Runtime-specific 差异通过组合内置投射原语表达

保留的 adapter-specific 内容包括：Rule 是 native 还是 bridge、runtime 目标目录、桥接格式、产品 Skill 的 runtime guidance，以及确实无法通用化的兼容检查。共享原语可以表达 native `AGENTS.md`、reference bridge、`.agents/skills`、`.claude/skills` 和 install-plan layout。

共享原语不是 fallback。未来 `trae` 即便与 `codex` 组合相同原语，也必须拥有独立 descriptor、capability evidence、兼容测试和明确 runtime identity；调用 `trae` 时绝不解析为 `codex`。

### 5. Supported 状态要求五项 capability 全部通过静态与行为验证

registry 注册时验证 descriptor schema、唯一 id、五项 required capabilities、target 合法性和实现入口。package verification 再通过 contract tests 证明每项 capability 的计划和 check 行为。测试专用 fake adapter 只在测试注入点存在，用于证明新增 adapter 不修改通用控制流；它不会出现在发布 registry、帮助或 `runtime list` 中。

### 6. Component 自证完整性，但不能扩展 Adapter

Component/package check、install/update/uninstall 预检和 doctor 继续验证：definition schema、来源与版本、成员枚举、成员路径、成员 integrity、唯一 ownership、manifest 对齐，以及 Contribution 的 member 引用、目标 Skill 和 slot 声明。只有 enabled、installed 且完整性验证通过的 Contribution 才能进入 source assembly。

Component definition 不允许声明 adapter、adapter module、runtime hook、executable member 或 registry patch。发现此类未知或保留类型时 fail closed；Buildr 不加载或执行其内容。Component 完整性校验失败时，runtime 管线不得消费该 Component 的贡献，但诊断必须保留可归因 finding 和修复建议。

### 7. 迁移保持现有 runtime 结果和 managed ownership

先提取 shared source assembly 和 RuntimePlan validator，再迁移 Codex，最后迁移 Claude Code bridge；每一步都以现有 fixture 与临时 workspace parity 测试比较目标路径、内容、marker、conflict、orphan 和 doctor 结果。现有受管文件不改 marker/ownership 格式，避免重写或误清理。

如果迁移后出现 parity 回归，可以回退到变更前实现，因为本 change 不迁移 workspace 源数据或公开 manifest schema。已经由新实现生成的文件仍使用现有 managed 格式，可被旧实现识别。

## Risks / Trade-offs

- [计划模型无法表达某个 runtime 的特殊行为] → 先把必要差异建模为受约束的内置投射原语或结构化 finding，不给 adapter 开放任意 apply hook。
- [重构改变现有文件内容或清理范围] → 使用 golden parity、重复同步幂等、用户文件冲突和 orphan fixture 对两个现有 runtime 做差异验证。
- [registry metadata 与 adapter 行为仍可能漂移] → capability evidence 由计划和 contract tests验证，package check 拒绝声明能力但无实现证据的 adapter。
- [Component 校验失败阻止相关 runtime 内容更新] → fail closed 并给出 Component/member 级 finding；不影响与该 Component 无关的只读 source diagnostics，但 mutation 不得宣称完整成功。
- [共享原语造成 runtime 身份混淆] → descriptor id、诊断 attribution 和命令参数始终保留具体 runtime id，禁止 alias 和 fallback。

## Migration Plan

1. 定义 registry、RuntimeContext、RuntimePlan、finding/repair 与 validator 的内部契约和 contract tests。
2. 抽取通用 source assembly、Component Contribution 验证输入和 reconcile executor。
3. 将 Codex 与 Claude Code 迁移为静态 adapter，并保持现有输出 parity。
4. 将 CLI、sync、runtime check、doctor、Skill install 与 Component lifecycle 切换到 registry 驱动。
5. 删除被替代的 Agent-specific分支和重复 checker；更新产品文档与 Buildr Skill guidance。
6. 在最终候选上运行 package check、专项 contract tests 和一次临时 workspace E2E。

## Open Questions

无。Trae 的正式 runtime id、最低版本和实际目标布局留给后续 `add-trae-runtime-adapter` change 决定。

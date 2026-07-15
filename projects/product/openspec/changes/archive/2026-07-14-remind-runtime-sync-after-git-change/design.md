## Context

Buildr workspace 的 Git 源资产与本地 Agent runtime 是两个状态面。当前 `doctor` 已能综合判断 Rules、Skills、Commands、Components、Contributions 和 runtime 投射状态，但 Git 工作流不会在已检出内容变化后主动调用它。仅靠用户记得运行 `sync`，无法区分“源资产确实变化但 runtime 已同步”“Commands 缺失”“Component 冲突”等不同情况；引入 Git hook 又会产生安装、升级、跨 worktree 和失败恢复等新的维护面。

本变更涉及 `git-ops`、`task-worktree`、`task-finish`、产品入口 Buildr Skill 和包验证，需要统一触发与提醒边界。

## Goals / Non-Goals

**Goals:**

- 由 Agent 已经在执行的 Skill 在 Git 工作区转换完成后同步触发 Buildr 环境检查。
- 复用 `doctor` 的现有状态计算，覆盖 Rules、Skills、Commands、Components、Contributions 和当前 Agent runtime。
- 发现可由 workspace sync 修复的问题时，询问用户是否由 Agent 立即同步；确认后由 Agent 执行并验证，同时保留手动同步兜底。
- 保持任务 Skill 内部执行 Git 工作区转换时的行为一致。

**Non-Goals:**

- 不安装或维护 Git hook、daemon、文件 watcher、定时任务或后台服务。
- 不新增独立 hash、receipt 或缓存协议来替代 `doctor`。
- 不在缺少用户授权时执行 `render`、`sync`、Component 生命周期动作、外部命令安装或 CLI 更新。
- 不保证感知用户或其他程序绕过 Agent Skill 直接执行的 Git 操作。
- 不负责让当前 Agent session 热重载新资产。

## Decisions

### 1. 由工作流 Skill 触发，而不是由 Git 或 Buildr CLI 监听

`git-ops` 将工作区转换分为两类：

- 成功后可能改变已检出文件的操作：`pull`、`merge`、`rebase`、切换 checkout 的 `checkout` / `switch`、改变工作区的 `reset`、`cherry-pick`、`revert`、`stash apply` / `stash pop`。这类操作完成且仓库不处于未解决冲突状态后触发检查。
- 不改变已检出文件的操作：`fetch`、`push` 和普通 `commit`。这类操作不触发检查。

`task-worktree` 在新 worktree checkout 完成后复用检查；单纯复用未发生转换的 worktree 不重复检查。`task-finish` 在成功 rebase 或目标 workspace fast-forward 集成后复用检查。失败或冲突中的 Git 操作先按既有失败流程停止，不在未稳定 tree 上建议同步 runtime。

选择这一方案是因为 Agent 已知操作是否成功、当前 Agent 类型和用户意图，不需要安装额外基础设施。代价是 Agent 之外的 Git 操作不会即时触发；后续进入 Buildr 工作流时仍由既有基线 doctor 兜底。

### 2. `doctor` 是状态判断的唯一事实源

Skill 不自行维护关注路径清单或前后 hash。完成工作区转换后，它先从当前路径向上定位最近的 `.buildr/workspace.yml`；找不到则视为非 Buildr workspace，不执行 Buildr 检查。找到后使用当前 Agent 对应的受支持 adapter 运行：

```bash
buildr doctor --agent <agent> --target <workspace-root> --json
```

这会让新增资产类型、manifest 语义和 runtime adapter 变化自然继承 `doctor` 的现有实现。若无法确认当前 adapter，或 doctor 本身无法执行，Skill 报告“环境状态未确认”及原因，不猜测 runtime 已同步。

### 3. 诊断决定交互，Agent 是默认执行者

doctor 无需用户处理的问题时不输出额外同步提醒。发现 runtime/source 漂移且 `sync` 是合适修复动作时，Skill 汇总受影响资产并询问用户是否由 Agent 立即同步当前 Agent 的 workspace；同一提示提供 `buildr sync <agent> --target <workspace-root>` 作为手动备选。用户确认后，Agent 调用 Buildr Skill 执行 sync，并以命令内置的最终 doctor 或追加 doctor 验证结果。

Commands 差异、Component 冲突或 CLI 版本问题按各自生命周期询问和处理，不能全部归入 `sync`。所有写操作仍由用户意图和对应 Skill 的授权边界决定：未确认时不执行；确认且 Agent 能完成时不得只把命令交给用户。只有用户选择手动方式，或 Agent 因工具、权限、登录态、外部环境等原因无法完成时，才输出手动步骤并说明原因。当前 session 是否重新发现新资产仍由 Agent runtime 决定。

### 4. 产品入口和包验证共同守住契约

产品入口 Buildr Skill 将单项 Git 操作继续路由到 `git-ops`，并说明工作区转换后的诊断属于 Git 工作流检查点。包静态验证同时校验：

- `git-ops` description 能路由工作区转换意图；
- 触发操作、排除操作、Buildr workspace 判定和 doctor 命令存在；
- 诊断干净时不打扰；异常时先询问，用户确认后由 Agent 执行 sync 和 doctor，并保留手动兜底；
- `task-worktree` 与 `task-finish` 复用检查点；
- 没有把 Git hook 或当前 session 热重载声明为 Buildr 责任。

## Risks / Trade-offs

- [用户在终端直接执行 Git 操作时不会即时检查] → 在下一次 Buildr Skill 执行循环的基线 doctor 兜底，后续产品化再考虑审核事件或定时检查。
- [每次工作区转换运行 doctor 增加少量延迟] → 仅对成功且可能改变已检出文件的操作运行；不对 fetch、push、commit 或未变化的 worktree 复用重复执行。
- [doctor 诊断较宽，可能报告与本次 Git 操作无关的既有问题] → 提醒表述为“当前环境状态”，不错误归因于刚完成的 Git 操作，并以 doctor 分类和建议为准。
- [用户不希望在当前时点同步] → 不执行写操作，保留准确的手动命令，后续 Buildr 基线 doctor 继续报告未处理状态。
- [当前 session 无法立即加载新 Skill 或 Rule] → 明确这属于 Agent runtime activation 行为，Buildr 只保证源资产与投射状态可诊断。

## Why

Buildr 的内置 Skills 已支持独立安装和卸载，但跨 Skill 协作仍通过 `git-ops`、`task-finish` 等具体 Skill id 和重复流程文本连接。用户通常只会表达“以后采用 feature 分支”“改用公司内部流程”之类工作意图，不知道被修改 Skill 的哪些行为正被其他编排 Skill 依赖；Buildr 既无法可靠分析影响，也无法确认替代实现、完成组合验证并安全激活。

现在需要把“不可替换的不变量”“可组合的能力契约”和“可替换的 Skill 实现”分开，使 Buildr 内置 Skill 成为开箱即用的默认 provider，而不是其他工作流无法替换的硬依赖。

## What Changes

- 为 Skill 系统增加版本化能力契约，定义 capability identity、契约文档、provider、consumer、required/optional dependency 和显式 binding；contract 使用最小固定 frontmatter 自描述身份，manifest 负责 scope 注册，两者必须一致。
- 将完整机制命名为“Agent 工作能力适配（Agent-managed Capability Adaptation）”：用户只表达工作意图，Agent 负责识别该意图是否触达或产生跨 Skill 稳定依赖边界，并完成影响分析、候选资产开发、组合验证、激活和 runtime 同步。
- 在 required Core 固化 Skill 变更前的跨 Skill 依赖检查，在产品入口 Buildr Skill 中路由工作方式调整意图，并新增 `capability-adaptation` 管理 Skill 承载具体适配流程；普通用户无需理解或手动维护 contract、provider、consumer 或 binding。
- 将 Skill id 与 capability id 分离；一个 Skill 可以提供多个 capability，也可以依赖多个 capability，用户 Skill 无需冒用或覆盖内置 Skill id 即可成为替代 provider。
- 定义 workspace / Project scope 的 provider 解析顺序：更具体 scope 的显式 binding 优先；没有 binding 时只允许当前 scope 链唯一兼容 provider；零 provider、多个 provider 和版本不兼容都形成可诊断状态，不因 Project 中刚好新增 provider 而静默改绑，也不回退到已卸载 builtin。
- 扩展 doctor、runtime render 和 builtin/Skill 生命周期，使会移除、禁用或改绑当前 provider 的动作在写入前披露影响，并在 render、sync 和 doctor 中报告 required dependency 阻断、optional dependency 降级、binding 冲突和 provider runtime 不可用。
- runtime render 确定性投射 consumer 与所选 provider 的 binding、contract path/digest 和 readiness 信息，不修改用户 Skill 源；required capability 未解析时保留 consumer 的诊断与安全停止指引但标记为 `blocked`，optional capability 缺失时按 consumer 声明降级。
- 产品入口 Buildr Skill 在完整 sync 中获得当前 scope 的受管 capability routing evidence；仅执行独立 Skill install 或 evidence 缺失/陈旧时，通过当前 workspace doctor 解析 binding，不新增独立 dispatch API。
- 区分编排型 consumer 与能力路由者：`task-finish` 的 `requires` 参与整体 readiness；产品入口 Buildr Skill 只在某类用户意图命中时按 routing evidence 使用对应 capability，单项能力 blocked 不得阻塞其无关 Buildr 管理功能。
- 扩展 `buildr skills add/replace` 接收 `--provides` / `--requires`，并新增最小的 `buildr skills bind` / `unbind` 写入口，使 Agent 能事务化声明 provider/consumer 和替换实现，而不是要求用户手改 manifest。
- 以 Git/task 工作流作为首个落地案例：`git-ops` 成为默认 Git capability provider；`task-finish` required 依赖 Git task integration 与 task worktree lifecycle，optional 依赖资产审查；`task-worktree` 自身提供 lifecycle capability 并直接遵守 Core workspace-transition invariant，不再为了该 invariant 依赖具体 `git-ops` identity。
- 将 tree 转换后的 Buildr 环境检查从 optional `git-ops` 的所有权中移出：required Core 固化触发不变量，产品入口 Buildr Skill 承载 doctor/sync 专业动作，任何兼容 Git provider 都不得绕过该检查。
- 保留 `task-finish` 对“收尾”授权、阶段顺序和失败停止条件的所有权；把 rebase、fast-forward、merge 策略等默认 Git policy 交给所选 provider，并在 Git 写操作前向用户披露 provider、集成策略和影响范围。
- 将现有 `task-asset-review` 缺失降级迁移为 optional capability dependency，验证同一框架同时支持 required provider 和 optional provider。
- **BREAKING**：`skills/manifest.yml` 升级为 `buildr.skills/v2`；新版 Buildr 自动迁移 v1 manifest，但旧版 CLI 不能理解 capability contract、binding 和 dependency diagnostics。
- capability contract 只约束 consumer 安全协作所需的最小保证、授权类别、结果证据和失败边界，并显式记录 provider 可自由变化的部分；命令、算法、组织 policy 和非必要顺序留在 provider Skill。
- 本变更不引入 Git hook、daemon、watcher、事件总线、通用代码执行插件系统、通用 Agent Skill 测试平台、独立 capability resolve/dispatch 命令、自然语言自动认证平台或 contract marketplace，也不声称仅凭声明即可证明用户 Skill 的行为正确。
- 首批只迁移六个 Git/task capabilities；`task-triage`、`task-cockpit` 和 OpenSpec component Skills 等未进入本次真实依赖图的 builtin 继续使用现有 identity routing，不能被描述为已经支持透明替换。

## Capabilities

### New Capabilities

- `skill-capability-contracts`: 定义自描述 Skill capability contract、provider/consumer 声明、scope binding、readiness、required/optional dependency、runtime 投射和 doctor 诊断框架。

### Modified Capabilities

- `managed-skill-assets`: 将 Skills manifest 升级到 v2，支持 contract、provides、requires 和 bindings，并让 add/replace/remove/render 生命周期保留和校验这些声明。
- `agent-task-workflows`: 让内置任务 Skills 按 capability 而不是具体 Skill id 协作，区分编排所有权、默认 provider policy 和 required Buildr 不变量。
- `product-agent-skills`: 让产品入口 Buildr Skill 按已解析 capability 路由工作流，尊重 builtin 卸载、用户 provider binding 和依赖降级状态。
- `buildr-package-assets`: 让 package manifest 声明随包 capability contract、初始默认 binding 和依赖关系，并通过 package、runtime 与 E2E 验证覆盖替换场景。

## Impact

- 影响 `skills/manifest.yml` schema、Skill 源解析、scope 聚合、runtime render plan、doctor、builtin uninstall/restore、workspace sync 和相关 JSON diagnostics。
- 影响 `package/manifest.yml`、默认 workspace Skills manifest、Buildr Core、产品入口 Buildr Skill，以及 `git-ops`、`task-worktree`、`task-finish`、`task-asset-review` 的职责、依赖和路由文本。
- 需要新增 capability contract 最小 frontmatter 与固定语义章节、`buildr.skills/v1`→`buildr.skills/v2` 自动迁移、provider resolution、binding/contract identity 冲突、required/optional dependency 和 runtime 可用性测试。
- 需要在所有 supported runtime adapters 验证：默认 provider、用户自定义 provider、builtin 卸载、同 scope 多 provider、Project override、required provider 缺失和 optional provider 缺失。
- 不新增远程服务、数据库、runtime hook 或新的 Agent adapter trait。

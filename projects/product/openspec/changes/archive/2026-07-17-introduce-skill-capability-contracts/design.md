## Context

Buildr 当前把 Skill 作为 manifest-backed 工作资产管理，并支持 builtin install/uninstall、workspace/Project scope 聚合和多 runtime 投射。这个模型解决了“Skill 从哪里来、是否启用、投射到哪里”，但没有表达“Skill 对外提供什么稳定能力、另一个 Skill 依赖什么能力、用户替代默认实现后如何重新绑定”。

现有 Git/task 工作流已经形成真实依赖图：产品入口 Buildr Skill、`task-worktree` 和 `task-finish` 直接引用 `git-ops`，`task-finish` 同时重复部分 Git policy；`task-asset-review` 则由 `task-finish` 以 optional 方式调用。所有相关 builtin 都可卸载，但 manifest 和 doctor 不知道这些依赖，因此“可卸载”不等于“可替换”。

本设计把 Java 式 interface/implementation 思路映射到 Agent 工作资产：capability contract 是稳定接口，Skill 是 provider，consumer 依赖 contract，Buildr manifest 和 doctor 承担 binding 与兼容诊断。与代码接口不同，Agent contract 不约束调用签名或内部算法，而是形成“行为信封”：约束执行前必须确认和披露什么、允许哪些副作用、完成后必须给出什么证据，以及何时停止或交还用户判断；信封内部的工具、命令、策略和组织习惯由 provider 决定。

## Goals / Non-Goals

**Goals:**

- 让用户只表达工作方式变化，由 Agent 完成工作能力适配，不要求普通用户理解或手动维护 capability contract、provider、consumer 和 binding。
- 让 Agent 在创建、修改、替换或卸载 Skill 前识别该意图是否触达或产生跨 Skill 稳定依赖边界，并检查所有受影响能力使用者。
- 让上层 Skill 依赖版本化 capability contract，而不是具体 Skill id。
- 允许 Buildr builtin 作为默认 provider，workspace/Project Skill 以不同 id 提供兼容实现。
- 明确 required 和 optional dependency 的不同失败、降级和诊断语义。
- 通过 scope binding、doctor 和 runtime projection 给 Agent 一个唯一、可审计的 provider 选择结果。
- 保持 Rule、capability contract、Skill 和 orchestration 的职责分离。
- 把 tree 转换后的 Buildr 环境检查提升为独立于 optional Git provider 生命周期的 required invariant。
- 以 Git/task 工作流完成首个端到端迁移，并验证内部 provider 替换真实可用。
- 为现有 `skills/manifest.yml` 提供确定性 v1→v2 迁移，保留用户 Skill、builtin 卸载状态和来源信息。
- 让 contract 文件脱离当前 manifest 上下文时仍可被 Agent、索引器和 package check 识别，同时避免把动态安装状态复制进 contract。
- 将结构可解析、官方行为验证和单次执行成功分层，不用一个绿色状态制造虚假确定性。

**Non-Goals:**

- 不把 Skill 变成可执行代码插件、RPC 服务或 Java 对象。
- 不引入 Hook、daemon、watcher、事件总线或后台依赖注入容器。
- 不用 capability 声明替代 Skill 正文、Rule 或 OpenSpec 业务契约。
- 不证明用户 provider 的自然语言内容一定正确；用户声明 conformance 后仍由组织负责内容质量。
- 不建立通用 Agent Skill 执行 API、独立 capability dispatch 命令、行为评分系统或跨组织认证平台。
- 不从任意自然语言自动生成并认证 capability contract；Agent 仍需根据真实组合、替换和安全依赖作出判断。
- 不让 required Core 复制 Git、worktree、OpenSpec 或收尾操作手册。
- 不在本 change 中把所有现有 Skill 强制拆成最小 capability；只迁移已有跨 Skill 依赖和产品路由。
- 不宣称所有 builtin 在本 change 后都已透明可替换；`task-triage`、`task-cockpit` 和 OpenSpec component Skills 等未进入首批六个 contracts 的资产继续使用现有 identity routing，后续出现真实替换/组合需求时再独立迁移。

## Decisions

### 0. 将 capability CLI 场景作为候选集成测试并行执行

Capability parser、migration 和 resolver 的纯逻辑继续由 `test/*.test.mjs` 中的快速单元测试覆盖。会初始化完整 workspace、连续执行 Skill mutations、运行 doctor 并创建 Project override 的 capability CLI 场景属于集成测试，不进入 `test:unit` 的文件 glob；最终候选验证必须将它作为独立命名步骤，与临时 workspace E2E 并行执行。

这样保留 provider 替换、builtin 卸载、optional degradation、ambiguity 和 v1→v2 mutation 的真实 CLI 证据，同时避免约 24 秒的端到端流程成为所有 fast/affected/candidate 验证之前的串行固定成本。不得为了缩短耗时而删除该关键替换路径，或让 `test:unit` 名称继续掩盖进程级集成测试。

### 1. 将 invariant、contract、provider 和 orchestrator 分成四层

四层分别承担不同所有权：

1. required Core Rule 承载不可因 optional Skill 卸载而消失的价值、边界和常驻 invariant。
2. capability contract 定义 consumer/provider 之间的稳定协议，包括前置条件、允许副作用、授权类别、结果证据、tree-change 结果和失败语义。
3. Skill provider 承载可替换的专业动作和具体 policy；Buildr builtin 只是默认实现。
4. orchestrator Skill 拥有用户意图、阶段顺序和停止条件，通过 capability binding 调用 provider，不复制 provider policy。

`required` 与 `optional` 继续表示资产生命周期；`requires[].mode` 表示某个 consumer dependency 是否允许降级。二者不混用。

替代方案是把所有路由和安全流程放入 required Core。该方案会让 Core 成为总操作手册，并使每个 Skill 变化都修改必读 Rule，因此不采用。另一个替代方案是把 `git-ops` 改为 required；这会直接取消用户替换权，也不采用。

### 2. Contract 最小自描述，`skills/manifest.yml` v2 负责注册和 binding

`buildr.skills/v2` 在现有 `skills` 数组外增加 `contracts` 与 `bindings`，并允许 Skill entry 声明 `provides` 和 `requires`：

```yaml
schemaVersion: buildr.skills/v2

contracts:
  - id: buildr.git-task-integration
    version: 1
    path: contracts/buildr/git-task-integration/v1.md
    description: 提交并把已验证任务安全集成到目标分支。

bindings:
  - capability: buildr.git-task-integration
    version: 1
    provider: company-git-flow

skills:
  - id: company-git-flow
    path: company-git-flow
    provides:
      - capability: buildr.git-task-integration
        version: 1

  - id: task-finish
    path: buildr/task-finish
    requires:
      - capability: buildr.task-worktree-lifecycle
        version: 1
        mode: required
      - capability: buildr.git-task-integration
        version: 1
        mode: required
      - capability: buildr.task-asset-review
        version: 1
        mode: optional
```

每个 contract Markdown 使用最小固定 frontmatter：

```yaml
---
schemaVersion: buildr.capability-contract/v1
id: buildr.git-task-integration
version: 1
---
```

frontmatter 只声明 contract 文档自身的 schema、id 和 major version；manifest 负责 path、scope、来源、binding 和 Skill lifecycle。Manifest 中的 id/version 是注册断言，必须与 frontmatter 相同；不一致时 package check、doctor 和 render MUST 报告 integrity error，不能选择其中一份继续。

Contract 正文使用固定语义章节，但不规定句式和步骤模板：`Purpose`、`Consumer Obligations`、`Minimum Guarantees`、`Effects and Authorization`、`Result Evidence`、`Decision Points` 和 `Allowed Variations`；`Examples` 是可选且非规范性的。只有 consumer 无法安全继续时真正依赖的行为才能进入 normative clauses；工具、命令、算法、组织 policy 和说明性案例分别留在 provider 或 examples。

capability id 使用小写点分命名空间，version 使用正整数 major version。相同 id/version 的 normative minimum guarantees 不得变得更严格；文字澄清、非规范性示例和不改变既有 provider 合规性的说明可以在原 version 下更新。任何让原本合规 provider 变为不合规的新增 MUST 或语义改变都必须增加 major version。

同一可见 scope 链中，同一 id/version 只能解析到一个 contract definition；Project 不得用同一 identity 静默重定义 workspace/package contract。组织自定义 contract 使用自己的 namespace；内部 provider 若实现 Buildr contract，直接引用已注册的 Buildr identity，不复制一份同名 contract。

选择在 Skills manifest 中维护这些关系，而不是新增独立顶层资产 registry，是因为 capability contract 只服务 Skill composition；它不独立执行，也不成为 Rule 或 Command。

### 3. Provider 替换通过 capability binding，不通过同名 Skill 覆盖

Skill id 继续表示资产身份；capability id 表示行为接口。用户 provider 使用自己的 id，通过 `provides` 声明兼容能力。`skills add --replace` 继续只表示替换同一资产条目或源，不承担 provider substitution。

这种设计避免自定义 `git-ops` 与 builtin receipt、restore 和 package reconcile 发生身份冲突，也允许一个内部 Skill 同时提供多个能力，或多个专用 Skills 分别提供较小能力。

### 4. Provider resolution 优先显式 binding，不让安装动作静默改流程

对 consumer 所在 workspace/Project scope，Buildr 按以下顺序解析每项 dependency：

1. 只考虑 `enabled: true`、`state: installed|modified`、适用于当前 runtime 且声明兼容 version 的 provider。
2. 从 consumer scope 向 workspace root 查找最近的显式 binding；找到后必须绑定到该 scope 可见且兼容的 provider。Project binding 可以显式覆盖 workspace binding。
3. 当前 scope 链没有任何 binding 时，只在全部可见兼容 providers 恰好一个时自动选择；存在多个时必须报告 ambiguity，不因 provider 位于更具体 scope、属于 builtin、先出现或最后安装而静默选择。
4. 新 workspace/init 可以为 package builtin 写入初始默认 binding；后续 update/sync 只能补齐确实不存在且不会覆盖用户选择的 package-owned 初始值，不能重写现有 binding。
5. 解析结果使用 `ready`、`blocked`、`degraded` 三种 consumer readiness；`blocked`/`degraded` 另带 `missing_provider`、`ambiguous_provider`、`version_mismatch`、`runtime_unavailable`、`invalid_binding`、`provider_not_ready` 或 `dependency_cycle` reason，避免把原因和可用性混成不断扩张的状态机。
6. Resolver MUST 递归评估 selected provider 自身的 required dependencies；任一 required dependency blocked 时，该 provider 对上层 consumer 也不是 ready。Dependency graph 出现环时，环内 consumers 均为 blocked，并报告完整 cycle path，不能递归到栈溢出或任意打断一条边。

用户安装 Project provider 本身不会改变既有 workspace 默认 binding；用户通过 Project binding 明确选择后才替换。用户显式卸载 builtin 后，Buildr 不得把 package 默认实现重新作为 fallback。

不采用全局“最后安装者胜出”，因为安装顺序不是组织契约，也无法审计。

### 5. Required dependency 阻断 consumer，optional dependency 显式降级

已安装 consumer 的 required dependency 无法解析时：

- consumer readiness 为 `blocked`，doctor 报告 error、reason、consumer、capability、候选 providers 和 `nextActions`；
- runtime 继续投射 consumer 的专业诊断和安全停止指引，并注入 blocked evidence；Agent MUST NOT 执行依赖该 provider 的动作，但仍能解释阻塞和修复路径；
- 其他无关 Skills 继续投射，但 sync 最终 doctor 不得报告整体完成；
- Buildr 不自动恢复 builtin、不自动写 binding，也不级联卸载 consumer。

optional dependency 无 provider 时，consumer readiness 为 `degraded` 并继续投射；runtime binding block 标记 reason 和降级方式，doctor 最多报告 info。`task-asset-review` 是首个 optional 参考场景。

Consumer 的聚合规则保持简单：任一 required dependency blocked 则整体 `blocked`；required 全部 ready 且至少一个 optional dependency 缺失则整体 `degraded`；其余为 `ready`。Optional provider 自身 not ready 与 provider 缺失使用相同的声明降级边界，不向上升级为 required error。

### 6. Runtime 提供可执行路由证据，不修改任何 Skill 源

Buildr 在 consumer runtime `SKILL.md` 中生成受管的 capability binding block，包含 contract/version、contract source path/digest、mode、selected provider id、provider runtime path、provider scope、readiness 和 reason。`contractDigest` 使用 contract 文件精确 UTF-8 bytes 的 SHA-256，使 contract 变化进入现有 runtime projection content hash 与 stale 比较。Block 要求 Agent 在调用 provider 前读取已解析 contract 与 selected provider；blocked consumer 只能解释和修复，不得继续 provider-dependent action。该 block 是 runtime 派生内容，类似现有 contribution provenance，不写回 workspace 或外部 Skill 源。

Agent 加载 consumer 时可以直接知道应加载哪个 provider；provider 仍由当前 runtime 的原生 Skill discovery 机制提供。Buildr 不发明跨 Agent 的调用 API，也不声称 runtime 会像代码一样自动 dispatch。

产品入口 Buildr Skill 不登记为 workspace manifest consumer，但完整 `sync` 已在同一个 runtime projection 中同时解析产品 Skill 和全部 workspace/Project Skills，因此 Buildr 为它注入按 scope 分组的 capability routing evidence。独立 `buildr skill install` 只安装通用入口，不承诺包含当前 binding；当入口没有适用 evidence、当前 session 已知 capability source 在 evidence 生成后变化，或现有 runtime projection check 报告 stale 时，Skill 必须运行当前 workspace doctor 取得解析结果后再路由。v1 复用现有 managed content hash，不再增加独立 graph digest；也不要求 Agent 在每次 capability 调用前机械运行 doctor，不新增 `buildr skills resolve` 命令或独立 runtime registry。

### 7. Required Core 只固化解析和 workspace transition 不变量

Core 增加两条短小 invariant：

- Agent 组合 Buildr 管理的 Skills 时必须尊重 installed capability binding；不得使用已卸载 builtin 或自行猜测 ambiguous provider。
- Agent 成功改变已检出 Git tree 且位于已初始化 Buildr workspace 时，必须执行 Buildr workspace transition check；该要求不依赖任何 optional Git Skill 是否存在。

具体 doctor、sync 询问、Agent 执行和手动兜底流程继续由产品入口 Buildr Skill 承载。Git provider contract 只需报告或识别 `treeChanged` 结果并遵循该 required protocol。这样 Core 保留 invariant，Skill 保留专业动作。

不新增 required `workspace-transition-check` workspace Skill，因为产品入口 Buildr Skill 已是所有 Buildr workspace 的稳定操作入口；再增加一个 required Skill 只会制造新的硬依赖身份。

### 8. 首批 capability 采用小接口而不是一个巨型 Git 接口

首批内置声明至少包括：

- `buildr.git-single-operation/v1`：用户单项 Git 意图、安全状态检查和写操作边界。
- `buildr.git-task-integration/v1`：任务提交、目标分支更新、候选集成、推送和结果证据。
- `buildr.git-workspace-update/v1`：在 workspace sync 前安全更新 Git checkout。
- `buildr.task-worktree-lifecycle/v1`：任务 worktree placement、retention 和 cleanup。
- `buildr.task-finish/v1`：完整任务收尾编排。
- `buildr.task-asset-review/v1`：任务执行质量和资产候选审查。

默认 `git-ops` 提供三个 Git capabilities；`task-worktree` 提供 worktree lifecycle 且不依赖 Git provider；`task-finish` required 依赖 worktree lifecycle 与 Git task integration，optional 依赖 asset review；产品入口 Buildr Skill 按 capability 路由 workspace update、单项 Git、worktree、finish 和 review 意图。

`task-finish` 保留“收尾”意图、提交范围披露、阶段顺序、验证证据和不可逆动作边界。Worktree placement、retention 和 cleanup preconditions 由所选 lifecycle provider 决定；rebase/fast-forward/merge 等策略由所选 task-integration provider 的 contract 和 provider 正文决定。执行前必须披露两个 providers 与实际集成/清理策略；force push、删除远端分支、丢弃改动、改写共享历史和语义冲突决策继续需要动作级显式授权。merge commit 不再作为所有 provider 的固定排除项，而是默认 `git-ops` 的 policy。

### 9. 只对会破坏当前 binding 的 mutation 做写前影响披露

`builtin uninstall`、`skills remove`、disable 和 provider replacement 只有在会移除、禁用或改绑当前 selected provider 时，才在写入前计算受影响 consumer：

- required dependency 将失去 provider时，回执明确列出会变为不可用的 consumers；
- optional dependency 将失去 provider时，列出降级行为；
- 已有显式 binding 不会因出现另一个 provider 自动改绑；无 binding 且 mutation 后只剩唯一 provider 时才报告新的确定性选择；
- Buildr 不自动卸载 consumer、恢复 builtin 或选择多个候选之一。

provider add、restore、普通 render 和没有改变 selected provider 的 sync 不需要机械展示完整影响预演；完成任何相关变更后统一通过 doctor 输出最终 dependency graph 状态。Component-owned Skill 继续遵守 Component 唯一 lifecycle，不绕过现有 ownership。

### 10. Conformance 分成可解析、行为证据和单次执行结果

Buildr 校验 contract frontmatter/manifest identity、version、scope、binding、runtime presence 和 builtin 静态契约；用户 provider 声明 `provides` 表示组织接受其符合对应 contract。Buildr 不扫描自然语言推断 capability，也不因为描述相似自动建立绑定。

官方 builtin provider 由 package tests 和行为 fixtures 证明；组织 provider 可以附带自己的 tests、examples 或审查证据，但 v1 不定义通用 Skill 执行测试框架。

三个层次必须分开表达：`ready` 只表示结构上可路由；官方 fixture 或组织证据表示某个 provider 曾按场景验证；本次动作只有在 Agent 按 contract 完成计划/授权披露并返回 result evidence 后才算执行成功。Doctor MUST NOT 把 `ready` 描述为 behavior verified 或 execution succeeded。

判断某条规范是否进入 contract 的准则是：如果 provider 不满足它，consumer 是否无法安全继续。答案为否时，该内容必须留在 provider policy、orchestrator sequencing 或非规范性 example，不能仅因默认 builtin 当前这样实现就提升为 contract MUST。

### 11. v1 主动拒绝四类过度设计

- 不因 required dependency 阻断就删除 consumer runtime；保留可发现的停止与修复能力。
- 不为每次 add、restore、render 或 sync 生成完整影响预演；只拦截可能破坏当前 binding 的 mutation，并由最终 doctor 收敛。
- 不建设通用 dispatch API、daemon、Hook、Agent 行为评分或跨组织 provider 认证；继续使用原生 Skill discovery、现有 runtime projection 和组织声明。
- 不把 capability framework 强制套到所有独立 Skill；首批六个 contract 只覆盖已经存在真实产品路由或跨 Skill 依赖的边界。
- 不在同一 change 迁移 `task-triage`、`task-cockpit` 和全部 OpenSpec component Skills；框架支持后续迁移，但“框架可扩展”不等于“所有 builtin 已替换完成”。

### 12. 提供最小声明与 binding 写入口，不新增执行期调度层

为了让 Agent 不必直接拼接复杂 YAML，`buildr skills add/replace` 增加可重复的 `--provides <capability>@<version>` 和 `--requires <capability>@<version>:<required|optional>`；命令必须在写入前校验 contract identity、provider/consumer Skill、scope 和重复声明，并保留未被本次动作修改的 v2 内容。

Provider 替换使用：

```bash
buildr skills bind <capability>@<version> --provider <skill-id> --scope <.|projects/project> --target <dir>
buildr skills unbind <capability>@<version> --scope <.|projects/project> --target <dir>
```

`bind` 只写显式 binding，不安装 Skill、不卸载 builtin，也不把组织 provider 声明为 verified；`unbind` 删除当前 scope 的显式选择，删除后是否自动选择唯一 provider或进入 blocked/ambiguous 由同一个 resolver 决定。两者使用现有 workspace mutation 与最终 doctor 边界。

v1 不新增 `skills resolve`、dispatch、contract marketplace 或通用认证命令。组织自定义 contract 仍是高级 manifest-backed source asset；这些 CLI 是 Agent 使用的底层原语，不是要求普通用户学习的产品操作界面。

### 13. 完整机制命名为 Agent 工作能力适配

“Agent 工作能力适配（Agent-managed Capability Adaptation）”是面向用户工作意图的完整机制；capability contract、provider/consumer、binding、doctor graph 和 runtime evidence 是其内部基础设施。职责固定为：用户拥有工作意图和关键决策，Agent 负责工作资产开发与语义判断，Buildr 负责依赖结构、事务写入和 runtime 投射，contract 保护跨 Skill 最小协作边界。

Agent 不从用户措辞中寻找 capability id，而是判断目标行为是否触达或产生跨 Skill 稳定依赖边界：另一 Skill 是否调用或编排它、是否需要替换实现、consumer 是否依赖稳定保证或结果证据、修改或卸载是否需要影响诊断。仅属于单个 Skill 内部且不满足这些条件的变化继续作为普通 Skill 维护；触达已有 contract 时在其 `Allowed Variations` 内调整 provider；产生新边界时才创建 contract；突破既有边界时升级 major version 或同步修改 consumers。

required Core 只固化“修改 Skill 前必须检查 provides/requires、routing evidence 和受影响 consumers，不得绕过已知跨 Skill 依赖直接激活”的不变量。产品入口 Buildr Skill 识别“采用内部流程”“调整工作方式”“修改默认 Skill 行为”等意图并路由到新的 `capability-adaptation` 管理 Skill。该管理 Skill 不提供新的业务 capability，而是执行：建立 doctor 基线、分类变化、准备候选资产、检查 contract、运行 provider 与 consumer 组合验证、使用 Skills CLI 激活、sync/render 和最终 doctor。

能力适配先验证候选、后修改当前生效资产。v1 复用任务 worktree、临时候选目录、组织 tests、现有 workspace mutation、binding 和最终 doctor；候选验证失败时不得执行 replace/bind/uninstall。Buildr 不声称这等于通用自然语言行为认证，但 Agent 必须返回受影响 consumers、实际验证、激活结果和剩余风险。

### 14. 区分编排型 consumer 与能力路由者

`task-finish` 等编排 Skill 通过 manifest `requires` 声明组合依赖，其 required/optional dependencies 参与 consumer 整体 readiness。产品入口 Buildr Skill 是能力路由者，不登记为 workspace manifest consumer：它只在“提交”“更新 workspace”“收尾”等具体意图命中时读取 routing evidence 和 contract，并将该 capability 作为本次动作的 required dependency；单项 Git capability blocked 不得阻塞 init、doctor、Project 管理等无关入口。

完整 sync 继续向产品入口投射全部可路由 capability evidence，使 Agent 修改 provider 时能同时看到编排依赖和产品意图入口。能力路由关系属于产品入口 Skill 的受管路由说明，不扩张 `requires` 聚合状态机；后续只有出现机器必须独立查询 route impact 的真实需求时，才考虑新增结构化 route schema。

## Risks / Trade-offs

- [Risk] manifest v2 和 contract 文档增加资产复杂度。→ 只让存在组合/替换需求的 Skills 声明 capability；普通独立 Skill 仍可只包含现有字段。
- [Risk] 自然语言 provider 虚假声明兼容。→ 明确 conformance 是组织声明，doctor 只报告结构和可用性；官方 provider 继续使用产品行为测试。
- [Risk] blocked consumer 仍在 runtime 中，Agent 可能误把它当作可执行。→ managed block 和 Skill 前置检查必须明确禁止 provider-dependent action，doctor 同时报告 error；保留它是为了让 Agent 能解释和修复，而不是宣称 ready。
- [Risk] 用户安装 Project provider 后仍需显式 binding 才能替换 workspace 默认流程。→ 这是刻意的审计边界；doctor 提供准确 binding nextAction，避免安装动作静默改变组织行为。
- [Risk] 把过多行为放进一个 capability 会重建 Skill 耦合。→ capability 按 consumer 真正需要的职责拆分，首批 Git 能力拆成 single-operation、task-integration 和 workspace-update；`Examples` 保持可选且非规范。
- [Risk] Core 再次膨胀为操作手册。→ Core 只保留 provider binding 与 workspace transition 两条 invariant，具体步骤仍在 Buildr Skill 和 providers。
- [Risk] 旧 CLI 无法读取 v2 manifest。→ update/sync 前明确版本要求，提供事务化自动迁移和清晰回滚说明。

## Migration Plan

1. 先让新版 CLI 同时读取 v1/v2，并实现 v1→v2 确定性迁移；迁移保留所有 Skill identity、source/path、description、enabled、required、state、reason、runtime 和远端安装信息。
2. 增加最小 contract frontmatter、固定语义章节、manifest parser/renderer、递归 scope resolver/cycle detection、doctor diagnostics 和 runtime binding projection。
3. 更新 package manifest 与默认 workspace baseline，声明首批 contracts、initial default bindings 和 dependencies。
4. 迁移 Buildr Core、产品入口 Buildr Skill、`git-ops`、`task-worktree`、`task-finish` 与 `task-asset-review`，让 Task Finish 消费 worktree lifecycle 与 Git integration，删除具体 provider id 的跨层硬依赖和重复 policy。
5. 用临时 workspace 验证 v1 upgrade、默认 provider、显式 Project override、builtin uninstall、blocked consumer、optional degradation、multiple providers、contract identity conflict 和所有 supported adapters。
6. 发布后由 `buildr update` 提供理解 v2 的 CLI，再通过 `buildr sync <agent>` 迁移 workspace 源资产和 runtime；不得要求旧 CLI 直接处理 v2。

回滚新版实现时，不自动把含 capability 声明的 v2 manifest 降级为 v1。回滚必须使用迁移前事务快照或显式移除 contracts/bindings/provides/requires 后再写回 v1，避免静默丢失用户 provider 选择。

## Resolved Questions

- Contract 采用最小固定 frontmatter；manifest 仍登记 id/version/path，二者承担自描述与 scope 注册的不同职责并强制一致。
- 替换现有 default provider 必须写显式 binding；Project provider 的安装本身不静默改变 workspace 流程。
- Required dependency 缺失时保留 blocked consumer，而不是从 runtime 删除；这使 Agent 仍能安全停止、解释和修复。
- 产品入口 Buildr Skill 复用完整 sync 注入的 routing evidence，并以 doctor 作为 install-only 或 stale evidence 的只读 fallback，不新增 dispatch 命令。
- v1 不建设通用 conformance harness；官方 builtin 使用 fixtures，组织 provider 使用声明与可选证据，单次成功由 result evidence 判断。
- 首批只迁移六个 Git/task contracts；未迁移 builtin 继续按现有 identity routing，不能被描述为已经支持透明替换。

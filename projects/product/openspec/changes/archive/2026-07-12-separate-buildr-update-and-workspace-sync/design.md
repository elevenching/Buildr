## Context

当前 CLI 的 `update` application service 负责从当前 package target 物化 workspace builtins，`sync` 再组合 update、Buildr Skill 安装、runtime render 和 doctor。产品 Buildr Skill 因而把用户“更新 Buildr”直接映射为 `sync`，没有更新承载 CLI 与 package assets 的 Git checkout 或 registry package。

Buildr 同时存在两种来源：维护者通过 `tools/install-buildr-cli` 将命令链接到本地 Git checkout；普通用户从 npm/registry 安装 package。两种来源携带相同 CLI 和 workspace assets，但更新机制不同。根 README 目前只把当前目录描述为自举 workspace，完整产品说明维护在 `projects/product/README.md`，公开入口重复且主次颠倒。

## Goals / Non-Goals

**Goals:**

- 让 `buildr update` 只负责更新当前 Buildr CLI 来源，并输出稳定的 Agent-readable 结果。
- 让 `buildr sync <agent>` 成为唯一 workspace 产品能力同步高层入口。
- 让 Buildr Skill 根据用户意图组合或分离 update 与 sync。
- 让根 README 成为唯一主要产品 README，并在末尾说明自举 workspace。
- 保持当前 workspace assets 随 CLI package 发布的简单模型。

**Non-Goals:**

- 不新增 `update --no-sync`；update 本身就不执行 sync。
- 不独立发布 workspace assets，不引入 assets 下载、缓存、版本协商或双版本状态。
- 不让 Component、workspace Command 或 runtime adapter 扩展 CLI 自更新机制。
- 不自动解决 Git 内容冲突，不自动改写已发布或可判断为共享的提交。
- 不在本 change 中设计除 npm registry 以外的 package manager 更新协议。

## Decisions

### 1. 命令职责按状态边界拆分

`buildr update` 不再接收 workspace `--target`，也不读取或修改 workspace；它只识别当前 executable 所属产品根并更新该来源。`buildr sync <agent> --target <dir>` 内部直接调用 workspace package reconciliation，而不是调用 CLI update。低层 builtin 检查继续由 `builtin list` 和 doctor 提供，不复用 `update check`。

选择该方案而不是保留旧 `update` 并增加 `self-update`，是因为用户和 Agent 对“更新 Buildr”的首要理解是更新产品本身；workspace 投射已有语义更准确的 `sync`。这是有意的破坏性命令迁移。

### 2. update 提供 check 与 apply 两种只读/写入动作

`buildr update check --json` 只识别来源、读取当前版本或 Git 状态、查询远端并报告是否可更新、推荐动作和阻塞原因。`buildr update --json` 复用同一计划后执行安全更新；默认文本输出供人阅读，JSON 供 Agent 编排。update 成功只证明 CLI 来源已更新，不包含 sync 或 doctor 结果。

### 3. 来源识别基于 executable 的真实产品根

CLI 从当前进程入口解析 realpath，向上定位声明 `@buildr/cli` 的 `package.json`：

- 产品根位于有效 Git worktree，且 executable 来自该根时，判定为 `development-checkout`。
- 否则，若 package metadata 与 npm 安装布局一致，判定为 `registry-package`。
- 两者均不能证明时返回 `unknown` 并停止，不根据是否为符号链接猜测。

开发安装和 npm 安装都可能使用符号链接，因此符号链接本身不作为模式事实。

### 4. 开发者模式遵循可证明的 Git 安全边界

update 先 fetch 当前 branch 的 upstream，再检查 worktree、HEAD、upstream 与 merge-base：

- worktree clean 且 HEAD 可 fast-forward 时自动 fast-forward。
- worktree clean、当前提交只存在于本地且与 upstream 分叉时，允许自动 rebase；rebase 前后比较 tree，冲突时中止并保留 Git 可诊断状态，由用户决策。
- dirty、detached HEAD、缺少 upstream、远端包含当前已发布/共享提交后的非 fast-forward 分叉、多个 worktree 共享风险或无法证明本地提交未发布时停止。

不使用 reset、force push 或自动 stash。Git 结果改变产品 checkout 后，本次进程不继续加载新模块；Agent 在命令退出后调用新的 `buildr` 入口。

### 5. 发布模式通过 npm registry 更新同一 package identity

发布模式读取当前 package name/version 与 npm registry 最新可用版本。check 只查询；apply 使用 npm 对承载当前 executable 的安装 prefix 更新同一 package。registry 不可达、版本不兼容、权限不足或安装位置无法安全解析时停止并返回可执行 next action。

不静默切换 registry、scope、tag 或 package manager。正式 registry 配置和凭据仍遵循发布流程；本 change 只实现已从支持的 npm registry 安装后的更新闭环。

### 6. Agent 自然语言编排保持在 Skill

Buildr Skill 使用以下路由：

| 用户意图 | Agent 编排 |
|---|---|
| 更新 Buildr | `buildr update`，成功后重新解析 `buildr` 并执行 `buildr sync <agent> --target <workspace>` |
| 只更新 Buildr | 只执行 `buildr update` |
| 同步 workspace | 只执行 `buildr sync <agent> --target <workspace>` |

update 出现 Git 或安装决策点时停止，不能继续用旧 CLI sync。这样完整用户体验仍是一句话触发，但命令保持单一职责。

### 7. README 以根目录产品入口为唯一主说明

将 `projects/product/README.md` 的产品定位、模型、快速开始、能力摘要、CLI 表面、文档入口和开发说明合并到根 `README.md`。快速开始分别说明开发 checkout 与 registry package。最后增加“Buildr 自举 workspace”章节，解释产品源位于 `projects/product/`、根目录是消费自身资产的 workspace，以及开发命令必须使用当前 Product checkout。

产品目录 README 删除；内部链接统一按根 README 的位置重写。`docs/buildr-product.md` 仍是产品定位、核心模型、边界和 Roadmap 的详细权威说明，README 不取代 specs 或 current-state knowledge。

### 8. assets 独立演进只进入 Roadmap

新增 Roadmap 条目记录未来 CLI version 与 workspace assets version 可独立，并可由 CLI 下载带 integrity 的版本化 tarball。当前实现和 specs 仍把 workspace assets 作为 CLI package 内容，不增加运行时分支。

## Risks / Trade-offs

- [现有自动化调用 `buildr update --target`] → CLI 给出明确迁移错误或帮助，文档和验证全部迁移到 `sync <agent>`。
- [运行中的 CLI 更新自身 checkout/package] → update 只完成来源更新并退出，后续 sync 必须由 Agent 重新调用入口。
- [Git 是否共享无法绝对证明] → 只在提交可证明未发布时自动 rebase，其余分叉停止；fast-forward 保持自动。
- [npm 全局安装权限或 prefix 差异] → 从 executable 反推安装位置，无法安全证明时只报告命令，不提权、不猜测。
- [删除 Product README 导致旧链接失效] → 仓内链接统一改到根 README，README 的产品详细事实继续链接权威 docs。
- [CLI 与 assets 一起发布仍会耦合版本] → 当前接受该取舍，并把解耦触发条件与未来设计写入 Roadmap。

## Migration Plan

1. 先实现来源识别与 update check/apply，保持 sync 内部仍能直接调用 workspace reconciliation。
2. 将旧 update workspace application service 改为 sync 私有组合步骤，迁移所有 CLI help、测试和调用点。
3. 更新 Buildr Skill、README、bootstrap、产品文档和 Roadmap，并同步 package/runtime 受管副本。
4. 在临时 Git checkout 和 npm prefix 中分别验证 update；在临时 workspace 验证 sync 和自然语言编排所需输出。
5. 发布说明明确破坏性迁移。出现问题时可回滚整个版本；不提供同版本双重 update 语义。

## Open Questions

- 正式 npm registry 的 scope、tag 和发布凭据由发布流程确定；实现和测试使用 package metadata 与可配置 registry，不硬编码私有地址。

## Context

Buildr 当前通过静态 descriptor 组合 Rules、Skills、surface、activation 和 checker traits，再由 adapter 生成声明式 `RuntimePlan`，通用 reconcile 负责路径保护、冲突预检、写入、清理和诊断。`codex` 使用 `native-recursive`，`claude-code` 使用逐 source 的 `reference-bridge`；Skills 已可通过 `.agents` 或 vendor root 复用同一文件系统实现。trait catalog 已声明 `vendor-rule-files`，但还没有注册对应 Rules implementation。

本次接入基于三类证据：目标 Agent 当前版本的本机观察、目标产品或厂商官方文档、可重复的黑盒 smoke。Cursor、Qoder 与 TRAE Work 的公开机制可从官方文档确认；TRAE IDE 的具体 `.trae/rules` 和 `.agents/skills` 项目路径来自本机 3.5.73 安装包配置与会话观察，官网只确认 Rules/Skills 产品能力；WorkBuddy 的公开文档也未覆盖完整 runtime 路径，`CODEBUDDY.md > .codebuddy/CODEBUDDY.md > AGENTS.md`、workspace root first-match、8000 字符上限与 first-turn 注入来自本机 5.2.5 安装包源码。因此所有结论必须明确标注证据等级和适用版本。

虽然五个 adapter 在一个 batch change 中交付，每个 runtime 仍是独立契约：独立 id、traits、capability evidence、checker、文档段落和测试，不共享 identity，也不互相 alias/fallback。

## Goals / Non-Goals

**Goals:**

- 让 `qoder`、`trae`、`trae-work`、`workbuddy`、`cursor` 完整覆盖五项 required render capabilities。
- 用最少的新 primitive 保持 Buildr 的 Root → Project → Service → deeper scope 规则语义、兄弟目录隔离、冲突零写入与幂等清理。
- 让 `runtime list`、doctor/check、Buildr Skill、bootstrap、README 与 adapter 文档给出一致、可操作的接入事实。
- 将尚未能自动证明的 UI toggle、reload、新会话和真实引用读取行为暴露为明确 finding 与证据等级；只有真实 smoke 明确失败时才成为对应能力门禁。

**Non-Goals:**

- 不接入 ZCode，也不扩展到 CodeBuddy IDE、TRAE cloud、QoderWork 或未认证的同品牌 surface。
- 不为目标 Agent 配置账号、登录、用户级 Rules/Skills 或全局偏好。
- 不让 adapter 解析 Rules 的业务语义，也不把 vendor runtime 文件变成 Buildr 源资产。
- 不为绕过真实产品限制而静默回退到 Codex、Claude Code 或同品牌其他 adapter。

## Decisions

### 1. 五个 descriptor 使用稳定产品 id，surface 单独声明

| Adapter id | Display name | Certified surface | Rules | Skills | Activation |
|---|---|---|---|---|---|
| `cursor` | Cursor | `ide`、`cli` | `vendor-rule-files`，各 source scope 的 `.cursor/rules/buildr.mdc` | `agents-compatible`，root `.agents` | Rules `path-read`；Skills `session-start` |
| `qoder` | Qoder | `ide` | `vendor-rule-files`，root `.qoder/rules` | `vendor-root`，root `.qoder` | Rules `path-read`；Skills `explicit-reload` |
| `trae` | TRAE | `ide` | `vendor-rule-files`，每个 source scope 的 `.trae/rules` | `agents-compatible`，root `.agents` | Rules `path-read`；Skills `session-start` |
| `trae-work` | TRAE Work | `desktop` | root-index `reference-bridge` | `vendor-root`，root `.trae` | Rules `session-start`；Skills按官方产品行为记录 |
| `workbuddy` | WorkBuddy | `desktop`、`desktop-bundled CLI` | root-index `reference-bridge` 到 `CODEBUDDY.md` | `vendor-root`，root `.codebuddy` | Rules、Skills 均为 `session-start` |

只认证已经获得证据的 surface。Qoder 的独立 terminal CLI、TRAE Work 与 TRAE Solo 的正式版本映射、WorkBuddy 的其他 surface 均不由本次 descriptor 暗示支持。

备选方案是沿用 intake 中的 `qoder-ide`、`trae-work-desktop` 作为 CLI adapter id。该命名把 surface 固化进长期 id，后续同一文件机制扩展 surface 时会产生不必要迁移，因此采用产品 id，并在 traits 中表达 surface。

### 2. Cursor/Qoder/TRAE 使用 vendor files，root-only 产品使用受管 bridge

Cursor 官方文档支持各目录的 nested `.cursor/rules` 自动按目录树挂载，也支持 `.agents/skills`。但 3.6 系列公开版本证据显示 nested `AGENTS.md` 的加载范围可能扩大为全仓 Always Rules，且 glob rules 曾有版本不稳定记录，无法稳定保证 Buildr sibling isolation。因此不认证为 `native-recursive`，也不依赖中央 glob；adapter 将每个 `AGENTS.md` 投射为同 source scope 的 `.cursor/rules/buildr.mdc`。真实版本 smoke 仍验证 parent/child 合并与 sibling isolation。

Qoder 官方文档确认 `.qoder/rules` 优先于 `AGENTS.md`，且 vendor rules 支持 always、glob 等触发方式；TRAE 3.5.73 安装包和本机会话确认 `.trae/rules` 的 vendor frontmatter 与目录行为。Cursor、Qoder 与 TRAE 使用受控的 `vendor-rule-files` planner，将每个 discovered `AGENTS.md` 转换为由 Buildr 管理、带 source identity 与 scope metadata 的 vendor rule file。planner 只做确定性格式转换，不判断 Rule 相关性；目标文件使用稳定、无碰撞的 source-relative identity，内容顺序保持 ancestor before descendant。

备选方案是把 Qoder 认证为 `native-recursive`，把 TRAE 认证为根 `AGENTS.md` 导入。Qoder 的 IDE/CLI nested 行为和 TRAE 的 optional import toggle 存在版本或配置差异，直接依赖会降低可诊断性；vendor files 是两者公开、原生且可检查的稳定入口。

TRAE Work 与 WorkBuddy 只提供 root guidance 入口，不能仅靠 native root 覆盖 Buildr 递归 scope。二者使用 `reference-bridge` 的 root-index placement：桥接文件不内联所有规则，而是明确要求 Agent 在行动前读取 workspace 根 `AGENTS.md`，并在访问或修改某个 scope 时读取该路径 ancestor chain 中适用的 `AGENTS.md`。桥接内容必须短小、包含 Buildr 受管标记和 source index，不超过目标产品限制。

- TRAE Work 使用其桌面版可导入的 root Markdown 入口；descriptor 必须把对应 Settings import toggle 记录为前置条件和 checker finding。
- WorkBuddy 使用 root `CODEBUDDY.md`，因为安装包 5.2.5 源码证明其优先级最高且 first-turn 注入；桥接必须保留在 8000 字符以内。

普通 Markdown link 不被视为自动 include。bridge 模板使用明确的 imperative instruction；官方资料或安装包源码可以把 adapter 认证到 `documented`，真实产品 smoke 证明 Agent 会打开被引用的 `AGENTS.md` 后提升为 `verified`。若 smoke 明确失败，adapter 不得继续声明完整 `rules-entry`；不得把“文件已生成”等同于“规则已读取”。

### 3. Rules planner 以 placement 和 format 参数化，不复制通用 reconcile

在 Rules implementation registry 中新增 `vendor-rule-files`，并扩展 `reference-bridge` 支持 `per-source` 与 `root-index` placement。descriptor 提供静态 format/template id、target pattern、managed marker、长度限制和 diagnostics；planner 输出标准 `writes/removals/actions/findings`，继续交给现有 `RuntimePlan` validation 与 reconcile。

不会为每个 Agent复制文件写入器，也不会允许 descriptor 携带可执行函数或 workspace 提供模板。所有 formatter 和 probes 都随产品静态注册，目标路径继续经过 safe-target 与 symlink 检查。

### 4. Skills 使用 Agent 实际发现的 project root

- Cursor Rules 渲染到各 source scope 的 `.cursor/rules/buildr.mdc`，Skills 渲染到 `.agents/skills/`。
- Qoder、TRAE IDE、TRAE Work、WorkBuddy 分别渲染到 `.qoder/skills/`、`.agents/skills/`、`.trae/skills/`、`.codebuddy/skills/`。
- 同一个 vendor root 下继续使用 `<root>/buildr/skill-install-plans/` 保存 Agent-readable install plans。

用户级 Skills 路径只作为文档和证据，不由 workspace render 写入。TRAE IDE 与 TRAE Work 必须保留两个 descriptor 和各自的 Skills root、activation/evidence；不能因品牌相同复用未认证的 runtime 路径。

### 5. Checker 区分 projection、environment 与 activation prerequisite

`runtime check` 继续以投射状态为核心，并执行 descriptor 静态声明的有限时 environment probe。probe 只能使用静态 executable/args、无 shell、有限超时；平台或安装形态不稳定时使用 `manual`，不得把未执行的检查标成成功。

checker 额外输出：

- 安装与版本的 `ok`、`missing`、`not-checked` 或 `manual` 状态及证据文本；
- TRAE Work 的 Rules import toggle、Qoder Skill reload、TRAE/WorkBuddy 新会话等 activation guidance；
- WorkBuddy first-match 入口冲突、8000 字符风险、bridge/reference smoke 未确认等 adapter-specific findings；
- vendor rule/bridge 的 missing、stale、conflict、orphan 状态。

### 6. 支持文档是 current-state 入口，不混入贡献调研流程

新增 `docs/agent-runtime-adapters.md` 作为已接入 adapter 权威说明，固定包含：支持矩阵、选择 adapter 的命令、逐 adapter Rules/Skills 路径、生成文件、activation/reload、checker、已知限制、证据来源、`documented` / `verified` 等级和 smoke 状态。`docs/agent-runtime-adapter-contribution.md` 继续说明“如何新增 adapter”，两者互相链接但职责不混合。

根 `README.md` 与 `README.en.md` 的当前支持摘要和文档导航都链接该说明；README 不复制整张机制表，避免多处事实漂移。`runtime list --json` 仍是机器可读事实源，文档必须提示以当前 CLI 输出为准。

### 7. 自动 contract tests 与一次性真实产品 smoke 分层

自动测试是每个 adapter 的常规实现门槛，覆盖 descriptor validation、format fixtures、scope/source ordering、sibling isolation、conflict zero-write、orphan cleanup、idempotency、Skills root、CLI/JSON/doctor 输出以及 Codex/Claude Code parity。每个 adapter 有独立 capability evidence fixture，不用“共享 primitive 已测试”代替具体 runtime 证据。

supported descriptor 的接入路径至少达到 `documented`：证据可以来自官方资料、随包资料、明确的 discovery 源码或可重复的本机会话观察。真实产品 marker smoke 用于把等级提升到 `verified`，不是每个 GUI adapter 的强制实现门槛。

当需要 smoke 时，生成器只准备一个临时 workspace 和一份一次性 Prompt，验证 scoped Rules 或 bridge traversal 与 project Skill discovery。activation/reload 由独立文档证据与 checker guidance 覆盖，除非产品提供稳定 reload 命令或证据发生冲突。GUI 产品由维护者手工提交一次 Prompt 即可；标准流程不自动点击 GUI、不抓取应用私有数据库，也不在 IDE 与同机制 bundled CLI 间重复执行。结果仍记录产品版本、surface、时间和证据等级；未执行时文档标为 `documented` / `pending`，不能写成 `verified`。

## Risks / Trade-offs

- [厂商版本改变 Rules/Skills 行为] → descriptor 文档记录证据版本与来源，checker 显示版本；出现版本漂移或行为冲突时再执行当前版本一次性 smoke，不确定 surface 不纳入认证。
- [root-index bridge 依赖 Agent 遵循读取指令] → 用强制性短 bridge、明确 source index 和黑盒 marker 验证；未通过时不发布完整 adapter。
- [WorkBuddy `CODEBUDDY.md` first-match 与用户文件冲突] → 非 Buildr 管理文件触发零写入 conflict，说明优先级与人工迁移路径，不覆盖也不退回低优先级入口。
- [vendor rule 格式或 glob 语义表达不完整] → formatter 固定在 adapter fixture 中，以官方格式与真实 smoke 校验；无法保持 scope 时停止该 adapter，而不是扩大 always-on 范围。
- [五个 adapter 同批改动扩大回归面] → 实现按 shared primitive、descriptor group、CLI/docs 三个任务组分层验证，并对每个 runtime 保留独立 fixtures 与 evidence。
- [README、文档和 `runtime list` 漂移] → contract test 检查 supported ids 在机器输出与权威文档中一致，README 只链接权威说明并保留简短当前摘要。

## Migration Plan

1. 先增加 formatter/planner 与 checker 能力，但在 descriptors 注册前完成自动 tests。
2. 分别注册五个 descriptors 和 capability evidence，更新 CLI/doctor 输出。
3. 更新 Buildr Skill、bootstrap、current-state knowledge、CLI Reference、权威 adapter 文档和根中英文 README。
4. 在临时 workspace 完成自动 parity/E2E，并为每个 adapter 记录 `documented` 或 `verified`。有稳定 headless surface 时可执行一次性 smoke；GUI smoke 可保持 `pending`，但明确失败时必须停止对应能力声明，不伪造支持状态。
5. 实际发布后，已有 workspace 仅在用户显式运行 `buildr sync <agent>` 时生成对应 runtime 文件；回滚可移除 descriptors，并由受管 orphan cleanup 删除仅由 Buildr 生成的目标，用户文件保持不变。
6. 本 change 修改产品 Buildr Skill、runtime registry 和生成入口。task checkout 中只刷新本机开发 CLI，不向主自举 workspace sync；合入后由收尾流程在主 workspace 运行 `projects/product/buildr sync codex --target .`，再运行 `projects/product/buildr doctor --agent codex --target . --json`。候选审计已确认主 workspace 当前仅有产品 Buildr Skill stale，符合该预期。

## Open Questions

没有阻塞 change 创建或实现的产品问题。Qoder 独立 terminal CLI、TRAE Work/Solo 的正式版本映射、TRAE Work Skill 直接文件改动的精确生效时机，以及 WorkBuddy 非 5.2.5 版本的源码行为，均作为未认证 surface/版本事实保留，不扩大本次支持范围。

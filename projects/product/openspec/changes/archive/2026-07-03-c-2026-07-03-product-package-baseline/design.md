## Context

Buildr 有三类容易混在一起的资产：

1. **产品开发资产**：服务 Buildr 自身研发，例如根 `AGENTS.md`、`product/openspec/`、`product/docs/`、`product/tools/` 和当前业务验证项目。
2. **产品随包资产**：随 Buildr 发布的 baseline，例如初始化模板、bootstrap guide、产品手册、schema、adapter baseline 和规则模板。
3. **用户实例资产**：用户运行 `buildr init` 后在某个 root 中生成并持续维护的项目管理资产。

随包资产不是开发资产之外的东西，而是开发资产中可发布、可复用、可验证的子集。它应该在产品仓中被一等维护，但与当前 org root 的自用验证上下文隔离。

本 change 也明确：Buildr root 本身就是 Organization context。`organizations/<org>/` 不再作为兼容路径保留。早期产品阶段直接去掉兼容，比长期维护两套路径更便宜、更清晰。

## Goals / Non-Goals

**Goals:**

- 让 Buildr 默认路径只保留 root-as-Organization：`projects/`、`shared/`、`practices/`、`skills/`。
- 移除 `organizations/<org>/` 的 CLI ref、scope、doctor 兼容和默认文档表述。
- 从默认初始化产物中移除 `ASSETS.md`，降低未成熟资产手册的维护压力。
- 设计 `product/package/` 作为随包资产源码，支持开发资产引用随包资产。
- 定义 package manifest/check/build 语义，保证发布子集清晰、可验证。
- 保留 Agent 渐进式 onboarding：先初始化 root，再基于诊断和用户回答逐步创建项目与服务。

**Non-Goals:**

- 不在本 change 中重新设计 `ASSETS.md` 或实现资产手册自动维护。
- 不支持 portfolio multi-organization workspace。
- 不迁移历史归档中的 OpenSpec artifact。
- 不把当前产品仓根 `AGENTS.md` 直接复制为用户模板。

## Proposed Structure

推荐的产品模块结构：

```text
product/
├── tools/
├── docs/
├── openspec/
├── package/
│   ├── manifest.yml
│   ├── bootstrap/
│   ├── manuals/
│   ├── README.workspace.md
│   ├── workspace.baseline.yml
│   ├── schemas/      # 有真实 schema 资产后再纳入 manifest
│   └── adapters/     # 有真实 adapter baseline 后再纳入 manifest
├── integrations/
└── dev/
```

`product/` 是挂载在当前 org root 下的 Buildr 产品开发模块。`product/package/` 不是另一个完整 workspace 模板仓，而是随包资产目录：维护 bootstrap、manuals、辅助文档和 manifest。用户 workspace baseline 由 `product/package/manifest.yml` 显式引用独立资产源生成。

默认规则源放在当前 root `rules/` 下。可发布规则必须是可独立维护、可脱离私有业务的规则文件，例如 `rules/AGENTS.workspace.md`、`rules/AGENTS.project.md`、`rules/git.md` 等；`rules/AGENTS.acme.md` 这类 overlay 不进入 manifest。

用户实例初始化后默认结构：

```text
<buildr-root>/
├── .buildr/
│   └── workspace.yml
├── AGENTS.md
├── README.md
├── rules/
├── practices/
├── skills/
├── shared/
│   ├── services.yml
│   └── services/
└── projects/
```

`ASSETS.md` 不再属于默认 root baseline。未来如果实践证明需要资产手册，应通过显式命令或模板能力引入，例如 `buildr assets init/check/refresh`。

## Decisions

### Decision 1: 去掉 legacy organizations 兼容

Buildr 主线只接受根相对路径：

```text
.
projects/<project>
projects/<project>/<service>
shared
shared/<service>
```

`buildr org create`、`<org>/<project>`、`<org>/<project>/<service>` 和 `organizations/<org>/...` scope 不再是产品能力。旧目录结构如需处理，应通过一次性人工迁移或单独迁移脚本完成，不作为长期兼容行为。

### Decision 2: 默认初始化不生成 ASSETS.md

`ASSETS.md` 是有价值的实践方向，但当前没有稳定命令维护。默认生成会让用户和 Agent 背负额外同步义务。

初始化应优先生成稳定、必要、可诊断的资产：`AGENTS.md`、`README.md`、`.buildr/workspace.yml`、`rules/`、`practices/`、`skills/`、`shared/`、`projects/`。

其中 `rules/` 不应再从 root template 中维护重复副本，而应由 manifest `workspaceFiles` 显式引用 root `rules/` 中允许发布的通用规则，默认包含任务分流、OpenSpec 工作流、runtime、worktree 和 Git 规则。

### Decision 3: 随包资产进入 `product/package/`

`product/package/` 是产品 runtime/base assets 的随包目录。Buildr 开发资产可以引用它，例如验证脚本直接用 manifest 映射生成临时 root；但 package assets 不能引用私有业务项目、私有组织名或产品仓根特有规则。

当前产品仓自身作为自用验证 root 时，root `rules/` 同时承载 Buildr 产品可发布规则和当前 org 专属规则。发布包和 `buildr init` 只使用 manifest 显式引用的源文件，不默认发布整个 `rules/`，也不发布业务 overlay。

### Decision 4: package manifest 是发布边界

`product/package/manifest.yml` 声明哪些目录进入发布包、哪些目录和文件映射生成用户 workspace/project baseline、模板变量、禁止内容和验证入口。`buildr package check` 应至少验证：

- manifest 引用的路径存在。
- `workspaceFiles` 和 `projectFiles` 的源路径存在、目标路径在生成 workspace 内，且 `render/copy` 模式合法。
- 模板变量完整。
- package assets 和 manifest 引用源不包含当前私有业务路径、私有组织名或私有 overlay。
- package assets 和 manifest 引用源不使用 `.gitkeep` 作为占位；空目录由 CLI 在 init/project create 时显式创建。
- 临时目录执行 `buildr init --name demo --profile team` 后 `doctor --json` 通过。

`buildr package build` 后续可基于同一 manifest 生成发布产物。

### Decision 5: onboarding 是渐进式，不是猜测式

`buildr init` 只创建可工作的 root context。Agent 后续通过 `doctor --json` 读取状态，再询问用户：

- 是否创建项目。
- 项目名称和业务边界。
- 是否接入 service repo。
- service 是项目服务还是 shared service。
- 是否需要 runtime check/render。

这让初始化结果健壮，同时保留自然语言交互中的渐进式决策。

## Risks / Trade-offs

- [Risk] 移除 legacy 兼容会破坏已生成的旧 `organizations/` workspace。 → 当前产品仍早期，优先换取主模型清晰；旧资产用一次性迁移处理。
- [Risk] 移除默认 `ASSETS.md` 会减少人类可读索引。 → 用 README、AGENTS 和 doctor 保持最小闭环；资产手册后续等实践成熟再产品化。
- [Risk] 从目录模板改为 manifest 映射后，baseline 结构不再靠目录直观看出。 → 通过 `product/package/manifest.yml` 和 `buildr package check` 固化发布边界，避免重复模板漂移。
- [Risk] 产品开发资产引用随包资产可能产生循环依赖。 → 约束方向为开发资产可以引用 package assets，package assets 不能引用开发 overlay 或私有业务内容。

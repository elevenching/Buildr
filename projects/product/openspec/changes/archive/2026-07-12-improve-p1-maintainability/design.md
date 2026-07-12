## Context

Buildr CLI 已形成 executable、command、application、domains、shared 的基本分层，但第一轮迁移为了控制行为风险，保留了若干过渡结构：application 模块通过宽 `platform` namespace 获得大量无关依赖，package maintenance 与 doctor 仍集中承担数百行流程，Claude Code renderer 同时解析 manifest、解析 contribution、获取来源并生成计划，MVP verifier 也仍是单一大型 shell 文件。与此同时，`product-agent-skills` 同时描述产品入口、源资产、runtime 投射和任务协作，已经超出单一 capability 的可读边界。

本变更必须保持公开 CLI 和生成结果兼容，不引入新运行时依赖，并继续满足 checkout、npm tarball 和自举 workspace 三种运行形态。最终完整验证只在所有代码、自然语言资产和生成资产冻结后执行。

## Goals / Non-Goals

**Goals:**

- 将剩余热点拆成职责单一、可独立测试且依赖显式的模块。
- 让架构门禁可以机械阻止宽 platform import、关键 facade 再次膨胀和验证器重新聚合。
- 以 `node:test` 覆盖纯解析、路径选择、计划生成和依赖边界等低成本高价值逻辑。
- 在不丢失既有规范行为的前提下拆分 `product-agent-skills` capability。
- 保留现有命令、输出、退出码、文件结果、runtime inventory 和发布闭包。

**Non-Goals:**

- 不改变 CLI 命令命名、参数模型或 JSON schema。
- 不重写整个 CLI composition/runtime，也不在本轮引入依赖注入框架。
- 不改变 Skill manifest、Component、OpenSpec 或 task workflow 的产品行为。
- 不追求任意文件的统一行数上限；门禁只约束已识别的 facade 和职责边界。

## Decisions

### 1. 保留稳定 facade，内部按纯逻辑与副作用边界拆分

`package-maintenance.mjs`、`doctor.mjs` 和 `render-claude-code.mjs` 继续保留原有入口与导出表面，避免调用方和 npm inventory 发生不必要变化。实现迁移到同名子目录：package maintenance 按静态校验、smoke、输出/报告拆分；doctor 按 scope/registry/runtime diagnostics 和 reporting 拆分；renderer 按 manifest、contributions、sources 和 render plan 拆分。

选择稳定 facade 而不是一次性修改全部调用方，是为了将行为兼容风险限制在模块内部。替代方案是彻底重做 application composition，但它会把结构优化扩大为运行时架构迁移，不适合最小开源前的 P1 收敛。

### 2. 使用显式 named imports 和窄 ports

CLI 模块直接从 shared platform 导入实际使用的命名能力；需要跨领域组合的函数继续由 application composition 传入窄 service port。禁止 `import * as platform`，也禁止用另一个“全量 deps”对象规避门禁。

这样既保留现有可替换 runtime 的能力，又让依赖可以通过静态扫描和 code review 被理解。替代方案是继续使用 service locator 并只减少 destructuring，但 namespace 本身仍会隐藏真实耦合。

### 3. verifier 采用薄聚合入口与场景脚本

保留 `tools/verify-buildr-product-mvp` 作为唯一对外入口，将公共环境、fixture 和断言放入 `tools/verify/mvp/lib.sh`，将验证流程按 workspace/bootstrap、资产生命周期、runtime/package 等场景拆分。场景脚本只通过公共 helper 协作，不通过隐式修改其他场景内部状态协作。

本轮不把全部 E2E 重写成 Node，因为 shell 对真实 CLI/文件系统场景仍更直接；纯逻辑验证则新增 `node:test`，避免继续把所有反馈都堆进 E2E。

### 4. 细粒度测试聚焦稳定纯函数

新增测试覆盖 Skill manifest 解析、contribution 合并、source resolution、render plan、package 静态规则和架构边界。需要进程/网络/完整临时 workspace 的行为继续由既有 smoke/E2E 覆盖。产品完整验证聚合 unit tests，但专项开发可以单独运行受影响测试。

### 5. capability 按所有权拆分

`product-agent-skills` 保留产品入口 Buildr Skill、Rule/Skill 语义和 Component 对象引导；workspace/project Skill 的源资产、manifest 和 runtime 投射迁移到 `managed-skill-assets`；内置场景化 Skills、OpenSpec/Git/worktree/task-finish 协作及分层验证迁移到 `agent-task-workflows`。

迁移使用同名 Requirement 的 removed/added delta，确保归档后仍可追踪原契约身份和行为，不把代码风格约束写入产品 capability。

### 6. 架构门禁针对回归模式而非任意指标

架构 verifier 检查：发布 CLI 模块不得使用 platform namespace import；三个兼容 facade 只承担组合/转发；MVP 聚合入口不得重新包含具体长场景；新增模块必须进入 npm runtime inventory（适用时）。行数阈值只作为 facade 回归信号，并与职责/依赖检查同时使用。

## Risks / Trade-offs

- [拆分时遗漏隐式共享状态] → 先建立行为基线，按调用链迁移，每组完成后运行语法和专项测试，最终运行完整验证。
- [named imports 暴露循环依赖] → 保持 shared 不反向引用上层，跨领域调用只通过 composition ports，并由架构 verifier 扫描。
- [shell verifier 拆分后工作目录或退出语义变化] → 公共库统一计算产品根目录、启用严格模式，并让场景脚本由聚合入口在同一进程语义下执行。
- [spec 迁移遗漏细节] → 使用同名 Requirement 迁移，归档前执行 contract guard、strict validation 和 delta/canonical 对照。
- [门禁阈值过度限制正常演进] → 只限制稳定 facade 与已知宽依赖，不设置全仓任意行数上限。

## Migration Plan

1. 建立 OpenSpec baseline 和现有 CLI/package/runtime 行为基线。
2. 先拆分纯 renderer 与诊断/校验逻辑，保留 facade 导出和调用方兼容。
3. 将 CLI platform namespace imports 收窄为 named imports，并增强架构 verifier。
4. 拆分 MVP verifier，增加 unit tests，随后更新验证聚合入口。
5. 完成 capability delta、架构文档和自举资产影响检查。
6. 冻结候选 tree 后执行 architecture、unit、package/doctor 和完整产品验证；失败时只修复失败影响面，稳定后再执行一次最终完整验证。

回滚时可以按 facade 分组恢复内部实现；由于公开入口与数据格式不变，不需要用户数据迁移。

## Open Questions

无。模块命名和内部文件边界可在实现中按现有职责机械确定，不涉及用户产品决策。

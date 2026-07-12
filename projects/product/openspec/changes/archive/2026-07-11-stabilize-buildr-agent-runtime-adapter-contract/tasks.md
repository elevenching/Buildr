## 1. Adapter contract 与计划模型

- [x] 1.1 新增静态 runtime adapter registry 和 descriptor 校验，统一声明 id、五项 required capabilities、runtime targets、recommended commands 与 planning 入口
- [x] 1.2 定义不可变 runtime context、声明式 RuntimePlan、capability evidence、finding/repair 和 managed removal 数据结构
- [x] 1.3 实现 RuntimePlan fail-closed validator，覆盖路径边界、重复 target、descriptor/capability 不一致和非法 removal
- [x] 1.4 增加 registry 与测试专用 fake adapter contract tests，证明未注册或不完整 adapter 不会进入发布支持列表

## 2. 通用 source assembly 与 reconcile

- [x] 2.1 抽取 canonical scope discovery、Rules sources、产品 Buildr Skill、workspace/Project Skills 和 install plans 的通用 source assembly
- [x] 2.2 将 Component definition、member integrity、ownership 和 Skill Contribution 完整性校验接入 source assembly，拒绝未验证 fragment
- [x] 2.3 显式拒绝 Component adapter、runtime hook、executable member 和 registry patch 声明，并补充 Component/package check 与 doctor findings
- [x] 2.4 实现共享 preflight、compare-only、apply、managed marker、冲突聚合、orphan cleanup 和结果确认 executor
- [x] 2.5 增加通用管线测试，覆盖零写入冲突、非法计划、用户文件保留、orphan 清理、Contribution 完整性失败和重复执行幂等

## 3. 迁移现有 adapters

- [x] 3.1 将 Codex 迁移为静态 adapter，组合 native `AGENTS.md` 与 `.agents/skills` 投射原语并保持现有 target 和 managed content parity
- [x] 3.2 将 Claude Code 迁移为静态 adapter，组合 reference bridge 与 `.claude/skills` 投射原语并保持现有 target 和 managed content parity
- [x] 3.3 将产品 Buildr Skill runtime guidance 和 Skill install plans 改为由选定 adapter context 生成
- [x] 3.4 增加 Codex 与 Claude Code golden/parity tests，覆盖 Rules、Skills、Contribution、install plans、conflicts、orphans 和 diagnostics

## 4. 统一命令与诊断路由

- [x] 4.1 让 `runtime list`、CLI help 和 runtime id validation 从静态 registry 派生，并删除重复 allowlist
- [x] 4.2 让 `render`、`skills render`、`skill install`、`runtime check` 和 `sync` 使用统一 planning/reconcile 管线
- [x] 4.3 让 `doctor --agent` 通过 registry 和 compare-only 管线聚合 runtime findings/repairs，并保持无 `--agent` 调用兼容
- [x] 4.4 让 Component install/uninstall 在 source transaction 后调用相同 runtime reconcile，并保持失败时的 source-of-truth 与完成状态语义
- [x] 4.5 删除已被 contract 取代的 Agent-specific 控制流和重复 checker，同时保留确属 runtime-specific 的 renderer 原语

## 5. 文档、同步与验证

- [x] 5.1 更新产品文档、CLI/Buildr Skill guidance 和架构说明，明确 adapter contract、无 fallback、Component 自证完整性但不扩展 adapter，以及 Trae 属于后续 change
- [x] 5.2 按自举规则从候选 Product checkout 同步或渲染受影响的 package Skills、Components 和当前 Agent runtime 资产，并确认生成内容无漂移
- [x] 5.3 运行 adapter/component 专项测试、OpenSpec strict validation、package check 和候选 tree 的一次最终临时 workspace E2E
- [x] 5.4 刷新本机 Buildr CLI 开发入口，验证 `command -v buildr`、`buildr --help` 和当前 Codex workspace doctor

## 1. Trait contract 与组合器

- [x] 1.1 在 runtime adapter contract 中定义 Rules、Skills、surface、activation、checker trait catalog 和序列化 metadata。
- [x] 1.2 实现静态 descriptor composer 与组合 validation，从 traits 派生五项 capabilities、runtime targets、Skills roots 和 capability evidence。
- [x] 1.3 为未知 trait、缺少参数、不安全 root、未注册 implementation、部分 Rules scope 和 runtime alias 添加失败测试。

## 2. Runtime 管线迁移

- [x] 2.1 将 Rules assembly 改为按 trait implementation registry 分派，保留 native recursive 与 reference bridge 现有 primitive。
- [x] 2.2 将产品 Buildr Skill、workspace/project Skills 和 install-plan target 改为使用组合后的 Skills trait。
- [x] 2.3 将 runtime check、doctor 和 printer 改为通用 projection checker 与静态 probe contract，移除按 runtime id 维护的 checker allowlist。
- [x] 2.4 将 CLI runtime discovery、workspace operation result 和 package static validation 改为从组合后 registry 派生，并运行 CLI 受影响范围验证。

## 3. 现有 adapters 与扩展验证

- [x] 3.1 用 composer 重写 `codex` 与 `claude-code` descriptors，保持公开命令、targets、managed markers、findings 和 repairs 兼容。
- [x] 3.2 扩展 fake adapter 测试，验证共享 traits、独立 identity、implementation dispatch、capability certification 和发布 registry 隔离。
- [x] 3.3 运行 adapter contract、parity、runtime smoke 和 package 受影响范围验证，修复所有兼容差异。

## 4. Agent-facing 接入信息

- [x] 4.1 让 `runtime list --json` 输出 trait catalog 和每个 adapter 的序列化 traits，并更新 JSON/CLI contract tests。
- [x] 4.2 将 adapter 接入指南缩减为“trait intake → OpenSpec change → 实现与验收”的短流程。
- [x] 4.3 将目标 Agent 调研 Prompt 改为与 descriptor 对齐的最小 intake，只询问 identity、Rules、Skills、activation、checker 和五项 capability evidence。
- [x] 4.4 更新 Buildr Skill、产品说明、current state、文档索引和已知限制，确保 Agent 能发现并正确使用新的 adapter 接入模型。

## 5. 最终候选验证

- [x] 5.1 冻结最终候选后按产品 release checklist 运行一次完整验证，并读取 timing summary，记录总耗时、最慢阶段和失败阶段。
- [x] 5.2 确认本次变更影响 Buildr Skill 和 runtime adapter；实际自举 sync/render 与当前 Agent doctor 留到集成后的保留 checkout 执行，不从未合并 task worktree 更新主 workspace。

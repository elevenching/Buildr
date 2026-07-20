## 1. Schema 与解析模型

- [ ] 1.1 定义并验证 `buildr.project-commands/v1`，实现 `projects/<project>/commands.yml` 的安全 parser、空 requirements baseline 和 provenance model。
- [ ] 1.2 将 workspace Command manifest 解析收敛为 catalog definitions，明确 identity 字段、default requirement 兼容输入和稳定冲突 reason codes。
- [ ] 1.3 实现 Project requirement 到 workspace catalog 的引用解析、required/optional 合并和缺失 definition 诊断。
- [ ] 1.4 实现多个 Project version constraints 的确定性求交；无法证明兼容时输出 `command_requirement_conflict` 并停止 machine probe。

## 2. Project 与 CLI 生命周期

- [ ] 2.1 更新 Project template/create/registry，使新 Project 创建空 `commands.yml`，旧 Project 缺失文件时按空集兼容并提供安全补齐动作。
- [ ] 2.2 扩展 Commands CLI 与 help，支持显式单 Project/跨 Project context，并保持无 Project 调用只检查 catalog 与 workspace defaults。
- [ ] 2.3 提供 Project requirement 的确定性维护入口或受验证文件契约，确保不复制 executable、probe 或 install hint。
- [ ] 2.4 在删除 Command definition 前检查 workspace defaults 和全部 Project 反向引用，存在引用时保持零写入。

## 3. Doctor、Components 与 Agent guidance

- [ ] 3.1 重构 Commands check JSON，分离 catalog、requirements、effective constraints、machine observations、findings 与 provenance。
- [ ] 3.2 更新 doctor scope diagnostics：root 校验全部 source/reference integrity，Project scope 检查有效 machine readiness，无关 Project 缺失不污染 root readiness。
- [ ] 3.3 更新 Component install/update/uninstall 预检，使 Component 只拥有 workspace catalog collections，并阻止删除仍被 Project 引用的 definition。
- [ ] 3.4 更新 Buildr Skill、onboarding、CLI reference 和产品文档，明确 Buildr 不 render/install Commands，也不保存凭证或个人配置。

## 4. 兼容、验证与交付

- [ ] 4.1 增加 catalog identity conflict、单 Project、跨 Project兼容/冲突、required/optional、旧 Project 空集和 machine warning 单元测试。
- [ ] 4.2 增加 Commands CLI、Project create、doctor、Component reverse reference、package workspace 与 JSON contract 集成测试。
- [ ] 4.3 运行 Commands/Project/doctor/Component/package focused verification、OpenSpec strict 与 `git diff --check`，更新任务看板。
- [ ] 4.4 冻结最终候选并运行完整 Candidate；通过后执行 spec sync、post-sync、archive、自举 workspace sync 和收尾。

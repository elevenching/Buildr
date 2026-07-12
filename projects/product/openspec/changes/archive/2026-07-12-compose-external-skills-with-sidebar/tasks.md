## 1. 外部 Skill 与 Sidebar 组合模型

- [x] 1.1 扩展 Component definition 和 Skill source model，区分外部 workflow Skills、Buildr-owned Skills 与 contribution members
- [x] 1.2 实现外部 Skill 的 prepend/append boundary contribution，并保留 Buildr Skill 的 slot contribution
- [x] 1.3 扩展 runtime receipt/check 和通用 fixtures，验证 provenance、确定性组合和源正文不变

## 2. OpenSpec Package 与迁移

- [x] 2.1 将 OpenSpec workflow Skills 移到外部来源命名空间并恢复上游纯净内容，移除 `skills/buildr/openspec-*` forks
- [x] 2.2 调整 OpenSpec Component、Skills manifest、package manifest、integrity 和 sidebar fragments
- [x] 2.3 实现旧 Buildr fork 到外部 Skill + sidebar 的安全三方迁移和卸载收敛
- [x] 2.4 更新 Buildr Skill、产品文档和 current-state knowledge，说明 Sidebar 与 Skill Contribution 的分层

## 3. Mutation Git 忽略

- [x] 3.1 让 init/update/sync 幂等确保 `/.buildr/mutations/`，同时保留 `.buildr/workspace.yml` 的版本管理
- [x] 3.2 增加旧 workspace 收敛、重复执行和异常 transaction ignored 状态验证

## 4. 验证与发布准备

- [x] 4.1 更新 package static validation、Component lifecycle、两种 runtime adapter 和迁移测试
- [x] 4.2 运行受影响专项验证并修复发现
- [x] 4.3 运行最终产品完整验证、OpenSpec strict validation 和 package dry-run
- [x] 4.4 从候选 checkout 刷新本机 Buildr CLI，并验证入口与 workspace doctor

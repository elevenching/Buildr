## 1. Package 与诊断实现

- [x] 1.1 从 workspace 和 Project 随包 directory baseline 移除 `practices/`，保持现有 materialization 与 transaction 路径不变
- [x] 1.2 从 Project baseline 缺失检查移除 `practices/`，并为 root/Project 遗留目录增加非阻塞、只检查存在性的 doctor info finding
- [x] 1.3 更新 package/doctor 直接测试，覆盖新初始化不创建目录、已有目录和内容在 update/sync/Project repair 后保持不变

## 2. 当前自然语言资产

- [x] 2.1 更新 Product README、产品主文档、Project 模板和随包 Buildr Core，移除独立 Practices 资产语义并说明 Rule、Skill、OpenSpec、docs 分工
- [x] 2.2 更新随包 Buildr Skill 和 task-worktree Skill 的当前资产说明与遗留迁移指引，不修改历史 OpenSpec archive 或归档产品文档
- [x] 2.3 复查当前非历史源中的 `practices/` 引用，只保留遗留兼容说明或普通“最佳实践”语义

## 3. 受影响范围验证

- [x] 3.1 运行 CLI 语法检查、OpenSpec change strict validation 和 package check
- [x] 3.2 运行受影响的 workspace/Project 创建、doctor、managed mutation 和 managed-data-integrity 验证，修复回归
- [x] 3.3 按 Product 规则刷新本机开发 CLI，并在 task worktree 上验证入口、help 和 doctor

## 4. 最终候选验证

- [x] 4.1 冻结实现与自然语言候选，完成 diff review、`git diff --check` 和当前引用审计
- [x] 4.2 对最终候选运行一次 `projects/product/tools/verify-buildr-product`，并等待同一进程完成
- [x] 4.3 执行 `npm pack --dry-run` smoke，确认发布包不再声明 Practices baseline 且未丢失其他资产

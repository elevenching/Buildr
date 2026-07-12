## 1. 统一运行时同步

- [x] 1.1 建立共用的运行时检查结果，列出需要新增、更新、删除、保留和报错的文件，并保持稳定顺序
- [x] 1.2 让 Rules、Skills 和安装计划在写入前完成全部冲突检查
- [x] 1.3 清理失去来源的 Buildr 受管 Skill 和安装计划，同时保护用户文件
- [x] 1.4 完成运行时同步相关的小范围测试

## 2. 接入现有命令

- [x] 2.1 让 `render` 和 `skills render` 使用共用逻辑，并在写入后确认结果
- [x] 2.2 让 Component 安装和卸载使用共用逻辑
- [x] 2.3 让 `sync` 的源资产更新使用现有事务，并在提交后同步运行时
- [x] 2.4 完成 render、sync 和 Component 受影响范围验证

## 3. Project 范围

- [x] 3.1 实现单 Project render 只处理 workspace 和当前 Project
- [x] 3.2 实现 workspace 全量 render 对相同 Skill 共用一份、不同内容撞同一路径时报错
- [x] 3.3 补充单 Project、多个 Project 和重复执行的临时 workspace E2E

## 4. 规则和文档

- [x] 4.1 在产品源的 Buildr Core 中加入简明表达要求
- [x] 4.2 更新相关产品文档、诊断说明和命令帮助
- [x] 4.3 按自举要求同步受影响的 Rules、Skills、Components 或 Agent runtime 资产

## 5. 最终验证

- [x] 5.1 审阅实现、自然语言资产和生成资产，修正发现的问题
- [x] 5.2 对最终候选 Git tree 运行 Buildr 产品完整验证
- [x] 5.3 按 OpenSpec 契约门禁检查 delta specs，确认 change 可同步和归档

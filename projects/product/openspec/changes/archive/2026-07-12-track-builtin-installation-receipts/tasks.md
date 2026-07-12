## 1. 回执模型与 package 证据

- [x] 1.1 实现 Builtin 精确 inventory、完整性与回执 schema 读写校验
- [x] 1.2 扩展 package manifest 和 package check，声明并校验 legacy 官方完整性

## 2. Builtin 生命周期

- [x] 2.1 将 Rule、Skill 和 Command 状态改为 Old/Live/New 三方比较
- [x] 2.2 实现无回执 workspace adoption、官方自动升级与未知来源 fail closed
- [x] 2.3 将 sync、uninstall、restore 的资产、manifest 和回执纳入同一 transaction

## 3. 诊断与验证

- [x] 3.1 补充 list/doctor 状态、目录额外或缺失文件、损坏回执测试
- [x] 3.2 补充 legacy 自举升级、显式卸载/还原与事务回滚测试
- [x] 3.3 运行 OpenSpec guard、受影响检查和最终产品级验证

## 1. 共享 timing evidence

- [x] 1.1 实现唯一 evidence paths、run/source identity 和候选 fingerprint
- [x] 1.2 抽取统一 summary writer 与人类可读 total/slowest/failed/path formatter
- [x] 1.3 扩展 timing 单元与集成测试，覆盖 source identity、唯一目录、成功和失败输出

## 2. Candidate 与 Changed 集成

- [x] 2.1 Candidate 使用共享 evidence 模块并保留显式环境变量兼容
- [x] 2.2 Changed 生成持久整体 timing summary，同时继续清理短生命周期执行制品
- [x] 2.3 增加两个 worktree/run 不互相覆盖及 Changed summary 的回归测试

## 3. Task Finish 与文档

- [x] 3.1 更新 builtin task-finish，在收尾时核对并报告最终 Candidate timing evidence
- [x] 3.2 更新 task-finish contract fixtures、验证文档和 timing 输出说明

## 4. 验证

- [x] 4.1 运行 OpenSpec contract guard、timing/verification 专项测试和 changed verification
- [x] 4.2 在唯一显式 evidence 路径运行最终 Candidate，并核对总耗时、最慢阶段、失败阶段、source identity 与 summary 路径

## 1. Workspace 范围 projection

- [x] 1.1 将 getting-started projection 改为聚合全部 Project 与 Service，移除 selectedProject 和 `projectCode` 输入依赖。
- [x] 1.2 保留迁移与部分不可用诊断，并为全局汇总和旧查询参数补充 Application/HTTP 契约测试。

## 2. 开始页与任务交接

- [x] 2.1 将开始页改为 Workspace 摘要与项目目录入口，移除项目选择控件和 URL 查询状态。
- [x] 2.2 让开始页每次以未预填范围打开“用 Agent 开始”，由现有抽屉临时选择项目和可选服务。

## 3. 验证

- [x] 3.1 更新浏览器集成用例，验证多项目开始页不锁定项目、旧查询参数被忽略、抽屉仍生成明确范围的工作指令。
- [x] 3.2 修复 Windows launcher 验证对 UTF-16LE `Buildr.vbs` 的编码读取，并验证其 bundle contract。
- [x] 3.3 运行受影响范围验证，冻结候选后运行完整 Candidate 验证并记录结果。

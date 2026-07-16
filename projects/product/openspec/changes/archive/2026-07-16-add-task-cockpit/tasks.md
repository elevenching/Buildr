## 1. Skill 与模板

- [x] 1.1 使用 Skill Creator 初始化 `task-cockpit` builtin Skill 源目录，并完成触发 description、单向维护流程、路径规则、更新节点和回复入口契约
- [x] 1.2 实现自包含 HTML 驾驶舱模板，提供首页、推进、方案和技术细节视图以及普通用户优先、聚焦简练的响应式样式
- [x] 1.3 校验 Skill 目录结构、frontmatter、UI metadata 和模板离线可打开性

## 2. 任务路由与产品交付

- [x] 2.1 更新 `task-triage`，增加驾驶舱“不需要 / 创建 / 继续维护”判断和用户可见状态输出
- [x] 2.2 将 `task-cockpit` 登记到 workspace Skills manifest、package builtin 清单、bootstrap contract 和产品入口 Skill 路由
- [x] 2.3 更新 package/static verifier，覆盖 Skill、模板、日期前缀命名、knowledge 路径和回复链接契约
- [x] 2.4 运行 task workflow 与 package 受影响范围验证

## 3. 产品事实与真实驾驶舱

- [x] 3.1 更新 current-state knowledge、产品说明和文档索引，说明 task cockpit 与 specs、change、代码和 current-state knowledge 的边界
- [x] 3.2 为本 change 创建 `openspec/knowledge/task-cockpits/2026-07-16-add-task-cockpit.html`，展示本次任务的目标、方案、阶段、进展、依赖和关键技术细节
- [x] 3.3 检查驾驶舱桌面和窄屏信息结构；浏览器环境不可用时执行 Tab、响应式、溢出、只读和自包含静态审计，并记录截图级视觉验收限制

## 4. 候选验证

- [x] 4.1 运行 OpenSpec strict validation、Git diff 检查和 Skill/package 静态检查
- [x] 4.2 冻结最终候选并运行 `npm run test:candidate`，读取 timing summary，确认最终任务状态和驾驶舱内容一致

## 1. 验证能力契约与 Skills

- [x] 1.1 新增 `buildr.task-verification/v2` contract，以 `requiredAssurance: affected | candidate` 定义 provider 与 consumer 的最小协作证据
- [x] 1.2 将默认 `task-verification` provider、manifest、binding、package targets 和全部 runtime 投射迁移到 v2
- [x] 1.3 简化 `task-verification` Skill 的用户决策为受影响验证与完整候选验证，同时保留 minimal 内部反馈、identity、计时、复用和清理语义
- [x] 1.4 调整 `task-finish` consumer：普通收尾消费 affected，发布/高风险/显式完整收尾消费 candidate，implementation change 重跑同一 requiredAssurance
- [x] 1.5 更新组合 fixtures 与 contract tests，覆盖 v2 binding、provider replacement、普通/高风险收尾、evidence 复用及 fail-closed 分支

## 2. Product 验证路由收敛

- [x] 2.1 为本机应用补充 API client、router 和可提取页面逻辑的低成本快速检查 owner
- [x] 2.2 收窄 contract、CLI architecture、managed mutations 等 Changed `inputs`，保持未映射 Product path fail closed
- [x] 2.3 移除已由低层 integration 或真实浏览器行为覆盖的前端实现源码正则断言
- [x] 2.4 增加 planner/registry 契约测试，证明局部 API、Project、Service、Change 与 Shell 改动只选择真实受影响 owner

## 3. Browser integration 拆分

- [x] 3.1 提取可复用的隔离 Workspace、loopback server、Chrome 和清理 fixture
- [x] 3.2 实现 Project、Service、Change、Shell 四个独立 browser selector 与稳定 step id
- [x] 3.3 将独立 browser steps 接入 changed/focus registry，并保证单 selector 不执行无关资源流程
- [x] 3.4 验证 browser 环境阻塞、页面错误诊断和临时资源清理，且不下载浏览器或访问外部系统

## 4. 文档、生成资产与验证

- [x] 4.1 更新 Product 开发规则、验证职责文档、current-state 和 CLI/README 入口，统一使用快速检查、integration、产品候选三类能力与 affected/candidate 两种正式保证
- [x] 4.2 更新 package manifest/生成资产并核对所有 supported runtime adapter 的 v2 capability graph ready
- [x] 4.3 运行 OpenSpec strict、Skill/package contract、planner、Changed 和 browser affected 验证，确认 `projects/product/verification.yml` 没有变化
- [x] 4.4 审查测试重复与 owner 边界，确认保留的交叉覆盖有独立价值且不存在 `.skip`、占位或无效门禁
- [x] 4.5 冻结最终实现 identity，运行完整 Product Candidate 并核对 timing summary、失败/跳过项、预算和 evidence 生命周期

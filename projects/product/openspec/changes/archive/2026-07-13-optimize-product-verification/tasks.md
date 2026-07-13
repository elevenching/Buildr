## 1. 快速与受影响验证入口

- [x] 1.1 新增 fast verifier，并将 `npm test`、`test:fast`、`test:candidate` 映射到明确的三层入口。
- [x] 1.2 重构 affected verifier，以稳定 step id 去重多个 group 共享的检查，并补充入口契约测试。
- [x] 1.3 更新 Product 验证文档，运行 fast 与组合 affected 验证并记录耗时。

## 2. 候选 package 制品复用

- [x] 2.1 让 candidate orchestrator 生成一次 tarball/pack metadata，并让 open-source candidate、package parity、MVP 和 release smoke 支持安全复用与 standalone fallback。
- [x] 2.2 删除 MVP installed lifecycle 中重复的完整 package check，保留安装后 bootstrap/help 契约。
- [x] 2.3 补充共享 tarball 与 fallback 的直接测试，并集中运行 release/package 受影响验证。

## 3. Runtime adapter 验证收敛

- [x] 3.1 加强全部 adapter 的低成本 trait/target/plan 契约，并将 parity 与 smoke generator 的昂贵生命周期收敛到不同实现族代表。
- [x] 3.2 修复 scoped Rules render 跨 Project cleanup，并补充 same-directory、central vendor 和 root-index 模型的隔离回归。
- [x] 3.3 运行 runtime adapter contract、parity、generator 和 CLI affected 验证并记录耗时。

## 4. 完整候选有界并行

- [x] 4.1 实现可测试的并行 step runner，保证声明顺序输出、逐阶段 timing 和批次失败传播。
- [x] 4.2 重构完整候选 orchestrator，在共享制品准备后按隔离边界分批并行，保持原有门禁和 diagnostics。
- [x] 4.3 补充 timing/失败场景测试，并验证候选 summary 包含全部要求阶段。

## 5. 契约与最终验证

- [x] 5.1 更新 release checklist 与相关 Product 规则/静态契约，执行 OpenSpec strict、proposal baseline/check 和 affected 验证。
- [x] 5.2 冻结最终 tree 后运行一次 `npm run test:candidate`，读取 timing summary 并与优化前 128.827 秒基线比较。
- [x] 5.3 检查 CLI/Rules/Skills/runtime 自举影响，按需安装候选 CLI、同步 Codex runtime 并运行 doctor。

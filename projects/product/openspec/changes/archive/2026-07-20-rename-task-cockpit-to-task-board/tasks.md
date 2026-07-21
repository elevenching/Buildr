## 1. Builtin replacement 契约与同步事务

- [x] 1.1 为 Product package builtin schema 增加单一 predecessor replacement 声明，校验 identity 合法性、目标唯一性、禁止多跳或循环 replacement，并更新 package/bootstrap fixtures
- [x] 1.2 扩展 sync 只读 preflight，识别 `task-cockpit → task-board` 的旧 manifest entry、源目录、官方 integrity、安装回执、runtime projection 和目标冲突，保证所有用户决策点发生在 workspace 写入前
- [x] 1.3 在同一 source mutation 中实现 installed builtin 的源 identity、manifest 和 builtin receipt 原子迁移；同一次 sync 随后清理旧 runtime、投射新 runtime 并由最终 doctor 判定完成
- [x] 1.4 实现 optional builtin `uninstalled` 状态继承；对 modified、missing、未知文件、无法证明 ownership 和目标已存在场景保持零写入并返回可执行 diagnostics
- [x] 1.5 增加 builtin replacement 单元与集成测试，覆盖新 workspace、installed、uninstalled、modified、missing、目标冲突、source 事务失败回滚、runtime 未完成诊断和重复 sync 幂等性
- [x] 1.6 运行 `npm run test:focus -- package-static`、`npm run test:focus -- managed-data-integrity` 及 replacement 直接相关测试，确认 package/sync 受影响范围通过

## 2. Canonical task-board Skill 与产品入口

- [x] 2.1 将 package Skill source 从 `task-cockpit` 迁移为 `task-board`，更新 `SKILL.md`、`agents/openai.yaml`、manifest identity、bootstrap contract 和 package file inventory；description 保留旧名称意图识别但只输出“任务看板”
- [x] 2.2 将模板迁移为 `assets/task-board-template.html` 和 `script#board-data`，统一页面标题、空状态、相对路径、导航与错误文案，同时保持自包含、离线、响应式和只读
- [x] 2.3 更新 `task-triage` 与产品入口 Buildr Skill，将复杂任务可视化、整体进度、长期跟踪、任务全景和旧“任务驾驶舱”意图无歧义路由到 `task-board`
- [x] 2.4 更新 static validation、Skill contract tests 和所有 adapter parity expectations，验证完整 `task-board` 目录被投射且受管 runtime 不同时保留 `task-cockpit`
- [x] 2.5 运行 `npm run test:contract` 与 `npm run test:focus -- runtime-adapter-parity`，确认 Skill、模板、路由和 adapter 受影响范围通过

## 3. 新页面路径与历史页面保留

- [x] 3.1 更新 `task-board` Skill，使新任务只在 canonical `task-boards/` 下创建页面，并明确产品升级不得移动、转换、覆盖或替换既有 `task-cockpits/*.html`
- [x] 3.2 增加历史页面零改写测试，记录 Product Project 当前 `task-cockpits/` 文件路径与内容 integrity，并验证 init、sync、Skill rename 和 runtime render 后保持不变
- [x] 3.3 验证新任务看板页面数据、静态结构、窄屏、自包含和只读行为，同时确认 Product Project 现有旧页面未产生 Git diff

## 4. Canonical facts 与历史边界

- [x] 4.1 同步本 change 的 `task-board`、legacy `task-cockpit`、`agent-task-workflows`、`buildr-development-openspec`、`buildr-product-capability-sync` 和 `product-agent-skills` delta specs，并确认 current specs 不再把任务驾驶舱作为当前产品入口
- [x] 4.2 更新 `buildr-current-state.md`、`buildr-product.md`、document index、package 说明和其他当前产品文案，统一使用“任务看板”、`task-board` 与 `task-boards/`
- [x] 4.3 审计非 archive 当前源中的 `任务驾驶舱`、`task-cockpit`、`task-cockpits` 和模板旧 identity；只允许自然语言兼容、builtin replacement、历史页面边界或相关 fixture 中的必要引用
- [x] 4.4 确认 `openspec/changes/archive/`、历史提交和历史交付记录未被批量改写，并验证当前文档不会把这些历史名称解释成并行产品能力
- [x] 4.5 运行 OpenSpec strict validation、proposal contract check 和 `npm run test:changed`，确认 canonical facts、代码和受影响验证一致

## 5. 隔离升级验收与最终候选

- [x] 5.1 在临时 workspace 验证旧官方 `task-cockpit` installed 状态经 `buildr sync codex` 迁移为唯一 `task-board` 源与 runtime，最终 doctor 无立即处理 error
- [x] 5.2 在临时 workspace 验证旧 optional builtin 的 uninstalled 状态不会因改名被恢复，modified/missing/目标冲突场景 preflight 零写入且 diagnostics 可供 Agent解释
- [x] 5.3 验证新 workspace init 只创建 `task-board`，所有支持 adapter 的 Skill inventory、metadata、模板和 receipts 使用当前 identity
- [x] 5.4 冻结最终候选 tree，运行 `npm run test:candidate`，读取 timing summary 并记录总耗时、最慢阶段、失败阶段和 summary 路径
- [x] 5.5 对照用户确认的 Skill/runtime 迁移责任、历史页面零改写边界、全部 change artifacts、最终 diff 和验证证据检查语义完整性；任何偏差在收尾前回到对应任务修正

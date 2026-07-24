## 1. 建立迁移事实和保护门禁

- [x] 1.1 枚举 `tools/` 全部 tracked files、executable、imports、package inventory、npm scripts、verification registry inputs/executors 和文档/OpenSpec 引用，形成逐文件迁移映射。
- [x] 1.2 按“安装后 CLI 是否可达”分类产品 verifier、仓库 verification、测试 fixture 和维护脚本，并为每项记录目标 owner 与 npm 交付结论。
- [x] 1.3 运行并保存迁移前 CLI help、public JSON、package parity、runtime adapter、managed mutation 和 Candidate identity 基线，明确仅允许内部路径变化。
- [x] 1.4 先更新架构契约测试，使其表达 `bin/src/test/scripts/package` 终态、单向依赖、无 `shared` 根、产品 verifier 边界和旧 `tools/` 零引用要求。

## 2. 迁移领域、应用和基础设施源码

- [x] 2.1 将现有 Workspace registry、Rules、Skills、Commands、Components、OpenSpec、runtime 与 package assets 操作迁入 `src/application/domains/`；不把含文件 IO/mutation 的 handler 伪装成纯 domain，后续真实存储无关模型再建立 `src/domain/`。
- [x] 2.2 将 doctor、workspace operations、package maintenance、CLI update 和 composition root 迁入职责明确的 `src/application/`，并将 release bridge 归入 `scripts/release/`。
- [x] 2.3 把 filesystem、path resolution、YAML、atomic write 和 workspace transaction primitive 迁入 `src/infrastructure/filesystem/`，保持 mutation 与回滚语义。
- [x] 2.4 把 process/Git 调用、remote fetch 和 Agent runtime adapter/renderer 分别迁入 `src/infrastructure/process/`、`network/` 和 `runtime/`。
- [x] 2.5 消除旧 shared 聚合依赖，把 JSON contract、filesystem/platform、network 与 runtime helper 放入明确 owner，并验证不存在顶层或 `src/shared/`。
- [x] 2.6 更新迁移模块的 unit owner 与 imports，逐批运行相关 unit/fast integration，证明源码移动未改变行为。

## 3. 建立唯一 CLI 和产品 interface

- [x] 3.1 将 command registry、help、identity、diagnostics、参数解析和 output adapter 迁入 `src/interfaces/cli/`，保持唯一 command key 和既有输出通道。
- [x] 3.2 创建薄 `bin/buildr.mjs` 并让 Product 根 `buildr` checkout 入口委托同一 `src/interfaces/cli` implementation。
- [x] 3.3 更新 composition/bootstrap 路径和 CLI architecture verifier，证明 executable 不包含领域实现且 interface 不绕过 application 用例。
- [x] 3.4 运行全量 help、无效输入、JSON discovery、source mutation 和 checkout CLI compatibility focused tests。

## 4. 分离产品 verifier 与仓库 verification

- [x] 4.1 将 `buildr package check`、OpenSpec contract 和 runtime contract 等安装后产品命令可达的 verifier 留在 `src` owner；managed integrity 等仓库门禁迁入 `test/verification`。
- [x] 4.2 更新 package maintenance verifier registry，使产品命令只组合 `src` verifier，且不导入 `test/verification`。
- [x] 4.3 将统一 verification registry、planner、scheduler、executor、Changed/Focus/Candidate 入口、timing、evidence 和 coverage 迁入 `test/verification/`。
- [x] 4.4 将 CLI、runtime、package、release、network、onboarding、integrity、Workspace E2E 等 checkout-only focused verifier 迁入 `test/verification/<area>/`。
- [x] 4.5 将固定 Workspace、manifest、legacy、冲突和损坏状态样本收敛到 `test/fixtures/`，并更新所有 fixture consumers。
- [x] 4.6 更新 verification registry 的 executors、inputs、changed-path mapping、profiles、groups、budgets 和 artifact dependencies，删除全部旧目录 glob。
- [x] 4.7 验证 Fast、Changed 与 Focus 的 stable step identity、DAG、failure propagation、timing schema 和 evidence identity 保持兼容；完整 Candidate 由 8.4 单独验收。

## 5. 迁移仓库安装、分发和发布脚本

- [x] 5.1 将 checkout CLI install/uninstall 脚本迁入 `scripts/`，更新本机入口定位、帮助和 installer verification。
- [x] 5.2 将 release contract、notes、registry state、convergence 和 history bridge 等真实发布动作迁入 `scripts/release/`；Candidate tarball、package parity 与 release smoke 作为验证保留在 `test/verification/`，不为不存在的职责创建空目录。
- [x] 5.3 更新 shell/Node shebang、executable mode、跨平台进程调用和所有文档命令，确保 `src`/`bin` 不导入 `scripts`。
- [x] 5.4 从隔离 checkout 验证开发 CLI 安装、卸载和 update source 识别，不修改主自举 Workspace。

## 6. 收敛 npm package 和交付资产边界

- [x] 6.1 将 `package.json#bin.buildr` 切换为 `bin/buildr.mjs`，更新 npm scripts 指向新的 `test/verification` 与 `scripts` 入口。
- [x] 6.2 重写 `package.json#files` 为安装后实际需要的 `bin`、`src`、docs 和顶层 `package` runtime closure，排除 `test`、`scripts`、`tools` 和 active changes。
- [x] 6.3 更新 package static validation、tarball inventory 和 installed command smoke，证明产品 verifier 已随 `src` 交付且安装后命令不读取 checkout-only 文件。
- [x] 6.4 保持顶层 `package/manifest.yml`、bootstrap、workspace/runtime targets 和 source-to-target 语义不变，并运行全部 package focused steps。
- [x] 6.5 更新根 `buildr`、npm bin、checkout install 和 tarball install 四条入口的 parity 断言，确保使用同一 CLI implementation。

## 7. 更新长期契约和删除旧目录

- [x] 7.1 重写 `docs/cli-architecture.md`，记录新的顶层职责、依赖方向、verifier 分类、package runtime 边界和新增模块归属规则。
- [x] 7.2 更新 package README、CLI reference、release/verification 文档、Skills 命令示例和 active/canonical OpenSpec 中仍具现行效力的旧路径引用。
- [x] 7.3 更新 architecture、managed mutation、managed data、open-source candidate 和 package parity 门禁，使其扫描新的完整源码闭包。
- [x] 7.4 删除 `tools/buildr`、`tools/cli`、`tools/runtime`、`tools/shared`、`tools/verification` 及顶层验证 wrappers，最终删除整个 `tools/`。
- [x] 7.5 对全部现行 Product files 执行旧路径零引用检查；迁移 change 自身和历史 archive 保留迁移前事实并由检查显式排除。
- [x] 7.6 检查 Git rename/删除结果、文件 executable mode、EOF、无重复 source 和无空壳兼容目录。

## 8. 验证、交付和后续功能衔接

- [x] 8.1 运行 unit、contract、fast integration 和架构专项验证，修复所有新路径 owner 与 import boundary 问题。
- [x] 8.2 运行 `test:changed` 并确认所有 `src/bin/test/scripts/package` changed paths 均有可解释 owner，未映射路径 fail closed。
- [x] 8.3 构建正式 tarball并在无 checkout 的临时 prefix 验证 help、init、sync、doctor、package check、runtime 和 optional Component 生命周期。
- [x] 8.4 运行完整 Product Candidate，报告候选 identity、全部 required steps、总耗时、最慢阶段、失败/跳过和 timing evidence。
- [x] 8.5 记录产品化任务看板的唯一位置和更新时机；看板只存在于冻结功能 worktree，架构分支不跨写，待功能恢复时将本迁移标记为已满足前置。
- [x] 8.6 形成 `migration-handoff.md`，明确迁移集成后更新 `productize-workspace-project-service`、移除旧根 Workspace metadata diff 和把未合入功能迁入新布局的顺序与边界。

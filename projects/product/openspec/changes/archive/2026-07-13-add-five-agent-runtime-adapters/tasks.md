## 1. 共享 Rules 与 checker 原语

- [x] 1.1 为 `vendor-rule-files` 注册静态 Rules implementation，完成 Cursor、Qoder 与 TRAE formatter、稳定 source identity、scope metadata、managed marker、长度/格式校验和直接 fixture tests。
- [x] 1.2 扩展 `reference-bridge` 支持 `per-source` 与 `root-index` placement，完成 TRAE Work 与 WorkBuddy 的 imperative bridge 模板、source index、target 长度限制和直接 fixture tests，同时保持 Claude Code parity。
- [x] 1.3 让 vendor files 与 root bridges 通过统一 `RuntimePlan` 输出 writes/removals/actions/findings，补齐非受管文件冲突零写入、symlink/path 防护、orphan cleanup 与幂等的受影响范围测试。
- [x] 1.4 实现静态无 shell environment probe 的有限时执行与 `manual` 状态，扩展 activation prerequisite、reload/new-session、UI toggle 和 adapter-specific diagnostic findings 的 checker tests。

## 2. 五个独立 adapter descriptors

- [x] 2.1 注册 `cursor` descriptor：`.cursor/rules` scoped vendor Rules、`.agents` Skills、IDE/CLI surfaces、path-read/session-start activation、保守 environment probes和独立五项 capability evidence/tests。
- [x] 2.2 注册 `qoder` descriptor：`.qoder/rules` vendor files、`.qoder` Skills、IDE surface、path-read/explicit-reload guidance、安全安装/版本 probe 和独立五项 capability evidence/tests。
- [x] 2.3 注册 `trae` descriptor：nested `.trae/rules` vendor files、`.agents` Skills、IDE surface、path-read/session-start guidance、安全安装/版本 probe 和独立五项 capability evidence/tests。
- [x] 2.4 注册 `trae-work` descriptor：root-index bridge、`.trae` Skills、desktop surface、Rules session-start、Skills immediate、Rules import toggle/manual probe 和独立五项 capability evidence/tests。
- [x] 2.5 注册 `workbuddy` descriptor：root `CODEBUDDY.md` bridge、`.codebuddy` Skills、desktop 与 desktop-bundled CLI surfaces、session-start activation、5.2.5 evidence/8000 字符约束、安全 probe 和独立五项 capability evidence/tests。
- [x] 2.6 运行 descriptor contract 与 adapter parity 受影响范围验证，确认五个 id 均独立、required capabilities 完整，且 `codex`/`claude-code` 输出和 runtime tree 保持兼容。

## 3. CLI、projection 与临时 workspace 验证

- [x] 3.1 更新 runtime list、人类可读摘要、render/sync/skill install/runtime check/doctor 的 adapter routing 与 JSON fixtures，证明所有命令使用同一 descriptor 和 plan/reconcile 管线。
- [x] 3.2 扩展临时 workspace runtime parity，分别验证 Cursor/Qoder/TRAE vendor targets、TRAE Work/WorkBuddy root bridges、Skills roots、install plans、冲突零写入、orphan cleanup 和重复同步幂等。
- [x] 3.3 增加 Root → Project → Service/deeper scope markers，自动验证 ancestor-before-descendant、source index、兄弟目录隔离和 combined render 的 Rules/Skills scope 分离。
- [x] 3.4 运行 CLI/runtime/onboarding 受影响范围验证并修复发现的问题；不得在每个 descriptor task 后重复产品总验证。

## 4. Agent 接入文档与 onboarding

- [x] 4.1 新增 `docs/agent-runtime-adapters.md`，包含 supported matrix 和每个 adapter 的 id、surface、Rules/Skills 接入路径、生成 targets、activation/reload、checker、前置条件、限制、证据等级与 smoke 状态，并与贡献调研指南互链。
- [x] 4.2 更新根 `README.md` 与 `README.en.md` 的当前支持摘要和文档导航，链接权威 adapter 文档并保留 `buildr runtime list --json` 作为机器事实入口，不复制完整机制表。
- [x] 4.3 更新 Buildr Skill、bootstrap guide、CLI Reference、current-state knowledge、known limitations、product/architecture 说明和 package 映射，使新增 adapters、无 fallback、reload/UI prerequisite 与实际支持状态一致。
- [x] 4.4 增加文档/registry 一致性检查，证明 README 链接有效、权威文档列出的 supported ids 与 `runtime list` 一致，且每个 adapter 都有接入方式和证据状态。

## 5. 分层证据与一次性真实产品 smoke

- [x] 5.1 为五个 adapters 生成只读 smoke workspace 与一次性验证 Prompt，固定 root/child/sibling Rules markers、project Skill marker和证据记录格式；Prompt 不要求 GUI 自动化、私有数据库抓取或重复 reload 测试。
- [x] 5.2 将 Cursor 记录为 `documented` / `pending`：官方 Rules/Skills 证据与自动 scope fixtures 已具备，本机未安装时不把 GUI smoke 作为当前 change 阻塞项。
- [x] 5.3 将 Qoder 记录为 `documented` / `pending`：官方资料、本机 1.13.3 intake、投射和 Skill root fixtures 已具备，不把未产出完整 JSON 的 GUI 会话算作通过。
- [x] 5.4 将 TRAE 记录为 `documented` / `pending`：本机 3.5.73 会话观察、安装包 discovery 配置和自动 fixtures 已具备，不重复操控 IDE 验证 reload。
- [x] 5.5 将 TRAE Work 记录为 `documented` / `pending`：官方资料、本机 intake 和自动 bridge fixtures 已具备，Rules import/reference traversal 继续由 checker warning 和可选一次性 smoke 跟踪。
- [x] 5.6 在 WorkBuddy 5.2.5 新任务中验证 `CODEBUDDY.md` first-match 注入、bridge 实际读取 root/current-scope `AGENTS.md`、排除 sibling marker、发现 `.codebuddy/skills` 与 session-start 行为，并写回源码/黑盒证据。
- [x] 5.7 对未执行 smoke 保持 `documented` / `pending`；对明确失败保持阻断 finding 并修正 capability 声明。不得将文件生成成功改写为 `verified`。

## 6. 候选验证与开发入口刷新

- [x] 6.1 完成实现、文档、生成资产和 review 修订后冻结候选，按 `docs/release-checklist.md` 运行一次 Buildr 产品完整验证，并读取 timing summary 汇报总耗时、最慢阶段、失败阶段和 summary 路径。
- [x] 6.2 从当前 task worktree 运行 `tools/install-buildr-cli` 刷新本机开发入口，检查 `command -v buildr`、`buildr --help` 和 `buildr doctor --agent codex --target <workspace-root> --json`；task 收尾清理 worktree 前必须从仍保留的 Product checkout 重新安装。
- [x] 6.3 检查本次变更对 Rules、Skills、Components、Commands、项目结构和 Agent runtime 入口的自举影响；不得从未合并 task checkout 向主自举 workspace 执行 sync，并把合入后所需的 `projects/product/buildr sync codex --target .` 与 doctor 动作交给收尾流程。

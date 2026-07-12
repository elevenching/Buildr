## 1. Package 目录迁移

- [x] 1.1 将 `package/workspace/` 移到 `package/targets/workspace/`，保持 workspace 和 Project target 源内容不变。
- [x] 1.2 将 `package/agent-skills/buildr/` 移到 `package/targets/runtime/skills/buildr/`，保持产品入口 Buildr Skill 的 runtime-only 语义。
- [x] 1.3 将 `package/bootstrap/bootstrap.contract.yml` 重命名为 `package/bootstrap/contract.yml`，并更新 contract 内的 artifact 路径。
- [x] 1.4 更新 `package/manifest.yml` 的 agentSkills、builtins、workspaceFiles 和 projectFiles 源路径，确认不再引用旧 package 路径。

## 2. CLI 与 package 契约

- [x] 2.1 更新 CLI 中 workspace target、runtime target 和 bootstrap contract 的路径解析，集中无法由 manifest 表达的固定控制文件路径。
- [x] 2.2 更新 package check 的 workspace baseline、Rule target、Agent Skill 和显式映射校验，使其只接受新的 canonical target 路径。
- [x] 2.3 让 package check 拒绝活动 manifest 或产品引用使用 `package/workspace/`、`package/agent-skills/` 和旧 bootstrap contract 路径。
- [x] 2.4 更新 package build 与 npm 打包路径，确保新 target 被包含、旧路径和兼容副本不进入产物。
- [x] 2.5 验证 init/update/sync 保留 workspace 自有 `AGENTS.md` 正文和非 manifest 管理资产，不引入反向同步。

## 3. 自动化验证

- [x] 3.1 更新产品 MVP 验证脚本中的 package 文件清单、路径断言和 bootstrap contract 断言。
- [x] 3.2 补充临时用户 workspace 测试，覆盖 init、update、Codex/Claude Code Skill install、sync、runtime check 和 doctor 的相关主路径。
- [x] 3.3 补充 npm dry-run 断言，确认 tarball 包含 `package/targets/` 和 `package/bootstrap/contract.yml`，且不包含旧 package 路径。
- [x] 3.4 扫描活动代码、specs、knowledge 和文档中的旧路径引用；归档文件作为历史记录不修改。

## 4. 规则与事实文档

- [x] 4.1 更新 Product AGENTS，明确 package 新路径、用户交付视角和候选版本自举验收顺序。
- [x] 4.2 更新 `package/README.md`，区分 README、manifest、bootstrap 和 targets 的职责。
- [x] 4.3 更新 current-state knowledge 与活动产品文档，记录三层所有权、单向物化和新的 canonical package 路径。
- [x] 4.4 检查 Buildr Skill、bootstrap guide 和 workspace Core，只在语义或路径确实变化的位置更新，避免重复操作手册。

## 5. 产品与自举验收

- [x] 5.1 运行 `buildr package check`、产品 MVP 总验证、`openspec validate --all --strict`、`npm pack --dry-run` 和 `git diff --check`。
- [x] 5.2 因 CLI 实现发生变化，从当前 Product checkout 安装本地 `buildr`，验证 `command -v buildr`、`buildr --help` 和当前 workspace doctor。
- [x] 5.3 使用当前候选 `projects/product/buildr sync codex --target .` 更新自举 workspace，检查 workspace/runtime 变化并确认 Codex doctor 通过。
- [x] 5.4 提交 Product Project 源变更；如自举 workspace 产生 tracked 更新结果则单独提交，自举验收通过前不得合并、推送。

## 1. Runtime Adapter Discovery

- [x] 1.1 在 CLI 中集中声明 supported Agent runtime 矩阵，包含 `claude-code` 和 `codex` 的 render 能力、实现模式、runtime 目标和 `recommendedCommands`。
- [x] 1.2 实现 `buildr runtime list [--json]`，文本输出面向人类，JSON 输出面向 Agent，且不要求当前目录已初始化为 Buildr workspace。
- [x] 1.3 在 `runtime list --json` 中输出 `requiredRenderCapabilities`：`rules-entry`、`product-buildr-skill`、`workspace-project-skills`、`skill-install-plans`、`runtime-check`。
- [x] 1.4 在 `runtime list --json` 中输出 unsupported Agent guidance，包含 `mustNotUseFallbackAdapter: true` 和“请联系 Buildr 作者反馈该 Agent”。

## 2. Doctor Agent Filter

- [x] 2.1 扩展 `buildr doctor` 参数解析，支持 `--agent <agent>`，校验 Agent id 只能包含字母、数字、点、下划线或短横线，并在 JSON 中回显 selected Agent runtime。
- [x] 2.2 当 `--agent codex` 时，只运行 Codex runtime diagnostics，并确保 Claude Code runtime findings 不进入 top-level findings 或 nextSteps。
- [x] 2.3 当 `--agent claude-code` 时，只运行 Claude Code runtime diagnostics，并确保 Codex runtime findings 不进入 top-level findings 或 nextSteps。
- [x] 2.4 确保 `--agent` 只过滤 adapter，不改变现有 scope 发现逻辑；runtime repair commands 必须带精确 scope。
- [x] 2.5 当 `--agent <unsupported>` 时，不运行具体 runtime checker，只输出 unsupported Agent warning、`mustNotUseFallbackAdapter: true` 和联系作者反馈文案，并让整体 summary 计入 warning、退出码保持 0。
- [x] 2.6 确保 unsupported Agent 场景不生成 `.buildr/skills/buildr/SKILL.md` 或其他 bootstrap 导出文件。
- [x] 2.7 保持未传 `--agent` 的兼容路径，避免现有脚本失效。

## 3. Runtime Command Semantics

- [x] 3.1 澄清 `buildr skill install <agent>` 只安装产品入口 Buildr Skill。
- [x] 3.2 澄清 `buildr skills render <agent> --scope ...` 只渲染 workspace/project Skills 和 Skill install plans。
- [x] 3.3 澄清 `buildr render <agent> --scope ...` 组合 rules entry render 和 workspace/project Skills render，但不安装产品入口 Buildr Skill。
- [x] 3.4 澄清 `buildr sync <agent>` 同步 Buildr 产品能力并准备当前 Agent 的 workspace 入口 runtime，不作为 Project scope 同步工具。
- [x] 3.5 梳理当前全部公开 CLI 命令和多级子命令，形成 help surface 清单。
- [x] 3.6 实现全局和所有公开命令/子命令 help 的有效输出和无副作用行为，至少覆盖 `init`、`project create`、`service create`、`doctor`、`runtime list`、`runtime check`、`sync`、`render`、`skill install`、`skills add/remove/render`、`commands add/remove/check`、`builtin list/uninstall/restore`、`update/check`、`package check/build` 和 `bootstrap guide`。

## 4. Guidance And Documentation

- [x] 4.1 更新 `package/agent-skills/buildr/SKILL.md`，把 `runtime list --json` 和 `doctor --agent <agent>` 写入主执行循环。
- [x] 4.2 更新 `package/bootstrap/guide.md`，补充支持矩阵发现、不支持 Agent 警示、不得猜测 fallback adapter 和联系作者反馈文案。
- [x] 4.3 更新 `README.md` 和 `package/workspace/README.md`，减少硬编码单一 Agent 的 onboarding 指令，并统一使用 render/渲染术语。
- [x] 4.4 更新 `package/bootstrap/bootstrap.contract.yml`，覆盖新增命令和不支持 Agent 引导文案。
- [x] 4.5 更新 `openspec/knowledge/buildr-current-state.md`，记录新的 runtime 发现、render 能力清单、doctor Agent filter 和 sync 语义。
- [x] 4.6 统一 Project registry / Service registry 术语，避免把同类 manifest 分别称为 registry 和 metadata。

## 5. Verification

- [x] 5.1 更新 `tools/verify-buildr-product-mvp`，覆盖 `runtime list --json`、`doctor --agent codex`、`doctor --agent claude-code`、unsupported Agent、非法 Agent id、大小写敏感 Agent id、不要求 workspace 的 runtime list 场景，以及全 CLI help surface 的有效输出和无副作用。
- [x] 5.2 运行 `./buildr package check`。
- [x] 5.3 运行 `tools/verify-buildr-product-mvp`。
- [x] 5.4 运行 `openspec validate select-agent-runtime-for-doctor --strict`。
- [x] 5.5 运行 `openspec validate --all --strict`。

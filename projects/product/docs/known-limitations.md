# Buildr 0.1 已知限制

- 当前支持 `claude-code`、`codex`、`cursor`、`qoder`、`trae`、`trae-work` 和 `workbuddy` runtime adapter；目标路径与证据状态见 [Agent Runtime Adapters](agent-runtime-adapters.md)。新增五个 adapter 的自动投射测试已覆盖；WorkBuddy 5.2.5 为 `verified` / `passed`，Cursor、Qoder、TRAE 与 TRAE Work 为 `documented` / `pending`。`pending` 不会触发 GUI 自动化，只表示尚未用一次性真实产品 marker smoke 提升证据等级。
- TRAE Work 依赖桌面 Rules import toggle，checker 会持续提示无法仅靠文件系统证明的前置条件。WorkBuddy 依赖 `CODEBUDDY.md` 中的 imperative reference bridge，其通过状态仅适用于已记录的 WorkBuddy 5.2.5 / bundled CLI 2.106.4 证据版本。
- runtime trait catalog 只降低新增 adapter 的重复实现；它不会把尚未独立验证五项 capabilities 的 Agent 自动视为 supported。
- CLI 支持 Node.js 20 及以上版本。CI 在 Linux 上对 Node 20/22 执行完整验证，并在 Linux、macOS、Windows 的 Node 22 上验证打包安装生命周期；其他 Node/操作系统组合不属于 0.1 的持续验证范围。
- Component 只支持 workspace scope；没有 Project/Service Component、远程 registry、依赖求解或可执行 Hook。
- Buildr 使用本地文件系统和 Git 保存资产，没有云端权限系统、Web UI 或跨机器自动恢复服务。
- Commands 只声明和诊断外部 CLI，不执行本机安装、升级或登录。
- 远端 Skill 当前只支持 raw `SKILL.md` 的 `resolved.kind: skill-url`；未声明 integrity 时允许 render，但 doctor 会警告。
- Service branch intent 不负责 pull、merge、rebase 或长期分支同步；它只控制首次 clone、metadata 和 drift 诊断。
- `@buildr-ai/buildr@0.1.0-rc.2` 通过 GitHub trusted publisher 发布，`next` 指向该 RC；`latest` 仍可能指向历史 prerelease，它不代表稳定版。稳定版 `0.1.0` 尚未发布，公开试用应显式安装 `@next`。
- `package check/build` 与 `openspec baseline/check` 是维护/workflow 表面，不建议普通 workspace 直接依赖。

遇到 unsupported runtime 或不能确定的资产边界时，Agent 应停止自动变更、保留源资产，并报告可执行下一步。

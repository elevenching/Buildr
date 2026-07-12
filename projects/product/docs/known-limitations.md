# Buildr 0.1 已知限制

- 当前只支持 `claude-code` 和 `codex` runtime adapter。
- CLI 支持 Node.js 20 及以上版本。CI 在 Linux 上对 Node 20/22 执行完整验证，并在 Linux、macOS、Windows 的 Node 22 上验证打包安装生命周期；其他 Node/操作系统组合不属于 0.1 的持续验证范围。
- Component 只支持 workspace scope；没有 Project/Service Component、远程 registry、依赖求解或可执行 Hook。
- Buildr 使用本地文件系统和 Git 保存资产，没有云端权限系统、Web UI 或跨机器自动恢复服务。
- Commands 只声明和诊断外部 CLI，不执行本机安装、升级或登录。
- 远端 Skill 当前只支持 raw `SKILL.md` 的 `resolved.kind: skill-url`；未声明 integrity 时允许 render，但 doctor 会警告。
- Service branch intent 不负责 pull、merge、rebase 或长期分支同步；它只控制首次 clone、metadata 和 drift 诊断。
- 官方 npm package identity 已确定为 `@buildr-ai/buildr`；在 `0.1.0-rc.1` 实际发布和 GitHub trusted publisher 配置完成前，registry 安装命令仍属于发布准备表面，开发 checkout 和本地 tarball 路径继续作为当前可验证入口。
- `package check/build` 与 `openspec baseline/check` 是维护/workflow 表面，不建议普通 workspace 直接依赖。

遇到 unsupported runtime 或不能确定的资产边界时，Agent 应停止自动变更、保留源资产，并报告可执行下一步。

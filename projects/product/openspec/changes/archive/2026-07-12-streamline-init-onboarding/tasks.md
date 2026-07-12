## 1. CLI 高层初始化

- [x] 1.1 为 `buildr init` 增加可选 `--agent` 参数，在任何写入前校验 adapter，并保持不带参数的纯源资产初始化行为。
- [x] 1.2 让 `init --agent` 在源资产初始化后复用完整 `syncRuntime` 管线，并为后续 sync/doctor 失败输出可恢复的阶段说明。
- [x] 1.3 更新根帮助、`init --help` 和初始化结果，清晰区分首次 onboarding、纯 init 与日常 sync。

## 2. 行为验证

- [x] 2.1 增加直接 CLI 回归，覆盖 supported/unsupported Agent、零写入预检、纯 init 兼容、单命令 runtime/Skill/doctor 结果和幂等重试。
- [x] 2.2 将 repository onboarding smoke test 改为只用 `init --agent` 完成首次闭环，并独立读取 doctor JSON 验证结果。
- [x] 2.3 更新 npm package E2E 与 CLI compatibility/parity 检查，证明安装后命令和 checkout 行为一致。
- [x] 2.4 完成 CLI/runtime/onboarding 受影响范围验证。

## 3. 产品说明与自然语言代码

- [x] 3.1 更新 README、CLI reference、bootstrap guide、Buildr Skill 和 package contract，将 canonical 首次路径收敛为 `runtime list -> init --agent`。
- [x] 3.2 更新 current-state knowledge、release checklist 与 package 说明，保留纯 init、日常 sync 和独立 skill install 的兼容/修复边界。
- [x] 3.3 审阅所有非 archive canonical onboarding 文本，移除仍要求首次连续执行 `init + sync + doctor` 的冲突表述。

## 4. 候选验证与开发入口

- [x] 4.1 冻结最终候选后运行一次 Buildr 产品完整验证，并修复所有相关失败。
- [x] 4.2 从候选 Product checkout 刷新本机 `buildr` 开发入口，验证 `command -v`、help 与隔离 workspace Codex doctor。
- [x] 4.3 执行 Buildr 自举影响检查，确认需要更新的 Rules、Skills、Components、Commands 或 runtime 入口已按“候选隔离、集成后同步主 workspace”的边界处理。

## Why

Buildr 当前把本地作者型和 package Skill 的源目录登记为完整资产，却在 runtime render 时只投射 `SKILL.md`。这会让 `assets/`、`scripts/`、`references/`、`templates/`、`examples/` 和 `agents/` 等随附资源在 Agent runtime 中缺失，造成源资产声明、runtime check 与真实可用能力不一致；`task-cockpit` 已实际暴露这一缺口。

## What Changes

- 将本地作者型和 package Skill 的受支持源目录完整投射到各 Agent runtime Skill 目录，而不是只写入 `SKILL.md`。
- `SKILL.md` 继续执行 Buildr managed marker、contribution 和 capability binding 组合；其他随附文件按字节确定性复制，并保留脚本可执行权限。
- 扩展 runtime plan 与 reconcile，使文本和二进制 Skill 文件共享 preflight、冲突检查、apply、check 和幂等语义。
- 为 runtime Skill 投射维护可验证的受管文件清单与完整性，使源文件删除、Skill 卸载和 orphan 清理能够删除 Buildr 上次投射的文件，同时保留并报告用户新增或修改的非受管内容。
- 拒绝源 Skill 包中的符号链接、路径逃逸和不受支持顶层内容，不跟随链接读取或写入 workspace 外部。
- 保持 `resolved.kind: skill-url` 的既有含义：它仍只表示单个 raw `SKILL.md`，不在本 change 中猜测远端完整 Skill 包协议。
- 补齐所有 supported adapters 的完整目录投射、冲突、清理、doctor/check 和幂等验证。
- 本 change 不包含破坏性 CLI 参数变更；现有只含 `SKILL.md` 的 Skill 保持兼容。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `managed-skill-assets`: 本地作者型和 package Skill 渲染后必须在 runtime 中包含受支持的完整 Skill 包内容，并保持远端单文件来源边界。
- `workspace-first-runtime-projection`: runtime 统一计划与 reconcile 必须支持完整 Skill 文件清单、二进制内容、权限、受管清理和跨 adapter 一致性。

## Impact

- Runtime Skills source assembly、render plan、adapter plan validation、reconcile 与 orphan cleanup。
- `buildr skills render`、`buildr render`、`buildr sync`、runtime check、doctor 和 Component 生命周期共享的 Skills 投射路径。
- Runtime 受管所有权/完整性回执及其事务影响范围。
- Unit、adapter contract、CLI integration、临时 workspace 和 package candidate 验证。
- Buildr Skill 使用说明、current-state knowledge 和相关 canonical specs。

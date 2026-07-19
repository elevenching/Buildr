## Context

Buildr 已把本地作者型 Skill 定义为至少包含 `SKILL.md`、并可带 `scripts/`、`templates/`、`assets/`、`examples/`、`references/` 和 `agents/` 的完整源目录。当前 `resolveSkills` 只把 `sourceFile` 传给 render plan，`buildSkillRenderPlan` 也只生成一个 `SKILL.md` target；通用 runtime plan 进一步限定 write content 必须是文本。因此源资产能够装载完整 Skill，runtime 却只能得到入口文件。

现有 orphan cleanup 以 runtime Skill 目录中的 managed `SKILL.md` 判断 Buildr 所有权，并且只有目录内恰好一个 `SKILL.md` 时才允许删除。完整目录投射后，如果没有独立文件清单，Buildr 无法区分自己上次复制的资源与用户后来加入的文件，也无法在源目录删除单个资源时安全清理 runtime stale 文件。

本 change 影响所有 supported adapters 共用的 filesystem Skills primitive，以及 render、sync、runtime check、doctor 和 Component lifecycle 的统一计划与 reconcile 管线。

## Goals / Non-Goals

**Goals:**

- 本地作者型和 package Skill 在 runtime 中获得完整、可用、确定性的受支持目录内容。
- 继续只对 `SKILL.md` 执行 Buildr 内容组合，其他文件保持原始字节并保留可执行位。
- 让统一 runtime plan 能表达文本和二进制文件、权限及内容 identity。
- 在写入前发现全部冲突，并通过可验证回执安全更新或清理 Buildr 投射文件。
- 保持 scoped render、多个 Project、同内容去重、不同内容冲突和所有 adapter 的既有语义。

**Non-Goals:**

- 不新增远端 Skill bundle 下载、解压或供应链协议；`skill-url` 仍是单个 raw `SKILL.md`。
- 不投射 source manifest、capability contract 或 Skill 目录之外的 workspace 资产。
- 不跟随或复制符号链接，不支持任意未知顶层目录。
- 不迁移或修改用户手工维护的非 Buildr-managed runtime Skill。
- 不改变 Agent runtime 的 Skill discovery root 或 activation 语义。

## Decisions

### 1. Source resolution 同时返回入口文件和完整源目录

本地 `path` Skill 与 `package:<source-id>` Skill 增加 `sourceDir`；render plan 从该目录递归枚举普通文件。顶层允许集合与 Skill 源资产装载契约保持一致：`SKILL.md`、`agents/`、`assets/`、`scripts/`、`templates/`、`examples/`、`references/`。目录中的嵌套普通文件全部参与，空目录没有 runtime 语义，不单独投射。

选择显式允许集合而不是“复制目录中任何内容”，是为了让 add、doctor 和 render 对 Skill 包边界一致，并避免把缓存、密钥、`.git` 或构建产物意外复制进 runtime。枚举遇到符号链接、socket、device 或其他非普通文件时在 plan 阶段失败。

`resolved.kind: skill-url` 没有可验证的目录来源，只生成 `SKILL.md`；Agent-install plan 保持原状。

### 2. `SKILL.md` 派生，随附文件按字节复制

`SKILL.md` 继续经过 managed marker、contribution、adapter context 和 capability binding 组合。其他文件不做文本解析或 marker 注入，以免破坏模板、脚本和二进制资源。

Runtime write item 保持 JSON 可表达：

```text
{
  targetFile,
  content,
  contentEncoding: "utf8" | "base64",
  mode,
  source,
  sourceContent
}
```

`SKILL.md` 和 Buildr 生成的回执使用 `utf8`；随附文件统一以 `base64` 表达原始字节。reconcile 通过统一的 expected-bytes helper 比较和写入，`mode` 只保留 owner executable bits，避免把 source 环境的无关 group/other 权限投射到不同机器。

选择 base64 而不是在 plan 中保存 `Buffer`，是因为 runtime plan 当前会递归冻结且需要保持可诊断、可序列化的结构；直接使用 `Buffer` 会破坏该边界。

### 3. 每个 runtime Skill 使用独立投射回执

回执位于对应 adapter runtime root：

```text
<runtime-root>/buildr/skill-projection-receipts/<adapter-id>/<runtime-path>.json
```

每个回执使用 `buildr.runtime-skill-projection/v1`，记录 adapter、runtime path、声明 scope/source identity，以及上次投射的相对文件路径、SHA-256 和 executable 状态。一个 adapter 下的一个 Skill 使用一个回执；即使 Codex、Cursor 和 TRAE 等 adapter 共享 `.agents` root，也不会互相覆盖生命周期证据。Project scoped render 只更新当前可见 Skill，无需重写或猜测 sibling Project 的全局清单。

回执在同一个 runtime plan 中生成和检查，不作为 Buildr 源资产，也不放进 Agent 消费的 Skill 目录。runtime check 和 doctor 从相同 plan 比较回执与文件。

选择 adapter root 下的独立回执，而不是仅依赖 managed `SKILL.md`，是为了安全识别随附文件；也避免向 Skill 包内部加入 Agent 可能读取的 Buildr 私有 sidecar。

### 4. 旧回执驱动 active stale 与 orphan cleanup

对仍然 active 的 Skill，plan 比较旧回执和新 inventory：

- 新增或变化文件进入 writes。
- 旧回执中存在、但新源目录已删除的文件进入 removals。
- 只有 runtime 当前字节和 executable 状态仍匹配旧回执时才允许删除或覆盖；用户修改过的文件报告 conflict，且在任何写入前停止。
- runtime Skill 目录中的额外未知文件不属于回执，保留并报告，而不是静默删除。

对已失去 manifest 来源的 Skill，orphan discovery 优先读取对应回执；只有所有登记文件仍匹配且没有未知文件时，才删除 Skill 目录和回执。旧版本仅有 managed `SKILL.md`、没有回执的 orphan 保持现有兼容清理规则。

### 5. 所有冲突在统一 reconcile preflight 完成

Plan validation 校验 encoding、base64、mode、重复 target、write/removal 重叠和目标路径安全。reconcile 在 apply 前读取所有 write/removal 的当前字节与权限，聚合非受管覆盖、已修改受管文件、符号链接穿越和 receipt mismatch；存在任何 conflict 时零写入失败。

写入时先创建父目录、按字节写文件，再设置受约束权限。删除按文件执行，最后清理已空目录；不会递归删除包含未知内容的目录。

### 6. 兼容与 rollout

- 只含 `SKILL.md` 的 Skill 生成与现状相同的 runtime 入口，额外产生投射回执。
- 已存在 managed runtime Skill 首次用新版 render 时，如果 `SKILL.md` 可证明由 Buildr 管理，则采用当前 source 生成初始回执；随附 target 已存在且内容不一致时按冲突处理，不静默接管。
- `buildr skills render`、完整 `render`、`sync`、doctor 和 Component reconcile 全部复用同一 source assembly 和 runtime plan，不提供旁路复制命令。
- Product 自举 workspace 只在候选实现验证完成并集成后按既有流程同步，不从 task worktree 更新主 workspace。

## Risks / Trade-offs

- [风险] 完整目录增加 runtime plan 大小，base64 对二进制内容有额外内存成本。→ Skill 包本来是面向 Agent 的小型工作资产；先保持简单确定性实现，并通过测试覆盖合理体积，不在本 change 引入流式 executor。
- [风险] 回执丢失后无法证明随附文件所有权。→ 降级为保守冲突，不删除非 `SKILL.md` 文件；重新 render 时只在内容与 source 完全一致时建立回执。
- [风险] executable 权限在不同平台表现不同。→ 只规范 POSIX owner executable bit；不承诺 Windows ACL 等价，内容 identity 仍可验证。
- [风险] 旧 runtime Skill 中用户已经手工放入与新 source 同路径的文件。→ 内容一致时可安全采用，内容不一致时零写入报告冲突。
- [风险] receipt 自身成为 orphan。→ orphan discovery 同时扫描 Skill 目录与 receipt tree，只有在对应 Skill 清理成功后删除回执。

## Migration Plan

1. 扩展 source resolution 和 runtime plan schema实现，但保持旧文本 write item 有效。
2. 增加完整目录 inventory、回执生成与 active stale cleanup。
3. 迁移 orphan discovery 使用回执，并保留旧 managed-only 兼容路径。
4. 通过 unit、adapter contract、CLI integration 和临时 workspace E2E 验证后发布。
5. 用户下一次执行 `buildr skills render`、`buildr render` 或 `buildr sync` 时自动生成回执并补齐随附文件，无需手工迁移。

回滚到旧 CLI 时，已投射的随附文件会被旧 orphan cleanup 视为额外内容并保守拒绝删除，但不会丢失用户数据；重新升级后可由回执继续管理。

## Open Questions

无阻塞问题。远端完整 Skill bundle 的 source kind、下载完整性和解包安全留给独立 change。

---
name: openspec-contract-guard
description: 创建、修改、同步或归档 OpenSpec change，且需要建立契约基线、检查 active change 冲突、陈旧 delta 或同步结果时使用。此 Skill 是 Buildr 的 OpenSpec sidebar，不修改外部 openspec-* Skills。
metadata:
  author: buildr
  version: "1.0"
  supportedOpenSpec: "1.4.1"
---

# OpenSpec Contract Guard

本 Skill 是 Buildr 自有的 OpenSpec 契约门禁。它通过 `buildr openspec` 检查 change 与 canonical specs 的关系，不修改外部 `openspec-*` Skills，也不修改或替换外部 OpenSpec CLI，更不安装外部 CLI。

## 适用边界

- Change 的 proposal、design、specs、tasks 已经 complete，准备进入 apply 时，建立或更新 baseline。
- 即将同步 delta specs、归档 change 或执行 `task-finish` 时，执行 pre-sync 和 post-sync 门禁。
- 用户要求排查并行 change、陈旧 delta、spec 回退或同步后契约丢失时，读取 JSON diagnostics 并报告可执行下一步。

先从 workspace root、Project registry 和 OpenSpec status 确认 `<workspace>`、`<project>` 与 `<change>`；不得根据当前目录猜测 Project。

## 1. 建立基线

在 change artifacts 达到 apply-ready、且 delta specs 已完成后运行：

```bash
buildr openspec baseline create <change> --project <project> --target <workspace> --json
buildr openspec check <change> --stage proposal --project <project> --target <workspace> --json
```

基线位于 change 的 `.buildr/contract-baseline.json`，记录 touched Requirement 的 canonical facts。普通 check 不会自动创建或刷新基线。

历史 active change 缺少基线时，先向用户报告无法证明原始事实；只有用户确认“以当前 canonical specs 作为采用基线”后，才能运行：

```bash
buildr openspec baseline create <change> --project <project> --target <workspace> --adopt-current --json
```

delta 在基线后新增或改变 touched Requirement 时，先审阅新范围，再显式运行 `--update`。不得把 stale、incomplete 或 adopted warning 描述为已通过门禁。

## 2. 同步前后门禁

在任何 canonical spec sync 前：

```bash
buildr openspec check <change> --stage pre-sync --project <project> --target <workspace> --json
```

只有 `ok: true` 才能调用外部 OpenSpec sync。pre-sync 会检查 proposal/delta 对齐、baseline 完整性、active change 同 Requirement 冲突、当前 canonical Requirement 是否仍匹配基线，并写入本次同步 receipt。

完成外部 sync 后、archive 前：

```bash
buildr openspec check <change> --stage post-sync --project <project> --target <workspace> --json
```

post-sync 会验证 ADDED、MODIFIED、REMOVED、RENAMED 的结果，并确认 receipt 中未触达的 Requirement 没有被删改。失败时停止 archive、commit、push 和 cleanup；不要手工删除 sidecar 或重新运行 pre-sync 来掩盖已经发生的同步结果。

## 3. 失败处理

- `active_conflict`：列出冲突 change 和 Requirement；合并语义、先完成其中一个 change，或重新建立后续 change 基线。
- `baseline_stale`：当前 canonical facts 已变化；不要继续 sync，先审阅前序 change 并更新/重建当前 change。
- `baseline_missing` 或 `baseline_incomplete`：补齐显式基线；历史 change 必须得到采用确认。
- `post_sync_*`：停止归档与 Git 动作，保留 worktree，报告实际/预期摘要；需要语义选择时请用户决定。
- upstream 或 CLI version 不一致：按 Component 的 Command declaration 升级或恢复用户本机 OpenSpec CLI；Buildr 不代为安装。

用户可见状态必须包含 change、stage、baselineState、conflicts/findings 和 `nextActions`。外部 `openspec-*` Skills 继续承担 explore、propose、apply、sync 与 archive 的原有职责。

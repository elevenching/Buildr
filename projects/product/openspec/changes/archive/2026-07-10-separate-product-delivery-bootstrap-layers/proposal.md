## Why

Buildr 当前把 workspace 交付源、产品入口 Buildr Skill 和 bootstrap 恢复入口并列放在 `package/` 下，但目录名称没有表达它们分别投射到用户 workspace、Agent runtime 或 CLI 恢复通道，容易把产品分发源与当前自举 workspace 的安装结果混为一体。现在需要固化产品源、用户交付资产和自举 workspace 三层所有权，并让候选版本先经过真实自举验收再合并、推送。

## What Changes

- **BREAKING** 将 workspace 交付源从 `package/workspace/` 移到 `package/targets/workspace/`，将产品入口 Buildr Skill 从 `package/agent-skills/` 移到 `package/targets/runtime/skills/`；旧 package 内部源路径不再保留。
- 保留 `package/bootstrap/` 作为 Buildr Skill 不可用时由 CLI 暴露的恢复入口，并将机器契约统一为 `package/bootstrap/contract.yml`；`package/README.md` 继续作为 package 维护说明，`package/manifest.yml` 继续作为唯一机器映射契约。
- 更新 package manifest、CLI 路径解析、package check、npm 包内容和端到端验证，使 workspace/runtime 目标都从 `package/targets/` 的明确 source target 读取。
- 明确产品交付源到用户 workspace/runtime 的单向流动：产品开发不得直接同步编辑自举 workspace 中由 Buildr 管理的安装结果，只能使用当前 Product checkout 的 `update` / `sync` 物化。
- 固化候选版本验收顺序：先只修改并验证 Product Project，再使用当前候选 Buildr 更新和诊断自举 workspace，通过后才可合并、推送。
- 更新 Product AGENTS、package README、current-state knowledge 和相关产品文档中的路径与三层职责说明。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `buildr-package-assets`: 将随包资产明确分为 workspace target、runtime target 和 bootstrap 恢复入口，并调整 canonical package 源路径及校验契约。
- `buildr-product-capability-sync`: 要求 update/sync 从当前产品 package target 单向物化用户 workspace 与 Agent runtime，不把安装结果作为产品源维护。
- `buildr-development-openspec`: 增加产品源、自举 workspace 和用户交付资产的开发所有权边界，以及合并推送前的候选版本自举验收顺序。

## Impact

- 影响 `package/` 目录结构、`package/manifest.yml`、bootstrap contract、CLI package 路径解析和验证脚本。
- 影响 npm tarball 内部资产路径，但不改变公开 CLI 命令、用户 workspace 目标路径或 Agent runtime 目标路径。
- 影响 Product AGENTS、package README、current-state knowledge、产品文档和对应 OpenSpec 主 specs。
- 实施完成后需要用当前候选 Buildr 对临时用户 workspace 和当前自举 workspace 分别执行 package、sync、runtime 和 doctor 验证。

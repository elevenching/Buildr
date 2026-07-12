## Why

当前 `sync` 只比较 package 新版本与 workspace live 内容，因而会把“workspace 仍是 Buildr 上一版官方资产”误判为“用户修改”，导致每次产品升级都要求用户确认。Buildr 需要保存上次安装事实并执行 Old/Live/New 三方比较，才能在保护真实用户修改的同时自动交付官方更新。

## What Changes

- 为独立内置 Rules、Skills 和 Commands 建立 Buildr 管理的安装回执，记录精确资产清单与内容完整性。
- `sync` 使用上次安装回执、workspace live 状态和当前 package 进行三方比较：未被用户修改的旧官方资产自动升级，真实修改继续安全停止。
- 为没有安装回执的旧 workspace 提供保守迁移：当前内容匹配新版或 package 声明的已知旧版完整性时自动采用，否则 fail closed。
- 将内置资产文件、manifest 状态和安装回执纳入同一 source transaction，并补充 package check、doctor 与产品验证。
- 不引入独立的 workspace assets 发布物或版本；回执只记录当前随 CLI package 交付资产的安装事实，独立发布继续保留在 Roadmap。

## Capabilities

### New Capabilities

- `builtin-installation-receipts`: 定义独立内置能力安装回执、精确完整性、三方判定和 legacy adoption 契约。

### Modified Capabilities

- `buildr-product-capability-sync`: 将 optional 内置能力的修改判定改为回执支持的 Old/Live/New 比较，并要求官方升级自动收敛。
- `buildr-package-assets`: 要求 package 携带并校验 legacy 官方完整性集合，支持无回执 workspace 的安全迁移。
- `managed-data-integrity`: 要求内置资产、registries 与安装回执在同一 source transaction 中原子提交或回滚。

## Impact

- 影响 `sync`、`builtin list/uninstall/restore`、workspace 初始化与 doctor 的内置能力状态处理。
- 新增 Buildr 管理的 workspace 回执文件，并扩展 package 内置资产元数据与校验。
- 需要覆盖 Rule、Skill、Command、额外/缺失文件、用户修改、legacy migration、事务回滚和自举 workspace 升级测试。

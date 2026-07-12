## Why

Buildr 的运行时同步由多条命令分别处理，删除资产后可能留下旧文件或安装计划，冲突也可能在部分文件已经写入后才被发现。需要统一这些行为，让相同源状态稳定得到相同结果。

## What Changes

- 统一 `render`、`skills render`、`sync` 和 Component 生命周期使用的运行时同步逻辑。
- 写入前检查全部目标；发现冲突时不写入任何运行时文件。
- 删除已经没有来源的 Buildr 受管运行时文件和安装计划，同时保留用户文件。
- 重复执行同步时，第二次不再产生变化。
- `sync` 修改源资产时使用现有的安全事务流程，并在结束时确认运行时已经同步完成。
- 单 Project render 只处理当前 Project；workspace 全量 render 才检查跨 Project 冲突。相同 Skill 可共用一份，不同内容写入同一路径时才报错。
- 在 Buildr Core 中增加简明表达要求：优先使用常用、直接的语言，避免不必要的术语。

本变更不包含破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `workspace-first-runtime-projection`: 统一运行时同步、清理、冲突检查、重复执行和 scope 行为，并增加 Core 的简明表达要求。
- `managed-data-integrity`: 明确 `sync` 的源资产修改必须进入现有事务边界，运行时同步仍在源提交后执行。

## Impact

- 影响 `projects/product/tools/buildr` 中的 render、sync、Skill 和 Component 运行时处理。
- 影响 runtime check、doctor 和相关产品验证。
- 影响 `projects/product/package/targets/workspace/rules/buildr/core.md`。
- 需要更新相关 OpenSpec specs、测试和产品文档。

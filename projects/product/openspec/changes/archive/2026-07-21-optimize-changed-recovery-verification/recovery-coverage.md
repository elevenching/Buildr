# Builtin recovery 覆盖映射

优化前的 recovery suite 对外提供 20 项语义证据。优化后，纯 replacement 状态分类由 `test/unit/builtin-replacement.test.mjs` 持有；只有必须经过真实 CLI、Workspace transaction、runtime 或 doctor 的生命周期证据留在 Candidate E2E。

| # | 原语义 | 优化后 owner |
| ---: | --- | --- |
| 1 | source 与 runtime 原子替换 | E2E：成功迁移黄金路径 |
| 2 | 历史 task-cockpits HTML 不迁移、不改写 | E2E：成功、restore 与阻断路径 |
| 3 | 重复 sync 幂等 | E2E：成功迁移黄金路径 |
| 4 | 新 init 只产生 task-board identity | E2E：init 黄金路径 |
| 5 | 用户修改 legacy source 时 sync 零写入 | E2E：代表性 source 阻断 |
| 6 | 显式 restore 接受未知但受管内容 | Unit：restore override；E2E：真实 restore |
| 7 | 重复 restore 可收敛 | E2E：真实 restore |
| 8 | manifest target mismatch | Unit：状态分类与零回调 |
| 9 | foreign manifest source | Unit：状态分类；E2E：真实 CLI 零写入与无假成功 |
| 10 | replacement source target occupied | Unit：live snapshot 分类与零回调 |
| 11 | predecessor source missing | Unit：missing 分类与 restore blocked outcome |
| 12 | restore mutation 失败完整回滚 | E2E：restore transaction rollback |
| 13 | sync 时 legacy source missing | Unit：missing 分类与零回调 |
| 14 | sync 时 current 与 predecessor 同时存在 | Unit：identity conflict 分类与零回调 |
| 15 | legacy source 出现未知文件 | Unit：unknown integrity；E2E：用户修改 source 代表路径 |
| 16 | legacy runtime 被修改 | E2E：runtime preflight 零写入 |
| 17 | replacement runtime target occupied | E2E：runtime preflight 零写入 |
| 18 | sync mutation 失败完整回滚 | E2E：sync transaction rollback |
| 19 | 最终 doctor 失败不假报成功，修复后收敛 | E2E：doctor 黄金路径 |
| 20 | uninstalled predecessor 保持卸载 | Unit：uninstalled 分类与 metadata mutation；E2E：真实 manifest 收敛 |

fixture 只共享两个只读基础：source-only 基础只执行 `init`，with-runtime 基础执行 `init + sync`。每个 mutation 测试都把对应基础复制到唯一临时 Workspace，测试结束只清理自己的副本。

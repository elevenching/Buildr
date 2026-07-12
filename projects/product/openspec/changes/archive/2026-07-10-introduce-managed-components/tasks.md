## 1. Component Schema 与完整性模型

- [x] 1.1 定义并实现 `buildr.components/v1` registry parser、renderer 和字段校验
- [x] 1.2 定义并实现 `buildr.component/v1` definition parser、renderer，以及 Rule、Skill、Command collection 成员校验
- [x] 1.3 实现文件和目录的确定性 integrity 计算，目录按安全递归和稳定顺序生成摘要
- [x] 1.4 实现 workspace Component inventory、definition 解析、成员唯一所有权索引和 Project/Service scope 拒绝
- [x] 1.5 为非法路径、重复 id、未知 kind、缺失成员、integrity 不一致和 ownership conflict 增加结构化错误

## 2. Commands Collections

- [x] 2.1 将 Commands manifest 读取扩展为安全递归发现 `commands/**/manifest.yml`，保留根 manifest 为默认 collection
- [x] 2.2 实现多 collection 聚合、来源跟踪、相同声明合并和冲突声明报错
- [x] 2.3 为 `commands add/remove` 增加安全的 `--collection` 定位和回执，同时保持未传参数时操作根 collection
- [x] 2.4 在 Commands mutation 前查询 Component ownership，拒绝修改 Component-owned collection
- [x] 2.5 更新 `commands check --json` 和文本输出，使其展示 collection 来源、冲突和现有本机差异

## 3. Package 与 Workspace Baseline

- [x] 3.1 扩展 `package/manifest.yml` 解析和校验，支持随包 Components、默认启用状态和 definition 源路径
- [x] 3.2 在 `package/targets/workspace/components/` 增加 Component registry baseline 和 OpenSpec installed definition 源
- [x] 3.3 在 `package/targets/workspace/commands/buildr/openspec/manifest.yml` 声明 OpenSpec CLI、版本检查和 installHint
- [x] 3.4 将全部 OpenSpec workflow Skills 登记为 OpenSpec Component 成员并生成可验证 integrity
- [x] 3.5 移除 OpenSpec Component 成员在 workspace baseline 映射中的重复安装声明，保留独立 Builtins 不变
- [x] 3.6 更新 `buildr init`，创建 `components/`、`components/manifest.yml` 并通过 Component 生命周期安装默认组件
- [x] 3.7 扩展 package check，校验 Component schema、成员边界、integrity、OpenSpec `generatedBy` 版本和 ownership 冲突

## 4. Component 生命周期 CLI

- [x] 4.1 实现 `buildr component list/check` 的文本和 Agent-readable JSON 状态输出
- [x] 4.2 实现 Component 级安装预检和无冲突成员物化，确保 definition 最后写入
- [x] 4.3 实现 Old/Live/New 三方比较，覆盖安全升级、回执收敛、新增成员和删除成员
- [x] 4.4 实现 modified、missing 和移除成员已修改时的集合级阻塞，确保预检失败零写入
- [x] 4.5 实现 `buildr component install <id> --agent <agent>` 的 registry 状态更新和源资产闭环
- [x] 4.6 实现 `buildr component uninstall <id> --agent <agent> [--reason]`，保留卸载 tombstone 并安全删除受管成员
- [x] 4.7 拒绝卸载 required Component，并拒绝通过 builtin、rules、skills 或 commands 单独操作 Component 成员
- [x] 4.8 更新全 CLI help、参数校验和无副作用 help 测试，明确当前只支持 workspace Component

## 5. Update、Sync、Runtime 与 Doctor

- [x] 5.1 将启用和卸载的 Buildr-managed Components 接入 `buildr update` 与 `update check`
- [x] 5.2 将 Component 冲突和成员待决状态接入 `buildr sync <agent>` 的 render 前停止条件
- [x] 5.3 让 Component install/uninstall 通过指定 adapter reconcile Rules 和 Skills runtime，并运行最终 doctor
- [x] 5.4 处理 runtime reconcile 失败：保留已提交源资产、返回失败并输出可执行修复动作
- [x] 5.5 扩展 doctor 聚合 Component registry、definition、integrity、ownership、成员和 runtime 状态
- [x] 5.6 扩展 doctor 聚合全部 Commands collections，并将 collection 语法或声明冲突报告为 error

## 6. OpenSpec Builtins 迁移

- [x] 6.1 实现旧 workspace OpenSpec Skills 与当前 package 一致时的原位 Component 采用
- [x] 6.2 实现旧 OpenSpec Skill 为 modified、missing、uninstalled 或来源冲突时的迁移阻塞和集合级决策输出
- [x] 6.3 迁移后让 `builtin list` 标识 OpenSpec Component 归属，并让单项 uninstall/restore 指向 Component 命令
- [x] 6.4 验证 OpenSpec Component 安装、更新和卸载不修改本机 OpenSpec CLI，也不创建、修改或删除 Project `openspec/` 内容

## 7. Agent 指引与产品事实

- [x] 7.1 更新产品内置 Buildr Skill，加入显式 Component、显式单项资产、模糊“安装 X”和对象级“卸载 X”的识别路由
- [x] 7.2 实现 Component 卸载范围摘要和二次确认指引，覆盖成员、workspace scope、runtime 影响以及保留的本机 CLI 和 Project 内容
- [x] 7.3 更新 bootstrap contract、guide 和相关内置 Skills，说明 Agent 负责资源调查、CLI 不猜测 Component 边界
- [x] 7.4 更新 Buildr Core、README、产品说明和 current state，登记 Components 与 Commands collections 的事实边界
- [x] 7.5 更新发布检查清单和文档索引，明确本 change 不包含 Project/Service Component、远程 registry、Hook 或 OpenSpec 门禁

## 8. 验证与自举收尾

- [x] 8.1 扩展 package check 单测路径，覆盖 Component schema、integrity、ownership、Commands collections 和 OpenSpec package 对齐
- [x] 8.2 扩展临时 workspace E2E，覆盖新初始化、安装、卸载范围确认、拒绝确认零写入、三方更新、冲突零写入、旧 workspace 迁移和两个 Agent adapter
- [x] 8.3 运行 `projects/product/buildr package check`、产品临时 workspace E2E、`openspec validate --all --strict` 和 `npm pack --dry-run`
- [x] 8.4 使用当前 Product checkout update/sync 自举 workspace，确认 OpenSpec Component、Commands collection 和当前 Agent runtime 状态
- [x] 8.5 安装并验证本机 Buildr 开发入口，运行 `command -v buildr`、`buildr --help` 和带当前 Agent 的 `doctor --json`

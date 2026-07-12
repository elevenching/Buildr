# AGENTS.md

Agent 在 `product` Project 中的最小运行规则。

## 项目定位

本文件是 Project scope 规则。开始产品任务时，先遵循 Buildr root `AGENTS.md` 和 Buildr Core，再读取本文件。

当前 Project 是 Buildr 自举 workspace 的产品 Project：`projects/product/`。这里维护 Buildr 产品本身，不是用户 workspace。

所有回复、文档、提案、规格、任务说明和面向用户的文本默认使用中文；代码标识、命令、文件路径、协议字段、第三方专有名词或必须保持原文的格式关键字可以使用英文。

## 资产边界

| 对象 | 位置 | 说明 |
|------|------|------|
| Project rules | `AGENTS.md` | 当前 Product Project 的 Agent 工作规则 |
| OpenSpec | `openspec/` | Buildr 产品事实、能力规范、变更和归档 |
| Product docs | `docs/` | 产品定位、设计说明、发布和维护文档 |
| Package assets | `package/` | 随包 manifest、bootstrap、workspace/runtime targets |
| Product CLI | `buildr`、`tools/` | Buildr 产品 CLI 入口、实现和验证脚本 |
| Service registry | `services/manifest.yml` | 当前 Product Project 的 Service registry |
| Service repos | `services/<service>/` | 独立 Git repo，业务代码由自身 Git 管理 |

## 产品边界

- 产品定位、核心模型、边界和 Roadmap 以 `docs/buildr-product.md` 为准。
- Buildr 的用户既包括人，也包括 Agent；产品能力必须同时从人类用户和 Agent 一等用户的视角设计，不能只提供面向人的操作入口与说明。
- 产品交互优先支持 Agent 理解用户意图、自主推理下一步并引导用户使用 Buildr；能够由 Agent 判断、解释和推进的工作，不应要求人类用户先掌握 Buildr 的内部模型或命令细节。
- 新增或调整产品能力时，必须同时考虑 Buildr Skill 如何让 Agent 发现、理解、选择并正确使用该能力；缺少相应的 Agent 使用指引、决策边界或完成标准时，功能设计不完整。
- 产品能力、CLI 行为、上下文模型、runtime adapter 行为和架构性变更必须先创建 OpenSpec change。
- `package/manifest.yml` 声明发布边界；`package/targets/workspace/` 只放映射到用户 workspace 或 Project 的源，`package/targets/runtime/` 只放直接安装到 Agent runtime 的源。
- `package/targets/` 和 `package/bootstrap/` 是发布给用户的内容，修改时必须同时从用户初始化、更新和日常使用 Buildr 的视角审视。
- 预计包含代码、构建或测试的产品 change 必须在 propose 前创建或复用 task worktree；artifacts、实现和合并前候选验证只写入该 worktree。
- 合并前候选验证使用临时 workspace 或 task worktree 自身，不从未合并 checkout 更新主自举 workspace。
- OpenSpec apply 期间按单任务最小反馈、任务组受影响范围验证、最终候选完整验证分层执行；不得在每个普通任务后运行产品总验证或临时 workspace E2E。所有实现、自然语言资产、所需同步和 review 修订完成并冻结候选后，才运行一次产品级总验证。
- 验证进程仍在运行或暂时无输出时继续等待同一进程，不重复启动相同命令；完整验证失败后的修复循环优先重跑失败项和受影响检查，候选重新稳定后再运行一次最终完整验证。
- 完整验证必须绑定所有 rebase、冲突解决和内容修改结束后的最终候选 Git tree；commit、相同 tree 集成、push 和 worktree 清理复用该结果，不在主开发分支重复 E2E。候选 tree 改变时，必须在集成前重新运行受影响的验证。
- 用户在 task worktree 中明确要求“收尾”时，使用 `task-finish` 编排已完成 change 的 specs 同步与归档、相关校验、提交、必要的本地未推送 rebase、fast-forward 集成、目标分支 push 和本地 worktree/任务分支清理；该意图不授权 force push、merge commit、远端任务分支删除、丢弃改动或语义冲突决策。
- `task-finish` 是 Buildr 自有编排层，不直接修改外部 `openspec-*` Skills；OpenSpec archive/specs sync 后只对可证明由本次操作产生的 Markdown EOF 多余空行自动规范化。
- 实际自举 workspace 如需消费新版产品资产，再从仍保留的当前产品 checkout 执行 sync；CLI update 只更新 Product checkout 或 registry package。workspace 状态变更后按 Buildr Core 运行当前 Agent doctor，但不作为相同 tree 后续 Git 动作的重复产品验证门禁。
- 私有业务 workspace、私有业务规则和私有服务内容不得进入 `package/`。
- 开发阶段执行 Buildr 命令时，从 workspace root 使用 `projects/product/buildr`，不要依赖本机 PATH 上安装的 `buildr`。

## 服务入口

Project 服务通过 `services/manifest.yml` 维护 Service registry，默认 repo 目录为 `services/<service>/`。进入具体 Service repo 后，继续读取该服务仓 `AGENTS.md`。

## 本地 CLI 同步

- 改动涉及 Buildr 产品 CLI 入口或实现（`buildr`、`tools/buildr`、CLI 使用的 `tools/*.mjs`、安装/卸载脚本或 npm CLI 映射）时，完成相关验证后必须从包含本次变更的 Product checkout 自动运行 `tools/install-buildr-cli`，刷新本机 `buildr` 开发入口，无需再次等待用户提醒。
- 安装后必须运行 `command -v buildr`、`buildr --help` 和 `buildr doctor --agent <agent> --target <workspace-root> --json`，确认本机入口和目标 workspace 状态有效。
- task worktree 中的候选 CLI 只验证临时 workspace 或 task worktree；本机入口如仍指向即将清理的 task worktree，清理前必须重新安装到仍保留的 workspace checkout。
- 如目标位置存在非 Buildr 管理的文件或命令冲突，停止自动安装并明确报告，不得覆盖；如果本机 `buildr` 指向 task worktree，清理该 worktree 前必须重新安装到仍保留的 workspace checkout 并验证。

## 验证入口

修改 package baseline、manifest、CLI、bootstrap、Buildr Skill 或 runtime adapter 后，按 `docs/release-checklist.md` 验证。

Buildr 产品完整验证结束后，Agent 必须读取 timing summary，并向维护者汇报总耗时、最慢阶段、失败阶段（如有）和 summary 文件路径。耗时仅用于观察趋势；除非 OpenSpec 另有阈值契约，不得仅因耗时增长判定验证失败。该要求仅适用于 Buildr Product Project，不扩展为其他 Buildr workspace 的通用 Skill 流程。

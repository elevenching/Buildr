## 1. Task environment contract 与数据模型

- [x] 1.1 实现 repository selector、registry/source Git identity 解析和 task environment plan，覆盖 Workspace root、Git Project 与 Git Service，拒绝越界、非 Git、tracked target、remote 冲突和重复歧义。
- [x] 1.2 实现 task environment 本机 receipt、environment/repository identity、隔离级别和 legacy single-worktree 识别，保证 receipt 不进入 tracked source tree。
- [x] 1.3 将 `buildr worktree create --json` 升级为 `buildr.worktree-create/v2`，保留单仓等价生命周期字段并更新 public JSON contract、CLI help 和 command registry。

## 2. 多仓创建、复用与 context 门禁

- [x] 2.1 重构 `worktree create` 为完整 plan 预检后执行，默认创建 root worktree，并按 canonical `source.path` 创建显式选择的 nested Project/Service worktrees。
- [x] 2.2 实现多 repository created/reused/blocked 状态、部分失败 receipt、相同 plan 幂等恢复和不同 plan fail-closed，确保失败时不自动删除 checkout 或分支。
- [x] 2.3 增加 task environment inspect/context CLI，核对请求路径、owner、repository membership、branch、HEAD、dirty、CLI source 和允许执行根；主工作区、其他 environment 或未知路径必须返回 mismatch。
- [x] 2.4 为 Buildr-owned task runtime state 提供 environment namespace，并在结果中精确披露 Git shared metadata、Project-declared effects 与 unknown/external isolation 边界。

## 3. Skill capability 与 consumer 协作

- [x] 3.1 更新 `task-triage`、`task-worktree` 和 OpenSpec propose contribution，使实现任务在写入前声明 environment root/repository set，开发、CLI、构建和测试使用明确 task checkout workdir 与 context。
- [x] 3.2 升级 `buildr.task-worktree-lifecycle` contract/result evidence，并同步 `task-finish` consumer、capability manifests、static validation 和组合 tests；多仓收尾按 receipt 逐仓处理且任一阻塞时保留整个 environment。
- [x] 3.3 扩展 `buildr.task-verification/v2` provider guidance/result evidence，使 task-environment 模式绑定 environment、实际 execution roots 和 repository candidate set，同时保持非 worktree 验证独立可用。
- [x] 3.4 更新 `task-asset-review`，要求从多 worktree 本机资源继续追踪 CLI source、cwd、repository set 和验证 evidence，避免只审查 Local App owner 隔离。

## 4. Local App preview 与清理边界

- [x] 4.1 将 preview owner identity 扩展为 task id、environment root 和具体 Product checkout，保持旧单 worktree preview 的可诊断兼容。
- [x] 4.2 更新 preview start/list/stop 和 Task Finish guidance，使当前 environment 的实例可认证停止、其他 environment 实例保持不变，多仓任一 checkout 仍被使用时阻止清理。
- [x] 4.3 补充并行 environments、相同实例名 owner 冲突、legacy preview 和逐 environment cleanup 的集成/browser tests。

## 5. 多仓与越界验证

- [x] 5.1 增加 root + nested Project/Service Git repositories fixture，验证 canonical layout、不同 integration branches、相同 remote URL 的独立 source paths、单仓兼容和 Codex 入口目录树。
- [x] 5.2 增加完整预检零写入、tracked/occupied target、branch owner、remote mismatch、部分创建恢复、不同 plan 重用和其他 environment 不受影响的 fail-closed tests。
- [x] 5.3 增加错误 cwd、原 Workspace checkout、其他 environment、缺失 repository coverage 和多仓 candidate identity 的 verification/contract tests。
- [x] 5.4 更新 CLI、JSON contract、Skill capability 与 Codex 适配文档，明确一个 Codex Worktree chat 原生绑定一个 Git repository，Buildr 在入口 worktree 内编排 nested repositories，且 worktree 不等于 OS/外部系统沙箱。

## 6. 收敛与正式验证

- [x] 6.1 运行变更直接相关的 unit、contract、fast integration 和 preview/browser affected checks，修复失败后重跑失败项与受影响检查。
- [x] 6.2 运行 package/static/runtime projection 检查，确认 packaged source、workspace assets、contracts、bindings、consumers 和 adapter runtime 一致。
- [x] 6.3 在全部实现、文档、generated assets 和 review 修订完成后运行 Buildr Product 完整 Candidate，核对 task environment/repository candidate identity、wall-clock summary 和 transient evidence 生命周期。

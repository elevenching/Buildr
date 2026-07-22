## Buildr OpenSpec Sidebar

应用 change 前先向用户说明正在使用 OpenSpec、`apply` action、change id 及其选择或推断来源。OpenSpec status 解析上下文后，在编辑前报告实际 `changeRoot`；采用 task worktree 时同时报告 canonical 路径与分支。

当未完成的最后一项是“运行完整 Candidate”时，先保持该任务为 `- [ ]`，对当前 implementation identity 运行 Candidate 并捕获可信 evidence。Candidate 成功后立即只把这一项由 `- [ ]` 改为 `- [x]`，同时记录 source/target identity、change/task identity 和精确 old/new marker；确认 `git diff` 中没有任务文本、顺序、其他 checkbox、其他文件或实现内容变化。

只有上述动作在当前会话中完整可观测、source identity 与刚成功的 Candidate evidence 一致，且该 checkbox 是唯一变化时，才把它交给 Task Finish 作为 `closeout-metadata-only` / `verification-result-metadata-only` transition。任何额外变化、多个候选任务、证据丢失或重新进入会话，都不得仅凭最终 `tasks.md` 状态推断可复用性，按 implementation change 重新验证。原 Candidate evidence 仍只证明 source implementation identity，不得表述为直接覆盖 target delivery tree。

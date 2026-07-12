### OpenSpec 契约门禁

当 OpenSpec change 的 proposal、design、specs 和 tasks 都已完成、准备进入 apply 时：

1. 从 Buildr workspace root 和 Project registry 解析 `<workspace>` 与 `<project>`，不得根据当前目录猜测。
2. 运行 `buildr openspec baseline create <change> --project <project> --target <workspace> --json`，再运行 `buildr openspec check <change> --stage proposal --project <project> --target <workspace> --json`。
3. 只有 check 返回 `ok: true` 才报告 change 可进入 apply；缺少、陈旧或不完整 baseline，或 proposal/delta 不一致时，将 change 标记为 `blocked` 并报告 `nextActions`。
4. delta 后续新增或改变 touched Requirement identity 时，必须再次运行 proposal check，并在审阅后显式使用 baseline `--update`；普通 check 不得自动采用当前 canonical facts。

历史 active change 缺少 baseline 时，先向用户说明无法证明原始事实。只有用户明确确认以当前 canonical specs 作为采用基线，才能使用 `--adopt-current`。

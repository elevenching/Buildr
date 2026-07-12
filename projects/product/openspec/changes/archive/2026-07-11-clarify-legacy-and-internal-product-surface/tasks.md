## 1. CLI 表面分层

- [x] 1.1 调整 `tools/buildr` 根帮助，将 public workspace 命令与 product maintenance/workflow internal 命令明确分区，并保持各命令主题帮助可发现。
- [x] 1.2 从 `service create` canonical usage 和主题帮助移除 `--rules`，补充 Service `AGENTS.md` 规则入口说明，同时保持旧参数的 deprecated no-op 行为。
- [x] 1.3 更新 help 与 Service 定向测试，验证 `--help` 零副作用、canonical 输出不含 `--rules`、旧调用仍 warning 且不写 rule-source metadata。
- [x] 1.4 运行 CLI 语法检查和 help/Service 受影响范围验证。

## 2. 产品文档与随包入口收敛

- [x] 2.1 更新 bootstrap guide 与 Buildr Agent 入口中受影响的 canonical 示例，确保不推荐 legacy 参数、scope 或内部 package source reference。
- [x] 2.2 更新产品 README、`docs/buildr-product.md`、`openspec/knowledge/buildr-current-state.md` 和维护文档，加入完整 public/legacy/internal 分类并明确 `package build`、`package:<id>` 与 `service create --rules` 的边界。
- [x] 2.3 检查非 archive 的 help、docs、knowledge、package assets 与 specs，确认分类和术语一致，历史 archive 保持不变。
- [x] 2.4 运行 OpenSpec strict validation 与 package 受影响范围检查。

## 3. 候选验证

- [x] 3.1 审阅最终 diff 和 surface 分类，确认没有删除 CLI、改变数据语义或把 unsupported layout 误标为兼容入口，并运行 `git diff --check`。
- [x] 3.2 冻结最终候选后运行一次 `projects/product/tools/verify-buildr-product` 完整验证。
- [x] 3.3 对相同候选运行 `npm pack --dry-run`，确认随包 help、bootstrap 和 CLI 文件边界有效。

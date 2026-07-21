## 1. CLI identity 与帮助路由

- [x] 1.1 实现 package identity 读取和 `--version`、`-V`、`version`、`version --json` 入口，并补直接单元/兼容测试。
- [x] 1.2 扩展 help topic 解析，使 `help <command...>` 与 flag 形式共享正文，未知 topic 明确失败。
- [x] 1.3 实现未知命令诊断和有限 suggestions，支持文本 stderr 与 `buildr.cli-error/v1` JSON renderer。

## 2. JSON、parity 与文档契约

- [x] 2.1 登记 `buildr.version/v1` 和 `buildr.cli-error/v1`，扩展 schema coverage、checkout/tarball parity 和退出码验证。
- [x] 2.2 更新 CLI reference 与 current-state knowledge，记录 version、help 和错误输出边界。
- [x] 2.3 运行 CLI/JSON/package 受影响范围验证并修复相关失败。

## 3. 候选验证

- [x] 3.1 冻结最终候选并运行 `npm run test:candidate`，确认最终 tree 的完整产品验证通过并记录 timing summary。

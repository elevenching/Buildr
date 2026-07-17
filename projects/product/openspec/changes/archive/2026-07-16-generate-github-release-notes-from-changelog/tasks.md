## 1. Release notes 提取契约

- [x] 1.1 新增无外部依赖的 release notes 提取模块与 CLI，按目标 version 精确读取根 `CHANGELOG.md` 章节并对缺失、重复和空正文 fail closed
- [x] 1.2 在 `open-source-release.test.mjs` 补充正常提取、相邻版本隔离和无效章节单元测试

## 2. Publish workflow 集成

- [x] 2.1 在 npm registry check 与 publish 前生成临时 release notes file，并让 GitHub Release 使用 `--notes-file`、`--verify-tag` 和正确的 prerelease/Latest 参数
- [x] 2.2 加固 publish workflow 静态契约测试，验证 notes 来源、步骤顺序、tag 校验及 prerelease 展示语义
- [x] 2.3 运行 release 受影响范围验证并修复发现的问题

## 3. 发布流程资产

- [x] 3.1 更新发布检查清单，说明 changelog 章节格式、发布前预览和 fail-closed 顺序
- [x] 3.2 更新 Product Project 的 `buildr-release` Skill，在准备阶段预览最终 notes，并在发布后核对 GitHub Release body
- [x] 3.3 检查本次 Skill、workflow 和验证入口变更的自举同步影响，记录收尾时需要执行的 workspace sync

## 4. 最终候选验证

- [x] 4.1 对冻结候选运行一次完整产品验证并读取 timing summary
- [x] 4.2 复核 OpenSpec 状态、Git diff 与最终候选 tree，确认 change 已完成且可进入收尾

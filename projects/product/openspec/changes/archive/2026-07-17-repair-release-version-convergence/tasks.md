## 1. 既有发布事实恢复

- [x] 1.1 对比 `dev` 与 `main@v0.1.0-rc.5` 的发布材料，只合并 package/lockfile 与缺失的 rc.4/rc.5 事实并保留后续开发内容。
- [x] 1.2 增加回归断言，确保 Product checkout version、lockfile version 与当前已发布基线一致。

## 2. Release convergence 门禁

- [x] 2.1 实现只读 release convergence checker，覆盖 candidate base、目标 version、dev/main tree、ancestry、remote ref 与 release task hygiene。
- [x] 2.2 强化 history bridge 与测试：release branch 未先进入 dev、旧 dev ancestor 候选、tree/version mismatch 和远端竞争必须 fail closed。
- [x] 2.3 更新 `buildr-release` 源 Skill、release checklist 与 current-state knowledge，明确最新 dev 基线、先集成 dev、再 PR/bridge/tag 的不可绕过顺序。

## 3. Update check 版本漂移诊断

- [x] 3.1 扩展 development-checkout update plan，分别输出 sourceStatus、versionStatus 和 released version，同时保持 registry 失败时只读降级。
- [x] 3.2 补充 JSON schema/兼容性测试，覆盖 Git up-to-date 但发布版本 stale，以及 registry unavailable 场景。

## 4. 验证与完成

- [x] 4.1 创建并检查 OpenSpec contract baseline，运行 release、CLI update 和 package 受影响验证。
- [x] 4.2 同步受影响的 Product Skill/package assets，并确认生成结果一致。
- [x] 4.3 冻结最终 tree，运行一次 `npm run test:candidate` 并读取 timing summary。

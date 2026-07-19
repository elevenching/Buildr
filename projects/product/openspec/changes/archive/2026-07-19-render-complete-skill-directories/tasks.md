## 1. Skill source 与 runtime write 模型

- [x] 1.1 扩展本地和 package Skill source resolution，暴露完整源目录并安全枚举受支持普通文件，拒绝符号链接、非普通文件和路径逃逸
- [x] 1.2 扩展 runtime plan write identity，支持 UTF-8 与 base64 字节内容、受约束 executable mode、统一比较和确定性写入
- [x] 1.3 实现版本化 runtime Skill 投射回执的路径、schema、完整性校验和 source/runtime inventory 构建

## 2. 完整目录投射与安全生命周期

- [x] 2.1 让 Skill render plan 对 `SKILL.md` 执行现有派生组合、对随附文件执行原始字节投射，并在同一 plan 中生成回执
- [x] 2.2 根据旧回执规划 active Skill 的 stale 文件清理，聚合已修改受管文件、非受管目标和 receipt mismatch 冲突后再执行零部分写入 preflight
- [x] 2.3 迁移 runtime Skill orphan discovery 和 cleanup 使用回执安全删除完整受管目录，同时保留旧版仅 `SKILL.md` 的兼容路径与未知用户文件
- [x] 2.4 对齐 `skills render`、完整 `render`、`sync`、runtime check、doctor 和 Component lifecycle 的完整 Skill inventory、诊断与结果确认

## 3. 契约、产品说明与测试

- [x] 3.1 补充 runtime plan、Skill source/render、二进制、权限、路径安全、回执、active stale、orphan 和冲突的 unit tests
- [x] 3.2 补充全部 supported adapters 的目录投射、scope、幂等、check/doctor 与临时 workspace integration 验证
- [x] 3.3 更新 Buildr Skill 使用说明、current-state knowledge 和受影响 package/runtime 契约，明确完整本地/package Skill 与远端 `skill-url` 边界
- [x] 3.4 创建并维护关联本 change 的 Product 任务驾驶舱，记录阶段、验证证据和后续第二个 change 的边界

## 4. 最终候选验证与开发入口

- [x] 4.1 运行受影响范围验证并修复所有回归，确认 OpenSpec proposal 契约门禁持续通过
- [x] 4.2 冻结最终候选 tree，运行 `npm run test:candidate`，读取并报告 timing summary
- [x] 4.3 从当前 Product checkout 安装本机开发 CLI，验证 `command -v buildr`、`buildr --help` 和目标 workspace doctor

## 1. Required Core 与用户视角

- [x] 1.1 在 required Buildr Core 中增加状态变更后 doctor 验证的统一 invariant。
- [x] 1.2 在 Product AGENTS 中明确发布资产必须从用户使用视角审视，并在 CLI 安装后要求 workspace doctor。

## 2. Skill 与自举规则去重

- [x] 2.1 保留 Buildr Skill 执行循环和完成标准中的 doctor，删除 Workspace、Project、Service、Rules 章节的重复提醒。
- [x] 2.2 精简 root AGENTS 的 doctor 重复文案，使自举更新与渲染依赖 Core 完成条件。
- [x] 2.3 保持 bootstrap guide 的最小兜底 doctor 流程与 Core 一致。
- [x] 2.4 明确产品候选版本先完成自举验证，通过后再合并、推送。

## 3. 同步与验证

- [x] 3.1 同步 required Core、Buildr Skill 和 Codex runtime 到当前 workspace。
- [x] 3.2 运行 package check、OpenSpec strict validation、Codex doctor 和 `git diff --check`。

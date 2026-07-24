## 1. 预览实例运行模型

- [x] 1.1 在 Local App runtime 中实现 preview 实例名校验、状态命名空间、owner identity 与健康状态读取。
- [x] 1.2 实现 preview 的受控后台启动、健康等待、认证停止和陈旧状态清理，保持默认 `buildr app` 单实例行为不变。
- [x] 1.3 将 preview identity 接入 health 响应与 Web Shell 的只读身份条。

## 2. CLI 与开发者交接

- [x] 2.1 注册 `buildr app preview start|list|stop`，实现参数校验、文本/JSON 输出和帮助主题。
- [x] 2.2 更新公开 CLI 文档，明确 preview 运行当前 worktree，不安装或替换 `Buildr Dev.app`。

## 3. 收尾与资产边界

- [x] 3.1 更新 task-finish Skill 与其 capability contract：收尾只停止当前任务 owner 的 preview，保留其他任务 preview。
- [x] 3.2 更新 task-asset-review 的强信号与检查项，覆盖用户级单例、端口、锁和 worktree 并发边界。
- [x] 3.3 更新包映射/静态契约验证，确保修改后的 Skill source、contract 与 runtime 投射一致。

## 4. 验证

- [x] 4.1 增加快速集成测试，覆盖两个并行 preview、同名 owner 冲突、身份输出和认证停止。
- [x] 4.2 增加浏览器冒烟覆盖，验证 preview 页面展示正确的 checkout identity，且默认页面不显示 preview 条。
- [x] 4.3 运行受影响验证、OpenSpec baseline/proposal check，并在候选冻结后运行产品 Candidate。

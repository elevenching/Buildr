## 1. 产品仓维护规则

- [x] 1.1 在根 `AGENTS.md` 增加简短的 Buildr Skill 维护原则章节
- [x] 1.2 确保产品仓专属维护规则不写入 `package/workspace/AGENTS.md`

## 2. Buildr Skill 操作手册

- [x] 2.1 围绕 Agent 工作流和 Workspace、Project、Service、Rules、Commands、Skills、Runtime 七类资产重组 `package/agent-skills/buildr/SKILL.md`
- [x] 2.2 将 `buildr doctor --json` 作为 Skill 中默认的诊断和事实入口
- [x] 2.3 命令说明保持面向决策，必要主路径写入对应资产章节，详细参数交给 CLI 帮助、当前 manifest 状态或 CLI 错误输出
- [x] 2.4 让 Skills 相关内容在直接服务 Agent 决策的位置集中呈现，不额外增加泛化政策章节

## 3. Bootstrap 契约与验证

- [x] 3.1 同步 `package/bootstrap/guide.md`，采用同样的 doctor 优先入口模型
- [x] 3.2 更新 `package/bootstrap/bootstrap.contract.yml`，反映新的 Buildr Skill 和 guide 期望
- [x] 3.3 在产品验证中确保 doctor 输出仍是 runtime 和资产状态的默认来源
- [x] 3.4 运行 `./buildr package check`
- [x] 3.5 运行 `tools/verify-buildr-product-mvp`
- [x] 3.6 运行 `openspec validate --all --strict`

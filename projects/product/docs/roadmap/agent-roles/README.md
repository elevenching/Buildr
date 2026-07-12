# 角色 Agent 设计候选

本目录保留 Buildr 未来可能支持的角色 Agent 职责草案。这些文档尚未接入 Buildr 的 Rule、Skill、Component、Agent runtime 或 subagent 编排模型；当前 Agent 不应因为角色名称匹配而自动加载或执行它们。

- [产品经理（PM）](pm.md)
- [后端工程师（BE）](be.md)
- [前端工程师（FE）](fe.md)
- [测试工程师（QA）](qa.md)

角色模型进入实现前，需要独立 OpenSpec change 明确资产类型、发现和激活方式、上下文边界、runtime 适配、与原生 subagent 的关系，以及验证和卸载语义。

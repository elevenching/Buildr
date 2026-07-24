# 历史角色能力拆解

本目录保留早期按产品经理、前端、后端和测试岗位整理的职责草案。它们不是 Buildr 未来要创建的固定 Agent 身份，也未接入 Rule、Skill、Component、Agent runtime 或 subagent 编排模型；当前 Agent 不应因为角色名称匹配而自动加载或执行它们。

后续使用这些资料时，应把岗位职责继续拆成可按任务动态加载的工作事实、Rules、Skills、Commands、Packages 或 capability contracts。同一个 Agent 可以在不同任务或同一端到端任务的不同阶段加载不同能力，不需要永久绑定岗位身份。

- [产品经理（PM）](pm.md)
- [后端工程师（BE）](be.md)
- [前端工程师（FE）](fe.md)
- [测试工程师（QA）](qa.md)

如果未来引入面向人的“角色”视图，它只能作为能力模板或可读投影，不能替 Agent 判断任务相关性，也不能成为固定 runtime、权限路由或组织结构。任何相关能力进入实现前，都需要独立 OpenSpec change 明确资产类型、发现与激活方式、上下文边界、runtime 适配、与原生 subagent 的关系，以及验证和卸载语义。

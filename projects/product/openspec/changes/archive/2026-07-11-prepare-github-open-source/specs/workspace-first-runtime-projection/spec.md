## ADDED Requirements

### Requirement: 远端 Skill 解析必须有界完成
Buildr MUST 对远端 resolved Skill 的网络读取设置有限的连接、响应和总执行时间，使 runtime render、sync 和 doctor 能够成功完成或返回明确失败，而不是无限等待。

#### Scenario: 远端 Skill 来源不可达
- **WHEN** workspace Skill 的 resolved URL 无法连接、停止响应或超过配置的总时限
- **THEN** Buildr MUST 在有限时间内终止该次拉取
- **AND** Buildr MUST 返回包含 Skill 或 URL 上下文的错误
- **AND** Buildr MUST NOT 写入部分 runtime Skill 内容

#### Scenario: 维护者调整远端请求时限
- **WHEN** 维护者通过受支持的环境变量调整远端 Skill 请求时限
- **THEN** Buildr MUST 校验该值是有限正整数并限制到产品允许的最大范围
- **AND** 无效配置 MUST 明确失败而不是退回无限等待

## ADDED Requirements

### Requirement: Adapter descriptor 声明可选 Skill publication extensions
Buildr MUST 允许 supported runtime adapter 的 Skills trait 声明受约束、静态且可验证的可选 publication extensions，并 MUST 由 package verification 从同一 descriptor 派生 adapter-specific extension 校验。

#### Scenario: Codex 发布 OpenAI Skill metadata
- **WHEN** 面向 `codex` runtime 发布的 package Skill 包含 `agents/openai.yaml`
- **THEN** Codex adapter extension profile MUST 校验该文件的 OpenAI metadata
- **AND** validation failure MUST 标识 `codex` adapter、Skill id 和无效的 metadata

#### Scenario: Codex Skill 没有 OpenAI UI 扩展
- **WHEN** 面向 `codex` runtime 发布的 package Skill 没有 `agents/openai.yaml`
- **THEN** Codex adapter MUST 继续使用 `SKILL.md` 的 `name` 和 `description` 发现并路由该 Skill
- **AND** package verification 和 render MUST NOT 因扩展缺失失败或生成该文件

#### Scenario: 非 OpenAI adapter 不消费 OpenAI metadata
- **WHEN** package Skill 面向未声明 OpenAI publication extension 的 adapter 发布
- **THEN** 该 adapter MUST NOT 因 `agents/openai.yaml` 缺失而判定发布失败
- **AND** 该 adapter MUST NOT 将该文件解释为自身 activation、routing 或 UI metadata

#### Scenario: Adapter publication extension 不安全或未知
- **WHEN** descriptor 声明绝对路径、逃逸路径、重复 extension 或不受支持的 vendor metadata format
- **THEN** adapter descriptor validation MUST fail
- **AND** Buildr MUST NOT 将该 adapter 报告为 supported

### Requirement: 完整 Skill 投射区分保留与消费
Buildr MUST 让所有 filesystem Skills adapters 保真投射相同 Skill 相对文件 inventory，同时 MUST 只让拥有对应 publication profile 的 adapter 消费 vendor extension。

#### Scenario: 所有 adapter 保留 vendor extension
- **WHEN** Skill 源目录包含 `agents/openai.yaml` 或其他普通随附文件
- **THEN** 每个 filesystem Skills adapter MUST 按相同相对路径和内容 identity 投射该文件
- **AND** 非 OpenAI adapter 对文件的保留 MUST NOT 被解释为支持或消费 OpenAI metadata

## MODIFIED Requirements

### Requirement: Buildr root 承载默认 Organization 资产路径
Buildr MUST 将 Buildr root 作为默认 Organization 资产路径，并在根目录维护组织级 Rules、Skills、Components、Commands 和项目入口。

#### Scenario: 组织级资产路径
- **WHEN** Buildr 表示当前 Organization 上下文的 Rules、Skills、Components 或 Commands
- **THEN** 这些资产 MUST 位于 Buildr root 的 `AGENTS.md`/`rules/`、`skills/`、`components/` 和 `commands/` 下
- **AND** Buildr MUST NOT 将 `practices/` 表示为独立 Organization 资产类型

#### Scenario: 项目级资产路径
- **WHEN** Buildr 表示当前 Organization 上下文下的项目
- **THEN** 项目资产 MUST 位于 `projects/<project>/` 下

#### Scenario: 共享服务路径
- **WHEN** Buildr 表示当前 Organization 上下文下的共享、基础或平台服务
- **THEN** 这些服务 MUST 归属某个 Project，并位于 `projects/<project>/services/` 下

## Why

Buildr 当前把 workspace 根目录和 `organizations/<org>/` 分成两层，但真实使用中，用户选择的起点目录本身就是个人、团队或公司的上下文边界。继续要求用户在 `~/acme` 下再创建 `organizations/acme/` 会制造重复心智和空壳目录，削弱初始化后的可用性。

## What Changes

- **BREAKING**：将 Buildr 默认物理模型调整为“一个 Buildr root 就是一个 Organization 上下文”。
- **BREAKING**：默认项目路径从 `organizations/<org>/projects/<project>/` 改为 `projects/<project>/`。
- **BREAKING**：默认 shared service 路径从 `organizations/<org>/shared/` 改为根 `shared/`。
- 将 `buildr init` 从“创建 workspace 容器”升级为“创建可直接使用的组织上下文实例”。
- 将 `org create` 从主路径移出；如仍保留，只作为兼容或高级多组织场景能力。
- 更新 `scope`、`doctor`、`project create`、`service link`、runtime check/render 和模板生成语义，使其默认基于根组织上下文工作。
- 为旧版 `organizations/<org>/` workspace 设计诊断和迁移路径，避免现有资产被静默误读。

## Capabilities

### New Capabilities

- `root-organization-workspace`: 定义 Buildr root 作为 Organization 上下文实例的目录、命令和诊断语义。

### Modified Capabilities

- `organization-model`: 将 Organization 的默认物理路径从 `organizations/<org>/` 调整为 Buildr root，并保留多组织容器作为非默认高级模式或迁移输入。

## Impact

- 影响 CLI 命令语义：`init`、`org create`、`project create`、`service link`、`doctor`、`runtime check/render`。
- 影响 scope 表达：默认 scope 应从 `organizations/<org>/projects/<project>` 收敛为 `projects/<project>` 或等价根相对表达。
- 影响模板资产：根 `AGENTS.md`、`ASSETS.md`、`README.md`、`rules/`、组织级 `practices/`、`skills/`、`shared/` 和项目模板。
- 影响当前 Buildr 仓库内已有文档、OpenSpec specs、产品手册和资产手册。
- 影响现有 `organizations/acme/` 示例资产，需要提供迁移策略或兼容读取策略。

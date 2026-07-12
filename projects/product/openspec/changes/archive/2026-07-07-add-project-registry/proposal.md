## Why

Buildr workspace 现在通过 `projects/<project>/` 目录隐式表示项目集合，但缺少一个稳定的 root 级 registry 来告诉 Agent 和人“这个 workspace 管理哪些 Project”。同时，Project 记忆和规则资产有时需要独立版本化，不能总是绑定在整个 Buildr root Git repo 中。

本变更引入 `projects.yml` 作为 Project registry，并允许 `project create` 将 Project 资产 materialize 为 `projects/<project>/` 下的独立 Git repo。

## What Changes

- 新增 root `projects.yml`，作为 workspace 管理 Project 的最小 registry。
- `buildr init` 创建空的 `projects.yml`。
- `buildr project create <project>` 创建 Project baseline，并同步维护 `projects.yml`。
- `projects.yml` 为每个 Project 记录简洁的人类可读说明：`title` 作为短显示名，`description` 作为可选一句话说明；Project key 继续作为稳定 name/id。
- `buildr project create <project> --repo <git-url>` 支持把 Project 资产 repo clone 到 `projects/<project>/`，补齐 Project baseline，并同步记录 repo metadata。
- Project repo 只支持 materialize 到 `projects/<project>/`，不支持外部本地路径链接。
- workspace root Git repo 必须忽略作为嵌套 Git repo 的 Project 资产目录，避免误提交独立 Project repo 内容。
- `doctor` 基于 `projects.yml` 检查 Project 是否缺失、是否为未登记目录、Project baseline 是否完整，以及 Project repo metadata 是否和本地 Git 状态一致。
- 不改变 `services.yml` 语义：它仍然是 Project 级 service repo metadata。
- 不包含破坏性变更；既有只依赖 `projects/<project>/` 目录的 workspace 需要由 `doctor` 引导补登记。

## Capabilities

### New Capabilities

- `project-registry`: 定义 root `projects.yml`、Project repo metadata、`project create --repo` 和 Project baseline/嵌套 repo 规则。

### Modified Capabilities

- `agent-readable-doctor`: 增加 Project registry、未登记 Project、缺失 Project、Project baseline 和 Project repo 状态诊断。
- `human-agent-onboarding`: 更新 Agent onboarding，引导 Agent 在创建 Project 或接入独立 Project 资产 repo 时使用 `project create` 并依赖 `doctor --json` 补齐 registry。

## Impact

- 影响 CLI：`init`、`project create`、`doctor`、`package check` 和帮助输出。
- 影响 package baseline：新增 `package/workspace/projects.yml` 或等价 workspace file 映射。
- 影响随包引导：`package/bootstrap/guide.md`、`package/agent-skills/buildr/SKILL.md` 和 `package/bootstrap/bootstrap.contract.yml` 需要同步命令语义。
- 影响验证：`./buildr package check`、`tools/verify-buildr-product-mvp` 和 `openspec validate --all --strict` 需要覆盖新 registry 行为。

## 1. Registry 模型与 Baseline

- [x] 1.1 新增 `projects.yml` parse/render helpers，支持 `schemaVersion`、Project title、optional description、Project path 和 repo metadata。
- [x] 1.2 新增默认 workspace `projects.yml` baseline，并通过 `package/manifest.yml` 映射。
- [x] 1.3 更新 package checks，校验 `projects.yml` baseline 并拒绝 forbidden 或 invalid registry data。

## 2. Project CLI

- [x] 2.1 更新 `buildr init`，创建空的 `projects.yml`。
- [x] 2.2 更新 `buildr project create <project>`，创建或修复 Project baseline，并写入 title 与 `repo.kind: workspace`。
- [x] 2.3 新增 `buildr project create <project> --repo <git-url>`，将 Project assets clone 到 `projects/<project>/`，记录 title、Git metadata 并修复缺失 baseline。
- [x] 2.4 拒绝 `project create --repo` 的 local path 值，并说明 Project assets 必须 materialize 到 `projects/<project>/` 下。
- [x] 2.5 更新 root `.gitignore` 处理，使其只忽略 Git 管理的 Project asset repos。
- [x] 2.6 支持 `project create` 的 `--title` 与 `--description`，省略时将 title 默认设为 Project id。

## 3. Doctor Diagnostics

- [x] 3.1 将 Project registry parsing 加入 `doctor --json` output。
- [x] 3.2 报告缺失的 `projects.yml`、缺失的 Project titles、registry 声明但缺失的 Projects 和未登记的 Project directories。
- [x] 3.3 报告不完整的 Project baseline assets 并提供 repair suggestions。
- [x] 3.4 报告 Git 管理的 Project repo 状态、remote mismatch 和缺失的 root `.gitignore` coverage。

## 4. Product Guidance

- [x] 4.1 更新 `projects.yml` 和 `project create --repo` 的 CLI help、README 与 product docs。
- [x] 4.2 一并更新 `package/bootstrap/guide.md`、`package/agent-skills/buildr/SKILL.md` 和 `package/bootstrap/bootstrap.contract.yml`。
- [x] 4.3 明确 Project asset repos 与 service repos 不同，且 `services.yml` 仍为 Project-local。

## 5. Verification

- [x] 5.1 扩展 `tools/verify-buildr-product-mvp`，覆盖 init registry、workspace-managed Project creation、Git-managed Project creation 和 doctor diagnostics。
- [x] 5.2 运行 `./buildr package check`。
- [x] 5.3 运行 `tools/verify-buildr-product-mvp`。
- [x] 5.4 运行 `openspec validate --all --strict`。

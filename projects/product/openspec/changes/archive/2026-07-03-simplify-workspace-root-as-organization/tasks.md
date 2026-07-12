## 1. 模板与初始化资产

- [x] 1.1 将当前内联初始化内容迁移为 Buildr 产品随包模板目录。
- [x] 1.2 新增 root-as-Organization 的 workspace baseline 模板，包含 `AGENTS.md`、`ASSETS.md`、`README.md`、`.buildr/workspace.yml`、`rules/`、`practices/`、`skills/`、`shared/` 和 `projects/`。
- [x] 1.3 更新 `buildr init`，支持 `--name` 和 `--profile`，并从模板渲染根组织上下文实例。
- [x] 1.4 确保初始化只写缺失文件，不覆盖用户已修改资产。

## 2. CLI 路径与 scope 模型

- [x] 2.1 将 `project create` 默认输出路径改为 `projects/<project>/`。
- [x] 2.2 将 `service link` 默认项目服务路径改为 `projects/<project>/services/<service>/`。
- [x] 2.3 将 shared service metadata 和默认 repo 目录改为根 `shared/services.yml` 与 `shared/services/`。
- [x] 2.4 更新 scope 解析，支持 `.`、`projects/<project>`、`projects/<project>/<service>`、`shared` 和 `shared/<service>`。
- [x] 2.5 为旧 `organizations/<org>/...` scope 保留兼容读取，并在输出中标记 legacy。

## 3. 诊断、迁移与 runtime

- [x] 3.1 更新 `doctor --json`，识别 root-as-Organization workspace 的根资产、项目、shared service 和 service repo 状态。
- [x] 3.2 更新 `doctor --json`，识别 legacy `organizations/<org>/` 布局并输出结构化迁移建议。
- [x] 3.3 更新 Claude Code runtime check/render 的规则路径解析，使根、项目和服务规则按新 scope 组合。
- [x] 3.4 明确 `.codex/`、`.claude/` 等 runtime 目录仍为投射产物，不作为 Buildr 资产源提交。

## 4. 文档与 OpenSpec 同步

- [x] 4.1 更新 README、产品手册、bootstrap guide、资产手册和设计文档中的默认路径模型。
- [x] 4.2 同步修正 `buildr-product-mvp` active change 中仍引用 `organizations/<org>/` 默认路径的内容，避免 active changes 冲突。当前 `buildr-product-mvp` 已归档，无 active change 需要修正。
- [x] 4.3 更新 `rules/task-triage.md` 或根 `AGENTS.md` 中涉及层级启动流程的表述。
- [x] 4.4 评估当前 `organizations/acme/` 资产是迁移为示例、保留为 legacy fixture，还是从产品仓默认状态移出。

## 5. 验证

- [x] 5.1 新增或更新 CLI 测试/验证脚本，覆盖 `init --name`、`project create`、`service link`、`doctor --json` 和 runtime check。
- [x] 5.2 用临时目录验证 `buildr init --target <tmp> --name acme --profile company` 生成健壮 workspace。
- [x] 5.3 运行 `openspec validate simplify-workspace-root-as-organization --strict`。
- [x] 5.4 运行 Buildr 现有产品 MVP 验证脚本或等价命令，确认未破坏当前 CLI 主路径之外的诊断能力。

## 6. 当前产品仓迁移

- [x] 6.1 将当前 Buildr 产品仓补齐为 root-as-Organization 实例结构。
- [x] 6.2 对当前产品仓执行 Claude Code runtime check。
- [x] 6.3 对当前产品仓执行 `doctor --json`。

## 7. acme 组织资产迁移纠偏

- [x] 7.1 识别 `organizations/acme/` 作为独立 root 的迁移方案不符合本 change 的 root-as-Organization 目标。
- [x] 7.2 将示例组织 `projects/`、`shared/`、`practices/` 和 `skills/` 并入 `/Users/demo-user/AI/Buildr` root。
- [x] 7.3 将项目服务仓迁移到 `projects/<project>/services/<service>/`，将共享服务仓保留在 `shared/services/<service>/`。
- [x] 7.4 更新根规则、示例组织业务规则、项目规则、资产手册和当前事实文档，移除 `organizations/acme/` 作为当前资产入口的表述。
- [x] 7.5 对 `/Users/demo-user/AI/Buildr` 执行 runtime check 和 doctor。

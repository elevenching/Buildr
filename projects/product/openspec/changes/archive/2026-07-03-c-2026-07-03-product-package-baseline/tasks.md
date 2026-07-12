## 1. OpenSpec 与产品语义

- [x] 1.1 更新 `root-organization-workspace`，移除 legacy organizations 兼容要求，并从 init baseline 中移除 `ASSETS.md`。
- [x] 1.2 更新 `buildr-workspace-management`，删除 `organizations/` 容器、默认 Organization 和 `<org>/...` 路径语义。
- [x] 1.3 更新 `agent-first-onboarding`，移除 `org create` 主路径，明确初始化后的渐进式用户引导。
- [x] 1.4 更新 `agent-readable-doctor`，删除 legacy scope 兼容诊断，只保留 root/project/shared/service 主线状态。
- [x] 1.5 新增 `buildr-package-assets` 规范，定义 `product/package/`、manifest、check/build 和引用边界。
- [x] 1.6 更新 `service-asset-indexing`，将 shared service 路径收敛到 root `shared/`。

## 2. 随包资产结构

- [x] 2.1 创建 `product/package/manifest.yml`，声明随包资产 include/exclude、模板变量和校验规则。
- [x] 2.2 将 root baseline 拆成可独立维护的规则/文档源，并由 `product/package/manifest.yml` 显式映射。
- [x] 2.3 将项目 baseline 拆成可独立维护的规则/文档源，并由 `product/package/manifest.yml` 显式映射。
- [x] 2.4 将 bootstrap guide、产品手册中需要随包交付的内容纳入 `product/package/` 或 manifest 引用。
- [x] 2.5 从默认 root baseline 中移除 `ASSETS.md` 模板。
- [x] 2.6 将通用根规则抽象到 root `rules/` 中的独立规则文件，并通过 manifest `workspaceFiles` 控制 init 安装。
- [x] 2.7 使用 manifest 文件映射约束发布边界，私有业务规则不进入随包资产。
- [x] 2.8 移除随包模板和空包目录中的 `.gitkeep` 占位，改由 CLI 显式创建必要目录。
- [x] 2.9 将 Buildr 产品开发模块命名为 `product/`，并把产品 `tools/`、`docs/`、`openspec/` 收敛到该模块下。
- [x] 2.10 移除 `product/package/templates/` 和 `product/package/rules/` 内容源，改由 `product/package/manifest.yml` 显式引用独立资产源。

## 3. CLI 主路径收敛

- [x] 3.1 移除 `buildr org create` 主线命令和帮助文本。
- [x] 3.2 移除 `project create <org>/<project>` 与 `service create <org>/<project>/<service>` 解析。
- [x] 3.3 移除 `organizations/<org>/...` scope 解析与 legacy 结果字段。
- [x] 3.4 更新 `buildr init` 从 manifest `workspaceDirectories` / `workspaceFiles` 渲染 root context。
- [x] 3.5 更新 `buildr project create` 从 manifest `projectDirectories` / `projectFiles` 渲染项目资产。
- [x] 3.6 更新 `doctor --json`，只诊断 root、projects、shared 和 service repo 状态。

## 4. Package 校验与构建

- [x] 4.1 新增 `buildr package check`，校验 manifest、模板变量、禁止内容和临时 init/doctor 闭环。
- [x] 4.2 新增或预留 `buildr package build`，基于 manifest 生成发布产物。
- [x] 4.3 更新现有验证脚本，覆盖 package manifest 生成的临时 root。
- [x] 4.4 扩展 `buildr package check`，校验 manifest 文件映射安装完整性和发布边界。
- [x] 4.5 扩展 `buildr package check`，防止 `.gitkeep` 占位文件重新进入随包资产。
- [x] 4.6 新增 `buildr bootstrap guide`，让 Agent 可通过命令读取 onboarding 指南。

## 5. 文档与当前仓库整理

- [x] 5.1 更新 README、产品手册、bootstrap guide 和 docs，移除 `organizations/<org>/` 作为默认或兼容路径的表述。
- [x] 5.2 更新根 `AGENTS.md` 和开发规则，说明产品开发资产引用 `product/package/` 随包资产的方式。
- [x] 5.3 评估当前产品仓 `ASSETS.md` 是否作为自用手册继续保留；即使保留，也不得进入默认 package baseline。
- [x] 5.4 清理或迁移旧 `product/templates/` 中不再属于发布边界的内容。

## 6. 验证

- [x] 6.1 运行 `openspec validate c-2026-07-03-product-package-baseline --strict`。
- [x] 6.2 用临时目录验证 `buildr init --target <tmp> --name demo --profile team` 不生成 `ASSETS.md` 且 `doctor --json` 通过。
- [x] 6.3 验证 `projects/<project>`、`shared/<service>` scope 正常，`organizations/<org>/...` scope 不再被接受。
- [x] 6.4 运行 Buildr 现有产品验证脚本或等价命令。

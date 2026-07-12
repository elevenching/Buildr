## 1. 安全基础与 YAML

- [x] 1.1 引入 `yaml` 运行时依赖和 lockfile，并把 Buildr manifest readers 迁移到兼容 YAML 语义的统一 parser
- [x] 1.2 实现严格 `assertAssetId`，覆盖 `.`、`..`、路径分隔符、控制字符和全部路径型 identity 调用点
- [x] 1.3 实现 scope path resolver、保护根/集合根策略和 symlink segment 拒绝，并为允许的精确成员删除保留正常路径
- [x] 1.4 实现 atomic text/JSON/YAML writer、tree integrity 和安全 remove/replace primitives

## 2. Mutation transaction

- [x] 2.1 实现 workspace mutation lock、journal、staging、backup、commit 和逆序 rollback
- [x] 2.2 让 manifest writers、legacy convergence 和普通 Rules/Skills/Commands/Builtins mutation 使用 atomic writer 或 source transaction
- [x] 2.3 增加生产直接危险写入静态检查，阻止未审阅的 mutation 绕过安全 primitives

## 3. Component 与 OpenSpec

- [x] 3.1 将 Component install/update/uninstall 的成员与 registry/manifests/definition 提交迁移到统一 source transaction
- [x] 3.2 使用 fault injection 验证 Component 中途失败后保持完整旧状态或留下 fail-closed transaction
- [x] 3.3 将 OpenSpec baseline 和 pre-sync receipt 迁移到 atomic JSON writer，并验证 OpenSpec Component lifecycle 不触碰 Project `openspec/` 数据

## 4. Project 与 Service repo identity

- [x] 4.1 为 Project create 增加既有 Git remote/registry identity 预检和 staged clone，冲突与失败保持零写入
- [x] 4.2 为 Service create 增加既有 Git remote/metadata identity 预检和 staged clone/copy，冲突与失败保持零写入
- [x] 4.3 扩展 Project/Service fixtures，覆盖相同来源幂等修复、来源冲突、本地目标已存在和 materialization 失败

## 5. Package output

- [x] 5.1 定义并实现 `.buildr-package-output.json` schema、文件清单与 output integrity
- [x] 5.2 将 package build 改为同级 staged build 和安全 swap，只接管不存在、空或 receipt 完整匹配的目标
- [x] 5.3 覆盖 workspace/Product/cwd/home/filesystem/集合根及祖先拒绝、非空无 receipt 拒绝、已修改输出拒绝和失败恢复

## 6. Doctor 与恢复

- [x] 6.1 扩展 doctor JSON/text findings，报告 lock、journal、staging、backup、operation、phase、affected paths 和 next action
- [x] 6.2 让存在 incomplete transaction 的后续 source mutation fail closed，同时保持只读 doctor 和专项 check 可运行
- [x] 6.3 增加正常清理、异常残留、rollback 失败和并发 mutation fixtures

## 7. 产品契约与文档

- [x] 7.1 更新产品/current-state/README 中的数据完整性、安全 package output 和非目标边界；`managed-components` Purpose 的历史文档债务不通过 active change 直接改 canonical spec
- [x] 7.2 更新 package verification、发布文件清单和 npm package smoke test，确认安装后的 CLI 能解析 YAML dependency
- [x] 7.3 检查本 change 是否影响 Rule、Skill、Component、项目结构或 runtime 入口，并只在 Product 源中维护应交付资产

## 8. 最终验证

- [x] 8.1 运行数据完整性 focused fixtures、package check 和临时 workspace E2E
- [x] 8.2 运行 `tools/verify-buildr-product`、OpenSpec strict validation、contract audit、`npm pack --dry-run` 和 `git diff --check`
- [x] 8.3 从当前 Product task checkout 安装本机开发 CLI，并验证 `command -v buildr`、`buildr --help` 与当前 Codex workspace doctor

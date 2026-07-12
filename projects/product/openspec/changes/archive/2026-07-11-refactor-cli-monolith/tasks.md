## 1. 冻结兼容基线与模块门禁

- [x] 1.1 新增 CLI compatibility verifier，覆盖全部 topic help 的 stdout/退出状态/无副作用、代表性非法输入的 stderr/退出状态、只读 JSON 命令和 source mutation 结果，并在当前巨石实现上运行通过。
- [x] 1.2 新增 CLI architecture verifier，声明 executable、command、application、domain、shared 层级和允许的 import 方向；先让它识别当前巨石缺口，并为后续薄入口、命令唯一登记和循环/反向依赖检查提供确定性诊断。

## 2. 抽取共享基础设施与基础领域

- [x] 2.1 建立 `tools/cli/` runtime tree，抽取 args/path、YAML、Git、filesystem、atomic writer 和 workspace mutation 基础设施；保持同步 API 与错误文本，并运行 Node 语法检查和 managed mutation 专项。
- [x] 2.2 抽取 workspace registry 与 Project/Service command 模块，保留 repo identity、branch intent、Git boundary 和 manifest schema 行为；运行 repository onboarding 与 Service branch 专项检查。
- [x] 2.3 抽取 Rules、Commands 和 Skills 领域的 manifest parser/renderer、validator 与 mutation handlers，确保领域所有权唯一且不复制 shared 写入；运行 CLI compatibility 和相关临时 workspace 专项。
- [x] 2.4 抽取 Components 与 OpenSpec contract guard 领域模块，把跨 Rules/Commands/Skills 的组合提升到显式 application service；运行 Component、OpenSpec contract、managed data integrity 相关专项检查。
- [x] 2.5 完成基础领域任务组后运行 CLI compatibility、architecture import boundary、managed mutation 和受影响 MVP 范围验证，修复所有行为或依赖方向漂移。

## 3. 拆分组合层与命令入口

- [x] 3.1 抽取 runtime command/application 模块并继续复用现有 adapter registry、projection 和 render/check modules，保持 supported/unsupported adapter、render、sync 与 Skill install 行为；运行 runtime contract/parity 专项。
- [x] 3.2 抽取 doctor composition 和各领域 diagnostics，使 doctor 只聚合显式领域结果并保持文本/JSON schema、finding code、summary 和退出状态；运行 Agent-readable doctor 与 CLI compatibility 相关检查。
- [x] 3.3 抽取 package/update/builtin application 模块，将 `packageCheck` 拆为 metadata/inventory、baseline/manifest、runtime/Component 校验和临时 smoke runner，保持统一命令输出与失败语义；运行 `buildr package check` 和 package build 专项。
- [x] 3.4 建立显式 command registry，统一命令路径、help topic 与 handler dispatch；将 `tools/buildr` 收敛为 shebang、bootstrap 和顶层错误处理，并验证所有现有命令仍唯一可达。
- [x] 3.5 完成组合层任务组后运行 CLI compatibility、runtime adapter、package check、managed mutation/data integrity 和受影响 MVP 范围验证，确认没有输出、退出码、写入或回滚漂移。

## 4. 发布边界、文档与最终验证

- [x] 4.1 更新 npm `files` 与 package check，使 tarball 递归包含 `tools/cli/` runtime dependency closure 且不声明内部 public exports；扩展 clean tarball install E2E 比较 checkout/npm 代表性命令行为。
- [x] 4.2 更新 managed mutation verifier 扫描全部发布 runtime modules并使用模块级直接写入白名单；启用 CLI architecture verifier，确保薄入口、命令唯一登记、层级依赖和运行时 inventory 失败时给出可定位诊断。
- [x] 4.3 更新 current-state knowledge、CLI 维护文档和 release checklist，记录内部模块边界、兼容策略、验证入口及“内部模块不是 public API”，不改变用户主路径说明。
- [x] 4.4 冻结最终候选后运行一次 `tools/verify-buildr-product`、`git diff --check` 和 strict OpenSpec validation；随后从 task checkout 运行 `tools/install-buildr-cli`，确认 `command -v buildr`、`buildr --help` 与当前 Agent doctor 均有效。

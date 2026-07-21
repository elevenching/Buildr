## 1. 固定迁移契约与新架构边界

- [x] 1.1 建立冻结 checkpoint `8b3c44d2839be9dac29cdba3170c1a507168d91a` 的行为、源码、测试到新 owner 的迁移矩阵，逐项覆盖 Workspace 模型、旧格式兼容、identity reconciliation、init/sync/doctor、CAS、HTTP、UI、package，并明确排除根 `.buildr/workspace.yml`、Project 和 Service。
- [x] 1.2 增加架构与契约测试，固定 `domain <- application <- interfaces`、application port 与 infrastructure adapter 的依赖方向，拒绝恢复 `tools/`、旧路径 shim、`src/shared` 或 Domain 对 Node/filesystem/YAML/HTTP 的依赖。

## 2. 实现 Workspace Domain 与文件存储适配

- [x] 2.1 在 `src/domain/workspace` 实现纯 `Workspace(id, name, description)`、WorkspaceId/UUID 校验及 name/description 规范化与约束，不引入存储和 runtime 细节。
- [x] 2.2 在 `src/infrastructure/filesystem` 实现 Workspace Manifest repository，支持 canonical schema、legacy schema 读取、YAML 映射、路径解析、稳定渲染和基于 canonical bytes 的 revision。
- [x] 2.3 在 application 与 repository 边界实现 Workspace Manifest 和 Skills Manifest 的 identity reconciliation：复用已有 UUID、补齐单边缺失、发现双边冲突或非法 identity 时零写入失败。
- [x] 2.4 补齐 Domain、canonical adapter、legacy reader、revision 与 identity reconciliation 单元测试，并运行该任务组的 affected 验证。

## 3. 接入 Workspace 应用用例与生命周期

- [x] 3.1 在 `src/application/workspace` 实现 Get、UpdateMetadata、MigrateMetadata 和 GenerateCreatePrompt 用例、最小 ports 及一致的结果/错误模型。
- [x] 3.2 让 `buildr init` 通过同一 identity generator 生成一次 UUID 并写入 Workspace 与 Skills Manifest，支持 `--description`，同时把 package workspace baseline 更新为 canonical Workspace schema。
- [x] 3.3 让 `buildr sync` 显式调用迁移用例，复用现有 mutation transaction 完成双 Manifest 预检、原子写入、写后验证与失败回滚；普通读取和 app 启动不得静默迁移。
- [x] 3.4 让 doctor 通过相同 read model 报告 migration required、identity conflict、invalid schema 和缺少 description，不在诊断过程中修改 Workspace。
- [x] 3.5 补齐应用用例、init、sync、doctor、CAS 和 rollback 的 fast integration tests，并运行该任务组的 affected 验证。

## 4. 恢复 CLI 与本机 Workspace UI

- [x] 4.1 在 command registry 增加唯一的 `buildr app` 命令及 `--target`、`--port` 参数，更新 root/app/init help，保持 `bin/buildr.mjs` 为薄入口。
- [x] 4.2 在 `src/interfaces/local-app/http` 实现固定 target 的 loopback server、API 路由与错误映射，落实随机 token、精确 Origin、JSON content type、32 KiB body limit、revision CAS 和 target/path 参数拒绝。
- [x] 4.3 在 `src/interfaces/local-app/web` 实现只依赖同源 API 的 Workspace 查看、name/description 修改、保存结果和新增 Workspace 可复制 prompt 页面，保持 UI 不直接读写文件。
- [x] 4.4 更新 npm package inventory、静态资源定位、CLI 文档与产品文档，确保 checkout、packed tarball 和本机安装的 `buildr app` 能力一致。
- [x] 4.5 补齐 HTTP/CLI/package integration tests，并在临时 Workspace 中完成桌面与窄屏浏览器检查、修改保存、revision 更新、冲突提示和 prompt 复制验证。
- [x] 4.6 运行 UI/CLI 任务组的 affected 验证，记录实际命令、结果和未执行项。

## 5. 最终收敛与交付判断

- [x] 5.1 更新 Buildr 产品定位、源码架构/current-state 文档与同一产品化任务看板，记录 Workspace 已迁移到新架构，Project、Service 继续冻结。
- [x] 5.2 在前述验证通过后，从新 worktree 安装本地 Product CLI，核对 `buildr --version`、root/app/init help 和 doctor；若影响 Rules、Skills、Components、Commands、项目结构或 runtime 入口，按自举规则执行所需 sync/render 并复核结果。
- [x] 5.3 汇总迁移矩阵、受影响测试证据、根 Workspace 无差异证据和集成建议，保留旧功能 worktree 为冻结参考，不启动 Project、Service 实现。
- [x] 5.4 冻结候选并运行完整 Product Candidate，保存本 change 独立的验证证据；任何失败先修复并按变更分类重跑，不复用旧 checkpoint Candidate 结论。

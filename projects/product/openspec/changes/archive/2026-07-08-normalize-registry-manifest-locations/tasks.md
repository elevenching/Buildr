## 1. Package Baseline

- [x] 1.1 将 root Project registry baseline 从 `package/workspace/projects.yml` 迁移为 `package/workspace/projects/manifest.yml`。
- [x] 1.2 将 Project service metadata baseline 从 `services.yml` 迁移为 `services/manifest.yml`，并写入 `schemaVersion: buildr.services/v1` 和 `project` 字段。
- [x] 1.3 为 `skills/manifest.yml` baseline 补 `schemaVersion: buildr.skills/v1`。
- [x] 1.4 更新 `package/manifest.yml` 的 workspaceFiles、projectFiles 和 package check 映射，并移除旧 `projects.yml` / `services.yml` 映射。

## 2. CLI Registry 读写

- [x] 2.1 将 Project registry helper 改为默认读写 `projects/manifest.yml`，schema 为 `buildr.projects/v1`。
- [x] 2.2 将 Service metadata helper 改为默认读写 `projects/<project>/services/manifest.yml`，schema 为 `buildr.services/v1`。
- [x] 2.3 更新 `init`、`project create`、`service create`、`doctor` 的路径和输出。
- [x] 2.4 保持 `projects/` 和 `services/` 空目录可识别，并确保空 manifest 可被解析。
- [x] 2.5 为 Project/Service manifest 实现封闭 schema 校验和写回：未知字段 warning，`update/sync` 清理。
- [x] 2.6 补齐 entry 默认值：`title` 默认 id、`description` 默认 TODO、Service `type` 默认 `service`、`repo.kind` 默认 `workspace` 或按 `.git/` 推断。

## 3. MVP 旧布局收敛

- [x] 3.1 `update/sync` 发现 root `projects.yml` 时直接删除，不读取、不迁移。
- [x] 3.2 `update/sync` 扫描 `projects/` 直属合法目录，为缺失 entry 生成最小 Project manifest 记录。
- [x] 3.3 `update/sync` 将旧 `projects/<project>/services.yml` 最小转换为 `projects/<project>/services/manifest.yml`，转换后删除旧文件。
- [x] 3.4 `update/sync` 扫描 `projects/<project>/services/` 直属合法目录，为缺失 entry 生成最小 Service manifest 记录。
- [x] 3.5 `doctor` 对未登记目录、缺失 manifest、TODO description、未知字段、非法 path 和 Git repo 缺 `repo.url` 输出 warning。

## 4. Git 边界维护

- [x] 4.1 在 `project create` / `service create` 中为独立 Git Project/Service 补齐最近上级 Git repo 的 `.gitignore` 规则。
- [x] 4.2 在 `update/sync` 中扫描 manifest 和目录事实，幂等补齐缺失 Git 边界。
- [x] 4.3 在 `doctor` 中检查 Git 边界缺失并输出 warning；无上级 Git repo 时不报 warning。

## 5. Runtime、Skill 与文档

- [x] 5.1 更新 runtime render/sync/check，确保 root -> Project -> Service 路径上的 `AGENTS.md` 按当前 Agent adapter 暴露。
- [x] 5.2 更新 Buildr Skill、bootstrap guide 和 current-state 中的 registry 路径、schemaVersion、AGENTS.md 规则资产和 Project/Service 管理心智。
- [x] 5.3 更新 root/project `AGENTS.md` baseline 中的路径说明，并明确 Service `AGENTS.md` 是 service 自身规则资产。
- [x] 5.4 更新 npm package 文件清单和 forbidden path 检查。

## 6. 验证

- [x] 6.1 更新 `tools/verify-buildr-product-mvp` 覆盖新 manifest 路径和 `skills/manifest.yml` schemaVersion。
- [x] 6.2 增加旧 `services.yml` 转换、root `projects.yml` 清理、目录补登记、未知字段清理和 TODO description warning 的临时目录回归测试。
- [x] 6.3 增加独立 Git Project/Service `.gitignore` 边界维护回归测试。
- [x] 6.4 运行 `openspec validate normalize-registry-manifest-locations --strict`。
- [x] 6.5 运行 `tools/verify-buildr-product`。

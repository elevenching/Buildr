## Context

`dev` 已通过 `restructure-product-source-layout` 建立新的产品源码边界：`bin` 是薄入口，`src/interfaces` 适配外部协议，`src/application` 编排用例，`src/infrastructure` 持有 filesystem/process/network/runtime adapters，真实存储无关模型出现后进入 `src/domain`。旧 `tools/` 已彻底删除，架构 verifier 会拒绝旧路径、反向依赖、`src/shared` 和 npm runtime 对 `test/scripts` 的依赖。

Workspace 产品功能已经在冻结分支 `codex/productize-workspace-project-service` 的 commit `8b3c44d2839be9dac29cdba3170c1a507168d91a` 完成模型、迁移、应用用例、loopback API、UI 和 Candidate 验证，但实现仍基于旧 `tools/cli` 结构。该 commit 是行为与测试参考，不是可直接合并的源码输入。主 `dev` 已单独提交当前自举 Workspace 的 canonical `.buildr/workspace.yml`，因此功能恢复不应再次携带根 Workspace diff。

## Goals / Non-Goals

**Goals:**

- 在新架构中恢复冻结 checkpoint 的 Workspace 可观察行为和安全边界。
- 首次建立真正纯净的 `src/domain/workspace`，验证 domain 与文件存储解耦。
- 让 CLI、本机 HTTP 和未来 Agent-facing interface 复用相同应用用例。
- 保持旧 Workspace 可读、迁移显式、跨 Manifest identity 一致、写入事务化且冲突 fail closed。
- 让 npm tarball、checkout 和本机安装后的 `buildr app` 行为一致。

**Non-Goals:**

- 不 rebase、merge 或继续开发旧功能 worktree。
- 不实现 Project、Service 或为它们建立空 domain/application/local-app 目录。
- 不把 YAML parser、filesystem path、HTTP、CLI、Node process 或 runtime 放入 Domain。
- 不引入数据库、Web framework、bundler、TypeScript、SaaS 或 Agent session connector。
- 不修改主自举 Workspace 的 `.buildr/workspace.yml`；它已由 `dev` 的独立 workspace commit 管理。

## Decisions

### 1. 冻结 checkpoint 是行为基线，不是 cherry-pick 输入

实现前建立逐项迁移矩阵：Domain 约束、旧格式兼容、identity reconciliation、init/sync/doctor、CAS 更新、HTTP 安全、Web UI、package 和测试。每一项映射到新 owner 后重新实现；不 cherry-pick 旧 commit，也不恢复 `tools/` shim。

选择重新落位而不是 rebase 解冲突，是因为架构迁移已经改变源码生命周期、composition、verification 和 package inventory。机械解决 rename 冲突会把旧 `workspace-metadata.mjs` 中 YAML/crypto 与 Domain 混合的问题带回新架构。

### 2. Workspace Domain 只表达实体与纯约束

`src/domain/workspace/` 只拥有：

```text
Workspace(id, name, description)
WorkspaceId validation
name/description normalization and validation
```

Domain 不解析 YAML，不计算文件 revision，不知道 `.buildr/workspace.yml`、Skills registry、root path、HTTP 或 CLI。UUID 生成通过 application port 注入，避免 Domain 依赖 Node crypto；UUID 格式校验保持纯函数。

`kind`、`profile` 是文件兼容 metadata，不进入实体。root path 和 revision 是应用 read model 中的存储上下文，也不进入 Workspace 实体。

### 3. Application 持有用例与 ports，filesystem adapter 持有 Manifest

`src/application/workspace/` 定义并组合：

- `GetWorkspace`
- `UpdateWorkspaceMetadata`
- `MigrateWorkspaceMetadata`
- `GenerateWorkspaceCreatePrompt`
- Workspace repository、identity generator 和 transaction 所需 ports

`src/infrastructure/filesystem/workspace-manifest-repository.mjs` 实现 `.buildr/workspace.yml` 与 `skills/manifest.yml.workspaceId` 的读取、YAML adapter、canonical rendering、路径定位和基于 canonical bytes 的 revision。应用用例负责业务白名单、identity reconciliation、revision compare-and-swap 和结果模型；adapter 不生成 UI/CLI 文案。

迁移继续复用现有 Workspace mutation 与 atomic writer。由于迁移同时涉及 Workspace metadata 和 Skills registry，应用层在 transaction 中协调两个持久化写入；任一预检、写入或写后验证失败都整体回滚。

### 4. Init、sync 和 doctor 复用同一 Workspace 应用能力

`buildr init` 通过 identity generator 只生成一次 UUID，并把它交给 Workspace metadata 与 Skills registry writer；不允许两个模块各自生成。`sync` 调用显式 migration 用例，不在普通 read 或 app 启动时静默迁移。doctor 读取相同 repository read model，报告 migration required、identity conflict、invalid schema 和 TODO description。

主 `dev` 当前 `.buildr/workspace.yml` 已 canonical，不进入本 change。package workspace baseline 仍是旧 schema，必须改为 canonical 模板，使新 init 直接产生可编辑 Workspace。

### 5. Local app 是 interface，不是 application service

目录：

```text
src/interfaces/local-app/
  http/server.mjs
  web/index.html
  web/styles.css
  web/app.js
```

HTTP server 只负责路由、请求解析、状态码、安全 header 和 application error 映射；不读取 YAML。Web UI 只调用同源 API，不保存第二套业务事实。CLI `app` command 只解析 `--target/--port` 并调用 local-app interface factory，command registry 仍只登记一次。

静态资源通过 `import.meta.url` 相对 local-app interface 定位，并由 npm package inventory 显式交付。`src` 不读取 checkout-only OpenSpec 或旧 worktree。

### 6. 写 API 保留最小安全边界

进程固定一个 target，只监听 `127.0.0.1`。写请求必须同时满足随机 session token、精确 Origin、JSON content type、32 KiB body limit 和当前 revision；任何 target/path 参数在进入应用用例前拒绝。读 API 只返回 Workspace read model，不返回文件正文、环境变量、token 或 Workspace 外路径。

### 7. 测试按新 ownership 重建，不照搬路径

- `test/unit`：纯 Domain、identity reconciliation、canonical adapter 的小粒度测试。
- `test/integration-fast`：init/sync/doctor、应用用例、CAS、rollback、HTTP 安全和 CLI help。
- `test/contract`：`interfaces -> application -> domain/infrastructure` 依赖方向、local-app 静态资源与 package inventory。
- `test/verification`：package parity、installed tarball、Changed owner 和 Candidate 覆盖。
- 页面交互：使用临时 Workspace 验证桌面/窄屏、修改保存、revision 更新和 prompt 生成；不把浏览器业务状态写回测试 fixture。

冻结 checkpoint 的旧 Candidate 只证明旧实现；新 change 必须生成自己的 affected 和最终 Candidate evidence。

## Risks / Trade-offs

- **[重新实现时遗漏冻结行为]** → 在第一批任务建立 checkpoint-to-owner 矩阵，并把每项行为映射到 spec 场景和测试。
- **[Repository adapter 吞掉应用规则]** → YAML/path/revision 属于 adapter；字段白名单、identity 选择、迁移状态和冲突结果属于 application，架构测试固定依赖方向。
- **[纯 Domain 过度抽象]** → 只抽取已经存在的 Workspace 实体和值约束，不为 Project/Service 或数据库创建空 ports。
- **[sync 同时改两份 Manifest 导致部分写入]** → 使用既有 mutation transaction，写前全量解析，写后重新读取验证，失败回滚。
- **[本机 Web API 被其他页面调用]** → loopback、固定 target、token、Origin、content type、body limit 和 path rejection 组合保护。
- **[静态资源未进入 tarball]** → package inventory、tarball install、CLI package parity 和 app smoke 同时验证。
- **[主 Workspace diff 被重复带入]** → 新 worktree 从当前 `dev` 创建，明确禁止复制冻结分支根 `.buildr/workspace.yml`，只修改 package baseline 和产品源码。

## Migration Plan

1. 记录冻结 checkpoint 行为、文件和测试到新 owner 的映射，确认根 Workspace diff 排除。
2. 实现纯 Workspace Domain 与 filesystem repository adapter，并建立架构门禁。
3. 实现查询、更新、迁移和 prompt application 用例，接入 init/sync/doctor。
4. 实现 local-app HTTP/Web interfaces 和 CLI `app` 表面。
5. 更新 package baseline、npm inventory、docs 和 tests；运行 affected 验证。
6. 在临时 Workspace 与当前自举 Workspace 上分别验证新 init、旧格式迁移和已迁移读取；不从未合并 worktree sync 主 Workspace。
7. 冻结候选，运行 Product Candidate；通过后再按普通 change-flow 决定集成。

回滚以新 task branch 为边界：未通过 Candidate 时不集成 `dev`。不得通过恢复旧 `tools/`、双目录或内部兼容 shim 回滚。

## Open Questions

没有阻塞 proposal 的产品决策。实现时唯一需要保留判断的是 repository port 的最小 JavaScript 形态；它必须服务当前四个 Workspace 用例，不为未来数据库预设通用 ORM 接口。

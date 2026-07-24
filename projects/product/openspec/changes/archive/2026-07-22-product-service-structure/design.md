## Context

`projects/product/` 同时是 Product Project 的 OpenSpec planning root、项目规则与文档根，又是 `@buildr-ai/buildr` npm package root。虽然 Buildr 模型已经要求 Project 通过 `services/manifest.yml` 管理代码 repo 或可执行资产，Product 的 registry 仍为空，导致自举 workspace 无法用真实数据验证 Service 管理。

迁移涉及 400 余处显式或派生的 Product root 引用，并影响公开开发入口、CI working directory、npm tarball、CLI source discovery、安装脚本、Candidate evidence 和 task worktree。迁移必须建立一个新的唯一实现根，不能在 Project 与 Service 下长期复制 package。

## Goals / Non-Goals

**Goals:**

- 让 `product/buildr` 成为真实 `application` Service，并让 Product Project 只保留治理与跨服务资产。
- 将 Buildr npm package 的唯一源码根迁到 `projects/product/services/buildr/`。
- 保持 `projects/product/buildr` 公开开发入口可用，并让 checkout、registry package 与 task worktree source discovery 都能识别新布局。
- 让 Product 级验证从 Project root 编排 OpenSpec 与 Service package 的完整 Candidate。
- 保持 npm identity、公开命令、workspace 初始化和 runtime 交付行为兼容。

**Non-Goals:**

- 不在本次迁移中把 Buildr 拆成 `core`、`cli`、`local-app` 等多个 Service。
- 不建立独立 nested Git repository；首版 Service 使用当前 workspace Git 边界内的 `workspace` source。
- 不改变 Project、Service Domain schema，不新增 `type` 枚举。
- 不借迁移重写业务实现或改变 CLI 命令语义。

## Decisions

### 1. Project root 是治理根，Service root 是可执行产品根

Project root 保留 `AGENTS.md`、`openspec/`、`capabilities.yml`、`commands.yml`、`verification.yml`、`services/manifest.yml` 和项目级产品/roadmap 文档。Service root 拥有 `package.json`、lockfile、`bin/`、`src/`、`test/`、`scripts/`、`package/` 及随 npm package 发布或直接维护实现的文档。

替代方案是只在 registry 中登记指向 `projects/product` 的重叠 Service；这会让 Project 与 Service 共享同一 source path，无法证明真实所有权分离，因此不采用。

### 2. 首个 Service 使用 `buildr` / `application` / workspace source

Service code 为 `buildr`，名称为“Buildr”，类型为开放词表中的 `application`，路径固定为 `projects/product/services/buildr`。它代表当前单一构建、验证和发布单元；CLI 与本机应用尚未独立发布，不提前拆成虚假多服务。

### 3. 保留 Project 级兼容 CLI bridge

`projects/product/buildr` 保留为薄桥接入口，只加载 `services/buildr/bin/buildr.mjs`。公开 README、root AGENTS 和用户已有开发命令可以继续工作，但桥接文件不拥有运行实现。Service root 同时提供 package-native `buildr`/`bin/buildr.mjs`。

### 4. Product verification 由 Project 编排、在 Service 执行

Product Project 是 Candidate policy owner，OpenSpec 和项目级契约仍从 Project root 读取；npm、源码、package 与测试命令从 Service root 执行。验证脚本必须显式解析 `projectRoot` 与 `serviceRoot`，evidence 同时记录两者，不能继续把单一 `productRoot` 当作所有权事实。

### 5. 文档按受众与发布生命周期拆分

产品定位、Roadmap、Project OpenSpec 导航留在 Project；CLI reference、runtime adapter、CLI architecture、release/maintenance 等随实现演进或进入 npm tarball 的文档迁入 Service。根 README 更新链接，但不复制两套正文。

### 6. 使用一次性 Git rename 迁移，禁止双根兼容实现

迁移批次先更新结构与入口，再机械修正路径契约，最后运行 affected 与 Candidate。兼容性只通过薄 bridge 和路径解析实现，不在旧位置保留 `src/`、`test/`、`package/` 或第二份 package metadata。

### 7. 仓库根 consumer 是已确认的关联实施范围

Product Project 仍是 OpenSpec planning root；仓库根 `.github/`、公开 README、root `AGENTS.md` 与 workspace Skill 只作为新 Service 布局的直接 consumer 更新，不取得 Product governance 或 Service implementation 所有权。2026-07-23 用户明确确认将这些 consumer 纳入同一次迁移，避免保留指向旧 package root 的失效入口。

## Risks / Trade-offs

- [大量路径引用造成漏改] → 建立旧 root inventory，架构 verifier 拒绝除白名单 bridge/治理资产外的旧 package-root 假设。
- [npm package 无法引用 Project 外部文档] → 将 publishable implementation docs 移入 Service，package files 只引用 Service root 内文件。
- [CLI source discovery 把 Service root 误判为普通 nested repo] → 用 package identity、Project registry 与 canonical Service path 联合识别 development checkout。
- [task worktree/更新流程仍假设 `projects/product`] → 保留 Project bridge，并为 source resolution、update、安装和 Candidate 加入新布局回归。
- [一次性迁移 diff 过大] → 分成 registry/结构、入口/运行、验证/发布、文档/契约四个任务组，每组只运行最低充分验证。

## Migration Plan

1. 登记 `product/buildr` Service，建立 Service `AGENTS.md` 和 package root skeleton，验证 Project/Service read model。
2. 使用 Git rename 迁移可执行产品资产，保留 Project bridge；修复相对 imports 和源码自定位。
3. 更新验证、CI、发布、安装和 tarball 路径，增加旧根残留检查。
4. 拆分并修正文档入口、root 自举说明和 current-state knowledge。
5. 运行 affected；在用户验收真实 Service 与开发入口后冻结 Candidate。

回滚以任务分支为单位：Candidate 前保留单一 worktree；任何批次无法维持 bridge、npm pack 或 fast verification 时停止后续迁移，不向 `dev` 集成部分布局。

## Open Questions

无阻塞问题。未来是否将 CLI、本机应用或其他运行单元拆成多个 Service，等待它们具备独立构建、验证或发布生命周期后另立 change。

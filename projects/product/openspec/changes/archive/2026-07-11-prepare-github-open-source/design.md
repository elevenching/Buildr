## Context

Buildr 当前以自举 workspace 中的 `projects/product/` 作为产品源，CLI 依赖 npm package 中的 `yaml`。已有 E2E 会验证本地 npm tarball安装，但公开 README 的开发仓库路径与真实目录结构不一致，安装脚本也假设依赖已存在，因此已有开发环境和干净 clone 的行为不同。产品同时已经实现 Service registry、远端 resolved Skill 和 runtime reconcile，但分支输入与网络失败边界仍不完整。

本 change 横跨安装、CLI、runtime、package metadata、文档和验证。GitHub 仓库级的 License、CI、贡献与安全文档属于 repo maintenance；产品行为和交付源仍只在 `projects/product/` 维护。

## Goals / Non-Goals

**Goals:**

- 让 Agent 能从干净 GitHub clone 或 npm tarball开始，完成 CLI 安装、workspace 初始化、当前 runtime 同步和 doctor 验证。
- 让首次安装路径有可重复的自动 smoke test，并在 GitHub Actions 中执行完整产品验证。
- 补齐现有 Service branch 契约和远端 Skill 有界失败。
- 提供足够的开源治理、CLI reference 和示例材料，使仓库可以公开而不会依赖内部口头知识。
- 以低风险拆分减少生产包中的明显验证耦合和未使用入口，但保持现有 public CLI 兼容。

**Non-Goals:**

- 不在本 change 中完成 Homebrew、standalone binary 或正式 npm registry 发布。
- 不重写整个 7,000+ 行 CLI，也不改变 Organization/Project/Service 核心模型。
- 不新增 Agent runtime adapter、权限系统、远程 Component registry 或 Web UI。
- 不承诺所有历史维护脚本成为稳定 public API。

## Decisions

### 1. 开发仓安装使用产品目录入口并自动准备锁定依赖

公开仓库的 canonical 命令从 repo root 进入 `projects/product/`，执行 `tools/install-buildr-cli`。安装脚本先验证 Node/npm；仅当运行依赖不可解析时执行 `npm ci --omit=dev`，然后再安装符号链接。这样既保持开发 checkout 可编辑，也避免每次安装重复联网。

备选方案是新增 root 产品 wrapper，但这会把产品实现复制到 Buildr 安装结果所在的 workspace root，违反产品源只在 `projects/product/` 维护的自举边界，因此不采用。

### 2. 首次 Agent 闭环统一使用 sync

安装 CLI 后，公开说明使用 `runtime list` 确认 adapter、`init` 创建源资产，再运行 `sync <agent>`。`sync` 已包含产品 Buildr Skill 安装、workspace/project Skills 渲染和 doctor，因此不再把多个低层命令作为默认首次路径。

### 3. Service branch 使用显式 `--branch`

`service create` 新增可选 `--branch <name>`。Git URL 首次 materialize 时使用 `git clone --branch <name> --single-branch`；既有 repo 幂等修复时验证当前分支和 metadata branch intent。Service registry 在 `repo.branch` 保存显式 intent，`repo.defaultBranch` 继续表示远端默认事实，两者语义不混用。

### 4. 远端 Skill 下载使用子进程总超时和请求 inactivity timeout

保留当前同步 resolver，增加可配置但有上限的默认超时。HTTP 子进程设置 socket timeout，父进程 `execFileSync` 设置总 timeout；错误信息包含 URL 和下一步。相比引入新的 HTTP dependency，这一方案改动小且适合当前单依赖 CLI。

### 5. 发布材料分为产品包和 GitHub 仓库两层

`projects/product/` 保存 npm package metadata、产品 License、CLI reference 和产品试用说明；GitHub repo root 保存仓库级 License、CONTRIBUTING、SECURITY 和 workflow。两层 License 使用同一 MIT 文本，避免 npm tarball依赖包根之外的文件。

### 6. 只做低风险结构收敛

本 change 将 repository onboarding smoke test独立为 verifier，并从 npm `files` 中移除确认未被运行时或 package check 使用的旧 standalone adapter/checker文件。`package check` 的大规模拆分另行 change 处理，避免把开源阻塞修复和核心重构绑定。

## Risks / Trade-offs

- [安装脚本自动执行 npm] → 只在依赖缺失时运行，使用 lockfile 和 `npm ci --omit=dev`，并在执行前输出明确提示。
- [GitHub clone 的默认分支名或远端不可用] → smoke test不依赖远端 GitHub，本地复制一个不含 `node_modules` 的候选树后验证。
- [Service branch 与远端默认分支混淆] → metadata 分离 `branch` 和 `defaultBranch`，doctor 分别诊断。
- [网络 timeout 对慢连接过于严格] → 提供环境变量覆盖，同时设置合理默认值和最大值。
- [移除打包文件影响隐藏调用] → 仅移除主 CLI、package check 和文档均未引用的 standalone 文件，并由 npm 安装 E2E 验证核心命令。
- [开源材料中的仓库 URL 未确定] → 不伪造 URL；CLI reference 和本地安装路径使用相对 repo 结构，发布地址后续可补。

## Migration Plan

1. 新增 delta specs 和实现测试，保持现有命令兼容。
2. 修改 installer、Service、remote resolver 和 package metadata。
3. 更新产品与仓库级公开材料，并增加 GitHub Actions。
4. 在不含 `node_modules` 的临时仓库副本执行 Agent onboarding smoke test。
5. 运行最终完整产品验证、strict OpenSpec validation 和 npm pack 检查。

回滚时可以恢复 installer、package metadata 和新增可选参数；现有 workspace 数据不需要迁移。已记录 `repo.branch` 的新 manifest 若回滚到旧 CLI，会因封闭 schema 被拒绝，因此发布后不应单独回滚 CLI 而保留新 metadata。

## Open Questions

- 正式公开 npm scope、GitHub URL 和发布凭据由首次发布时决定，不阻塞 GitHub 开源。

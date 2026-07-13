# Buildr

中文 | [English](README.en.md)

Buildr 是面向人、Agent 和组织的工作资产治理系统。

它把组织长期复用的规则、技能、命令、规范、产品事实和协作流程沉淀为可共享、可审计、可适配不同 Agent 的工作区（workspace）源资产，支撑多人、多职责、多项目、多服务的稳定协作。

```text
Manage assets in Buildr. Work through Agent.
```

## 核心模型

Buildr 把一个工作目录变成工作区。工作区是个人或组织的组织（Organization/Root）资产根。

```text
Organization/Root
  └── Project
        └── Service
```

- **组织（Organization/Root）**：组织级规则、技能、组件、命令和项目登记。
- **项目（Project）**：业务、产品线、系统或长期工作单元，可独立成 Git 仓库。
- **服务（Service）**：项目管理的代码仓、应用、模块或可执行资产。
- **Agent runtime**：Claude Code、Codex 等 Agent 实际运行 Buildr 资产的位置，是可重建渲染产物。

Buildr 保存工作资产源头，Agent runtime 只是渲染结果。Buildr 源资产不保存二进制文件、token、cookie、登录态或个人私有配置。

## 以 Agent 推理和引导为主

Buildr 面向的用户包括人和 Agent。人负责表达目标、提供业务判断并确认重要决策；Agent 负责理解 workspace 上下文、判断用户意图对应的资产类型、诊断当前状态，并引导后续操作。

[Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md) 是 Agent 使用 Buildr 的主要产品入口。它帮助 Agent：

- 理解 Organization/Root、Project、Service、Rules、Skills、Components、Commands 和 Agent runtime；
- 根据用户意图选择初始化、更新、同步、诊断或资产维护动作；
- 在存在冲突、风险或需要业务判断时向人说明情况并请求决策；
- 使用 Buildr CLI 作为确定性的执行和校验层，完成 workspace 与 Agent runtime 的维护闭环。

因此，人通常不需要先学习完整命令体系。可以直接向 Agent 描述目标，由 Agent 按 Buildr Skill 推理、执行和引导。CLI 仍保持可直接使用，并为 Agent 和高级用户提供一致、可验证的操作入口。

## 快速开始

最简单的方式是把本 README 给 Agent，然后告诉它：

```text
使用 Buildr 管理这个项目。
```

Buildr 根据当前 `buildr` 命令的实际来源自动区分两种模式。

### 开发者模式：本地 Git checkout

```bash
git clone https://github.com/elevenching/Buildr.git
cd Buildr/projects/product
tools/install-buildr-cli
buildr --help
```

安装脚本会在运行依赖缺失时按 `package-lock.json` 执行 `npm ci --omit=dev`，然后把当前 checkout 的 `buildr` 安装到 `~/.local/bin`。需要其他位置时设置 `BUILDR_CLI_INSTALL_DIR`。

### 发布模式：npm registry package

```bash
npm install --global @buildr-ai/buildr@next
buildr --help
```

当前公开试用版本是 [`0.1.0-rc.1`](https://github.com/elevenching/Buildr/releases/tag/v0.1.0-rc.1)，`next` 始终用于 release candidate。使用中遇到问题或希望提供建议，请提交 [GitHub Issue](https://github.com/elevenching/Buildr/issues/new/choose)；安全漏洞请按[安全报告](SECURITY.md)私下报告。当前试用边界见[已知限制](projects/product/docs/known-limitations.md)。

### 初始化 workspace

两种安装模式都使用相同的 onboarding：

```bash
buildr runtime list --json
buildr init --agent <agent> --target . --name <name> --profile <personal|team|company>
```

`init --agent` 会初始化 Organization/Root 源资产和当前 Agent runtime，并执行最终 doctor。不带 `--agent` 的 `init` 只初始化源资产。

初始化完成后，当前 Agent runtime 会获得 Buildr Skill。后续可以继续直接向 Agent 表达创建 Project、接入 Service、维护工作资产或诊断 workspace 等目标。

根据目标继续创建 Project 或接入 Service：

```bash
buildr project create <project> --target . [--repo <git-url>] [--title <text>] [--description <text>]
buildr service create <project>/<service> <repo-ref> --target .
buildr doctor --agent <agent> --target . --json
```

如需恢复或排查初始化入口，读取兜底指南：

```bash
buildr bootstrap guide
```

## 更新与同步

`buildr update` 更新 Buildr CLI 自身；`buildr sync <agent>` 同步 workspace assets 和当前 Agent runtime。通常只需向 Agent 表达“更新 Buildr”“只更新 Buildr”或“同步 workspace”，由 Buildr Skill 判断并引导正确流程。具体行为见 [Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md)，完整参数见 [CLI Reference](projects/product/docs/cli-reference.md)。

## 当前支持摘要

- Buildr Skill 让 Agent 从用户自然语言目标出发，理解上下文、选择 Buildr 能力并引导决策。
- Buildr CLI 提供初始化、资产维护、诊断、更新、同步和 runtime render 的确定性执行层。
- 当前 runtime adapter 支持 `claude-code` 和 `codex`；用 `buildr runtime list --json` 查看支持矩阵。
- Rules 支持 Root、Project、Service 和任意深层 workspace scope；Codex 原生读取，Claude Code 生成 reference bridge。
- workspace/project Skills 支持本地作者型 Skill 和远端发布型 Skill。
- workspace Components 统一管理 Rules、Skills、Command collections 和声明式 Skill Contribution；当前不支持 Project/Service Component。
- Commands 声明并检查组织复用的外部 CLI，但不自动修改本机环境。
- Buildr source mutation 使用严格 identity、scope/ownership 校验、原子写入和 workspace transaction；异常残留由 doctor fail closed 报告。
- workspace assets 当前随 CLI package 发布；未来独立版本化方向只记录在 Roadmap，不是当前实现。

## 文档

- [Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md)：Agent 理解和使用 Buildr 的主要产品入口。
- [Buildr 产品说明](projects/product/docs/buildr-product.md)：产品定位、核心模型、工作资产、协作方式和后续方向。
- [Buildr current state](projects/product/openspec/knowledge/buildr-current-state.md)：当前已实现事实。
- [OpenSpec specs](projects/product/openspec/specs/)：规范性产品行为契约。
- [CLI Reference](projects/product/docs/cli-reference.md)：公开命令和参数边界。
- [文档说明](projects/product/docs/document-index.md)：README、docs、knowledge、specs 和 archive 的分工。
- [Roadmap 资料](projects/product/docs/roadmap/)：尚未实现的产品方向，不作为当前事实或实施契约。
- [发布检查清单](projects/product/docs/release-checklist.md)：发布准备和验证入口。
- [已知限制](projects/product/docs/known-limitations.md)：当前试用范围与未实现能力。
- [最小 Workspace 示例](projects/product/examples/minimal-workspace/README.md)：高层 init onboarding 的最小路径。

## Buildr 自举 workspace

本仓库同时是 Buildr 用来开发、验证和消费自身产品能力的自举 workspace，也是一个 Buildr Organization/Root 实例。

- Buildr 产品源只在 `projects/product/` 维护，包括 CLI、package assets、产品 docs 和 OpenSpec。
- 根目录中的 Rules、Skills、Components、Commands 和 Agent runtime 是当前 workspace 消费 Buildr 后的状态，不是产品源。
- `projects/product/buildr` 是当前 Product checkout 的本地 CLI 入口：

```bash
projects/product/buildr runtime list --json
projects/product/buildr doctor --agent <agent> --target . --json
```

仓库协作入口：

- [贡献指南](CONTRIBUTING.md)
- [安全报告](SECURITY.md)
- [MIT License](LICENSE)
- [GitHub Issues](https://github.com/elevenching/Buildr/issues)

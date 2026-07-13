# Buildr

中文 | [English](README.en.md)

Buildr 是以 Agent 为主要用户的组织工作资产管理系统。

它把散落在员工经验、文档、仓库和工具中的工作内容、工作能力与项目结构，沉淀为可共享、可复用、可审计的组织资产，并让这些资产可在不同 Agent runtime 中使用。

Agent 从中发现任务所需的信息和能力，跨领域、跨服务完成端到端工作；人通过 Agent 表达目标、提供判断并参与关键决策。

## 为什么需要 Buildr

Agent 的能力越来越强，但组织真正依赖的经验、能力和知识仍散落在员工个人与不同工作载体中：

- 一个人探索出的工作方法、专业能力和工具用法，只能靠文档、会议、IM 或口口相传给其他人，难以持续沉淀为组织资产。
- 团队没有统一 Agent 工具，或准备切换 Agent 时，需要为每个客户端重新维护工作环境，组织资产容易漂移。
- 一个业务项目包含多个 Service，Agent 从单个仓库开始工作时，很难自然获得端到端的项目视野。
- 产品、设计、开发、测试和发布内容分散在不同岗位与工具中，Agent 往往只能感知当前工作范围内的信息，难以主动发现其他岗位或服务中与任务相关的依赖。

Buildr 把个体员工积累的经验和能力转化为组织可以共同维护的工作资产。不同成员和 supported Agent runtime 可以从同一组织基础开始工作，让个人探索成为可共享、可传承、可持续演进的组织价值。

## Buildr 如何工作

```text
组织成员共同沉淀工作方式
              │
              ▼
 组织知识 · 规则边界 · 专业能力 · 工具接入
 项目服务 · 规范事实 · 协作流程 · ...
              │
              ▼
       Buildr workspace
   共享、可审计的工作资产源头
              │
              ▼ runtime render
     Codex · Claude Code · ...
              │
              ▼
 Agent 发现任务相关资产，形成任务上下文
              │
              ▼
     Agent 推进工作并引导用户决策
```

Buildr 管理的是组织工作资产，不是 context window。它把工作资产组织成 Agent 可发现、可选择、可使用的共享工作环境，并按 runtime adapter 投射必要入口；Agent 再根据当前任务选择相关内容，形成 context window 中的任务上下文。

Buildr 不承诺把所有信息自动装入 context window，也不使用固定岗位路由替 Agent 判断相关性。它提供组织化的信息、能力和边界，让 Agent 有基础建立相关而充分的任务上下文。

```text
Organize work in Buildr. Work through Agents.
在 Buildr 中组织工作，通过 Agent 开展工作。
```

## 谁会从 Buildr 受益

| 角色 | Buildr 带来的价值 |
|---|---|
| 个人用户 | 沉淀并复用自己验证过的工作方法、专业能力和工具用法，借助 Agent 完成跨项目、跨服务的端到端任务，提高工作效率与质量 |
| 团队负责人 | 把成员各自探索出的工作方式转化为团队共享资产，让人和 Agent 在共同的规则、能力与项目结构上工作 |
| 企业负责人 | 将散落在员工个人经验、工作能力和各处组织知识中的内容统一治理，沉淀为可共享、可传承、可复用的组织资产与组织价值 |

Buildr 当前是文件系统、Git、CLI 和 Agent runtime adapter 驱动的 MVP，不是完整的企业权限、云服务或审计平台。当前能力与未来方向会在文档中明确区分。

## 典型场景

### 分享团队验证过的工作能力

把个人探索出的工作方法、专业能力和工具接入沉淀到 Buildr。当前可以通过 Rule、Skill、Command collection 或 Component 等形式管理；其他成员同步 workspace 后，即可让自己的 Agent 使用同一套组织资产。

### 在不同 Agent 工具间保持一致

Buildr 维护标准源资产，再由 runtime adapter 为 Codex、Claude Code 等 supported Agent 生成各自需要的入口。更换 Agent 工具时，不需要把组织工作方式重新手工整理一遍。

### 组织多 Service 的端到端项目

Project 表示业务、产品线或长期工作单元，Service 表示代码仓、应用或模块。Agent 从 Buildr workspace 开始，可以理解它们之间的组织关系，而不是一次只拿到一个孤立仓库。

### 支撑跨岗位协作

产品事实、规范、设计约束、开发流程、测试要求和发布边界可以作为 Project 或 workspace 资产被组织。Agent 在任务需要时可以发现其他岗位已经沉淀的相关内容，减少依赖临时会议和人工转述的信息损耗。

## 核心模型

```text
Organization/Root
  └── Project
        └── Service
```

- **组织（Organization/Root）**：Buildr workspace 根，保存组织级 Rules、Skills、Components、Commands 和 Project registry。
- **项目（Project）**：业务、产品线、系统或长期工作单元，不等同于单个代码仓，可拥有独立资产 repo。
- **服务（Service）**：Project 管理的代码仓、应用、模块或可执行资产。
- **Agent runtime**：Codex、Claude Code 等 Agent 实际读取 Buildr 资产的位置，是可重建投射，不是事实源。

Buildr workspace 是工作资产的源头，Agent runtime 只是渲染结果。Buildr 不保存 binary、token、cookie、登录态或个人私有配置；Commands 只声明和检查外部 CLI，不自动修改本机环境。

## 快速开始

人通常不需要先学习 Buildr 的完整模型和命令。最简单的方式是把本 README 给 Agent，然后告诉它：

```text
使用 Buildr 管理这个项目。
```

### 1. 选择 Buildr 来源

#### 发布版本

```bash
npm install --global @buildr-ai/buildr
buildr --help
```

正式版发布前可使用 release candidate；具体版本和 tag 以 [GitHub Releases](https://github.com/elevenching/Buildr/releases) 为准。当前试用范围见[已知限制](projects/product/docs/known-limitations.md)。

#### 开发 checkout

需要开发 Buildr 或直接试用仓库中的最新产品源时：

```bash
git clone https://github.com/elevenching/Buildr.git
cd Buildr/projects/product
tools/install-buildr-cli
buildr --help
```

安装脚本会把当前 checkout 的 `buildr` 安装到本机命令入口。完成后，进入你希望由 Buildr 管理的目录，再执行下面相同的初始化流程。开发阶段的 Buildr 产品维护命令仍应使用当前 checkout 的 `projects/product/buildr`。

### 2. 初始化 workspace 与 Agent runtime

```bash
buildr runtime list --json
buildr init --agent <agent> --target . --name <name> --profile <personal|team|company>
```

`runtime list` 让 Agent 确认当前支持的 runtime adapter。`init --agent` 初始化 Organization/Root 源资产、准备当前 Agent runtime，并执行最终 doctor；不带 `--agent` 的 `init` 只初始化源资产。

初始化后继续直接向 Agent 表达目标，例如：

```text
为这个产品创建一个 Project，并接入 API 和 Web 两个 Service。
把我们团队的代码审查规则和发布流程组织成可共享工作资产。
检查当前 workspace，并同步到我的 Agent。
```

Agent 会通过 [Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md) 理解目标并选择动作。对应的确定性 CLI 入口包括：

```bash
buildr project create <project> --target . [--repo <git-url>] [--title <text>] [--description <text>]
buildr service create <project>/<service> <repo-ref> --target .
buildr doctor --agent <agent> --target . --json
```

如 Buildr Skill 尚不可用，Agent 可以读取兜底指南：

```bash
buildr bootstrap guide
```

## 更新与同步

`buildr update` 更新 Buildr CLI 自身；`buildr sync <agent>` 同步 workspace 产品资产和当前 Agent runtime。日常使用时可以直接告诉 Agent“更新 Buildr”“只更新 Buildr”或“同步 workspace”，由 Buildr Skill 选择正确流程。

具体行为见 [Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md)，完整参数见 [CLI Reference](projects/product/docs/cli-reference.md)。

## 当前支持摘要

- Buildr Skill 让 Agent 从自然语言目标出发，理解 Buildr 工作资产、判断下一步并引导用户决策。
- Buildr CLI 提供初始化、资产维护、诊断、更新、同步和 runtime render 的确定性执行层。
- 当前 runtime adapter 支持 `claude-code` 和 `codex`；使用 `buildr runtime list --json` 查看事实矩阵。
- Rules 支持 Root、Project、Service 和任意深层 workspace scope；Codex 原生读取，Claude Code 使用生成的 reference bridge。
- workspace/project Skills 支持本地作者型和已解析的远端来源。
- workspace Components 统一管理 Rules、Skills、Command collections 和声明式 Skill Contribution；当前不支持 Project/Service Component。
- Commands 声明并检查组织复用的外部 CLI，但不负责安装或修改本机环境。
- Buildr source mutation 使用严格 identity、scope/ownership 校验、原子写入和 workspace transaction；异常残留由 doctor fail closed 报告。
- workspace assets 当前随 CLI package 发布；独立资产版本化、完整企业权限和更多 runtime adapter 仍是后续方向。

## 文档

- [Buildr 产品说明](projects/product/docs/buildr-product.md)：产品定位、问题、核心模型、工作资产、协作方式和后续方向。
- [Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md)：Agent 理解和使用 Buildr 的主要产品入口。
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

如果你通过快速开始中的开发 checkout 路径进入本仓，需要区分两层内容：Buildr 产品源只在 `projects/product/` 维护；根目录中的 Rules、Skills、Components、Commands 和 Agent runtime 是当前自举 workspace 消费 Buildr 后的状态，不是产品源。

开发和验证 Buildr 时，始终使用当前 Product checkout 的 CLI，避免误用本机其他来源的 `buildr`：

```bash
projects/product/buildr runtime list --json
projects/product/buildr doctor --agent <agent> --target . --json
```

仓库协作入口：

- [贡献指南](CONTRIBUTING.md)
- [安全报告](SECURITY.md)
- [MIT License](LICENSE)
- [GitHub Issues](https://github.com/elevenching/Buildr/issues)

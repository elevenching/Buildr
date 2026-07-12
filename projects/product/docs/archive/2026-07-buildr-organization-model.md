> Archived historical note. Not a current Buildr product source of truth.

# Buildr Organization 抽象与采用场景

本文沉淀 Buildr 产品化中的核心层级抽象：个人、小团队、咨询方和企业团队应使用同一套模型，只是在不同层级需要的能力深度不同。

## 核心判断

用户使用 Buildr 时，第一步通常是选择一个文件夹作为上下文起点。这个起点天然就是个人、团队、客户或公司的 Organization 边界。

因此，Buildr 默认模型应是：

```text
Buildr root / Organization context
└── Project
    └── Service
        └── Agent Runtime
```

`Organization` 仍然是产品语义，但不再默认表现为额外物理目录。一个 Buildr root 就是一个 Organization 上下文实例。

## Organization 的语义

`Organization` 是 Buildr 的最高所有权和规则边界。它可以代表：

- 个人：`personal`、`demo-user`。
- 团队：`frontend-team`、`platform-team`。
- 客户：`client-a`、`client-b`。
- 公司：`acme`、`example-co`。

个人视角和公司视角在模型上是一样的：都先选择一个 root，然后在 root 下管理项目、规则、实践和 Skills。共享、基础或平台服务通过普通 Project 表达。

## 默认目录

新 Buildr root 的默认结构：

```text
<buildr-root>/
├── AGENTS.md
├── README.md
├── .buildr/workspace.yml
├── projects.yml
├── rules/
├── practices/
├── skills/
└── projects/
    └── <project>/
        ├── AGENTS.md
        ├── openspec/
        ├── practices/
        ├── skills/
        ├── services.yml
        └── services/
```

旧多组织目录不再是默认或兼容路径。旧目录如需保留，应通过一次性迁移转为 root-as-Organization 布局。

## 个人用户采用场景

一个个人开发者有多个已有代码仓：

```text
~/code/
├── blog-api/
├── blog-web/
└── ai-tools/
```

他可以创建一个个人 Buildr root：

```bash
mkdir personal-buildr
cd personal-buildr
buildr init --name demo-user --profile personal
buildr project create blog --title Blog
buildr service create blog/api ~/code/blog-api
buildr service create blog/web ~/code/blog-web
buildr doctor
```

在这个场景下：

- `personal-buildr/` 本身就是个人 Organization 上下文。
- `projects.yml` 记录 workspace 管理的项目和 Project 资产来源。
- `projects/blog/` 是项目资产。
- `projects/blog/services.yml` 记录服务仓引用。
- `doctor` 检查 root、项目、服务和 runtime 是否可用。

## 企业采用场景

一家企业决定用 Buildr 治理 Agent 的项目上下文。

平台或架构团队可以创建专门的 Buildr root：

```bash
mkdir acme
cd acme
buildr init --name acme --profile company
buildr project create shop --title Shop
buildr service create shop/api ../shop-api
buildr service create shop/web ../shop-web
buildr doctor
```

在这个场景下：

- `acme/` 本身就是企业 Organization 上下文。
- 根 `AGENTS.md`、`rules/`、`practices/`、`skills/` 表达企业级规则和复用能力。
- `projects/shop/` 表达业务系统上下文。
- 跨项目共享、基础或平台服务通过普通 Project 表达，例如 `projects/foundation/` 或 `projects/platform/`。
- Runtime 是面向 Claude Code、Cursor、Qoder、Codex 等 Agent 的适配产物。

## MVP 命令语义

| 命令 | 产品语义 | 回答的问题 |
|------|----------|------------|
| `buildr init --name <name>` | 创建 root-as-Organization 的 Buildr 实例 | 我从哪里开始？ |
| `buildr project create <project> [--repo <git-url>]` | 创建项目上下文边界并维护 `projects.yml` | 某个业务、产品或系统的上下文放哪里？ |
| `buildr service create <project>/<service> <repo-ref>` | 把已有代码仓登记为项目服务 | 我的代码仓如何接入 Buildr？ |
| `buildr doctor` | 检查 root、项目、服务和 runtime 是否可用 | 我配置对了吗？下一步做什么？ |

旧多组织 scope 不再作为产品能力保留。

## 产品设计原则

1. Buildr 是上下文和规则资产管理系统，不是代码仓管理器。
2. Organization 是最高所有权和规则边界，默认由 Buildr root 承载。
3. Project 是业务、产品或系统上下文，不等于代码仓。
4. Service 是项目下的代码仓、应用、模块或可执行单元。
5. `service create` 维护 repo 引用和 metadata，不把 service repo runtime 作为默认副作用写入业务仓。
6. `doctor` 是 onboarding 和治理入口，不只是静态校验命令。

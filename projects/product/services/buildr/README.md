# Buildr

中文 | [English](https://github.com/elevenching/Buildr/blob/main/README.en.md)

Buildr 是为组织和 Agent 构建的工作资产治理系统。它把组织持续积累的工作事实和工作方法治理成 Agent 可用的工作资产。官方源码位于 [elevenching/Buildr](https://github.com/elevenching/Buildr)，公开 npm package 为 `@buildr-ai/buildr`，安装后使用 `buildr` 命令。

任何人进入组织都可以从一句自然语言指令开始，由 Agent 准备工作环境并进入任务。

Workspace 等同于 Buildr 治理的工作目录，也是 Skill 的唯一 source authority。Project 只表达业务、依赖、applicability 和 capability context，不是 Skill 安装范围。Skill 在 workspace `skills/` 维护后，可显式 render 到当前工作目录的 `workspace` destination，或个人所有工作目录共享的 `user` destination；Buildr 会在可观测 Agent Skills 集上先检查同名 identity、ownership 与内容冲突。

```bash
npm install --global @buildr-ai/buildr@next
buildr runtime list --json
buildr init --agent <agent> --target . --name <name> --description <description> --profile <personal|team|company>
```

初始化后可运行 `buildr app --target .`，在只监听本机的页面中查看 Workspace 与 Projects。页面可受控修改 Workspace/Project 的名称和说明，并展示 Project 的 source 声明及实时 Git 状态；新建 Workspace 或 Project 只生成可复制给 Agent 的指令。

当前公开试用版本是 [`0.1.0-rc.3`](https://github.com/elevenching/Buildr/releases/tag/v0.1.0-rc.3)。使用反馈请提交 [GitHub Issue](https://github.com/elevenching/Buildr/issues/new/choose)，安全漏洞请按 [SECURITY.md](https://github.com/elevenching/Buildr/blob/main/SECURITY.md) 私下报告。

完整产品定位、核心模型、快速开始、当前能力和文档导航见仓库根目录的[中文 README](https://github.com/elevenching/Buildr#readme) 或 [English README](https://github.com/elevenching/Buildr/blob/main/README.en.md)。

本目录是 Product Project 登记的 `product/buildr` application Service，也是 `@buildr-ai/buildr` package、CLI、本机应用、测试与交付资产的唯一实现根。Service 开发约定见 [AGENTS.md](AGENTS.md)，产品治理事实见 [Buildr 产品说明](../../docs/buildr-product.md)、[Buildr current state](../../openspec/knowledge/buildr-current-state.md) 和 [OpenSpec specs](../../openspec/specs/)。

产品验证由统一 registry 和 DAG planner 驱动：`npm test` 运行固定 Fast，日常使用 `npm run test:changed -- --plan` 查看 Git 改动会选择哪些步骤，正式候选始终运行完整 `npm run test:candidate`；失败定位统一使用 `npm run test:focus -- <step-id|group:<group>>`。职责边界见 Project 的[验证覆盖职责矩阵](../../docs/verification-ownership.md)。

# Buildr

中文 | [English](https://github.com/elevenching/Buildr/blob/main/README.en.md)

Buildr 是面向人、Agent 和组织的工作资产治理系统。官方源码位于 [elevenching/Buildr](https://github.com/elevenching/Buildr)，公开 npm package 为 `@buildr-ai/buildr`，安装后使用 `buildr` 命令。

```bash
npm install --global @buildr-ai/buildr@next
buildr runtime list --json
buildr init --agent <agent> --target . --name <name> --profile <personal|team|company>
```

当前公开试用版本是 [`0.1.0-rc.3`](https://github.com/elevenching/Buildr/releases/tag/v0.1.0-rc.3)。使用反馈请提交 [GitHub Issue](https://github.com/elevenching/Buildr/issues/new/choose)，安全漏洞请按 [SECURITY.md](https://github.com/elevenching/Buildr/blob/main/SECURITY.md) 私下报告。

完整产品定位、核心模型、快速开始、当前能力和文档导航见仓库根目录的[中文 README](https://github.com/elevenching/Buildr#readme) 或 [English README](https://github.com/elevenching/Buildr/blob/main/README.en.md)。

本目录维护 Buildr 产品源；开发约定见 [AGENTS.md](AGENTS.md)，详细产品事实见 [Buildr 产品说明](docs/buildr-product.md)，当前实现事实见 [Buildr current state](openspec/knowledge/buildr-current-state.md)，规范性契约见 [OpenSpec specs](openspec/specs/)。

产品验证由统一 registry 和 DAG planner 驱动：`npm test` 运行固定 Fast，日常使用 `npm run test:changed -- --plan` 查看 Git 改动会选择哪些步骤，正式候选始终运行完整 `npm run test:candidate`；失败定位统一使用 `npm run test:focus -- <step-id|group:<group>>`。职责边界见 [验证覆盖职责矩阵](docs/verification-ownership.md)。

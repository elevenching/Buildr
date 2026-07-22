## 旧 Product package-root 迁移清单

本清单把 `projects/product/` 当前一级内容逐项归类，作为迁移白名单。迁移完成后，Project 根只允许治理资产、Service registry、项目级文档和薄兼容入口；未在清单中的旧 package-root 内容不得继续保留。

| 当前路径 | 目标所有者 | 迁移动作 |
|---|---|---|
| `.gitignore` | Buildr Service | 迁入 `services/buildr/.gitignore` |
| `AGENTS.md` | Product Project | 保留并更新 Project / Service 边界 |
| `LICENSE` | Buildr Service | 迁入 Service，供 npm package 发布 |
| `README.md` | Product Project + Buildr Service | 现有实现型 README 迁入 Service；Project 根重建产品治理入口，不复制实现正文 |
| `bin/` | Buildr Service | 整体 Git rename |
| `buildr` | Product Project | 保留为只加载 Service CLI 的薄兼容 bridge |
| `capabilities.yml` | Product Project | 保留 Project capability requirements |
| `commands.yml` | Product Project | 保留 Project command requirements |
| `docs/` | 按文档生命周期拆分 | 产品定位、Roadmap、OpenSpec 导航保留；CLI、runtime、架构、发布维护文档迁入 Service |
| `openspec/` | Product Project | 保留 canonical specs、changes 与 knowledge |
| `package/` | Buildr Service | 整体 Git rename，保持唯一交付源 |
| `package-lock.json` | Buildr Service | Git rename，与 Service package metadata 同根 |
| `package.json` | Buildr Service | Git rename，Product 根不保留第二 package root |
| `scripts/` | Buildr Service | 整体 Git rename；脚本显式区分 Project root 与 Service root |
| `services/` | Product Project | 保留 registry；`services/buildr/` 承载真实实现 |
| `src/` | Buildr Service | 整体 Git rename，禁止旧根副本 |
| `test/` | Buildr Service | 整体 Git rename；Product 契约通过显式 Project root 读取 |

## 最终 Project 根白名单

- 治理文件：`AGENTS.md`、`capabilities.yml`、`commands.yml`、未来的 `verification.yml`。
- 治理目录：`openspec/`、`services/`、保留的项目级 `docs/`。
- 兼容入口：`buildr`，且只能桥接 `services/buildr/bin/buildr.mjs`。
- 项目入口：Project `README.md`；不得成为 npm package metadata 或实现文档副本。

以下内容在最终 Project 根一律视为结构违规：`package.json`、`package-lock.json`、`bin/`、`src/`、`test/`、`scripts/`、`package/`。`.gitignore`、`LICENSE` 和实现型 README 由 Buildr Service 拥有。

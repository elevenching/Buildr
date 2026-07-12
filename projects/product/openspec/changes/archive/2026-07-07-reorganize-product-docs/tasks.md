## 1. 文档说明文档

- [x] 1.1 重写 `docs/document-index.md`，定义 README、`docs/buildr-product.md`、`openspec/knowledge/`、`openspec/specs/`、`docs/archive/` 的职责
- [x] 1.2 在 `docs/document-index.md` 中写明 archive 不是当前事实源，Agent 默认不应依赖 archive
- [x] 1.3 在 `docs/document-index.md` 中写明当前实现事实优先进入 `openspec/knowledge/buildr-current-state.md`

## 2. Current State Knowledge

- [x] 2.1 将 `openspec/knowledge/buildr-product-mvp-current-state.md` 重命名或收敛为 `openspec/knowledge/buildr-current-state.md`
- [x] 2.2 按 specs 能力域重组 current-state：Workspace/Organization、Project registry、Service metadata、Package baseline、Agent Skills、Workspace Skills、Commands、Doctor、Runtime projection、Current limits
- [x] 2.3 从现有 docs 中抽取已实现事实并迁入 current-state
- [x] 2.4 检查 current-state 与 `openspec/specs/` 不冲突，避免把愿景或待实现方向写成事实

## 3. 聚合产品说明

- [x] 3.1 新建 `docs/buildr-product.md`
- [x] 3.2 从产品手册、架构愿景、上下文模型、组织模型、runtime adapter 和 roadmap 中提炼产品理解内容
- [x] 3.3 `docs/buildr-product.md` 只保留产品定位、核心模型、工作资产、协作方式、runtime 高层模型、MVP 边界摘要和后续方向
- [x] 3.4 在 `docs/buildr-product.md` 中链接 `openspec/knowledge/buildr-current-state.md` 作为当前事实源

## 4. README 收敛

- [x] 4.1 瘦身根 `README.md`，只保留产品入口、快速开始、当前支持摘要和文档导航
- [x] 4.2 移除 README 中过细的实现事实，改为链接 current-state knowledge
- [x] 4.3 确保 README 不重复承担产品手册或路线图职责

## 5. 归档旧文档

- [x] 5.1 将被聚合或被 knowledge/specs 取代的旧 docs 移入 `docs/archive/`
- [x] 5.2 给归档文档增加归档声明：`Archived historical note. Not a current Buildr product source of truth.`
- [x] 5.3 保留 `docs/release-checklist.md` 作为发布操作清单，并按新索引更新引用
- [x] 5.4 删除或更新旧路径引用，确保当前入口只指向新文档结构

## 6. 验证

- [x] 6.1 运行 `openspec validate --all --strict`
- [x] 6.2 如果文档路径影响 package 或 README 验证，运行 `./buildr package check`
- [x] 6.3 检查 `rg` 中旧文档路径和旧 current-state 文件名引用，避免残留当前入口指向 archive

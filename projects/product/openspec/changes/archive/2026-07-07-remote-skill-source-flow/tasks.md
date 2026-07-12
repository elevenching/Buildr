## 1. Manifest Schema 与兼容迁移

- [x] 1.1 重新定义 `skills/manifest.yml` 的本地作者型和远端发布型条目结构
- [x] 1.2 支持对象型 `source`、`resolved` 和 `install`，其中 `version`/`integrity` 属于 `resolved`，Agent runtime 名称默认使用 Skill id
- [x] 1.3 将上一版 `package:<id>` 本地引用实现调整为内部 resolver 或迁移辅助，不作为用户远端发布型 source 主路径
- [x] 1.4 为旧 `path` manifest 保持兼容

## 2. Skills Add/Remove

- [x] 2.1 保持 `skills add --source <skill-dir>` 登记本地完整 Skill 源目录
- [x] 2.2 新增 `skills add <id> --remote-source <url>` 登记未解析远端信息源
- [x] 2.3 新增 `skills add <id> --resolved-source <url>` 登记已解析精确安装源，并支持 `resolved.kind: skill-url`
- [x] 2.4 支持登记 source kind、resolved kind、version、integrity 和 description；未提供 source kind 时默认 `url`
- [x] 2.5 支持 `--remote-source <source-url>` 与 `--resolved-source <skill-md-url>` 组合登记，保留原始信息源和精确安装源
- [x] 2.6 更新 `skills remove`，本地作者型删除本地源目录，远端发布型只删除 manifest 条目

## 3. Render、Runtime Check 与 Doctor

- [x] 3.1 更新 Skills resolver，按 `path`、`resolved`、`source/install.mode: agent` 产出统一内部模型，并支持只有 `resolved` 没有原始 `source` 的远端发布型 Skill
- [x] 3.2 本地作者型 Skill 继续由 Buildr CLI 直接安装到 Agent runtime
- [x] 3.3 已解析远端 Skill 由 Buildr CLI 拉取、校验并安装到 Agent runtime；不支持的 resolved kind 必须报错
- [x] 3.4 未解析远端信息源由 render 生成 Buildr managed 的 Agent-readable 安装说明或安装任务
- [x] 3.5 runtime check/doctor 对 Agent 安装模式报告 `agent action required`，不计为 up to date

## 4. Buildr Skill、Bootstrap 与文档

- [x] 4.1 调整 Buildr Skill `SKILL.md` 结构，把两种 Skill 类型和三种登记/render 方式放到前面
- [x] 4.2 更新 bootstrap guide 的兜底说明，保持和 Buildr Skill 入口一致
- [x] 4.3 更新 workspace baseline `AGENTS.md` 和 README 的 Skills 管理说明
- [x] 4.4 更新 roadmap/current-state 文档，说明远端 source/resolved/install 流程

## 5. 验证

- [x] 5.1 更新 package check 覆盖远端信息源和已解析安装源 manifest
- [x] 5.2 更新 `tools/verify-buildr-product-mvp` 覆盖三种 add 方式和三种 render 方式
- [x] 5.3 运行 `./buildr package check`、`tools/verify-buildr-product-mvp`、`openspec validate --all --strict`

## 1. 命令行工具清单与 add/remove

- [x] 1.1 将 `commands/manifest.yml` 标准字段收敛为 `installHint`，新增可选 `description`，并同步解析、校验、写回和示例。
- [x] 1.2 实现 commands manifest 稳定写回：保留原有条目顺序，新条目追加，`--replace` 保留原位置，删除到空时保留空清单。
- [x] 1.3 实现 `buildr commands add <id>`：要求 target 已 `buildr init`，`purpose` 必填，`executable` 默认等于 `id`，支持 `name`、`description`、`version`、`installHint`。
- [x] 1.4 实现 `buildr commands add <id> --replace`：整项替换已有条目，不做局部 update，不兼容旧 `install` 字段。
- [x] 1.5 实现 `buildr commands remove <id>`：只删除 manifest item，不删除命令文档或其他文件。
- [x] 1.6 更新 `commands check`、`doctor` 和 package check 的命令清单读取逻辑，使用 `installHint` 输出安装提示。
- [x] 1.7 确认 `commands add/remove` 不提供 `--json`，不自动运行 check/doctor，不执行 install/render。

## 2. Skills 清单与完整 Skill 装载

- [x] 2.1 扩展 `skills/manifest.yml` 解析与写回，支持可选 `description`，并确认 `skills render` 不依赖该字段。
- [x] 2.2 实现 Skill source 校验：必须包含 `SKILL.md`，frontmatter `name` 必填，显式传入的 `id` 必须与 `name` 一致。
- [x] 2.3 实现 Skill source 顶层内容白名单装载：`SKILL.md`、`scripts/`、`templates/`、`assets/`、`examples/`、`references/`。
- [x] 2.4 实现未知顶层内容处理：默认报错；显式 `--ignore-unsupported` 时跳过，并在中文回执中列出未装载内容。
- [x] 2.5 实现 `buildr skills add --source <skill-dir>`：支持 workspace/project scope；外部 source 复制到目标 `skills/<skill-id>/`；source 已在目标位置时只登记 manifest。
- [x] 2.6 实现 `buildr skills add --source <skill-dir> --replace`：整目录替换已装载源资产，保留 manifest 原位置；source 已在目标位置时只替换 manifest item。
- [x] 2.7 实现 `buildr skills remove <id>`：删除 manifest item，并在安全校验后删除对应 `skills/<id>/` 源目录；不删除 Agent runtime 产物。
- [x] 2.8 确认 `skills add/remove` 不支持 service scope，不提供 `--json`，不自动执行 render/check/doctor。

## 3. 输出、引导与文档

- [x] 3.1 为 `commands add/remove` 输出中文 Agent-readable 回执，包含已更新源资产和行为级下一步。
- [x] 3.2 为 `skills add/remove` 输出中文 Agent-readable 回执，包含已更新源资产、跳过内容和行为级下一步。
- [x] 3.3 更新 Buildr Skill，说明命令清单使用 `commands add/remove`，Skill 源资产使用 `skills add/remove`，规则不提供 `rules add/remove`。
- [x] 3.4 更新 Buildr Skill 中从零创建 Skill 的说明：直接创建目标 `skills/<skill-id>/SKILL.md` 及允许的配套目录，再登记或维护 manifest。
- [x] 3.5 更新 bootstrap guide 和 onboarding contract，覆盖 manifest-backed 资产维护命令、中文下一步回执和 add/remove 边界。
- [x] 3.6 更新产品 README 或 roadmap，记录 service 层级源资产后续统一支持方向。

## 4. 验证

- [x] 4.1 增加 commands add/remove 测试，覆盖新增、重复报错、`--replace`、删除、`installHint`、`description` 和非 init target 报错。
- [x] 4.2 增加 skills add/remove 测试，覆盖完整目录装载、目标位置登记、`--replace`、删除、安全删除、manifest `description` 和未知顶层内容处理。
- [x] 4.3 更新 package check 验证，覆盖 manifest-backed 资产维护命令、`installHint` 字段和禁用 `rules add/remove`。
- [x] 4.4 更新产品 MVP 验证脚本，覆盖 add/remove 后继续通过 check/doctor/render 或 runtime check 确认状态。
- [x] 4.5 运行 `openspec validate manage-manifest-backed-assets --strict`、`./buildr package check` 和 `product/tools/verify-buildr-product-mvp`。

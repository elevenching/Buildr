## 1. Skills Manifest 与 Resolver

- [x] 1.1 扩展 `tools/buildr` 的 `readSkillManifest`、`renderSkillsManifestYaml` 和 manifest 校验，支持 `path`/`source` 二选一和可选 `runtimePath`
- [x] 1.2 扩展 `tools/render-claude-code.mjs` 的 Skills manifest 解析，输出统一 resolved Skill 模型
- [x] 1.3 实现 `package:<source-id>` resolver，并校验 resolved `SKILL.md` frontmatter `name` 与 manifest `id` 一致
- [x] 1.4 保持本地 `path` Skill 的现有行为和 runtime path 兼容

## 2. CLI 维护命令

- [x] 2.1 保持 `buildr skills add --source <skill-dir>` 作为本地完整源目录装载入口
- [x] 2.2 新增 `buildr skills add <id> --reference <source-ref>`，只写入引用型 manifest 条目，不复制源目录
- [x] 2.3 更新 `buildr skills remove`，对 `path` 条目删除本地源目录，对 `source` 条目只删除 manifest 条目
- [x] 2.4 更新 Skills mutation receipt，清晰说明本地源目录和引用型条目的更新范围

## 3. Package Baseline 与默认 Skills

- [x] 3.1 在 `package/manifest.yml` 增加 workspace Skill source registry，并更新 package manifest 读取与校验
- [x] 3.2 将默认 OpenSpec Skill 源移到非 `package/workspace/` 的包内 source 目录
- [x] 3.3 将 `package/workspace/skills/manifest.yml` 改为 `source: package:<source-id>` 引用型条目
- [x] 3.4 移除默认 OpenSpec Skill `SKILL.md` 的 workspaceFiles 映射，确保 `buildr init` 不再复制这些源目录到 workspace

## 4. Runtime Check、Doctor 与验证

- [x] 4.1 更新 Claude Code Skills render，确保引用型 Skill 可渲染并保留默认 OpenSpec runtime path
- [x] 4.2 更新 Claude Code runtime check 和 doctor，正确报告引用来源缺失、stale、conflict 和 repair command
- [x] 4.3 更新 `tools/verify-buildr-product-mvp` 覆盖本地源目录 Skill、引用型 Skill、remove 行为和默认 baseline
- [x] 4.4 运行 `./buildr package check`、`tools/verify-buildr-product-mvp`、`openspec validate --all --strict`

## 5. 文档与引导

- [x] 5.1 更新 Buildr Skill 对 Skills 管理的说明，区分本地源目录 Skill 与引用型 Skill
- [x] 5.2 更新 roadmap/current-state 文档中的 manifest-backed Skills 维护事实
- [x] 5.3 检查默认 workspace `AGENTS.md` 是否需要补充引用型 Skills 维护边界

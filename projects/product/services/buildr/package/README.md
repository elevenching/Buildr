# Buildr Package

本目录保存 Buildr 随包源资产。这里的 README 只面向维护者说明目录职责，不作为发布、映射或运行契约。

`package check` 和 `package build` 属于 Buildr 产品维护、验证和发布表面，不是普通 workspace onboarding 的必需步骤。`package:<source-id>` 仅是 package manifest `skillSources` 与随包 resolver 的内部 source identity；维护材料可以准确描述它，public Skill authoring 指引不得把它当作用户 asset id 或公开 source scheme。

## 事实来源

- `manifest.yml` 是发布边界、source-to-target 映射、模板变量和禁止内容的机器契约。
- 产品仓中的 `openspec/specs/buildr-package-assets/spec.md` 是随包资产和 package check 的规范性契约。
- Service 中的 `docs/release-checklist.md` 是发布和验证入口。
- `targets/workspace/` 保存由 init/sync 物化到用户 workspace 或 Project 的交付源。
- `targets/runtime/` 保存直接安装到 Agent runtime 的交付源；产品入口 Buildr Skill 位于 `targets/runtime/skills/buildr/SKILL.md`。
- `bootstrap/guide.md` 是 Buildr Skill 不可用时由 CLI 输出的 fallback runbook，`bootstrap/contract.yml` 是对应机器校验契约；bootstrap 不属于 workspace/runtime target。

## 验证

从 workspace root 运行：

```bash
projects/product/buildr package check
cd projects/product && npm run test:focus -- package-static
projects/product/services/buildr/test/verification/onboarding/init.mjs
projects/product/services/buildr/test/verification/onboarding/repository.mjs
(cd projects/product && npm run test:focus -- workspace-lifecycle ownership-recovery runtime-reconciliation)
(cd projects/product && openspec validate --all --strict)
```

统一 `test:focus` 使用 `package-static`、`package-workspace`、`package-commands`、`package-rules`、`package-skills`、`package-runtime` 六个稳定 step id 定点重跑；它们不是随 npm 包承诺的用户 CLI 参数。无 selector 的 `buildr package check` 仍聚合全部阶段。

repository onboarding 会复制一个不含 `node_modules` 与 Agent runtime 的临时候选树，验证开发 checkout installer、runtime discovery 和 update source 识别。完整 `init -> sync -> doctor` 的安装后生命周期由 release tarball smoke 持有。

# Buildr Package

本目录保存 Buildr 随包源资产。这里的 README 只面向维护者说明目录职责，不作为发布、映射或运行契约。

`package check` 和 `package build` 属于 Buildr 产品维护、验证和发布表面，不是普通 workspace onboarding 的必需步骤。`package:<source-id>` 仅是 package manifest `skillSources` 与随包 resolver 的内部 source identity；维护材料可以准确描述它，public Skill authoring 指引不得把它当作用户 asset id 或公开 source scheme。

## 事实来源

- `manifest.yml` 是发布边界、source-to-target 映射、模板变量和禁止内容的机器契约。
- 产品仓中的 `openspec/specs/buildr-package-assets/spec.md` 是随包资产和 package check 的规范性契约。
- 产品仓中的 `docs/release-checklist.md` 是发布和验证入口。
- `targets/workspace/` 保存由 init/sync 物化到用户 workspace 或 Project 的交付源。
- `targets/runtime/` 保存直接安装到 Agent runtime 的交付源；产品入口 Buildr Skill 位于 `targets/runtime/skills/buildr/SKILL.md`。
- `bootstrap/guide.md` 是 Buildr Skill 不可用时由 CLI 输出的 fallback runbook，`bootstrap/contract.yml` 是对应机器校验契约；bootstrap 不属于 workspace/runtime target。

## 验证

从 workspace root 运行：

```bash
projects/product/buildr package check
projects/product/tools/verification/onboarding/init.mjs
projects/product/tools/verification/onboarding/repository.mjs
(cd projects/product && npm run test:workspace)
(cd projects/product && openspec validate --all --strict)
```

`verify-repository-onboarding.mjs` 会复制一个不含 `node_modules` 与 Agent runtime 的临时候选树，从开发 checkout installer 开始验证 `runtime list -> init --agent codex`，并独立读取 doctor JSON 证明最终状态。

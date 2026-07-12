## 1. CLI 接口

- [x] 1.1 为 `buildr rules add` 和 `buildr rules remove` 新增 help topic 与 command routing。
- [x] 1.2 为 root `rules/manifest.yml` 实现 `rules add`，包括默认 `rules/<id>.md` path derivation、existing-file validation、id/path validation、required description 和 replace behavior。
- [x] 1.3 为 root `rules/manifest.yml` 实现 `rules remove`，包括默认 source-file deletion、`--keep-file` 和 required Buildr Rule protection。
- [x] 1.4 拒绝将 `rules add/remove` 用于 Project scope，并清晰说明 Project rules 当前通过 `projects/<project>/AGENTS.md` 维护。

## 2. Diagnostics 与 Safeguards

- [x] 2.1 更新 Rules doctor findings，在适用时建议 `rules add/remove`，同时保留 manual repair guidance。
- [x] 2.2 确保 `rules add/remove` mutation receipts 说明 runtime render 不会自动执行，并按需指向 Agent 的 doctor、runtime check 或 rules render。
- [x] 2.3 确保 `rules remove --keep-file` 保留 Rule files，并通过 doctor 报告剩余未登记文件。

## 3. Verification

- [x] 3.1 更新 `buildr package check`，校验 `rules add/remove` main paths、default path derivation、required description、existing-file requirement、required builtin protection、default file deletion、`--keep-file`、doctor 对保留文件的报告，以及无 runtime writes。
- [x] 3.2 更新 `tools/verify-buildr-product-mvp`，在 manifest-backed asset flow 中覆盖 Rules add/remove。
- [x] 3.3 运行 `projects/product/buildr package check`、`projects/product/tools/verify-buildr-product` 和 `openspec validate --all --strict`。

## 4. Product assets 与 Docs

- [x] 4.1 更新 Buildr Skill 和 bootstrap guidance，将 Rule 描述为 Agent values/boundaries/constraints，将 Skill 描述为可复用专业动作。
- [x] 4.2 更新 workspace baseline rules 和 product docs，建议使用 `rules add/remove` 维护 root Rules manifest。
- [x] 4.3 更新仍称 `rules add/remove` 不存在的 current state 与 release checklist references。
- [x] 4.4 如果 source asset updates 影响当前 Codex runtime，运行 `projects/product/buildr sync codex --target ../..` 或 targeted render。

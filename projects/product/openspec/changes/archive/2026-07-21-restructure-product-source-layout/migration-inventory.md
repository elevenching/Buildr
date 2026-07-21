# Source Layout Migration Inventory

迁移基线：

- Git HEAD：`a4341dd7d42b3f82c9b948de3c89b93b51ae8c85`
- Git tree：`837e7ca2b1a1cef2a3d86e94d4eb8542d467af1d`
- `tools/` tracked files：104
- CLI：36；runtime：17；verification：45；shared：1；顶层 executable/wrapper：5
- 直接旧路径引用文件：迁移前扫描由 `rg 'tools/(cli|runtime|shared|verification)'` 和 verification registry inventory 持有；迁移完成门禁要求现行 tracked files 零引用。

## Exhaustive mapping rules

下表按源路径覆盖全部 104 个文件；无文件允许落在未列出的默认目录。

| Source | Target | Ownership / delivery |
|---|---|---|
| `tools/cli/domains/*.mjs` | `src/application/domains/<name>.mjs` | 现有模块含用例编排、文件 IO 与 mutation，属于 application handler；npm runtime。纯领域模型由后续功能建立 `src/domain/` |
| `tools/cli/application/**` | `src/application/**` | 产品用例与 composition；npm runtime |
| `tools/cli/command/**` | `src/interfaces/cli/**` | CLI interface；npm runtime |
| `tools/cli/bootstrap.mjs` | `src/interfaces/cli/main.mjs` | CLI composition entry；npm runtime |
| `tools/cli/shared/infrastructure.mjs` | `src/infrastructure/filesystem/index.mjs` | filesystem/path/transaction；npm runtime |
| `tools/cli/shared/platform.mjs` | 按 named export 拆入 `src/infrastructure/*` 与 composition | 不保留 shared facade；npm runtime |
| `tools/cli/shared/json-contracts.mjs` | `src/application/json-contracts.mjs` | 多个用例共享的 JSON contract；npm runtime |
| `tools/runtime/**` | `src/infrastructure/runtime/**` | Agent runtime adapter/renderer；npm runtime |
| `tools/shared/fetch-remote-text.mjs` | `src/infrastructure/network/fetch-remote-text.mjs` | 网络 adapter；npm runtime |
| `tools/buildr` | `bin/buildr.mjs` | npm executable；npm runtime |
| `tools/install-buildr-cli` | `scripts/install-buildr-cli` | checkout maintenance；不发布 |
| `tools/uninstall-buildr-cli` | `scripts/uninstall-buildr-cli` | checkout maintenance；不发布 |
| `tools/verify-buildr-product` | `scripts/verify-buildr-product` | Candidate thin wrapper；不发布 |
| `tools/verify-buildr-product-fast` | `scripts/verify-buildr-product-fast` | Fast thin wrapper；不发布 |
| `tools/verification/package/run.mjs` | `test/verification/package/run.mjs` | checkout-only selector wrapper；不发布 |
| `tools/verification/{candidate,changed,changed-paths,dag-scheduler,executor,focus,plan-runner,planner,profile,registry,unit-coverage}.mjs` | `test/verification/` | 仓库验证编排；不发布 |
| `tools/verification/timing/**` | `test/verification/timing/**` | evidence/timing；不发布 |
| 旧 verification 中的 release contract、notes、registry state、convergence 与 release bridge | `scripts/release/**` | 真实发布操作；不发布 |
| `tools/verification/{cli,docs,integrity,network,onboarding,openspec,runtime,workspace}/**` 及 release candidate/smoke | `test/verification/<area>/**` | focused verifier/test infrastructure；不发布 |

## Product verifier decision

当前安装后 `buildr package check` 的真正产品 verifier 从旧 CLI application 迁到 `src/application/package-maintenance/**`。旧 verification package runner 只是 Candidate/Focus 使用的 selector wrapper，迁到 `test/verification/package/run.mjs`，不是产品 runtime。

`package.json#files` 当前显式发布的 OpenSpec、integrity 和 runtime verification modules 只被 repository verification registry 使用，不被安装后 CLI import。迁移后它们全部进入 `test/verification/` 并从 npm inventory 删除；package parity 与 installed command smoke 负责证明没有隐藏 runtime dependency。

## Baseline evidence

- `npm test`：通过；Unit 52、Contract 50、Fast Integration 34，CLI architecture、OpenSpec strict/spec quality、runtime adapter contract 全部通过。
- Focus：`cli-compatibility`、`cli-package-parity`、`runtime-adapter-contract`、`managed-mutations` 全部通过。
- CLI compatibility 基线：37 个 help topics，package identity、actionable failures、JSON discovery、workspace mutation。
- Managed mutation 基线：55 个 production files、30 个显式 mutation functions。
- Candidate identity 基线：HEAD/tree 见文首；迁移后的完整 Candidate 必须绑定新的最终 fingerprint，不复用本基线作为完成证据。

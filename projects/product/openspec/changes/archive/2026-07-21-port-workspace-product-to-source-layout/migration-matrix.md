## Workspace checkpoint 迁移矩阵

冻结行为基线：`8b3c44d2839be9dac29cdba3170c1a507168d91a`。本矩阵只映射行为和测试，不授权 cherry-pick、恢复旧 `tools/` 或带入根 `.buildr/workspace.yml`。

| checkpoint 行为 | checkpoint owner | 新 owner | 验证位置 |
|---|---|---|---|
| Workspace `id/name/description` 与 UUID/文本约束 | `domains/workspace-metadata.mjs` | `src/domain/workspace/workspace.mjs` | `test/unit/workspace-domain.test.mjs` |
| canonical/legacy YAML、兼容 metadata、revision | `domains/workspace-metadata.mjs` | `src/infrastructure/filesystem/workspace-manifest-repository.mjs` | `test/unit/workspace-manifest-repository.test.mjs` |
| 跨 Workspace/Skills Manifest identity reconciliation | `workspace-product.mjs` | `src/application/workspace/workspace-application.mjs` | unit + fast integration |
| 查询、白名单更新、CAS、prompt | `workspace-product.mjs` | `src/application/workspace/workspace-application.mjs` | `test/integration-fast/workspace-product.test.mjs` |
| init 单 UUID 与 description | `workspace-operations.mjs` | `src/application/workspace-operations.mjs` 调用 Workspace Application | fast integration + onboarding |
| sync 显式迁移与事务回滚 | `runtime.mjs` / `workspace-product.mjs` | `src/application/runtime.mjs` + Workspace Application | fast integration + Workspace E2E |
| doctor migration/identity/description 诊断 | `doctor/scope-diagnostics.mjs` | `src/application/workspace/workspace-application.mjs` 产生诊断，doctor 编排 | fast integration |
| loopback HTTP 与写安全边界 | `application/local-workspace-app.mjs` | `src/interfaces/local-app/http/server.mjs` | fast integration |
| Workspace 页面与新增 prompt | `app-ui/*` | `src/interfaces/local-app/web/*` | fast integration + 浏览器验收 |
| CLI `app`、help 和 command registry | `command/*` | `src/interfaces/cli/*` | contract + fast integration |
| npm 静态资源与安装后 parity | 隐式依赖旧目录 | `package.json` 的 `src/` 发布边界与 interface 相对资源 | contract + Candidate parity |

明确排除：

- 根自举 Workspace 的 `.buildr/workspace.yml`；它属于 `dev` 已完成的独立迁移事实。
- Project、Service 的 Domain、应用能力和页面。
- 旧 change artifacts、旧 `tools/` 路径、兼容 shim 和旧任务看板实现副本。

## Candidate 前验证证据

- `npm run test:changed`：通过；实际累计耗时 39.061 秒，最慢步骤为 Candidate integration: builtin recovery and migration（38.913 秒），无失败；timing evidence 为 `/var/folders/_8/bhpxxm251kj_z4xjqxjj4wsr0000gn/T/buildr-changed-evidence-Kobh0E/timing.json`。
- Workspace 页面：在临时 Workspace 中通过桌面读取与保存、revision 更新、并发修改冲突提示、创建 Workspace prompt 生成与复制；390×844 窄屏下单列布局且无横向溢出。
- 本机 CLI：`scripts/install-buildr-cli` 已把 `buildr` 指向当前 task worktree；`buildr --version` 为 `0.1.0-rc.6`，root/app/init help 正常。
- doctor：不指定 runtime 时当前 task worktree `ok: true`、`workspaceValid: true`、`ready: true`；指定 Codex 时仅报告该独立 worktree 尚未投射 runtime，不影响 Workspace 数据和本次产品源码验证。本 change 没有修改受管 Rules、Skills、Components 或 Commands，因此不在允许编辑根之外执行 sync/render。
- 根 Workspace：task worktree 的 `.buildr/workspace.yml` 无 diff；冻结参考 worktree `productize-workspace-project-service` 仍保留在 checkpoint `8b3c44d2839be9dac29cdba3170c1a507168d91a`，未继续 Project、Service。

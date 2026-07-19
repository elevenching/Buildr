# Buildr CLI 内部架构

本文面向 Buildr 维护者，说明 npm `buildr` bin 的内部模块边界。`tools/cli/` 是 package 内部实现，不是面向使用者的稳定 JavaScript API；公开兼容承诺仍以命令、参数、help 和 OpenSpec specs 为准。

## 分层

```text
tools/buildr
  -> tools/cli/bootstrap.mjs
  -> tools/cli/command/
  -> tools/cli/application/
  -> tools/cli/domains/
  -> tools/cli/shared/

tools/runtime/       # runtime adapter 与 renderer
tools/shared/        # CLI 外复用的基础 helper
tools/verification/  # 按 cli/runtime/release 等领域分组的 verifier
```

- `tools/buildr`：稳定 shebang/bin，只负责启动和顶层错误处理。
- `command/`：根/主题 help、唯一 command registry 和参数 dispatch。
- `application/`：组合 doctor、sync/update、package maintenance 等跨领域流程。
- `domains/`：Workspace/Project/Service、Rules、Skills、Commands、Components、OpenSpec contract 和 runtime 等领域实现。
- `shared/`：无领域语义的参数、路径、YAML、Git、filesystem、atomic write 和 workspace transaction 基础设施。

依赖只允许沿上述方向向下。领域模块不直接互相 import；跨领域调用由 `application/compose-runtime.mjs` 显式装配，以避免循环依赖和隐式全局共享。composition root 可以聚合完整 platform，其余 CLI 模块必须从 `shared/platform.mjs` 使用实际需要的 named imports，并通过窄 runtime port 调用跨领域能力。

三个稳定 facade 保留现有调用表面，但不承载长流程：

```text
application/doctor.mjs
  -> application/doctor/{scope,service,runtime}-diagnostics.mjs
application/package-maintenance.mjs
  -> application/package-maintenance/{verification-registry,static-validation,smoke-checks}.mjs
tools/runtime/render-claude-code.mjs
  -> tools/runtime/skills/{arguments,manifests,contributions,sources,render-plan}.mjs
```

Workspace E2E 位于 `tools/verification/workspace/`，只保留 `workspace-lifecycle`、`ownership-recovery` 和 `runtime-reconciliation` 三条跨组件黄金路径。每个 suite 使用独立临时状态，可通过 `npm run test:workspace -- <suite...>` 定点重跑；无参数执行全部 suites，`--list` 列出稳定 id。全量 help、onboarding 异常分支、runtime adapter 实现族 parity、tarball inventory 与安装后生命周期分别由 focused verifier 持有，不在 Workspace E2E 重复覆盖。

`package check` 的公开命令仍执行完整维护门禁。内部 registry 为 static、workspace、Commands、Rules、Skills、runtime 提供稳定 identity；Candidate 和 `npm run test:package -- <selector>` 可独立执行，selector 不属于公开 CLI 参数。无 selector 的聚合命令复用兼容 fixture，隔离 steps 则各自持有临时状态和 diagnostics。

各类契约的主 owner、旧 MVP section 迁移和有意保留的边界交叉记录在 [验证覆盖职责矩阵](verification-ownership.md)。新增断言前先选择主 owner，不把 Workspace E2E 当作所有行为的兜底层。

产品验证采用 fast、changed、affected、workspace 和 candidate 分层调度。`verification/registry.mjs` 是 step identity、executor、inputs、依赖、profile/group、预算、并发类别和 artifact metadata 的唯一规划事实源；planner 负责选择、依赖展开、去重和稳定拓扑，scheduler 按全局/class 容量运行 DAG，并把失败后续标记为 blocked。稳定 wrapper 不得重新内联阶段命令、预算或 group mapping。

`verify-buildr-product-fast` 提供普通任务低成本反馈，并将 unit、静态契约和 fast integration 作为三个独立 registry steps；`test:changed` 根据 Git diff 或显式 Product 路径规划最小 DAG，未映射路径 fail closed；`verify-buildr-product-affected` 保留人工领域 group；Workspace/package selector 提供定点重跑。`verify-buildr-product` 固定选择完整 32-step Candidate profile，不接受 diff 或 selector 缩小门禁。Candidate 只创建一个共享只读 tarball，并为每个 step 保留独立 stdout/stderr、退出状态、timing 和非阻断目标预算。

`tools/` 顶层只保留 `buildr`、安装/卸载脚本和产品验证聚合入口等稳定可执行表面。内部 runtime、共享 helper 与专项 verifier 必须进入职责子目录；这些内部文件路径不属于公开兼容契约。

## 兼容和发布边界

- `tools/buildr` 与 npm 安装后的 `buildr` 使用同一个内部 runtime 和 command registry。
- `package.json#files` 递归发布 `tools/cli/`，但不声明 package `exports`。
- 重构内部模块不得改变命令路径、参数、stdout/stderr、退出码、JSON schema、文件结果或 transaction/fail-closed 行为；行为变化必须使用独立 OpenSpec change。
- `packageCheck` 是 composition handler：从稳定 registry 选择并组合静态、workspace 和领域 verifier，统一聚合问题与退出状态；旧单体 `runPackageSmokeChecks` runner 不得恢复。

## 维护验证

```bash
node tools/verification/cli/architecture.mjs
npm test
npm run test:changed -- --plan
npm run test:affected -- cli
npm run test:affected -- runtime
node tools/verification/cli/compatibility.mjs
node tools/verification/cli/package-parity.mjs
node tools/verification/integrity/managed-mutations.mjs
```

architecture verifier 检查薄入口、稳定 facade、显式 platform 依赖、完整 runtime inventory、单向 import、command 唯一登记、统一 verification registry、32-step Candidate 和 npm 边界；默认 `npm test` 聚合 unit、contract、fast integration 与其他低成本契约；compatibility verifier 检查全量 help、失败路径、JSON discovery 和 source mutation；package parity verifier 从 tarball 安装，在干净目录比较 checkout/npm 行为；runtime parity 持有各实现族的昂贵 adapter 生命周期；onboarding integration 持有 unsupported、幂等和冲突恢复；release smoke 持有安装后 tarball 生命周期；mutation verifier 递归扫描全部发布 runtime modules 的直接写入白名单。

新增命令时应先在 `command/registry.mjs` 登记唯一 key，把领域逻辑放入对应 domain，并仅在确需跨领域组合时新增 application service。不要把领域 helper 放入 `shared/`，也不要通过 Component 或动态加载扩展 command registry。

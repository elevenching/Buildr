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
  -> application/package-maintenance/{static-validation,smoke-checks}.mjs
tools/runtime/render-claude-code.mjs
  -> tools/runtime/skills/{arguments,manifests,contributions,sources,render-plan}.mjs
```

`tools/verify-buildr-product-mvp` 同样只调度 `tools/verify/mvp/*.sh` 场景；共享同一临时 workspace 的 E2E 仍在同一 shell 进程执行，但不再把所有场景实现堆在聚合入口。

产品验证采用三层调度：`verify-buildr-product-fast` 提供普通任务低成本反馈，`verify-buildr-product-affected` 按 step identity 去重领域检查，`verify-buildr-product` 作为稳定 wrapper 委托 `verification/candidate.mjs` 运行完整候选。candidate orchestrator 只对使用独立临时状态的 verifier 做有界并行，并为每个 step 保留独立日志、退出状态和 timing；同一候选 run 的 tarball 为只读共享制品，安装 prefix 和 workspace 不共享。

`tools/` 顶层只保留 `buildr`、安装/卸载脚本和产品验证聚合入口等稳定可执行表面。内部 runtime、共享 helper 与专项 verifier 必须进入职责子目录；这些内部文件路径不属于公开兼容契约。

## 兼容和发布边界

- `tools/buildr` 与 npm 安装后的 `buildr` 使用同一个内部 runtime 和 command registry。
- `package.json#files` 递归发布 `tools/cli/`，但不声明 package `exports`。
- 重构内部模块不得改变命令路径、参数、stdout/stderr、退出码、JSON schema、文件结果或 transaction/fail-closed 行为；行为变化必须使用独立 OpenSpec change。
- `packageCheck` 是 composition handler：静态发布校验和临时 workspace smoke runner 分开维护，统一聚合问题与退出状态。

## 维护验证

```bash
node tools/verification/cli/architecture.mjs
npm test
npm run test:affected -- cli
node tools/verification/cli/compatibility.mjs
node tools/verification/cli/package-parity.mjs
node tools/verification/integrity/managed-mutations.mjs
```

architecture verifier 检查薄入口、稳定 facade、显式 platform 依赖、完整 runtime inventory、单向 import、command 唯一登记、MVP 场景组合和 npm 边界；默认 `npm test` 聚合 `node:test` 与低成本契约；compatibility verifier 检查 help、失败路径、JSON discovery 和 source mutation；package parity verifier 从 tarball 安装，在干净目录比较 checkout/npm 行为；mutation verifier 递归扫描全部发布 runtime modules 的直接写入白名单。

新增命令时应先在 `command/registry.mjs` 登记唯一 key，把领域逻辑放入对应 domain，并仅在确需跨领域组合时新增 application service。不要把领域 helper 放入 `shared/`，也不要通过 Component 或动态加载扩展 command registry。

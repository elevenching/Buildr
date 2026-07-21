## Context

Buildr Product 当前把 npm executable、CLI command、application composition、领域实现、runtime adapter、通用 helper、Candidate 编排、专项 verifier、安装脚本和发布脚本共同放在 `tools/`。这一结构曾适合 CLI 原型，但 Workspace 本机应用已经引入独立领域模型、应用用例、HTTP 接口和 Web UI；继续沿用 `tools/cli` 会把产品本体误表达为开发工具，并让 Project、Service 后续实现继续扩大路径耦合。

迁移必须覆盖约 71 个直接引用旧路径的源码、测试、package inventory、文档和 OpenSpec 契约。当前 `tools/verification` 还同时包含安装后 CLI 使用的产品 verifier 与仅供仓库 Candidate 使用的验证编排，不能按目录整体移动。

现有 `productize-workspace-project-service` change 已在独立 worktree 保留 Workspace checkpoint。本 change 从 `dev` 独立创建，先成为新的源码布局基线；功能 change 在本 change 集成后再基于新布局恢复。

## Goals / Non-Goals

**Goals:**

- 用目录结构准确表达产品源码、产品入口、测试验证、仓库脚本和交付资产的职责。
- 彻底删除 `tools/`，不保留旧内部路径 shim、duplicate source 或长期兼容层。
- 建立 `interfaces -> application -> infrastructure` 的现阶段依赖边界，并为后续纯 `domain` 模型预留严格的无基础设施依赖边界。
- 依据安装后 CLI 的真实依赖闭包区分产品 verifier 与仓库 verification。
- 保持现有 CLI、JSON、文件 mutation、runtime adapter、package 和验证门禁的可观察行为。
- 让 Workspace、Project、Service 后续功能直接进入同一套稳定架构。

**Non-Goals:**

- 不新增或修改 Workspace、Project、Service 产品能力。
- 不修改 manifest、Task 或其他领域数据模型。
- 不更名或重新设计顶层 `package/` 交付资产。
- 不引入数据库、远程服务、构建器、TypeScript 或新的运行时依赖。
- 不同步或修改主自举 Workspace 的源资产和 Agent runtime。

## Decisions

### 1. 顶层目录以运行职责划分

最终 Product 目录使用以下结构：

```text
bin/                         npm executable 薄入口
src/
  domain/                    纯领域模型、值对象和约束；有真实模型时建立
  application/               用例、跨领域组合和 ports
  infrastructure/            filesystem、process、network、runtime 等 adapters
  interfaces/
    cli/                     CLI registry、help、参数与输出 adapter
    local-app/
      http/                  本机 HTTP adapter
      web/                   静态 Web UI
test/
  unit/
  contract/
  integration-fast/
  integration-candidate-*/
  fixtures/
  verification/              仓库门禁的 registry、planner、runner、timing、evidence
scripts/                      checkout 安装、分发、发布和仓库维护动作
package/                      Buildr 交付源资产，语义保持不变
```

选择这一结构而不是继续细分 `tools/`，因为源码顶层首先需要回答“它是否属于产品运行时”，其次才是技术实现类型。`bin`、`src`、`test`、`scripts` 和 `package` 能直接表达这些不同生命周期。

### 2. 不建立无所有权的 `shared/`

现有 shared 内容按语义迁移：filesystem/atomic write/path resolution 进入 `infrastructure/filesystem`，进程与 Git 调用进入明确的 infrastructure owner，remote fetch 进入 `infrastructure/network`，多用例共享的 JSON contract 进入 `application`。只有真正不依赖 filesystem、runtime 或 interface 的实体、值对象和约束才进入 `domain`。

迁移盘点确认，原名为 `domains` 的模块仍包含文件 IO、mutation 和 CLI 用例注册，不能直接视为纯领域模型；它们迁入 `application/domains`。本 change 不为目录对称创建空 `domain`，后续 Workspace、Project、Service 功能在形成存储无关模型时再建立该 owner。

不建立顶层或 `src/shared`，因为它会重新形成无法约束依赖方向的聚合目录。架构 verifier 必须拒绝新增无所有权 shared 根。

### 3. Product verifier 由生产依赖决定，不由文件名决定

分类规则如下：

- 安装后的 `buildr` 命令可达、`package check` 直接组合或 npm runtime 必需的 verifier 属于产品源码，进入对应 `src/application/*-verification` 或 `src/infrastructure`。
- 只由 `npm test`、Fast、Changed、Focus、Candidate、coverage 或 CI 使用的 registry、planner、scheduler、runner、timing、evidence 和 focused verifier 进入 `test/verification`。
- 测试样本进入 `test/fixtures`；具体断言继续位于 unit、contract 或 integration 目录。
- `scripts` 可以调用产品源码或 `test/verification`，但 `src` 和 `bin` 不得导入 `scripts` 或仓库 verification。

实现第一批任务先生成逐文件 ownership inventory，并用 import graph、package tarball 和安装后命令验证分类结果。选择这一方式，是因为当前 `package.json#files` 与 package static validation 已证明路径名称不能代表实际运行所有权。

### 4. CLI 使用唯一 `bin` 入口和 `src` implementation

`package.json#bin.buildr` 指向 `bin/buildr.mjs`。该文件只调用 `src/interfaces/cli/main.mjs` 并处理顶层退出；根 `buildr` checkout convenience entry 也委托同一实现。旧 `tools/buildr`、`tools/cli/bootstrap.mjs` 和其他兼容入口全部删除。

不保留 shim，因为旧内部路径不是公开 API，而且本 change 的目的就是建立唯一源码事实。兼容性只针对已记录的 CLI 命令和结果，而不是仓库内部 import path。

### 5. npm package 只交付安装后运行闭包

`package.json#files` 显式包含 `bin/`、安装后 CLI 可达的 `src/`、文档和顶层 `package/` 交付资产；排除 `test/`、`scripts/`、OpenSpec planning artifacts 和 Workspace 私有资产。Candidate tarball inventory 和 package parity 必须证明安装后命令不读取 checkout-only 路径。

如果某个 verifier 仍是 `package check` 的运行依赖，它必须先迁入 `src`，而不是通过把 `test/verification` 加回 npm files 来解决缺失。

### 6. 迁移按依赖闭包推进，但只接受完整终态

实现可按 core source、interfaces/runtime、product verifier、test verification、scripts、package/docs 六个内部批次执行，每个批次同步更新 imports 和 focused tests；但 change 完成条件要求 `tools/` 整体不存在、旧路径引用为零、完整 Candidate 通过。不会提交或发布同时依赖新旧两套目录的中间产品。

现有 Workspace 功能 change 不在本 worktree 迁移。架构 change 集成后，再把其 checkpoint 基于新 `dev` 整理，使功能 diff 只包含产品能力。

## Risks / Trade-offs

- [产品 verifier 被误归为测试代码，导致安装后 `package check` 缺文件] → 迁移前建立可达性 inventory，并用 tarball install、package parity 和完整 Candidate 验证。
- [71 个路径引用产生漏改或 Changed owner 缺失] → 架构 verifier 扫描旧路径，verification registry 对新目录建立完整 inputs，未映射路径 fail closed。
- [大规模 rename 掩盖行为变化] → 先冻结现有 public JSON/help/package parity 证据，迁移只做路径和依赖调整，行为变化另开 change。
- [删除 shim 使内部脚本或文档失效] → 将所有 tracked 引用、package inventory 和 executable 清单纳入零旧路径门禁；内部路径不提供兼容承诺。
- [功能 change 与迁移 change 冲突] → 迁移 worktree 独占源码重构；功能 worktree 保持 checkpoint，迁移集成后再整理，不交叉实现。
- [目录分层过度导致细碎模块] → 只按已有职责移动，不为未来假设创建空框架；Project/Service 空目录在对应功能恢复时建立。

## Migration Plan

1. 记录全部 `tools/` 文件、imports、executables、package inventory 和 verification owners，形成迁移映射。
2. 建立 `src` 分层与 ports，迁移领域、application、infrastructure 和 runtime 实现。
3. 建立 `src/interfaces/cli` 与 `bin/buildr.mjs`，切换 checkout/npm 唯一入口。
4. 分类并迁移产品 verifier；证明安装后 CLI 运行闭包不依赖 `test` 或 `scripts`。
5. 将仓库验证框架、focused verifiers 和 fixtures 迁入 `test`，更新 registry、Changed inputs 和 Candidate evidence。
6. 将安装、卸载和真实发布操作迁入 `scripts`；tarball、parity 和 smoke 等验证继续由 `test/verification` 持有，不创建空的未来目录。
7. 更新 package inventory、文档、OpenSpec 路径、Skill 命令示例和全部架构/mutation 门禁。
8. 删除 `tools/`，执行旧路径零引用检查、affected 验证和完整 Candidate。
9. 集成后再恢复 `productize-workspace-project-service`，基于新布局迁移其未合入 Workspace 文件。

回滚以任务分支为边界：迁移未通过 Candidate 时不集成 `dev`，保留原分支和 worktree 现场；不通过在主 Workspace 写兼容 shim 或双目录来回滚。

## Open Questions

没有阻塞 proposal 或实现的产品决策。单个 verifier、helper 和 release module 的最终目标路径由第一批 ownership inventory 按上述规则确定，并在移动前由 architecture tests 固化。

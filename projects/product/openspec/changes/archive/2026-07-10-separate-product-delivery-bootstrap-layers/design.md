## Context

当前 `package/workspace/` 保存会物化到用户 workspace 的 baseline 和内置能力源，`package/agent-skills/` 保存直接安装到 Agent runtime 的产品入口 Buildr Skill，`package/bootstrap/` 保存 Skill 不可用时由 CLI 输出的恢复指南及校验契约。三者都是产品随包资产，但现有命名把交付目的地隐藏在不同抽象中，也容易让维护者把根 workspace 中的 `rules/`、`skills/` 和 runtime 安装结果当成产品源同步编辑。

Buildr 自身又运行在一个自举 workspace 中：`projects/product/` 是产品 Project，workspace 根既包含用户 workspace 会收到的安装结果，也包含自举开发专用 overlay。目录重组必须保持公开 CLI、用户 workspace 目标路径、runtime 目标路径和已有 workspace 更新行为稳定。

## Goals / Non-Goals

**Goals:**

- 让 package 目录直接表达 workspace target、runtime target 和 bootstrap 恢复通道。
- 明确 Product Project、用户交付源和自举 workspace 安装结果的所有权与单向流动关系。
- 让 init、update、sync、skill install、package check 和 npm 打包统一使用新路径。
- 固化“先产品验证，再候选版本自举验收，最后合并推送”的开发顺序。

**Non-Goals:**

- 不改变公开 CLI 命令、参数或用户 workspace/runtime 目标路径。
- 不把产品入口 Buildr Skill 登记为 workspace `skills/manifest.yml` 中的普通 Skill。
- 不让 bootstrap guide 承担完整 Buildr Skill 手册职责。
- 不自动清理或重写用户已有 workspace 的自定义资产。

## Decisions

### 1. Package target 按交付目的地组织

采用以下 canonical 结构：

```text
package/
├── README.md
├── manifest.yml
├── bootstrap/
│   ├── guide.md
│   └── contract.yml
└── targets/
    ├── workspace/
    │   ├── AGENTS.md
    │   ├── .buildr/
    │   ├── commands/
    │   ├── projects/
    │   ├── rules/
    │   └── skills/
    └── runtime/
        └── skills/
            └── buildr/
                └── SKILL.md
```

`targets/workspace/` 表示会由 init/update/sync 物化到用户 workspace 的源；`targets/runtime/` 表示绕过 workspace 源资产、直接安装到 Agent runtime 的产品入口。Buildr Skill 保持 runtime target，不移动到 workspace Skills，因为它需要支持 workspace 初始化前安装，且不属于用户 `skills/manifest.yml`。

替代方案是只把 `agent-skills/` 改名为 `runtime-skills/` 并保留 `workspace/`。这能减少改动，但仍没有一个统一的交付目的地模型，因此不采用。

### 2. Bootstrap 是恢复通道，不是 package 总说明书

`package/README.md` 负责向维护者解释 package；`package/manifest.yml` 是发布和映射的机器契约；`package/bootstrap/guide.md` 由 `buildr bootstrap guide` 原位读取，只在 Buildr Skill 不可用时提供恢复路径；`package/bootstrap/contract.yml` 约束 guide、Buildr Skill 和生成后 runtime Skill 的最低一致性。

bootstrap 不放入 `targets/`，因为它既不物化到用户 workspace，也不安装到 Agent runtime。它是 CLI 随包携带并原位消费的恢复资产。

### 3. 产品交付只允许单向物化

数据流固定为：

```text
package/targets/workspace  -- init/update/sync -->  用户或自举 workspace
package/targets/runtime    -- skill install/sync --> Agent runtime
package/bootstrap          -- bootstrap guide --> CLI 输出
```

workspace 根中的产品管理 Rule、Skill 和 runtime 文件都是安装结果，不得反向作为 Product Project 的源。自举专用 `AGENTS.md` 正文、项目登记和其他 overlay 仍由自举 workspace 自己维护；Buildr 只管理 required block 和 manifest 声明的产品资产。

### 4. 自举验收使用当前候选 Product checkout

产品任务先只修改 `projects/product/`，并用临时目录完成 package check、init/update/sync、runtime 和 doctor 验证。产品验证通过后，使用当前 checkout 的 `projects/product/buildr sync <agent> --target .` 更新当前自举 workspace并运行 doctor；只有自举验收通过后才合并、推送。

产品源变更与自举 workspace 同步结果保持为两个提交，便于审计“发布源变化”和“当前 workspace 消费变化”。若自举验收失败，继续修正候选产品，不合并、不推送。

### 5. Package 内部旧路径不提供兼容别名

新版本 CLI、manifest 和随包资产原子切换到新路径。已有用户 workspace 只接收相同的目标文件，不依赖 package 内部源路径，因此无需迁移用户目录。旧 npm 版本继续使用其自身包内旧路径，新版本不会保留重复资产或 fallback 查找。

CLI 中无法由 manifest 表达的控制文件路径集中维护；package check 必须拒绝新 manifest 引用旧路径，并验证 `targets/workspace/` 中每个文件都有显式映射。

## Risks / Trade-offs

- [遗漏硬编码旧路径导致 package check 或 runtime 安装失败] → 全仓扫描活动代码/文档引用，并覆盖 package check、MVP 验证和 npm dry-run。
- [把 Buildr Skill 误当作 workspace Skill] → manifest 继续使用独立 `agentSkills` 声明，测试确认 init 不把它写入 workspace `skills/`。
- [自举 workspace 手工变化与生成结果混杂] → Product AGENTS 和根自举规则明确所有权，提交按产品源与同步结果分层。
- [目录移动造成较大 diff] → 使用纯路径迁移，除必要路径和说明外不重写资产正文。
- [归档文档保留旧路径造成搜索噪音] → 只更新活动事实源，归档保持历史原貌；检查时明确排除 archive。

## Migration Plan

1. 移动 workspace/runtime target 和 bootstrap contract，更新 manifest 与 package 说明。
2. 更新 CLI 路径解析、package check 和验证脚本，删除旧路径约束与 fallback。
3. 更新 Product AGENTS、current-state knowledge 和活动产品文档。
4. 在临时 workspace 完成 package、init/update/sync、runtime、doctor 和 npm dry-run 验证。
5. 使用当前候选 Buildr 同步并诊断自举 workspace，审查生成差异。
6. 分别提交 Product Project 与自举 workspace 结果，验证后再合并、推送。

回滚时整体恢复旧 package 目录、manifest 和 CLI 路径解析；不得只恢复其中一部分。

## Open Questions

无。

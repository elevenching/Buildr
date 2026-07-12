## Why

上一版 Skills 优化把 `source` 建模为可解析的本地 package 引用，解决了默认 baseline 复制文件的问题，但没有解决已发布 Skills 的真实来源问题：远端来源可能是网页、README、GitHub 目录、registry 页面或 raw `SKILL.md`，并不一定是 Buildr CLI 可以直接安装的技能包。

现在需要把 Buildr Skills 管理改成更贴近 Agent 协作的流程：先登记来源，再由 Agent 辅助解析；能解析成精确技能源时由 Buildr render 确定性安装，不能解析时由 render 把来源和安装要求交给 Agent 处理。

## What Changes

- 明确 Buildr workspace 维护的 Skill 分为两种类型：
  - 本地作者型 Skill：源内容位于 `skills/<skill-id>/`，适合项目实践、私有沉淀和未发布 Skill。
  - 远端发布型 Skill：`skills/manifest.yml` 只维护来源、解析状态和安装方式，不把远端内容复制到 `skills/`。
- 明确 `skills add` 支持三种登记方式：
  - `--source <skill-dir>`：登记本地完整 Skill 源目录。
  - `--remote-source <url>`：登记远端信息源，但尚未解析出精确安装源。
  - `--resolved-source <url>`：登记已解析出的精确 Skill 安装源，并允许附带 resolved kind、版本和 integrity。
- 明确 `skills render` 支持三种渲染方式：
  - 本地源目录：Buildr CLI 直接读取本地 `SKILL.md` 并安装到 Agent runtime。
  - 已解析远端源：Buildr CLI 根据 `resolved.kind` 拉取、校验并安装到 Agent runtime；本 change 要求支持 `skill-url`，即 URL 内容是 raw `SKILL.md`。
  - 未解析远端信息源：Buildr CLI 生成 Buildr managed 的 Agent-readable 安装说明，让 Agent 根据 source 自行阅读、解析和安装。
- 调整 Buildr Skill 和 bootstrap guide 的说明结构：把 Skill 类型和三种登记/渲染方式放到前面，便于 Agent 先判断路径。
- 修正 `optimize-skills-management` 中 `package:<id>` 本地引用的定位：它可作为内部/测试 resolver，但不作为用户远端发布型 Skill 的主要模型。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `product-agent-skills`: 修改 workspace/project Skills manifest、`skills add/remove` 和 Buildr Skill 引导契约，支持远端信息源、已解析安装源和本地源目录三种登记路径。
- `workspace-first-runtime-projection`: 修改 Skills runtime 投射契约，明确 `skills render` 对本地源、已解析远端源和未解析远端信息源的三种处理方式。

## Impact

- 影响 `skills/manifest.yml` schema、`buildr skills add/remove/render`、runtime check 和 doctor 对 Skills 的解析与诊断。
- 影响 Buildr Skill、bootstrap guide、默认 workspace `AGENTS.md` 和 README 对 Skills 管理方式的说明。
- 需要调整或替换上一版 `package:<id>` 本地引用实现，避免把远端发布型 Skill 误建模成本地 package 引用。
- 不要求实现任意网页的自动解析；Agent 辅助解析是流程的一部分，Buildr 只在来源已经精确可安装时执行确定性安装。

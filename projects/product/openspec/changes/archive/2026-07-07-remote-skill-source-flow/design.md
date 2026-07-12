## Context

当前 Buildr 已支持本地源目录型 Skill：`skills add --source <skill-dir>` 会把完整目录装载到 workspace/project 的 `skills/<skill-id>/`，`skills render` 再投射到 Agent runtime。上一版 `optimize-skills-management` 将第二种模式设计为 `package:<id>` 本地 package 引用，但这仍然是假设 Buildr 已经拥有可安装源。

远端已发布 Skill 的来源更复杂：可能是 raw `SKILL.md`，也可能是 GitHub 目录、README、网页、registry 页面或一篇说明文章。不是所有 `source` 都能由 Buildr CLI 直接拉取并安装。公开生态中比较稳定的共同点是可安装 Skill 通常最终落到含 `SKILL.md` 的目录或 bundle，但任意网页没有统一机器可读发现协议。

因此 Buildr 需要把“来源登记”和“精确安装”分开。

## Goals / Non-Goals

**Goals:**

- 把 Buildr workspace 维护的 Skill 类型放到 Buildr Skill / bootstrap guide 的前置说明中。
- 明确两种 Skill 类型：本地作者型、远端发布型。
- 明确三种 `skills add` 登记方式：本地源目录、远端信息源、已解析安装源。
- 明确三种 `skills render` 方式：本地直接安装、远端已解析由 Buildr 安装、远端未解析由 Agent 安装。
- 让 `skills/manifest.yml` 能保存远端来源、解析状态、安装模式、版本和 integrity 信息。

**Non-Goals:**

- 不要求 Buildr 自动解析任意网页或 README。
- 不要求 Buildr 支持所有可能的远端 Skill 打包格式。
- 不把远端 Skill 内容复制到 `skills/` 作为默认行为。
- 不把产品随包 `package:<id>` 作为用户发布型 Skill 的主要模型。

## Decisions

### 1. Manifest 区分 source 与 resolved

远端发布型 Skill 使用 `source` 保存信息源，使用 `resolved` 保存精确安装源。只有信息源时写 `source`；已经拿到精确安装源时写 `resolved`，并可同时保留原始 `source`：

```yaml
skills:
  - id: remote-review
    source:
      kind: webpage
      url: https://example.com/blog/review-skill
    install:
      mode: agent
    description: 来源里描述了 review skill，但还没有精确安装源

  - id: published-review
    source:
      kind: webpage
      url: https://example.com/review
    resolved:
      kind: skill-url
      url: https://raw.githubusercontent.com/org/repo/main/review/SKILL.md
      version: "2026-07-06"
      integrity: sha256-...
    install:
      mode: buildr
```

`source` 可以是网页、README、Git repo、registry 页面或 raw URL，不承诺可安装。`resolved` 必须是 Buildr 能确定性处理的来源。`resolved.kind` 表示安装源类型，本 change 要求支持 `skill-url`：URL 内容就是 raw `SKILL.md`。其他 kind 只有在 CLI 具备对应 resolver 后才能登记和渲染，否则必须报错。

### 2. 两种类型三种 add 方式

`skills add` 的用户意图分三类：

1. 本地源目录：
   ```bash
   buildr skills add [<id>] --source <skill-dir> --scope <scope> --target <dir>
   ```
   写入 `path` 条目，并将目录内容装载到 `skills/<skill-id>/`。

   参数：
   - `<id>`：可选；提供时必须与 `SKILL.md` frontmatter 的 `name` 一致。
   - `--source <skill-dir>`：本地完整 Skill 源目录，必须包含 `SKILL.md`。
   - `--scope <scope>`：`.` 或 `projects/<project>`。
   - `--target <dir>`：Buildr workspace 根目录。
   - `--replace`：替换同 id manifest 条目。
   - `--ignore-unsupported`：仅用于本地目录装载；遇到未知顶层内容时跳过并在输出中说明。

2. 远端信息源：
   ```bash
   buildr skills add <id> --remote-source <url> --source-kind <kind> --scope <scope> --target <dir>
   ```
   写入 `source` 和 `install.mode: agent`，不要求 Buildr 能解析该 URL。未提供 `--source-kind` 时默认记录为 `url`，避免 CLI 对网页、README 或 registry 页面做猜测。

   参数：
   - `<id>`：必填 Skill id。
   - `--remote-source <url>`：网页、README、GitHub 页面、registry 页面或其他信息源。
   - `--source-kind <kind>`：可选；未提供时默认 `url`。
   - `--scope <scope>`：`.` 或 `projects/<project>`。
   - `--target <dir>`：Buildr workspace 根目录。
   - `--description <text>`：可选摘要，仅用于 manifest 快速扫描。
   - `--replace`：替换同 id manifest 条目。

3. 已解析安装源：
   ```bash
   buildr skills add <id> --resolved-source <url> --resolved-kind <kind> --scope <scope> --target <dir>
   ```
   写入 `resolved`，并在可校验时把 `version`、`integrity` 记录到 `resolved`。如果命令同时提供原始 source URL，也保留 `source`。默认 `install.mode: buildr`。未提供 `--resolved-kind` 时默认 `skill-url`，表示 `<url>` 直接指向 raw `SKILL.md`。投射到 Agent runtime 时默认使用 `<id>` 作为 Skill 名称。

   参数：
   - `<id>`：必填 Skill id。
   - `--resolved-source <url>`：Agent 已确认的精确安装源。
   - `--resolved-kind <kind>`：可选；未提供时默认 `skill-url`。
   - `--remote-source <source-url>`：可选；用于保留原始网页、README 或 registry 信息源。
   - `--source-kind <kind>`：可选；与 `--remote-source` 配套，未提供时默认 `url`。
   - `--version <version>`：可选；记录 Agent 解析到的版本、tag、commit 或日期。
   - `--integrity <hash>`：可选；记录远端内容校验值，供 render/check 校验漂移。
   - `--scope <scope>`：`.` 或 `projects/<project>`。
   - `--target <dir>`：Buildr workspace 根目录。
   - `--description <text>`：可选摘要，仅用于 manifest 快速扫描。
   - `--replace`：替换同 id manifest 条目。

   当 Agent 是从一个网页或 README 解析出 raw `SKILL.md` 时，可以把原始信息源和精确安装源一次登记：
   ```bash
   buildr skills add <id> --remote-source <source-url> --resolved-source <skill-md-url> --replace --scope <scope> --target <dir>
   ```

取舍：不复用 `--source` 表达远端 URL，避免和当前本地目录语义冲突。

### 3. Agent 辅助解析是正式流程

Buildr Skill 应引导 Agent：

1. 先登记用户提供的 `source`。
2. 尝试从 source 中识别精确安装源。
3. 能识别时，调用 `skills add <id> --resolved-source ... --replace` 精确维护 manifest。
4. 不能识别时，保留 `install.mode: agent`，等待 render 时把 source 交给 Agent 处理。

这让“信息源”也能被治理，同时避免 Buildr CLI 对网页内容做不可靠推断。

### 4. render 分三种处理

`skills render <agent>` 对每个 manifest 条目按类型处理：

- `path` 本地源目录：Buildr CLI 读取本地 `SKILL.md` 并写入 Agent runtime。
- `resolved + install.mode: buildr`：Buildr CLI 拉取、校验并安装到 Agent runtime。
- `source + install.mode: agent`：Buildr CLI 生成 Buildr managed 的 Agent-readable 安装计划或安装说明，要求 Agent 阅读 source 并安装到目标 runtime。

对 `install.mode: agent`，render 不应假装已安装 Skill；runtime check/doctor 必须报告它需要 Agent action，而不是 ok。

### 5. source 升级 resolved 复用 skills add

不新增 `skills resolve <id>` 命令。Agent 从 source 里解析出精确安装源后，统一调用：

```bash
buildr skills add <id> --resolved-source <url> --replace --scope <scope> --target <dir>
```

如果需要显式声明类型，再附加 `--resolved-kind skill-url` 或 CLI 已支持的其他 kind。这样 `skills add` 仍是唯一的 manifest 登记/更新入口，避免再引入一条只做状态升级的命令。

### 6. Buildr Skill 文档结构前置类型

Buildr Skill 的 `SKILL.md` 和 bootstrap guide 应在资产维护章节前先给出：

1. Skill 类型：
   - 本地作者型
   - 远端发布型
2. 登记方式：
   - local source
   - remote information source
   - resolved install source
3. render 方式：
   - Buildr local install
   - Buildr remote install
   - Agent install

这样 Agent 在读说明时先判断类型，再选择命令，不会把远端网页误当成本地 Skill 源目录。

## Risks / Trade-offs

- [Risk] 远端网页不可稳定解析 -> Mitigation: `source` 只记录信息源；只有 `resolved` 才进入 Buildr CLI 确定性安装。
- [Risk] Agent 安装模式让 runtime 状态难以完全验证 -> Mitigation: runtime check 必须报告 `agent action required`，直到 Agent 安装后能被 adapter 检测为实际存在。
- [Risk] 远端内容漂移或被替换 -> Mitigation: resolved source 支持 `version` 和 `integrity`；无 integrity 时 doctor 给出 warning。
- [Risk] 与上一版 `package:<id>` 模型冲突 -> Mitigation: 将 `package:<id>` 限定为内部 resolver 或迁移辅助，不作为用户发布型 Skill 的主要 `source` 格式。

## Migration Plan

1. 更新 `remote-skill-source-flow` spec 后，调整或废弃 `optimize-skills-management` 中的 package-local source 设计。
2. 扩展 `skills/manifest.yml` parser，支持对象型 `source`、`resolved` 和 `install`。
3. 扩展 `skills add`，加入 `--remote-source` 和 `--resolved-source`。
4. 扩展 `skills render` 和 runtime check，分别处理 Buildr install 与 Agent install。
5. 更新 Buildr Skill、bootstrap guide、workspace baseline 文档和验证脚本。

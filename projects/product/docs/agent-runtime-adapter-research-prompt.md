# Agent Runtime Adapter 调研 Prompt

把下面内容交给目标 Agent，只替换第一行。请在不同 surface 中分别执行，例如 `Qoder IDE` 与 `Qoder CLI`、`TRAE Solo` 与 `TRAE Work`。

```text
目标 Agent：<产品名和 surface>

Buildr 准备为你当前运行的 Agent 增加 runtime adapter。请检查当前真实版本，只回答构造 adapter descriptor 所需的 runtime 事实，不要介绍产品的其他功能。

规则：

- 优先使用当前产品实际观察；其次使用对应版本官方文档或源码。
- 不确定就填写 null，不要猜测。
- 不要修改现有项目；需要测试时新建临时 workspace。
- 每项结论标记 observed、official_documentation、source_code 或 inferred。

## 1. Identity

请给出：

- 正式产品名和当前 surface：ide、cli、desktop 或 cloud；
- 当前版本/build 和操作系统；
- 建议 adapter id；
- IDE/CLI/Work/Solo 是否共享同一套 Rules、Skills 和配置；
- 查询版本的命令；没有则填 null。

## 2. Rules trait

从下面选择最接近的一项：

- native-recursive：原生按目录读取嵌套 AGENTS.md；
- native-root：只读取根规则；
- reference-bridge：可以用产品入口文件引用同目录 AGENTS.md；
- vendor-rule-files：需要生成产品专用 rules 文件。

请说明：

- 支持的准确文件/目录；
- 嵌套 AGENTS.md 的发现边界和合并顺序；
- 是否隔离兄弟目录和 multi-root workspace；
- 引用语法或 vendor rule 格式；
- 修改后何时生效。

## 3. Skills trait

从下面选择：

- agents-compatible：项目使用 `.agents/skills/<id>/SKILL.md`；
- vendor-root：使用其他项目级 Skills root。

请说明准确的项目路径、用户路径、同名优先级，以及新增/修改/删除 Skill 后何时生效。

## 4. Activation 与 checker

Rules 和 Skills 分别选择：

- immediate
- path-read
- session-start
- explicit-reload

如果需要 reload，请给出操作或命令。

请给出只读的安装检测和版本检测方法：

- command：可执行文件、参数和示例输出；
- manual：必须人工确认什么；
- none：没有可靠方法。

## 5. 最小验证

在临时 workspace 中尽量验证：

1. 根 AGENTS.md 是否生效；
2. 进入子目录后，子目录 AGENTS.md 是否生效且兄弟目录不泄漏；
3. project Skill 是否能被发现；
4. 修改 Rule/Skill 后是否需要 reload 或新会话。

无法验证的项目写 not_run。

## 输出

先用 5 行以内总结，然后输出严格合法的 JSON：

{
  "identity": {
    "name": "",
    "adapterId": "",
    "surface": "ide|cli|desktop|cloud",
    "version": "",
    "build": null,
    "os": "",
    "sharedWithOtherSurfaces": null
  },
  "rules": {
    "kind": "native-recursive|native-root|reference-bridge|vendor-rule-files|unknown",
    "entries": [],
    "discovery": null,
    "mergeOrder": null,
    "siblingIsolated": null,
    "multiRootIsolated": null,
    "referenceOrFormat": null,
    "activation": "immediate|path-read|session-start|explicit-reload|unknown"
  },
  "skills": {
    "kind": "agents-compatible|vendor-root|unknown",
    "projectRoot": null,
    "userRoot": null,
    "duplicatePriority": null,
    "activation": "immediate|path-read|session-start|explicit-reload|unknown"
  },
  "reloadGuidance": null,
  "checker": {
    "installation": { "kind": "command|manual|none", "command": null, "evidence": null },
    "version": { "kind": "command|manual|none", "command": null, "evidence": null }
  },
  "tests": [
    { "name": "root-rules", "status": "pass|fail|not_run", "observation": "" },
    { "name": "nested-rules-isolation", "status": "pass|fail|not_run", "observation": "" },
    { "name": "project-skill", "status": "pass|fail|not_run", "observation": "" },
    { "name": "reload", "status": "pass|fail|not_run", "observation": "" }
  ],
  "evidence": [
    { "claim": "", "level": "observed|official_documentation|source_code|inferred", "source": "" }
  ],
  "blockingUnknowns": []
}
```

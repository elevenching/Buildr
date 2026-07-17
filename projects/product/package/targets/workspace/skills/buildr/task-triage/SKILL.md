---
name: task-triage
description: 用户要求修 bug、实现或调整功能、改需求、重构、优化、补文档、补测试、调整 API/契约/权限/状态流/数据语义，或询问某项改动是否需要更新 spec、创建 change、只改代码时使用。用于先理解用户任务意图和影响范围，再决定后续处理方式。
---

# Task Triage Skill

本 Skill 用于在用户提出修改、修复、实现、补充或整理类任务时，先判断任务意图、影响范围和业务语义变化，再选择后续处理方式。

## 判断目标

- 用户真正想改变什么。
- 影响的是产品/业务语义、已有事实文档，还是实现细节。
- 是否需要业务确认。
- 后续处理方式是 `code-only`、`spec-maintenance`、`change-flow`，还是暂停确认。
- 当前任务是否需要创建或继续维护任务驾驶舱。

## 判断步骤

1. 识别用户任务意图：
   - 动作：修复、实现、调整、重构、优化、补文档、补测试、整理、删除。
   - 对象：产品能力、模块、接口、规则、文档、数据、状态流或权限。
   - 期望结果：用户希望外部可观察行为或长期事实如何变化。
2. 检查任务相关事实，只读任务相关范围，不做全量审计：
   - 相关 specs、knowledge、active changes。
   - 相关代码、测试、文档和现有行为。
3. 判断语义影响：
   - 是否改变 SHALL/MUST。
   - 是否改变状态流、API、数据契约、权限或业务规则。
   - 是否只是让代码符合已有 spec。
   - 是否只是把已接受的现有事实补写到文档。
4. 输出后续处理方式。
5. 判断任务驾驶舱：
   - 简单、短时、无持续跟踪价值时选择“不需要”。
   - 跨阶段、跨 change、跨服务或团队，存在交叉依赖、长期跟踪或多次用户判断时选择“创建”或“继续维护”。
   - 用户明确要求任务可视化、驾驶舱、整体进度或任务全景时，使用 `task-cockpit` Skill。

## 输出格式

```text
路径判定：
- 选择：code-only / spec-maintenance / change-flow / 暂停确认
- 用户任务意图：
- 是否改变业务语义：
- 是否需要业务确认：
```

任务驾驶舱判断：

```text
- 选择：不需要 / 创建 / 继续维护
- Task ID：<可确认时填写；尚未确定时明确说明>
- 路径：<已解析路径；尚未创建或解析时明确说明>
- 当前状态：<未创建 / 已创建 / 已更新 / 待更新 / 阻塞>
```

选择“创建”或“继续维护”时，使用独立 `task-cockpit` Skill 创建或更新驾驶舱，不在本 Skill 中复制 HTML 信息架构和维护手册。

如果选择或继续使用 OpenSpec，在同一回复中追加：

```text
OpenSpec change 状态：
- Change：<change id>
- 路径：<resolved change path；尚未解析时明确说明>
- 当前动作：<explore / propose / apply / sync / archive>
- 当前状态：<planned / active / blocked / apply-ready / complete / archived>
- 进度：<artifact 或 task 进度；可用时填写>
- 下一步或阻塞原因：<next executable action 或 blocking reason>
```

状态必须来自当前可确认的 OpenSpec 事实。优先读取 `openspec status --change <id> --json`；实现阶段需要 task 进度时，同时读取 `openspec instructions apply --change <id> --json`。change 尚未创建时写明 `planned`，不得伪造 resolved path 或进度。

首次采用 OpenSpec、状态发生实质变化、工作暂停或完成，以及用户询问进度时，必须刷新并报告当前 change 状态；没有状态变化的中间消息不必机械重复完整摘要。

使用 OpenSpec 时，Buildr 自有的 proposal、design、specs、tasks 和面向用户的说明，其文档正文使用中文。命令、路径、代码标识符、协议字段、YAML/frontmatter 以及 `Requirement`、`Scenario`、`MUST`、`WHEN`、`THEN` 等 OpenSpec 格式关键字可以保留英文。外部加载或由 OpenSpec 生成的 `openspec-*` Skills 不属于本约束的翻译范围。

## 后续处理方式

### code-only

- 适用于 spec 已覆盖、代码不符合的缺陷修复。
- 适用于 spec 已覆盖且代码符合的普通实现、重构、测试补充、日志、格式或性能优化。
- 不创建 OpenSpec change，不修改 specs，除非任务本身要求补文档且确认为已有事实。

### spec-maintenance

- 适用于 spec 缺失或含糊，但代码或已接受行为已经代表当前事实。
- 直接维护 specs 或 knowledge，不为已经发生的历史事实补造 change。
- 如果无法判断代码和文档谁代表正确事实，暂停并向用户确认。

### change-flow

- 适用于本次任务会改变 SHALL/MUST、状态流、契约、权限、业务规则或数据语义。
- 提案通过前不进入正式实现，除非用户明确要求探索性原型。
- 一个独立业务目标使用一个 change；多个独立业务目标分别维护。
- 选择或继续 OpenSpec change-flow 时，在用户可见回复中说明当前 change 状态、进度以及下一步或阻塞原因。

## 任务驾驶舱判断

- 驾驶舱覆盖整个任务，可以关联多个 OpenSpec change、code-only 工作、外部依赖和已完成阶段，不把当前 `tasks.md` 当作整个任务的唯一边界。
- 驾驶舱默认位于拥有任务的 Project `openspec/knowledge/task-cockpits/`，由 `task-cockpit` Skill 解析实际 Project、日期前缀文件名和稳定路径，不得在 triage 阶段猜测。
- 驾驶舱由 Agent 单向维护，用户通过 Agent 对话参与；HTML 中的 checkbox 和状态只读。
- 驾驶舱首次创建、实质更新、用户询问进度、任务暂停或完成时，Agent 回复应提供可点击入口；没有改变任务认知的短暂中间动作不机械重复链接。

## 实现型任务的验证编排

为实现型 change 编写或调整 tasks 时，按共享实现区域、验证入口或失败影响面组织有语义的任务组，不按固定任务数量机械分组：

- 每个实现任务只安排语法、类型或直接相关测试等最小反馈检查。
- 每个任务组完成后安排一次受影响范围验证，不为组内每项任务重复同一专项检查。
- 将完整候选验证放在全部实现、自然语言资产、生成资产同步和 review 修订之后。
- 具体专项检查和完整验证命令由当前 workspace 或 Project 的规则、OpenSpec 或开发文档定义；不得把 Buildr 产品仓的 package check、临时 workspace E2E 或产品总验证规定为所有项目的固定入口。
- 安全边界、不可逆迁移或用户明确要求的即时检查不因批量编排而省略。

<!-- buildr:skill-contributions change-ready -->

## Guardrails

- Bug 修复目标若已被现有 spec 覆盖，走 `code-only`。
- 小改动只要改变业务语义，就走 `change-flow`。
- 不能用 `spec-maintenance` 绕过新需求评审。
- 不能用 `code-only` 掩盖 spec 缺失或业务事实不明。
- 不能为过去未记录的事实补造虚假 change 历史。
- 不为简单任务机械创建空洞驾驶舱，也不把驾驶舱当作 OpenSpec change 的翻译。
- OpenSpec 只记录业务语义，不记录代码风格、工具类、SQL 默认值等工程约定。
- 不使用未经 OpenSpec CLI 确认的路径、进度或完成状态填充 change 状态摘要。
- 不把“按任务组集中验证”解释为跳过最终候选完整验证。

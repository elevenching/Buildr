## ADDED Requirements

### Requirement: Buildr Core 要求 Agent 引导下一步
Buildr required Core MUST 要求 Agent 在完成当前工作、到达阶段节点或遇到阻塞时，向用户说明明确、可执行的下一步。

#### Scenario: 当前事项存在下一步
- **WHEN** Agent 完成当前工作、到达阶段节点或遇到阻塞，且当前事项仍有后续动作
- **THEN** Agent MUST 结合当前状态以及适用的 Rule、Skill 和项目约定说明下一步

#### Scenario: 当前任务已经完整结束
- **WHEN** 当前任务已经完整结束且没有相关的后续动作
- **THEN** Agent MUST 明确说明任务已完成
- **AND** Agent MUST NOT 机械追加无关建议

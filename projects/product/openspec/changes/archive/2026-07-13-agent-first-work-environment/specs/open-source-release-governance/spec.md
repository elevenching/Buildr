## MODIFIED Requirements

### Requirement: 公开 README 必须提供中文入口和英文翻译
Buildr MUST 使用根 `README.md` 作为中文产品入口，并 MUST 提供 `README.en.md` 作为 README 的完整英文翻译；其他文档 MUST 继续遵循 Project 管理语言而不要求双语复制。

#### Scenario: 用户从任一 README 开始
- **WHEN** 用户打开中文或英文 README
- **THEN** README MUST 在顶部链接另一语言版本
- **AND** 两份 README MUST 包含一致的 Agent-first 产品定位、问题与价值、工作方式、典型场景、分角色价值、核心模型、快速开始、当前能力与边界和文档导航
- **AND** 两份 README MUST 使用相同的 canonical repository、npm package、CLI 命令和 supported Agent runtime 事实
- **AND** 快速开始 MUST 同时提供 registry package 和开发 checkout 两种 Buildr 来源，并汇合到相同的 runtime discovery 与 init onboarding
- **AND** README MUST 将快速开始的开发 checkout 安装路径与 Buildr 自举 workspace 的仓库结构说明清楚分工，不得在两个章节重复完整 onboarding

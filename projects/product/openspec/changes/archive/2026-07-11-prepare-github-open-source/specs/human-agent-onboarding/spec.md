## ADDED Requirements

### Requirement: 开发仓库安装必须形成 Agent 可用闭环
Buildr MUST 提供与当前 GitHub 仓库结构一致的开发 checkout 安装路径，使 Agent 在没有预装 `node_modules` 或 Buildr Skill 的干净 clone 中能够准备 CLI、初始化 workspace、同步自身 runtime 并完成诊断。

#### Scenario: Agent 从干净开发仓库开始
- **WHEN** Agent 在 Buildr GitHub 仓库的干净 clone 中按公开 README 安装 Buildr
- **THEN** 安装说明 MUST 使用仓库中真实存在的产品目录和安装脚本
- **AND** 安装流程 MUST 确定性准备 lockfile 声明的运行依赖
- **AND** Agent MUST 能运行 `buildr runtime list --json`

#### Scenario: Agent 完成首次 runtime 准备
- **WHEN** CLI 已从开发 checkout 或已安装 npm package 可用
- **THEN** 公开 onboarding MUST 引导 Agent 运行 `buildr init` 创建源资产
- **AND** 公开 onboarding MUST 引导 Agent 使用 `buildr sync <agent>` 安装产品 Buildr Skill、投射 workspace Skills 并运行 doctor
- **AND** 最终 `buildr doctor --agent <agent> --json` MUST 不包含需要立即处理的 error

#### Scenario: 开发仓库安装回归验证
- **WHEN** 产品完整验证运行 repository onboarding smoke test
- **THEN** verifier MUST 使用不包含 `node_modules` 和 Agent runtime 产物的临时候选树
- **AND** verifier MUST 从公开安装入口完成 CLI 安装、workspace 初始化、runtime sync 和 doctor 检查

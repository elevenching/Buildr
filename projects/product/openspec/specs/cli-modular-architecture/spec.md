# Buildr CLI 模块化架构

## Purpose

定义 Buildr CLI 的薄 executable、内部模块分层、依赖方向、行为兼容、npm runtime 发布完整性和自动架构门禁。

## Requirements
### Requirement: CLI executable 必须保持薄入口
Buildr CLI executable MUST 只承担进程启动、顶层错误处理和调用命令分发器，不得继续承载具体资产领域的解析、校验、诊断或写入实现。

#### Scenario: 从 checkout 或 npm package 启动 CLI
- **WHEN** 用户通过 checkout 的 `tools/buildr` 或 npm 安装后的 `buildr` 执行任意受支持命令
- **THEN** executable MUST 将参数交给同一内部 CLI runtime 和 command registry
- **AND** executable 自身 MUST NOT 包含具体 Project、Service、Rule、Skill、Command、Component、OpenSpec、doctor、package 或 runtime command 的领域实现

### Requirement: CLI 模块必须具有单向依赖和明确领域所有权
Buildr CLI runtime MUST 将 command entry、application composition、领域模块和 shared infrastructure 分层，并 MUST 保持从上层到下层的单向依赖；每个领域的 manifest 语义、校验和 mutation handler MUST 由对应领域模块唯一维护。

#### Scenario: 领域命令调用共享基础设施
- **WHEN** Rules、Skills、Commands、Components、OpenSpec contract、workspace registry 或 runtime 领域执行解析、校验或受管写入
- **THEN** 领域模块 MUST 只依赖 shared infrastructure 或显式的下层领域 service
- **AND** shared infrastructure MUST NOT 反向导入 command entry、application composition 或具体领域模块

#### Scenario: doctor、sync 或 package 组合多个领域
- **WHEN** doctor、sync/update 或 package maintenance 需要聚合多个领域的结果
- **THEN** 聚合 MUST 发生在显式 application composition 模块
- **AND** 领域模块 MUST NOT 通过循环 import 或隐式共享全局相互调用

### Requirement: 模块化重构必须保持 CLI 可观察行为兼容
Buildr MUST 在模块化迁移前后保持现有 public、legacy compatibility 和 internal/maintenance CLI 的命令路径、参数语义、help、stdout/stderr、退出状态、JSON schema、文件结果和失败回滚行为，除非另有独立 OpenSpec change 明确修改对应契约。

#### Scenario: 受支持命令从新模块运行
- **WHEN** 用户或 Agent 使用现有有效参数执行任一受支持命令
- **THEN** 重构后的 CLI MUST 产生与重构前相同语义的输出和状态变更
- **AND** source mutation、atomic write、transaction、integrity 与 fail-closed 约束 MUST 保持有效

#### Scenario: 无效输入和帮助请求
- **WHEN** 用户请求根/主题帮助，或提供未知命令、缺失参数、非法 option、unsupported adapter 等无效输入
- **THEN** CLI MUST 保持既有输出通道、退出状态和无副作用契约

### Requirement: CLI runtime 模块必须完整发布且不扩大公开 API
Buildr npm package MUST 包含 `buildr` bin 执行所需的完整内部模块依赖闭包，并 MUST 让 checkout 与 npm 安装入口使用同一命令实现；内部模块文件不得因此成为面向使用者的公开编程 API。

#### Scenario: 从 tarball 安装并执行 CLI
- **WHEN** 维护者构建 tarball 并在不依赖 development checkout 的干净目录安装
- **THEN** tarball MUST 包含 executable 引用的全部内部 CLI runtime modules
- **AND** 安装后的代表性 help、只读、mutation、runtime 与 doctor 命令 MUST 与 checkout 入口保持行为等价

#### Scenario: 使用者查看 package public surface
- **WHEN** 使用者检查 package metadata 或公开文档
- **THEN** package MUST 继续只承诺 `buildr` bin 和已记录的 CLI 产品表面
- **AND** 内部领域模块 MUST NOT 被声明为稳定 public exports

### Requirement: CLI 架构和 mutation 边界必须由自动验证保护
Buildr 产品验证 MUST 自动检查薄 executable、command 唯一登记、模块依赖方向、显式 shared platform 依赖、关键 facade 职责、npm runtime inventory、verifier 场景边界和直接文件写入边界，并 MUST 在模块回退为巨石、出现宽 namespace 或反向依赖、漏发运行时文件、验证流程重新内嵌到聚合入口或绕过受管 mutation primitive 时失败。

#### Scenario: 维护者运行产品验证
- **WHEN** 维护者运行 CLI 架构专项检查或产品完整验证
- **THEN** verifier MUST 扫描全部发布 CLI runtime modules，而不是只检查 `tools/buildr` 单文件
- **AND** verifier MUST 对不符合分层、显式依赖、facade 职责、verifier 场景或 mutation 白名单的实现返回非零状态和可定位文件/模块的诊断

#### Scenario: package check 聚合发布验证
- **WHEN** 维护者运行 `buildr package check`
- **THEN** package maintenance 层 MUST 聚合发布 metadata、inventory、baseline 和 smoke 结果
- **AND** 单个 package command handler MUST NOT 重新内嵌其他领域的完整实现

#### Scenario: 运行细粒度自动测试
- **WHEN** 维护者运行产品完整验证或单独运行 unit test 入口
- **THEN** Buildr MUST 使用 Node 原生测试入口验证可独立执行的解析、路径选择、计划生成和架构约束
- **AND** 需要完整临时 workspace 或真实 CLI 进程的端到端行为 MUST 继续由场景化 smoke 或 MVP verifier 覆盖

#### Scenario: 检查稳定 facade
- **WHEN** 架构 verifier 检查 package maintenance、doctor、runtime Skill renderer 或 MVP verifier 聚合入口
- **THEN** 这些入口 MUST 只承担参数接入、模块组合、兼容导出或场景调度
- **AND** 具体静态校验、诊断、来源解析、render plan 或长场景实现 MUST 位于职责明确的下层模块

### Requirement: tools 内部实现必须按职责目录组织
Buildr `tools/` MUST 将 runtime、renderer、shared helper 和专项 verification 实现组织到职责明确的下级目录，并 MUST 只在顶层保留稳定 executable facade 和明确的 checkout 安装入口。

#### Scenario: 维护者检查 tools 顶层
- **WHEN** 架构 verifier 扫描 `tools/` 顶层
- **THEN** 顶层 MUST 保留 `buildr`、checkout install/uninstall、产品总验证和 MVP 聚合入口
- **AND** runtime/check/render 实现 MUST 位于 `tools/runtime/`
- **AND** 专项 verifier MUST 位于 `tools/verification/<area>/`
- **AND** 通用非领域 helper MUST 位于 `tools/shared/`

#### Scenario: 内部文件迁移后发布 npm package
- **WHEN** 维护者构建并安装 npm tarball
- **THEN** package runtime inventory MUST 包含安装后 CLI 所需的全部新路径
- **AND** package MUST NOT 依赖旧内部文件路径
- **AND** 公开 `buildr` bin 和已记录 executable facade MUST 保持兼容

#### Scenario: 内部路径不是公开 API
- **WHEN** 使用者查看 package metadata 和 CLI 文档
- **THEN** Buildr MUST 继续只承诺公开 CLI surface
- **AND** `tools/runtime/`、`tools/verification/` 和 `tools/shared/` MUST NOT 被声明为稳定 package exports
### Requirement: package maintenance 必须组合独立 verifier
Buildr package maintenance application MUST 通过职责明确的 verifier modules 组合 package check，且每个 verifier MUST 提供稳定执行入口和结构化的成功或失败结果。

#### Scenario: 检查 package maintenance facade
- **WHEN** CLI architecture verifier 检查 package maintenance application
- **THEN** command handler MUST 只负责建立共享 package context、调用已登记 verifier 和汇总输出
- **AND** handler 与单个 smoke module MUST NOT 内嵌 Commands、Rules、Skills、runtime 和 workspace 生命周期的完整组合场景

#### Scenario: verifier 报告失败
- **WHEN** 任一 package verifier 发现契约问题或子进程失败
- **THEN** verifier MUST 将问题归属到稳定 step identity
- **AND** 聚合层 MUST 保留可定位诊断而不是仅报告无边界的 package check 失败

## MODIFIED Requirements

### Requirement: CLI executable 必须保持薄入口
Buildr CLI executable MUST 位于 `bin/buildr.mjs`，只承担进程启动、顶层错误处理和调用 `src/interfaces/cli` command dispatcher，不得承载具体资产领域的解析、校验、诊断或写入实现；checkout 根 `buildr` 入口 MUST 委托同一实现。

#### Scenario: 从 checkout 或 npm package 启动 CLI
- **WHEN** 用户通过 checkout 根 `buildr` 或 npm 安装后的 `buildr` 执行任意受支持命令
- **THEN** executable MUST 将参数交给同一 `src/interfaces/cli` runtime 和 command registry
- **AND** executable 自身 MUST NOT 包含具体 Project、Service、Rule、Skill、Command、Component、OpenSpec、doctor、package 或 runtime command 的领域实现
- **AND** checkout 与 npm 入口 MUST NOT 依赖已删除的 `tools/buildr` 或 `tools/cli` 路径

### Requirement: CLI 模块必须具有单向依赖和明确领域所有权
Buildr CLI runtime MUST 将 `interfaces/cli`、application composition、domain 与 infrastructure 分层，并 MUST 保持从 interface 经 application 到 domain/ports 的显式依赖；每个领域的 manifest 语义、校验和 mutation handler MUST 由对应 domain 或 application owner 唯一维护。

#### Scenario: 领域命令调用基础设施
- **WHEN** Rules、Skills、Commands、Components、OpenSpec contract、workspace registry 或 runtime 领域执行解析、校验或受管写入
- **THEN** CLI interface MUST 调用 application 用例
- **AND** application MUST 通过显式 port 使用 filesystem、process、network 或 runtime infrastructure
- **AND** domain MUST NOT 反向导入 application、infrastructure 或 interface

#### Scenario: doctor、sync 或 package 组合多个领域
- **WHEN** doctor、sync/update 或 package maintenance 需要聚合多个领域的结果
- **THEN** 聚合 MUST 发生在显式 application composition 模块
- **AND** 领域模块 MUST NOT 通过循环 import、interface import 或隐式共享全局相互调用

### Requirement: CLI runtime 模块必须完整发布且不扩大公开 API
Buildr npm package MUST 包含 `bin/buildr.mjs` 引用的完整 `src/` runtime dependency closure，并 MUST 让 checkout 与 npm 安装入口使用同一命令实现；内部 `src` modules 不得因此成为面向使用者的公开编程 API。

#### Scenario: 从 tarball 安装并执行 CLI
- **WHEN** 维护者构建 tarball 并在不依赖 development checkout 的干净目录安装
- **THEN** tarball MUST 包含 executable 引用的全部内部 runtime modules
- **AND** 安装后的代表性 help、只读、mutation、runtime、package 与 doctor 命令 MUST 与 checkout 入口保持行为等价
- **AND** 安装后命令 MUST NOT 依赖 `test/`、`scripts/` 或旧 `tools/` 路径

#### Scenario: 使用者查看 package public surface
- **WHEN** 使用者检查 package metadata 或公开文档
- **THEN** package MUST 继续只承诺 `buildr` bin 和已记录的 CLI 产品表面
- **AND** `src` 内部模块 MUST NOT 被声明为稳定 public exports

### Requirement: CLI 架构和 mutation 边界必须由自动验证保护
Buildr 产品验证 MUST 自动检查 `bin` 薄入口、command 唯一登记、`src` 单向依赖、明确基础设施 owner、关键 facade 职责、npm runtime inventory、产品 verifier 与仓库 verification 边界和直接文件写入边界，并 MUST 在恢复 `tools/`、出现无所有权 shared、反向依赖、漏发运行时文件、验证流程重新内嵌到聚合入口或绕过受管 mutation primitive 时失败。

#### Scenario: 维护者运行产品验证
- **WHEN** 维护者运行 CLI 架构专项检查或产品完整验证
- **THEN** verifier MUST 扫描全部发布 `bin/` 与 `src/` runtime modules
- **AND** verifier MUST 对不符合分层、显式依赖、facade、verifier ownership 或 mutation 白名单的实现返回非零状态和可定位诊断
- **AND** verifier MUST 对任何 tracked 旧 `tools/` 路径或新无所有权 shared 根失败

#### Scenario: package check 聚合发布验证
- **WHEN** 维护者运行 `buildr package check`
- **THEN** package maintenance application MUST 只组合位于 `src` 的产品 verifier
- **AND** command handler MUST NOT 导入 `test/verification` 或重新内嵌其他领域的完整实现

#### Scenario: 运行细粒度自动测试
- **WHEN** 维护者运行产品完整验证或单独运行 unit test 入口
- **THEN** Buildr MUST 使用 `test/` 下的稳定入口验证解析、路径选择、计划生成和架构约束
- **AND** 需要完整临时 workspace 或真实 CLI 进程的端到端行为 MUST 继续由场景化 integration 或 focused verifier 覆盖

#### Scenario: 检查稳定 facade
- **WHEN** 架构 verifier 检查 package maintenance、doctor、runtime Skill renderer 或 Candidate 聚合入口
- **THEN** 这些入口 MUST 只承担参数接入、模块组合、兼容导出或场景调度
- **AND** 具体静态校验、诊断、来源解析、render plan 或长场景实现 MUST 位于职责明确的下层模块

## ADDED Requirements

### Requirement: 产品内部实现必须脱离 tools 目录
Buildr Product MUST 将产品运行实现放入 `src/`、可执行入口放入 `bin/`、仓库 verification 放入 `test/verification/`、维护脚本放入 `scripts/`，并 MUST 在完成迁移后删除 `tools/`。

#### Scenario: 内部文件迁移后发布 npm package
- **WHEN** 维护者构建并安装 npm tarball
- **THEN** package runtime inventory MUST 包含安装后 CLI 所需的全部 `bin/` 与 `src/` 路径
- **AND** package MUST NOT 依赖旧内部文件路径
- **AND** 公开 `buildr` bin 和已记录 CLI surface MUST 保持兼容

#### Scenario: 内部路径不是公开 API
- **WHEN** 使用者查看 package metadata 和 CLI 文档
- **THEN** Buildr MUST 继续只承诺公开 CLI surface
- **AND** `src/` 内部路径、`test/verification/` 和 `scripts/` MUST NOT 被声明为稳定 package exports

## REMOVED Requirements

### Requirement: tools 内部实现必须按职责目录组织
**Reason**: Product 已不再只是 CLI 工具，`tools/` 同时承载产品源码、runtime、verification 和开发脚本，无法准确表达生命周期与依赖边界。

**Migration**: 产品实现迁入 `src/`，executable 迁入 `bin/`，仓库 verification 迁入 `test/verification/`，维护脚本迁入 `scripts/`，并删除整个 `tools/`。

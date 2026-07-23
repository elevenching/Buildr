# local-app-browser-verification Specification

## Purpose

定义 Buildr 本机应用轻量浏览器冒烟验证的隔离边界、项目/服务/变更主流程覆盖、错误诊断和渐进式测试声明要求。

## Requirements

### Requirement: Buildr 必须提供隔离的本机应用浏览器冒烟验证
Buildr Product MUST 提供可重复执行的真实浏览器验证，并 MUST 在独立临时 Workspace 和随机 loopback 端口中运行，不读取或修改开发者真实 Workspace。

#### Scenario: 执行浏览器冒烟验证
- **WHEN** 环境具备 Node、npm 和受支持的 Chrome/Chromium 可执行文件
- **THEN** 验证 MUST 自动创建临时 Workspace fixture、启动本机应用并驱动无头浏览器
- **AND** 执行结束后 MUST 关闭浏览器与服务器并清理测试拥有的临时目录

#### Scenario: 浏览器环境不可用
- **WHEN** 无法解析或启动受支持的浏览器
- **THEN** 验证 MUST 以明确诊断失败或由测试编排标记为环境阻塞
- **AND** MUST NOT 下载浏览器、访问外部系统或回退操作真实 Workspace

### Requirement: 浏览器冒烟验证必须覆盖三个资源管理主流程
Buildr Product browser smoke MUST 覆盖项目、服务和变更管理的稳定用户路径，并 MUST 使用明确操作入口而非依赖表格整行点击。

#### Scenario: 验证项目主流程
- **WHEN** 浏览器打开项目目录并选择项目的“详情”操作
- **THEN** 页面 MUST 进入稳定项目详情路由
- **AND** MUST 展示 fixture Project 的真实身份与关联摘要

#### Scenario: 验证服务主流程
- **WHEN** 浏览器按所属项目打开服务目录并选择服务的“详情”操作
- **THEN** 页面 MUST 展示 fixture Service 的名称、代码、类型与来源事实

#### Scenario: 验证变更主流程
- **WHEN** 浏览器打开变更目录、使用生命周期过滤并进入 Change 详情
- **THEN** 页面 MUST 展示真实 lifecycle、任务进度与标准 artifacts
- **AND** Agent 操作 MUST 打开抽屉并生成提示词，不直接修改 Change 文件

### Requirement: 浏览器冒烟能力必须提供可诊断结果并渐进成熟
Buildr Product MUST 为 browser smoke 提供独立命令、浏览器错误收集和 Project 测试能力声明，并 MUST 在环境与稳定性未确认前保持非阻断成熟度。

#### Scenario: 浏览器页面出现运行错误
- **WHEN** 任一流程产生未预期的 `pageerror` 或 `console.error`
- **THEN** browser smoke MUST 失败并输出对应页面与错误摘要

#### Scenario: 首版登记测试能力
- **WHEN** browser smoke 首次写入 Product `verification.yml`
- **THEN** capability MUST 声明真实命令、Chrome 环境要求、本地临时副作用和覆盖范围
- **AND** maturity MUST 为 `trial` 且 enforcement MUST 为 `advisory`

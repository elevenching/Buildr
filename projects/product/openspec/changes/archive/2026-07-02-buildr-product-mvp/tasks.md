## 1. Bootstrap 与 workspace 初始化

- [x] 1.1 定义 Buildr bootstrap guide 的位置、内容结构和 Agent 读取入口
- [x] 1.2 实现或完善 `buildr init`，生成 workspace 基础骨架、根规则入口和默认配置
- [x] 1.3 在初始化后的引导流程中支持默认 Organization `default` 语义
- [x] 1.4 更新初始化模板，生成 `organizations/` 容器但不直接创建 `organizations/default/`
- [x] 1.5 更新产品文档，说明用户通过自然语言触发 Agent 使用 Buildr，而不是直接学习命令菜单

## 2. Organization / Project / Service 目录骨架

- [x] 2.1 实现或完善 `buildr org create <org>`，创建组织级规则、practices 和 skills 资产入口
- [x] 2.2 实现或完善 `buildr project create [<org>/]<project>`，创建项目级规则、OpenSpec、practices、skills 和 service 索引位置
- [x] 2.3 固化默认 service repo 目录约定为 `organizations/<org>/projects/<project>/services/<service>/`
- [x] 2.4 确保 workspace Git 默认忽略嵌套 service repo 的业务代码内容

## 3. Service 接入与 metadata

- [x] 3.1 实现 `buildr service link [<org>/]<project>/<service> <repo-ref>` 的 repo-ref 类型识别
- [x] 3.2 支持本地路径 repo-ref：校验路径可访问性和 Git 仓库状态，并写入 service metadata 引用
- [x] 3.3 支持 Git URL repo-ref：默认 clone 到 `services/<service>/`，未指定分支时使用远端 HEAD
- [x] 3.4 定义并实现项目级 `services.yml` 最小 schema，记录 repo kind、Git URL、remote、默认分支、path、type 和 rules
- [x] 3.5 避免在 `services.yml` 中强制重复记录可由目录推导的 Organization、Project、Service 层级信息
- [x] 3.6 支持共享 workspace 后基于 metadata 识别缺失 service repo，并给出可供 Agent 引导 clone 的信息

## 4. Runtime 投射边界

- [x] 4.1 明确 `AGENTS.md` 作为 Buildr 标准规则资产，更新相关文档和模板表述
- [x] 4.2 确保 `.claude/`、`.trae/`、`.cursor/`、`.codex/` 等 runtime 目录被视为可重建投射产物而非组织或项目资产源
- [x] 4.3 保证 workspace 级 runtime check/render 可用于 Agent-first onboarding 主路径
- [x] 4.4 明确 service repo 不作为 MVP 的独立 Agent runtime 入口，`service link` 不向 service repo 写入 runtime 文件
- [x] 4.5 移除 service metadata 中的 service repo runtime 投射意图字段，保持 metadata 只表达 repo 来源、服务语义和规则资产引用

## 5. Doctor 诊断

- [x] 5.1 实现或完善 `buildr doctor --json`，输出 Agent-readable 结构化诊断结果
- [x] 5.2 保留或补充 `buildr doctor` 默认人类可读输出
- [x] 5.3 诊断 workspace、Organization、Project 和 Service 基础状态
- [x] 5.4 诊断 service metadata 与本地 repo 是否一致，包括缺失 repo、remote 不匹配和外部路径不可访问
- [x] 5.5 诊断 workspace `.gitignore` 是否正确忽略嵌套 service repo
- [x] 5.6 诊断 Agent runtime 桥接文件是否存在、是否 stale、是否由 Buildr 管理，并输出下一步建议

## 6. 文档、验证与 OpenSpec 收尾

- [x] 6.1 更新 `docs/buildr-productization-roadmap.md`，与 Agent-first MVP、service metadata 和 workspace-first runtime 口径保持一致
- [x] 6.2 更新 `docs/buildr-architecture-vision.md`，补充 Buildr 类 Maven 的跨 Agent 项目协作契约定位
- [x] 6.3 将开发完成并验证成立的架构事实，从 `docs/` 的愿景/路线内容中剥离或同步到 `openspec/knowledge/`，作为当前 Buildr 语义记忆维护
- [x] 6.4 更新 README 或 bootstrap 文档，给出从自然语言入口到 Agent 执行 Buildr 命令的最小闭环示例
- [x] 6.5 为 init、project create、service link、doctor 和 runtime check/render 增加或更新验证用例
- [x] 6.6 运行 OpenSpec 校验，确认 `buildr-product-mvp` artifacts 和 delta specs 可被识别

## 7. 当前 Buildr workspace 校准优化

- [x] 7.1 使用 `buildr doctor --json` 检查当前 Buildr workspace，记录需要校准的历史资产问题
- [x] 7.2 为历史项目资产补齐或迁移 MVP 项目骨架，包括 `services.yml`、`services/`、OpenSpec、practices 和 skills 入口
- [x] 7.3 校准当前 `CLAUDE.md`、`.claude/` 等 runtime 投射产物，使 runtime checker 能识别现行 Buildr 生成头并避免误报 conflict
- [x] 7.4 根据当前 workspace 的实际组织、项目和服务资产补齐 service metadata 或明确不纳入 MVP 管理的例外
- [x] 7.5 重新运行 `buildr doctor --json` 和 runtime check/render，确认当前 Buildr workspace 与 MVP 规则一致

## 8. Shared Service 资产管理

- [x] 8.1 明确 shared service 属于 Buildr MVP 的组织级共享服务资产，位于 `organizations/<org>/shared/services/`
- [x] 8.2 调整 `service link` 或后续命令设计，使用户未说明公共服务或业务服务时，Agent 应引导确认 service 归属
- [x] 8.3 为 shared service 定义并实现组织级 `shared/services.yml` metadata 索引，记录 repo 来源、服务类型和规则资产入口
- [x] 8.4 将当前 `organizations/acme/shared/` 下的历史服务纳入 shared service metadata 管理，不强制移动已有服务目录
- [x] 8.5 扩展 `doctor --json` 诊断 shared service metadata、repo 状态和 workspace Git 忽略关系
- [x] 8.6 运行 `doctor --json` 和相关 runtime check，确认 project service 与 shared service 均符合 Buildr MVP 定义
- [x] 8.7 将 `organizations/<org>/shared/` 下的历史 shared service repo 迁移到默认 `organizations/<org>/shared/services/<service>/` 目录，并同步更新 `shared/services.yml`

## 9. 产品手册与 workspace 资产手册

- [x] 9.1 为 Buildr 产品自身建立产品手册，说明产品定位、核心概念、MVP 能力边界、Agent-first 使用方式和当前实现状态
- [x] 9.2 明确产品手册与 `docs/`、`openspec/specs/`、`openspec/knowledge/` 的边界：手册面向理解产品现状，spec/knowledge 面向规范与语义记忆，docs 面向探索和演进
- [x] 9.3 为 Buildr workspace 建立资产手册或项目手册，面向企业/团队说明当前 workspace 中有哪些 Organization、Project、Service、规则、OpenSpec、practices、skills 和 runtime 投射状态
- [x] 9.4 设计资产手册的最小结构和生成来源，避免手册成为需要人工重复维护的目录镜像
- [x] 9.5 评估并实现 Buildr CLI 对资产手册的维护入口，例如从 `doctor --json`、`services.yml` 和目录资产生成或刷新手册（结论：本轮不实现 CLI 生成入口，改由 `AGENTS.md` 约束人和 Agent 维护，`doctor --json` 仅作事实校验来源）
- [x] 9.6 在 bootstrap guide 和 README 中说明 Agent 何时读取产品手册、何时读取 workspace 资产手册
- [x] 9.7 优化 README 等对外入口文档，围绕“Buildr 面对什么问题、想解决什么问题、如何解决问题”重新组织产品叙事
- [x] 9.8 明确 Buildr 产品定位为企业内 Agent 使用的上下文与工作资产治理系统，而不是单次 prompt 或狭义文档管理工具
- [x] 9.9 补充多人、多职责、多项目、多代码仓同时使用 Claude Code、Codex 等生产工具 Agent 时的治理问题和 Buildr 解法
- [x] 9.10 完成全部实现后同步 delta specs 到主 specs，并在用户确认后归档 change

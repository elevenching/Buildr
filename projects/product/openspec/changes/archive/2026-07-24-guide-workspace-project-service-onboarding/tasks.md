## 1. Getting Started Application contracts

- [x] 1.1 在 Workspace Application 层组合既有 Workspace、Project、Service read model，返回派生 phase、primary action、canonical entity references 和 partial/degraded completeness，并补齐无 Project、多 Project、无 Service、Service 可选与部分失败单元测试。
- [x] 1.2 将 native directory picker 的登记结果收敛为 canonical、未初始化、需要迁移/修复、不可读和 identity conflict 等结构化结果，保证失败时 Registry 零写入，并为可恢复结果生成受约束 Agent prompt。
- [x] 1.3 扩展 Project/Service prompt Application contract，使 code、type、source、remote 和 integration branch 可作为可选高级声明，同时保持未知字段、跨 Workspace Project 和任意 path 注入拒绝测试。
- [x] 1.4 新增 Workspace-scoped 开始工作 prompt Application/API，按 `workspaceId + projectCode + optional serviceCode` 解析 canonical 范围、拒绝跨 Project/未知 entity，并覆盖 Project-scoped、Service-scoped 和零写入安全测试。
- [x] 1.5 对本组变更运行直接相关 unit、HTTP/contract 与 integration-fast 最小反馈；修复失败后运行一次 `npm run test:changed` 作为 Application 合约组受影响验证。

## 2. Workspace 首次进入与开始页

- [x] 2.1 重构空 Workspace Registry 页面，展示 Workspace 普通语言定义、Workspace → Project → Service 关系、登记影响说明，以及“添加已有工作空间”主操作和“让 Agent 创建”次操作。
- [x] 2.2 为 picker 的未初始化、迁移/修复、不可读和 identity conflict 结果实现可操作诊断、重新选择与 Agent Action；不得自动 init、sync、迁移或改写 identity。
- [x] 2.3 将 Workspace 概览升级为“开始”页，按 Getting Started projection 展示当前范围和唯一主要下一步，并实现无 Project、多 Project、无 Service但可直接开始、ready 与 degraded 状态。
- [x] 2.4 保留 Workspace metadata、Project/Service 数量、schema、revision 和技术诊断的次级可发现性，不让技术事实占据首次使用主视觉。
- [x] 2.5 补齐 Workspace 页面 DOM/static contract、错误恢复、键盘可达性与 390px 无主容器横向溢出测试，并运行一次 `npm run test:changed` 作为 Workspace UI 组受影响验证。

## 3. Project 与 Service 层级交互

- [x] 3.1 调整 Workspace shell，将“开始、项目、服务”作为核心区域，将 Change 和后续资产能力放入次级区域，同时保持现有 Project、Service、Change 目录/详情/编辑路由和浏览器历史可用。
- [x] 3.2 让 Service 页面始终显示当前所属 Project，保留 `?project=<code>` 深链接与 Project 切换，并在 breadcrumb 和入口文案中表达 `Workspace > Project > Service` 层级。
- [x] 3.3 保持 Project、Service 的独立目录、只读详情、独立编辑、revision CAS 和 Git observation 边界；不得在开始页或详情页重新嵌入完整关联资源管理表。
- [x] 3.4 更新 Project/Service 空状态，使用户知道下一步应交给 Agent 还是可以直接开始 Project-scoped 工作，并补齐项目切换、空 Service 和旧深链接回归测试。
- [x] 3.5 运行 Project/Service 直接相关 unit/static/browser focus 检查；修复失败后运行一次 `npm run test:changed` 作为层级导航组受影响验证。

## 4. 意图式 Agent Action 与开始工作交接

- [x] 4.1 将 Project Agent Action 改为名称、用途为默认输入，code/source/Git 声明为可选高级输入，并保证生成结果明确 Project 尚未创建。
- [x] 4.2 将 Service Agent Action 改为 canonical Project 下拉选择、名称、用途为默认输入，当前 Project 自动带入，code/type/repo/remote/integration branch 为可选高级输入。
- [x] 4.3 在 Workspace 开始页和全局“交给 Agent”入口增加“用 Agent 开始”，收集 Project、可选 Service 和目标，展示、复制 canonical start-work prompt，并明确 local app 未启动或完成任务。
- [x] 4.4 调整全局 Agent Action 选择层级，使 Workspace、Project、Service 和开始工作优先，Change 等后续动作保持可访问但不占据首次使用主路径。
- [x] 4.5 增加可重复浏览器主流程，覆盖空 Registry 教学、进入 Workspace、无 Project 下一步、Service 可选、意图式 Project/Service prompt、开始工作 prompt、复制反馈、无 console/page error 和 390px 关键操作。
- [x] 4.6 分别运行 `npm run test:browser:shell`、`npm run test:browser:project`、`npm run test:browser:service` 或新增的等价 focus 入口；修复失败后运行一次 `npm run test:changed` 作为 Agent Action 组受影响验证。

## 5. Agent-only 初始化后教学

- [x] 5.1 在产品 Buildr Skill 中增加条件化首次使用交接：基于最终 doctor 与真实 Project/Service 状态解释三层模型、避免重复询问唯一范围、只询问必要歧义，并明确 Service 可选。
- [x] 5.2 调整 `init --agent` 成功输出，使其提示 Agent 完成首次使用交接并邀请真实工作目标，不再把要求用户手动执行 `project create` 作为默认下一步；source-only 与失败恢复输出继续保留准确兜底。
- [x] 5.3 对齐 bootstrap guide、CLI help 和必要 runtime/package 源，禁止生成 `WELCOME.md`、持久 checklist 或固定 required Rule 教学，并保持 local app/Agent-only 使用同一 source authority。
- [x] 5.4 扩展 onboarding init verification，覆盖无 Project、已有唯一范围、多候选提示契约、source-only 兼容、runtime activation guidance 和失败恢复；运行相关 unit/contract/onboarding focus 检查。
- [x] 5.5 完成本组后运行一次 `npm run test:changed`，确认产品 Skill、package baseline、runtime adapter parity 与 init onboarding 的受影响范围通过。

## 6. README 与产品定位

- [x] 6.1 重构中文 `README.md`：在技术模型前增加具体痛点和可代入场景，把快速开始前移，提供可复制 Agent 指令、local app/Agent-only 两种路径、Workspace → Project → Service 最小心智和第一次有效工作标准。
- [x] 6.2 将 Node/npm、development checkout、runtime list、init、doctor 和 Skill destination 等机制后置为 Agent/手动兜底信息，保留权威文档链接并删除与产品说明或 CLI Reference 重复的细节。
- [x] 6.3 更新 `projects/product/docs/buildr-product.md`，把 local app 定义为人的认知与治理入口及 canonical scope 交接界面，同时保持 Agent 负责理解、规划和专业执行的“不抢活”边界。
- [x] 6.4 中文内容和产品事实冻结后同步 `README.en.md`，逐项核对标题、适用场景、两种开始方式、最小模型、当前能力、限制和文档链接语义一致。
- [x] 6.5 运行 docs quality、OpenSpec strict、公开 README/open-source candidate 直接相关检查；修复失败后运行一次 `npm run test:changed` 作为公开入口组受影响验证。

## 7. 完整验证与候选收敛

- [x] 7.1 审查 proposal、design、delta specs、实现、测试、README、Buildr Skill、CLI 输出和 package/runtime 源是否语义一致，清理临时文案与重复 onboarding 来源，并确认所有任务产物已经冻结。
- [x] 7.2 运行 `npm run test:browser:smoke`，单独记录自动 browser primary-flow 的结果、环境和失败/跳过情况；如另做人工浏览器 acceptance，必须与自动 E2E 证据分开报告。
- [x] 7.3 在最终候选 tree 上运行一次 `npm run test:changed`，确认受影响计划、unit、contract、integration-fast、docs 与 OpenSpec 检查全部通过。
- [x] 7.4 所有实现、自然语言、生成资产、review 修订和必要同步冻结后，按 Project policy 运行一次 `npm run test:candidate`，绑定最终 candidate identity；候选 tree 发生实现变化时仅在重新稳定后重跑 Candidate。
- [x] 7.5 读取并保存 Candidate timing summary，向维护者报告本任务验证实际累计耗时、最终 Candidate 耗时、最慢阶段、browser 自动化/人工验收边界、失败或跳过项、evidence retention 与 cleanup 状态。
- [x] 7.6 完成 CLI 实现相关验证后从当前 Product checkout 运行 `npm run install:development`，核对 `command -v buildr`、`buildr --help` 与目标 Workspace doctor；任务收尾清理 worktree 前将本机入口迁回仍保留的 checkout。

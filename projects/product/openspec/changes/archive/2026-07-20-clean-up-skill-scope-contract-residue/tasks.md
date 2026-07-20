## 1. 建立残留基线

- [x] 1.1 枚举 canonical specs、current docs、README、package runtime Skills、CLI help/error 和验证中所有未限定的 Project Skill source/scope/discovery 表述，并区分 current-state、legacy migration 与 archive 历史。
- [x] 1.2 为允许保留的 legacy migration 术语建立明确清单，为 current-state 表面增加失败闭合的残留扫描 fixture。

## 2. 收敛 canonical contracts

- [x] 2.1 按 delta specs 修改 workspace-first runtime、onboarding、package、CLI surface 和产品定位 requirements，统一 workspace source、Project context 与 user/workspace destination。
- [x] 2.2 修改 capability contracts、managed Skill 和 product Agent Skill requirements，确保 contract/provider 只从 workspace registry 解析。
- [x] 2.3 保留 legacy Project Skill migration 的 check/apply、冲突零写入和 recovery requirements，并为所有历史输入增加 legacy/migration 限定。

## 3. 清理实现与产品表面

- [x] 3.1 检查 runtime source assembly、skills add/remove/render、doctor 和 package verifier，删除或隔离任何当前态 Project Skill source 读取，只保留 migration reader。
- [x] 3.2 更新 README、current docs、Buildr Product、Buildr Core、产品入口 Skill 与 adapter contribution/research 文档中的旧模型措辞。
- [x] 3.3 更新 CLI help、错误、nextActions、测试名称和 fixtures，使 Project 专用能力统一路由到 `capabilities.yml`。

## 4. 验证与交付

- [x] 4.1 运行残留扫描、Skill/runtime/capability/package focused tests 与 `git diff --check`，确认 legacy allowlist 外不存在旧模型。
- [x] 4.2 运行 OpenSpec strict、proposal contract check 和受影响验证，更新任务看板中的批次结果。
- [x] 4.3 完成本 change 的 canonical spec sync、post-sync、archive 和最终候选验证，再解除 Commands change 的实施顺序约束。

## 1. 验证入口

- [x] 1.1 新增或明确产品级总验证入口，统一执行 package check、临时 workspace 端到端验收和 OpenSpec strict 校验
- [x] 1.2 更新根 `AGENTS.md` 的验证说明，优先指向总验证入口，并说明底层分解命令

## 2. 临时 Workspace 端到端验收

- [x] 2.1 将 `tools/verify-buildr-product-mvp` 分组整理为 Workspace、Project、Service、Rules、Commands、Skills、Runtime 七类资产验收
- [x] 2.2 验证从空临时目录执行 `init`、`doctor --json`、Project 创建和 Service 接入
- [x] 2.3 验证 Rules 源资产、rules render 和 runtime bridge
- [x] 2.4 验证 Commands add/remove/check、doctor 聚合和不自动安装命令行工具
- [x] 2.5 验证 Skills 本地作者型、远端信息源、已解析远端源、render、remove 和 runtime 投射边界
- [x] 2.6 验证 Runtime 的 Buildr Skill install、workspace/project Skills render、runtime check 细查和 doctor 聚合

## 3. Buildr Skill 对齐

- [x] 3.1 验证安装后的 Buildr Skill 包含 Workspace、Project、Service、Rules、Commands、Skills、Runtime 七类资产章节
- [x] 3.2 验证安装后的 Buildr Skill 以 `doctor --json` 作为默认事实入口
- [x] 3.3 验证安装后的 Buildr Skill 没有回退到完整 CLI reference 或旧的独立命令地图结构
- [x] 3.4 同步 `package/bootstrap/bootstrap.contract.yml`，让 contract 约束与 Skill 结构一致

## 4. 验证

- [x] 4.1 运行产品级总验证入口
- [x] 4.2 运行 `tools/verify-buildr-product-mvp`
- [x] 4.3 运行 `openspec validate --all --strict`

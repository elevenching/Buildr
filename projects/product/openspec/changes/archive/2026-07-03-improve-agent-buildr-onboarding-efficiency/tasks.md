## 1. Skill 与 Guide 内容

- [x] 1.1 将 Buildr Skill 改为轻约束、命令地图和完成标准。
- [x] 1.2 将 bootstrap guide 调整为 Skill 不可用时的兜底发现和恢复入口。
- [x] 1.3 明确不新增 `buildr onboard` 或 `buildr use`，但提供 `buildr skill install <agent>` 作为 Buildr 产品内置 Skill 安装入口。

## 2. 同步契约与验证

- [x] 2.1 更新 `product/package/bootstrap/onboarding.contract.yml`，覆盖轻约束和禁用入口。
- [x] 2.2 更新 `buildr package check` 或现有验证，确保 contract 能约束 guide 与 Skill。
- [x] 2.3 更新产品验证脚本，检查 Buildr Skill 不再是详细流程脚本。
- [x] 2.4 验证 `buildr skill install claude-code --target <dir>` 能单独安装 Buildr Skill，且不覆盖非 Buildr managed 文件。

## 3. 文档与规格

- [x] 3.1 更新产品手册和 runtime adapter 文档，说明 Skill 是首选入口，guide 是兜底入口。
- [x] 3.2 更新 OpenSpec delta specs，记录新增产品级 Skill 安装入口但不新增高层 onboarding command 的设计选择。

## 4. 验证

- [x] 4.1 运行 `openspec validate improve-agent-buildr-onboarding-efficiency --strict`。
- [x] 4.2 运行 `openspec validate --all --strict`。
- [x] 4.3 运行 `buildr package check`、产品验证脚本和相关 Node 语法检查。

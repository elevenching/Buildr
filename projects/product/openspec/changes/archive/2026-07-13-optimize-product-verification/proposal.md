## Why

Buildr 当前把约两分钟的候选版完整验证暴露为默认 `npm test`，普通任务因而反复支付临时 workspace、CLI 子进程、打包安装和完整 E2E 成本，与既有的分层验证原则不一致。现在需要把快速反馈与候选质量门禁明确分开，并在不削弱发布安全边界的前提下消除重复验证。

## What Changes

- **BREAKING**：将 `npm test` 定义为开发阶段快速验证，并新增明确的 `npm run test:candidate` 作为完整候选验证入口。
- 建立 fast、affected、candidate 三层产品验证：fast 只运行进程内或低成本契约；affected 按领域组合且同一 verifier 每次最多运行一次；candidate 保留发布前完整覆盖和 timing summary。
- 完整候选验证复用不可变 npm tarball，并去除已经被专用 verifier 覆盖的重复 installed maintenance 生命周期。
- 将昂贵的 runtime adapter CLI 生命周期改为按投射实现族选择代表；全部 supported adapter 仍由低成本 descriptor、plan、target 和 evidence 契约覆盖，并补充 scoped render 不得破坏无关 Project 投射的回归覆盖。
- Linux Node 20/22 继续承担完整产品验证；macOS/Windows Node 22 只运行真实安装后的 release smoke，不再为平台无关 unit tests 或重复 Linux smoke 建立独立 job。
- 更新 Product 贡献和发布说明，明确普通任务、受影响任务组和最终候选分别使用哪个入口；现有仓库 CI/publish 继续通过兼容 wrapper 运行完整候选验证。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-verification-quality`: 修改产品验证分层、runtime adapter 验证抽样、候选 tarball 复用和跨平台 CI 职责契约。

## Impact

- 影响 `package.json` 测试脚本、`tools/verify-buildr-product*`、runtime adapter verifier、release/package verifier、MVP package lifecycle 和 timing 输出。
- 影响 `docs/release-checklist.md`、Product Project 验证规则以及对应 OpenSpec capability；现有 `.github` workflow 不需要产品目录外改动。
- 不改变 Buildr 对外 CLI、workspace 数据格式或已支持 Agent adapter 集合；开发者需要使用新的 `test:candidate` 命令运行完整候选门禁。

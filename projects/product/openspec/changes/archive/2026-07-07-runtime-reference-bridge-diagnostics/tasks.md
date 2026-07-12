## 1. OpenSpec

- [x] 1.1 增加 reference bridge 诊断语义变更说明。
- [x] 1.2 增加 doctor info 输出规则。

## 2. CLI

- [x] 2.1 修改 `rules render claude-code` 的新 reference bridge 头部。
- [x] 2.2 修改 `runtime check claude-code`，reference bridge 不因源内容 hash 变化报 stale。
- [x] 2.3 增加 metadata stale info finding。
- [x] 2.4 修改 `doctor` 默认过滤 metadata info，并支持 `--verbose` / `--json --include-info`。

## 3. 验证

- [x] 3.1 增加 package check 回归验证。
- [x] 3.2 运行 `./buildr package check`。
- [x] 3.3 运行 `tools/verify-buildr-product-mvp`。
- [x] 3.4 运行 `openspec validate --all --strict`。

# Workspace Assets 独立版本化方向

本文记录 Buildr CLI 与 workspace assets 未来可能独立演进的方向，不是当前产品事实、发布承诺或已批准实施契约。

## 当前阶段

- workspace assets 继续放在 `@buildr-ai/buildr` package 中，随 CLI 一起发布。
- `buildr sync <agent>` 使用当前 CLI 自带的 assets 同步 workspace 和 Agent runtime。
- 产品只维护一个 package version，不增加独立 assets version、远端下载、缓存或版本协商。
- `buildr update` 更新 CLI package 或开发 checkout；是否继续 sync 由 Agent 根据用户意图编排。

## 未来方向

当 CLI 与 workspace assets 的发布频率、兼容范围或回滚需求明显分离时，可以引入两个逻辑版本：

```text
Buildr CLI version
Workspace assets version
```

CLI 可从远端下载带版本、integrity 和 receipt 的 `workspace-assets` tarball，不要求把 assets 发布为独立 npm package。

未来 change 需要明确：

- CLI 与 assets compatibility matrix；
- registry、channel、缓存和离线行为；
- integrity 校验、失败回滚和版本固定；
- doctor 如何报告 CLI/assets 版本漂移；
- workspace 如何选择升级、保持或回退 assets；
- assets 下载失败时 sync 的 fail-closed 边界。

## 立项触发条件

- assets 需要在不升级 CLI 的情况下高频分发；
- workspace 需要固定或回滚 assets 版本；
- CLI package 体积或统一发布节奏形成实际问题；
- 多发布 channel 需要独立控制 CLI 与工作资产。

在这些条件出现前，继续内置 assets 是更简单且可验证的实现。

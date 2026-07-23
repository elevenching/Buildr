## 1. Workspace 本机登记能力

- [x] 1.1 在现有 Workspace Application 中定义登记列表、可用状态、identity conflict、最近使用项和 revision CAS 结果模型，不改变 Workspace entity 与 `.buildr/workspace.yml` schema
- [x] 1.2 实现用户级 Workspace registry repository，只原子持久化规范化 root 列表和最近使用 root，并分离持久登记与临时实例状态
- [x] 1.3 实现列出、登记、幂等重复登记、移除和解析 Workspace 用例，覆盖无效路径、不可用路径与重复 canonical identity
- [x] 1.4 补充登记 repository/Application 单元与 focused integration 测试，完成本组受影响验证

## 2. 全局单实例 Web 服务

- [x] 2.1 将 local app server 从启动时固定 `targetRoot` 改为通过已登记 `workspaceId` 解析请求上下文，并迁移 Workspace、Project、Service、Change 与 prompt API
- [x] 2.2 增加全局 Workspace list/register/remove API，确保普通业务 API 拒绝 target、root、path 和未登记 identity
- [x] 2.3 实现带随机实例 secret 的 health handshake、PID/端口 runtime state、健康实例复用和陈旧状态恢复
- [x] 2.4 实现同源 session 保护的安全退出端点、graceful shutdown 和正常/异常实例状态清理
- [x] 2.5 补充两个 Workspace 隔离、越权路径、重复启动、陈旧状态、安全退出和并发 CAS 测试，完成本组受影响验证

## 3. 全局 Workspace Web UI

- [x] 3.1 增加全局 Workspace 首页，展示真实 metadata、可用状态、添加目录、移除登记和最近使用入口
- [x] 3.2 将现有页面迁移到 `/workspaces/:workspaceId/...` 路由，并让 API client 与导航始终携带选定 Workspace identity
- [x] 3.3 实现 Workspace 切换、未知/不可用/identity conflict 状态和局部失败隔离，不增加跨 Workspace 聚合缓存
- [x] 3.4 增加明确的“退出 Buildr”交互、确认与退出后页面状态，并说明关闭浏览器不等于退出服务
- [x] 3.5 补充全局首页、深链接刷新、前进后退、Workspace 切换、添加/移除和退出交互测试，完成本组受影响验证

## 4. CLI、浏览器和普通用户入口

- [x] 4.1 调整 `buildr app` 为启动或复用全局实例并自动打开默认浏览器，增加 `--no-open` 开发选项
- [x] 4.2 将 `buildr app --target <workspace>` 兼容为验证、登记并打开指定 Workspace route，更新 help 与错误信息
- [x] 4.3 交付 macOS `Buildr.app` 与 Windows 开始菜单/桌面图标使用的轻量 launcher，共用 Buildr runtime/Web 服务且不引入 WebView、菜单栏或 Desktop UI
- [x] 4.4 让平台安装包共同交付 launcher 与所需 Buildr runtime，普通用户无需预先配置 Node、npm 或 PATH
- [x] 4.5 为启动失败、实例不可恢复场景提供普通用户可理解的反馈，并验证 macOS、Windows 重复点击只复用一个实例
- [x] 4.6 更新 package inventory/parity、CLI compatibility 和双平台 launcher 安装后生命周期测试，完成本组受影响验证
- [x] 4.7 设计 Buildr 应用主图标，生成并接入 macOS `Buildr.icns`、Windows `Buildr.ico` 与双平台 launcher 测试
- [x] 4.8 修复 macOS 选中态图标辨识度，并让 macOS、Windows launcher 启动失败时提供可见反馈

## 5. 产品契约、文档与最终验证

- [x] 5.1 更新产品说明、CLI reference 与 known limitations，明确全局本机 Web App、Workspace 登记事实边界、启动/关闭/退出语义和 Desktop 非目标
- [x] 5.2 核对本次源码、package、Commands 与用户入口变化，按自举规则同步当前 workspace 的 Buildr runtime 资产
- [x] 5.3 对冻结实现 tree 执行完整 Candidate 验证，记录候选 identity、结果、耗时、失败项与跳过项
- [x] 5.4 启动打包后的全局 App，登记 Buildr 与 jixian 两个真实 Workspace，人工验收切换、重复启动、关闭浏览器、重新打开和安全退出

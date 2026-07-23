## 1. Launcher 身份与安装模型

- [x] 1.1 定义官方、npm CLI 与 development launcher 的版本、channel、来源和 App protocol metadata，并补齐解析与兼容性测试
- [x] 1.2 将 launcher 构建器改为只输出新的版本化 staging bundle，拒绝把运行中安装目标作为构建输出
- [x] 1.3 为 macOS 与 Windows 统一用户级日志位置、启动失败反馈和实际实例 URL 解析，并运行直接相关测试
- [x] 1.4 实现 Agent-facing 统一安装入口，默认组合安装并分别验证 CLI 与当前平台 launcher，保留显式单项修复边界

## 2. 开发 Launcher 生命周期

- [x] 2.1 实现 canonical 开发 launcher 安装入口，完成 build、stage validation 和独立 `Buildr Dev` 目标安装
- [x] 2.2 实现旧实例安全退出、资源释放等待、原子 switch、上一版本保留与失败回滚
- [x] 2.3 实现开发 launcher 状态检查和精确清理入口，保护正式 launcher、npm CLI、Registry 与 Workspace 源资产
- [x] 2.4 实现 canonical 开发准备入口，同时更新 checkout CLI 与隔离的 `Buildr Dev` launcher，并验证同一 checkout identity
- [x] 2.6 将 macOS launcher 默认入口收敛到 `/Applications`，并隔离测试 Registry
- [x] 2.7 将 macOS launcher 声明为无 Dock 图标的后台入口，避免服务运行期间持续弹跳
- [x] 2.5 增加连续 checkout identity 更新、运行中覆盖阻止、回滚和正式版隔离测试，并执行 launcher 受影响范围验证

## 3. 普通用户安装与首次运行

- [x] 3.1 生成携带独立 runtime、图标、版本 metadata 和卸载信息的 macOS 安装产物
- [x] 3.2 生成携带独立 runtime、开始菜单入口、可选桌面快捷方式和卸载信息的 Windows 安装产物
- [x] 3.3 实现 Registry 为空时的首次运行页面，支持选择已有 Workspace、生成新 Workspace Agent Action 和稍后处理
- [x] 3.4 补齐无效目录零写入、显式安装后打开、重复启动复用和卸载保留用户资产测试
- [x] 3.5 执行安装、首次运行与卸载任务组的受影响范围验证

## 4. 更新、诊断与产品入口

- [x] 4.1 扩展诊断 read model，分开展示 CLI、官方 launcher、development launcher 与当前实例的真实身份
- [x] 4.2 保持 `buildr update` 只管理 npm 安装，并为平台 installer 与开发 launcher 建立各自更新责任和冲突提示
- [x] 4.3 更新 CLI help、公开安装文档和开发文档，分别说明普通用户、Agent/CLI 用户与 Buildr 开发者路径
- [x] 4.4 增加 package、launcher 安装生命周期和跨渠道版本不一致的契约与集成测试
- [x] 4.5 更新 Buildr Skill 安装指引并验证全局安装零 Agent runtime 写入、`init` 首次投射及 `sync`/`render` 收敛边界
- [x] 4.6 执行更新、诊断和文档任务组的受影响范围验证

## 5. 候选收敛

- [x] 5.1 在全部实现、文档和 review 修订完成后运行完整 Product Candidate 验证
- [x] 5.2 核对 macOS 与 Windows 发布产物不依赖 development checkout、系统 Node 或 PATH，并记录签名/公证的实际交付状态
- [x] 5.3 复核 OpenSpec delta 与最终行为一致，完成同步前契约检查并准备归档

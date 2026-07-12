# Security Policy

## Supported Versions

当前安全修复面向最新的 `0.1.x` 开发版本。Buildr 尚未承诺旧版本的长期安全维护周期。

## Reporting a Vulnerability

请优先使用 GitHub repository 的 **Security → Report a vulnerability** 私密报告入口。不要在公开 issue、讨论区、日志或示例 workspace 中提交 token、cookie、真实仓库地址、客户数据或可直接利用的漏洞细节。

如果当前 repository 尚未启用 private vulnerability reporting，可以创建一个不含敏感细节的公开 issue，请维护者提供私密联系方式；在建立私密渠道前不要披露复现载荷。

报告建议包含：

- 受影响版本或 commit
- 受影响命令和资产类型
- 最小复现步骤
- 预期和实际安全边界
- 潜在影响与已知缓解方式

维护者会在合理时间内确认接收并评估严重性、修复范围和披露时间，但当前不承诺固定响应或修复时限。Buildr 的 CLI 数据完整性保护不是操作系统权限或远端访问控制；任何能直接修改 workspace 文件的进程仍处于用户授权边界内。

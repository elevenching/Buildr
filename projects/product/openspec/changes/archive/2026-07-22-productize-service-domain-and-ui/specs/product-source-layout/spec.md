## ADDED Requirements

### Requirement: Service 产品切片必须遵守新源码分层
Service 产品能力 MUST 将纯 Domain、Application、filesystem/Git Infrastructure 与 CLI/HTTP/Web Interfaces 分离。

#### Scenario: Domain 依赖检查
- **WHEN** 架构验证扫描 `src/domain/service`
- **THEN** Service Domain MUST NOT 导入 YAML、filesystem、Git、HTTP 或 CLI 模块

#### Scenario: Interface 读取 Service
- **WHEN** CLI、doctor 或 HTTP 读取或修改 Service
- **THEN** interface MUST 通过 Service Application 用例
- **AND** MUST NOT 新增直接解析 `services/manifest.yml` 的实现

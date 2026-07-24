## 1. Project Domain 与持久化

- [x] 1.1 实现纯 Project entity、ProjectSource 值对象、UUID/code/path 与字段校验，并补齐 Domain 单元测试
- [x] 1.2 实现 `buildr.projects/v2` filesystem repository、canonical revision、atomic compare-and-swap 与 repository 测试
- [x] 1.3 实现 v1 compatibility projection 和显式 v2 migration，验证 UUID/workspaceId 持久化、幂等与失败零写入

## 2. Application 与 Git observation

- [x] 2.1 实现 Project list/get/update metadata/create prompt 用例及 ports，覆盖字段白名单、迁移阻断和 revision conflict
- [x] 2.2 实现有界 Git observer 与 declared/observed comparison，覆盖 branch、dirty、upstream、ahead/behind、HEAD 和 remote identity
- [x] 2.3 将 project create、update/sync convergence 与 doctor Project read model 接入 Project Application，保持旧输入兼容和 fail-closed 行为

## 3. CLI 与本地应用

- [x] 3.1 更新 Project CLI 的 `--name`、`--integration-branch`、JSON 与帮助契约，并补齐 CLI 集成测试
- [x] 3.2 增加 Project list/detail/read API 与受控 metadata PATCH，复用 fixed-target、Origin、token、JSON、body-size 和 CAS 安全边界
- [x] 3.3 增加 Project 列表、详情、Git 状态、编辑与窄屏 UI，并实现 workspace/git Project 的可复制 Agent prompt
- [x] 3.4 完成 HTTP/Web 自动化与真实浏览器桌面、窄屏、修改、冲突和 prompt-only 场景验证

## 4. 产品资产与收敛

- [x] 4.1 更新 package/bootstrap manifest 和 fixture，保证 v2 canonical parity；真实自举 Workspace 在 change 集成后由 retained checkout 显式 sync 迁移
- [x] 4.2 更新 Buildr Skill、产品文档、帮助与 task board，说明 Project 字段、source、迁移和 Git 声明/观察边界
- [x] 4.3 运行架构、OpenSpec、affected tests 与 package checks，修复所有受影响失败

## 5. 最终验证

- [x] 5.1 冻结 implementation Candidate 并运行一次 `npm run test:candidate`，记录 identity、总耗时、最慢阶段、evidence retention 与 cleanup status

# Changed plan 基线

冻结代码树：`optimize-changed-recovery-verification` 实现前。

| 代表路径 | 实现前 | 实现后 | 减少 | 实现前无关重型 owner |
| --- | ---: | ---: | ---: | --- |
| `src/infrastructure/network/fetch-remote-text.mjs` | 11 | 4 | 7 | recovery、capability CLI、CLI package parity、release smoke、managed integrity |
| `src/infrastructure/product-layout.mjs` | 10 | 6 | 4 | recovery、capability CLI、CLI compatibility、managed integrity |
| `src/interfaces/cli/help.mjs` | 11 | 8 | 3 | recovery、capability CLI、managed integrity |
| `src/application/domains/workspace.mjs` | 15 | 9 | 6 | recovery、capability CLI、CLI compatibility、CLI package parity、release smoke |
| `src/application/package-maintenance/builtin-replacement.mjs` | 17 | 14 | 3 | capability CLI、CLI compatibility、CLI package parity |
| `src/infrastructure/runtime/skills/publication.mjs` | 16 | 11 | 5 | recovery、CLI compatibility、CLI package parity、release smoke |

这些计数作为优化前后证据，不作为脆弱的最终契约。最终 planner tests 断言每类路径的必需 owner 与明确无关 owner；Candidate profile 则精确断言全部 required step identity，避免 Changed inputs 收窄影响完整候选验证。本 change 的 affected plan 为 9 个 step，执行 9/9 通过、失败与跳过均为 none，总墙钟 13.891 秒。

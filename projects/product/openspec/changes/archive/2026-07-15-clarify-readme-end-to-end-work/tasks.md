## 1. 重写中文 README 产品入口

- [x] 1.1 用“让 Agent 在一个窗口里，把事情做完”重写首屏，先表达结果再定义工作资产，并保留任务上下文边界。
- [x] 1.2 用端到端自举、同一 Project 事实协作、跨 Agent 复用和人员/团队变化四个具体场景替换重复的角色价值表与能力分类。
- [x] 1.3 按文件系统结构和 runtime adapter 边界重写“Buildr 如何工作”，并保留最小独立核心模型章节。
- [x] 1.4 压缩快速开始前后的重复说明，保留可执行 onboarding、当前能力边界、文档导航和自举入口。

## 2. 对齐英文 README

- [x] 2.1 同步英文首屏、场景顺序、团队 Project 事实协作和真实 runtime 边界。
- [x] 2.2 检查中英文 README 章节结构、当前能力和未实现能力表述一致。

## 3. 验证公开入口与产品契约

- [x] 3.1 运行 README 结构与格式检查、`git diff --check` 和 `openspec validate --all --strict`。
- [x] 3.2 运行公开入口与 OpenSpec 受影响验证。
- [x] 3.3 冻结最终自然语言候选并运行一次 Buildr 产品候选完整验证，读取并报告 timing summary。

## 4. 根据用户 review 收敛 README

- [x] 4.1 压缩首屏和四个场景，并统一使用“场景一”至“场景四”的标题。
- [x] 4.2 用文件系统结构和模块职责重写“Buildr 如何工作”，准确解释 workspace、Project、Service、工作资产与 Agent runtime。
- [x] 4.3 将快速开始改为通过 Agent 使用 Buildr，并补充 Project 资产仓库和已有 Git Service 仓库的自然语言示例。
- [x] 4.4 同步英文 README，并压缩当前能力、自举说明等次要内容。
- [x] 4.5 重新运行契约、公开入口受影响验证与候选完整验证。

## 5. 根据最终审阅完成定稿

- [x] 5.1 修正中文 README 的任务窗口、工作资产边界、核心模型和快速开始表述，并保留面向 Agent 的初始化完成标准。
- [x] 5.2 同步英文 README 的产品语义与章节结构，删除不再使用的 README 草稿。
- [x] 5.3 重新运行 README、OpenSpec、公开入口受影响验证与最终候选完整验证，并读取 timing summary。

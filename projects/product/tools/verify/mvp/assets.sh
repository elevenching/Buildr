section "Commands"

node "$buildr" commands check --target "$tmp" --json >/tmp/buildr-product-mvp-commands-empty.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-commands-empty.json'))
assert result['ok'] is True
assert result['manifest']['exists'] is True
assert result['manifest']['valid'] is True
openspec = next(command for command in result['commands'] if command['id'] == 'openspec')
assert openspec['sources'] == ['commands/buildr/openspec/manifest.yml']
PY

if node "$buildr" commands add forbidden --purpose forbidden --collection buildr/openspec --target "$tmp" >/tmp/buildr-product-mvp-commands-owned.txt 2>&1; then
  echo "commands add changed a Component-owned collection" >&2
  exit 1
fi
grep -q 'managed by Component openspec' /tmp/buildr-product-mvp-commands-owned.txt

node "$buildr" commands add shared-demo --purpose shared --target "$tmp" >/dev/null
node "$buildr" commands add shared-demo --purpose shared --collection team/tools --target "$tmp" >/dev/null
node "$buildr" commands check --target "$tmp" --json >/tmp/buildr-product-mvp-commands-merged.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-commands-merged.json'))
item = next(command for command in result['commands'] if command['id'] == 'shared-demo')
assert item['sources'] == ['commands/manifest.yml', 'commands/team/tools/manifest.yml']
PY
node "$buildr" commands add shared-demo --purpose conflict --collection team/tools --target "$tmp" --replace >/dev/null
if node "$buildr" commands check --target "$tmp" --json >/tmp/buildr-product-mvp-commands-conflict.json; then
  echo "commands check accepted conflicting collections" >&2
  exit 1
fi
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-commands-conflict.json'))
finding = next(f for f in result['findings'] if f['code'] == 'commands.collection_conflict')
assert finding['sources'] == ['commands/manifest.yml', 'commands/team/tools/manifest.yml']
PY
node "$buildr" commands remove shared-demo --collection team/tools --target "$tmp" >/dev/null
node "$buildr" commands remove shared-demo --target "$tmp" >/dev/null
if node "$buildr" commands add escape --purpose escape --collection ../outside --target "$tmp" >/tmp/buildr-product-mvp-commands-escape.txt 2>&1; then
  echo "commands collection escaped commands root" >&2
  exit 1
fi
grep -q 'must stay inside commands' /tmp/buildr-product-mvp-commands-escape.txt

node "$buildr" commands add missing-demo --purpose 测试缺失命令 --executable definitely-missing-buildr-demo --description 缺失命令验证 --install-hint https://example.com/install --target "$tmp" >/tmp/buildr-product-mvp-commands-add.txt
grep -q '已添加命令行工具清单条目：missing-demo' /tmp/buildr-product-mvp-commands-add.txt
grep -q '下一步：' /tmp/buildr-product-mvp-commands-add.txt
grep -q 'installHint' "$tmp/commands/manifest.yml"
if grep -q 'install:' "$tmp/commands/manifest.yml"; then
  echo "commands add wrote legacy install field" >&2
  exit 1
fi
node "$buildr" commands check --target "$tmp" --json >/tmp/buildr-product-mvp-commands-missing.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-commands-missing.json'))
assert result['ok'] is True
item = next(command for command in result['commands'] if command['id'] == 'missing-demo')
assert item['status'] == 'warning'
assert item['description'] == '缺失命令验证'
assert item['installHint'] == 'https://example.com/install'
assert 'install' not in item
assert any(f.get('installHint') == 'https://example.com/install' for f in result['findings'])
PY
node "$buildr" doctor --target "$tmp" --json >/tmp/buildr-product-mvp-doctor-commands-missing.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-doctor-commands-missing.json'))
assert result['ok'] is True
assert next(command for command in result['commandLineTools']['commands'] if command['id'] == 'missing-demo')['status'] == 'warning'
assert any(f['code'] == 'commands.executable_missing' for f in result['findings'])
assert any(f.get('installHint') == 'https://example.com/install' for f in result['findings'])
PY
if node "$buildr" commands add missing-demo --purpose 重复命令 --target "$tmp" >/tmp/buildr-product-mvp-commands-duplicate.txt 2>&1; then
  echo "commands add duplicate unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'Use --replace' /tmp/buildr-product-mvp-commands-duplicate.txt
node "$buildr" commands add missing-demo --purpose 替换命令 --target "$tmp" --replace >/tmp/buildr-product-mvp-commands-replace.txt
grep -q '已替换命令行工具清单条目：missing-demo' /tmp/buildr-product-mvp-commands-replace.txt
grep -q '替换命令' "$tmp/commands/manifest.yml"
node "$buildr" commands remove missing-demo --target "$tmp" >/tmp/buildr-product-mvp-commands-remove.txt
grep -q '已删除命令行工具清单条目：missing-demo' /tmp/buildr-product-mvp-commands-remove.txt
grep -q 'commands: \[\]' "$tmp/commands/manifest.yml"
if node "$buildr" commands add json-demo --purpose json --target "$tmp" --json >/tmp/buildr-product-mvp-commands-json.txt 2>&1; then
  echo "commands add --json unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'Unknown argument: --json' /tmp/buildr-product-mvp-commands-json.txt

if node "$buildr" commands render --target "$tmp" >/tmp/buildr-product-mvp-commands-render.txt 2>&1; then
  echo "commands render unexpectedly succeeded" >&2
  exit 1
fi
if node "$buildr" commands install --target "$tmp" >/tmp/buildr-product-mvp-commands-install.txt 2>&1; then
  echo "commands install unexpectedly succeeded" >&2
  exit 1
fi

if node "$buildr" commands add not-init --purpose 未初始化 --target "$(mktemp -d)" >/tmp/buildr-product-mvp-commands-not-init.txt 2>&1; then
  echo "commands add on non-init target unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'buildr init' /tmp/buildr-product-mvp-commands-not-init.txt

section "Rules"

if node "$buildr" rules add backend --target "$tmp" >/tmp/buildr-product-mvp-rules-missing-desc.txt 2>&1; then
  echo "rules add without description unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'Missing required option: --description' /tmp/buildr-product-mvp-rules-missing-desc.txt

if node "$buildr" rules add backend --target "$tmp" --description 后端边界 >/tmp/buildr-product-mvp-rules-missing-file.txt 2>&1; then
  echo "rules add missing file unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'registers an existing root Rule file' /tmp/buildr-product-mvp-rules-missing-file.txt

printf '# Backend Rule\n' > "$tmp/rules/backend.md"
node "$buildr" rules add backend --target "$tmp" --description 后端工程边界 >/tmp/buildr-product-mvp-rules-add.txt
grep -q '已添加规则资产：backend' /tmp/buildr-product-mvp-rules-add.txt
grep -q '下一步：' /tmp/buildr-product-mvp-rules-add.txt
grep -q 'doctor --agent <agent>' /tmp/buildr-product-mvp-rules-add.txt
grep -q 'path: "rules/backend.md"' "$tmp/rules/manifest.yml"
grep -q 'description: "后端工程边界"' "$tmp/rules/manifest.yml"
if node "$buildr" rules add backend --target "$tmp" --description 重复规则 >/tmp/buildr-product-mvp-rules-duplicate.txt 2>&1; then
  echo "rules add duplicate unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'Use --replace' /tmp/buildr-product-mvp-rules-duplicate.txt
node "$buildr" rules add backend --target "$tmp" --description 替换规则 --replace >/tmp/buildr-product-mvp-rules-replace.txt
grep -q '已替换规则资产：backend' /tmp/buildr-product-mvp-rules-replace.txt
grep -q 'description: "替换规则"' "$tmp/rules/manifest.yml"

printf '# Nested Rule\n' > "$tmp/rules/nested-rule.md"
node "$buildr" rules add nested --path rules/nested-rule.md --target "$tmp" --description 嵌套路径规则 >/tmp/buildr-product-mvp-rules-path.txt
grep -q 'path: "rules/nested-rule.md"' "$tmp/rules/manifest.yml"
node "$buildr" rules remove nested --target "$tmp" >/tmp/buildr-product-mvp-rules-path-remove.txt
test ! -f "$tmp/rules/nested-rule.md"

if node "$buildr" rules add project-rule --scope projects/demo --target "$tmp" --description 项目规则 >/tmp/buildr-product-mvp-rules-project-scope.txt 2>&1; then
  echo "rules add project scope unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'Project rules are maintained through projects/<project>/AGENTS.md' /tmp/buildr-product-mvp-rules-project-scope.txt

if node "$buildr" rules add json-rule --target "$tmp" --description json --json >/tmp/buildr-product-mvp-rules-json.txt 2>&1; then
  echo "rules add --json unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'Unknown argument: --json' /tmp/buildr-product-mvp-rules-json.txt

if node "$buildr" rules add not-init --target "$(mktemp -d)" --description 未初始化 >/tmp/buildr-product-mvp-rules-not-init.txt 2>&1; then
  echo "rules add on non-init target unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'buildr init' /tmp/buildr-product-mvp-rules-not-init.txt

if node "$buildr" rules remove buildr-core --target "$tmp" >/tmp/buildr-product-mvp-rules-required.txt 2>&1; then
  echo "rules remove required builtin unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'Required Buildr Rule cannot be removed' /tmp/buildr-product-mvp-rules-required.txt

node "$buildr" rules remove backend --target "$tmp" --keep-file >/tmp/buildr-product-mvp-rules-keep.txt
grep -q '已删除规则资产：backend' /tmp/buildr-product-mvp-rules-keep.txt
test -f "$tmp/rules/backend.md"
node "$buildr" doctor --target "$tmp" --agent codex --json >/tmp/buildr-product-mvp-rules-keep-doctor.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-rules-keep-doctor.json'))
assert any(f['code'] == 'rules.unregistered' and f['path'] == 'rules/backend.md' for f in result['findings'])
PY
node "$buildr" rules add backend --target "$tmp" --description 后端工程边界 >/tmp/buildr-product-mvp-rules-readd.txt
node "$buildr" rules remove backend --target "$tmp" >/tmp/buildr-product-mvp-rules-remove.txt
grep -q '已删除规则资产：backend' /tmp/buildr-product-mvp-rules-remove.txt
test ! -f "$tmp/rules/backend.md"
if grep -q 'backend' "$tmp/rules/manifest.yml"; then
  echo "rules remove left backend manifest entry" >&2
  exit 1
fi

section "Builtins"

node "$buildr" sync codex --target "$tmp" --scope . >/tmp/buildr-product-mvp-builtin-sync-initialize.txt

node "$buildr" builtin list --target "$tmp" --json >/tmp/buildr-product-mvp-builtin-list.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-builtin-list.json'))
assert any(item['type'] == 'rule' and item['id'] == 'buildr-core' for item in result['findings'])
assert any(item['type'] == 'skill' and item['id'] == 'openspec-propose' and item['component'] == 'openspec' for item in result['findings'])
PY

node "$buildr" component list --target "$tmp" --json >/tmp/buildr-product-mvp-component-list.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-component-list.json'))
assert any(item['id'] == 'openspec' and item['status'] == 'installed' for item in result['components'])
PY

if node "$buildr" builtin uninstall buildr-core --target "$tmp" >/tmp/buildr-product-mvp-builtin-uninstall-core.txt 2>&1; then
  echo "required builtin uninstall unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'Required Buildr builtin cannot be uninstalled' /tmp/buildr-product-mvp-builtin-uninstall-core.txt

core_rule="$tmp/rules/buildr/core.md"
grep -q 'Git 提交信息的主题和正文默认使用中文' "$core_rule"
grep -q '代码标识、路径、scope 和专有名词可保留原文' "$core_rule"
cp "$core_rule" /tmp/buildr-product-mvp-core-before-git-ops-uninstall.md
node "$buildr" builtin uninstall git-ops --target "$tmp" --reason verify >/tmp/buildr-product-mvp-builtin-uninstall-git-ops.txt
test ! -e "$tmp/skills/buildr/git-ops"
python3 - "$tmp/.buildr/builtin-receipts.json" <<'PY'
import json, sys
assert not any(item['id'] == 'git-ops' for item in json.load(open(sys.argv[1]))['builtins'])
PY
cmp /tmp/buildr-product-mvp-core-before-git-ops-uninstall.md "$core_rule"
node "$buildr" builtin restore git-ops --target "$tmp" >/tmp/buildr-product-mvp-builtin-restore-git-ops.txt
test -f "$tmp/skills/buildr/git-ops/SKILL.md"
python3 - "$tmp/.buildr/builtin-receipts.json" <<'PY'
import json, sys
assert any(item['id'] == 'git-ops' for item in json.load(open(sys.argv[1]))['builtins'])
PY
cmp /tmp/buildr-product-mvp-core-before-git-ops-uninstall.md "$core_rule"

# A receipt-backed old official snapshot upgrades without a user decision.
printf '\nofficial old fixture\n' >> "$tmp/skills/buildr/task-triage/SKILL.md"
node --input-type=module - "$tmp" <<'NODE'
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2];
const receiptPath = path.join(root, '.buildr', 'builtin-receipts.json');
const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
const item = receipt.builtins.find((entry) => entry.id === 'task-triage');
const file = path.join(root, 'skills/buildr/task-triage/SKILL.md');
item.files = [{ path: 'SKILL.md', integrity: `sha256-${crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}` }];
item.integrity = `sha256-${crypto.createHash('sha256').update(JSON.stringify(item.files)).digest('hex')}`;
fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
NODE
node "$buildr" sync codex --target "$tmp" --scope . >/tmp/buildr-product-mvp-builtin-three-way.txt
cmp "$product_root/package/targets/workspace/skills/buildr/task-triage/SKILL.md" "$tmp/skills/buildr/task-triage/SKILL.md"

# Exact directory inventories treat extra files as user modifications.
printf 'user file\n' > "$tmp/skills/buildr/task-triage/user-note.md"
if node "$buildr" sync codex --target "$tmp" --scope . >/tmp/buildr-product-mvp-builtin-extra-file.txt 2>&1; then
  echo "builtin sync deleted an unrecorded user file" >&2
  exit 1
fi
grep -q 'skill:task-triage (modified)' /tmp/buildr-product-mvp-builtin-extra-file.txt
test -f "$tmp/skills/buildr/task-triage/user-note.md"
rm "$tmp/skills/buildr/task-triage/user-note.md"

# A receipt-less workspace matching a declared legacy official integrity migrates automatically.
python3 - "$tmp/skills/buildr/task-worktree/SKILL.md" "$tmp/.buildr/builtin-receipts.json" <<'PY'
import json, pathlib, sys
skill = pathlib.Path(sys.argv[1])
content = skill.read_text()
content = content.replace('本 Skill 是 `buildr.task-worktree-lifecycle/v1` 的默认 provider，管理任务 worktree 生命周期：是否创建、如何隔离开发、何时保留，以及何时进入清理检查。它不判断业务语义是否需要 OpenSpec change，也不提供 Git 命令教程。', '本 Skill 管理任务 worktree 生命周期：是否创建、如何隔离开发、何时保留，以及何时进入清理检查。它不判断业务语义是否需要 OpenSpec change，也不提供 Git 命令教程。')
content = content.replace('用户要求完整“收尾”或自动完成归档、集成、推送和清理时，由 `buildr.task-finish/v1` selected provider 编排；本 Skill 只提供 worktree placement、retention 和 cleanup 条件。', '用户要求完整“收尾”或自动完成归档、集成、推送和清理时，由 `task-finish` Skill 编排；本 Skill 只提供 worktree placement、retention 和 cleanup 条件。')
content = content.replace('新 worktree checkout 完成后，直接遵守 required Core workspace-transition invariant，并通过产品入口 Buildr Skill 完成具体 doctor、sync 询问、Agent 执行和手动兜底边界。只有新 checkout 实际位于包含 `.buildr/workspace.yml` 的已初始化 Buildr workspace 中才触发；复用既有 worktree且没有发生 tree 转换时不重复检查。本 Skill 不依赖 `git-ops` 或 `buildr.git-single-operation/v1` 来获得该不变量。', '新 worktree checkout 完成后，复用 Git Ops 的“工作区转换后的 Buildr 环境检查”：只有新 checkout 实际位于包含 `.buildr/workspace.yml` 的已初始化 Buildr workspace 中，才针对当前 Agent 和该 workspace root 运行 doctor。doctor 无需处理时不询问同步；发现可由 sync 修复的环境问题时，复用同步询问、Agent 执行和手动兜底边界，用户确认前不执行 sync。复用既有 worktree 且没有发生 tree 转换时，不重复运行该检查。')
content = content.replace('- 普通开发任务未上线、未归档或未明确收尾前，默认保留 task worktree 和任务分支。\n', '- 任务未上线、未归档或未明确收尾前，默认保留 task worktree 和任务分支。\n')
content = content.replace('\n新 worktree checkout 完成后，复用 Git Ops 的“工作区转换后的 Buildr 环境检查”：只有新 checkout 实际位于包含 `.buildr/workspace.yml` 的已初始化 Buildr workspace 中，才针对当前 Agent 和该 workspace root 运行 doctor。doctor 无需处理时不询问同步；发现可由 sync 修复的环境问题时，复用同步询问、Agent 执行和手动兜底边界，用户确认前不执行 sync。复用既有 worktree 且没有发生 tree 转换时，不重复运行该检查。\n', '')
content = content.replace('- 不在用户确认前同步新 worktree runtime，也不把手动命令作为默认处理方式；不为未发生 tree 转换的 worktree 复用重复检查。\n', '')
content = content.replace('\n发布 worktree 是用于从既有发布基线制作、验证和推送发布分支的临时环境，不沿用普通开发任务的保守保留策略。满足以下全部条件时，默认删除本地发布 worktree 和已由远端安全承载的本地发布分支：\n\n- 远端发布分支已推送，且远端 ref 与本地候选提交一致。\n- 发布 worktree 干净，没有未提交或未处理内容。\n- 没有明确的后续本地构建、部署、修复或验证动作。\n\n发布分支推送后仍有明确的本地构建、部署、修复或验证动作时，保留发布 worktree，并向用户说明保留原因和下一项本地动作。发布 worktree 的默认清理不授权删除远端发布分支。\n', '')
content = content.replace('- 发布 worktree 已完成远端分支推送和 ref 核对，且没有明确后续本地动作。\n', '')
skill.write_text(content)
receipt_path = pathlib.Path(sys.argv[2])
receipt = json.loads(receipt_path.read_text())
receipt['builtins'] = [item for item in receipt['builtins'] if item['id'] != 'task-worktree']
receipt_path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
PY
node "$buildr" sync codex --target "$tmp" --scope . >/tmp/buildr-product-mvp-builtin-legacy.txt
cmp "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md" "$tmp/skills/buildr/task-worktree/SKILL.md"
python3 - "$tmp/.buildr/builtin-receipts.json" <<'PY'
import json, sys
assert any(item['id'] == 'task-worktree' for item in json.load(open(sys.argv[1]))['builtins'])
PY

cp "$tmp/.buildr/builtin-receipts.json" /tmp/buildr-product-mvp-builtin-receipts.json
printf '{}\n' > "$tmp/.buildr/builtin-receipts.json"
if node "$buildr" builtin list --target "$tmp" --json >/tmp/buildr-product-mvp-builtin-invalid-receipt.txt 2>&1; then
  echo "builtin list accepted an invalid receipt" >&2
  exit 1
fi
grep -q 'Invalid Builtin receipt schema' /tmp/buildr-product-mvp-builtin-invalid-receipt.txt
if node "$buildr" doctor --target "$tmp" --agent codex --json >/tmp/buildr-product-mvp-doctor-invalid-receipt.json; then
  echo "doctor accepted an invalid builtin receipt" >&2
  exit 1
fi
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-doctor-invalid-receipt.json'))
assert any(item['code'] == 'builtin.receipt_invalid' for item in result['findings'])
PY
cp /tmp/buildr-product-mvp-builtin-receipts.json "$tmp/.buildr/builtin-receipts.json"

node "$buildr" sync codex --target "$tmp" --scope . >/tmp/buildr-product-mvp-builtin-sync-before-uninstall.txt
test -f "$tmp/.buildr/builtin-receipts.json"
python3 - "$tmp/.buildr/builtin-receipts.json" <<'PY'
import json, sys
receipt = json.load(open(sys.argv[1]))
assert receipt['schemaVersion'] == 'buildr.builtin-receipts/v1'
assert {f"{item['type']}:{item['id']}" for item in receipt['builtins']} == {
    'rule:buildr-core', 'skill:task-triage', 'skill:task-cockpit', 'skill:capability-adaptation', 'skill:task-asset-review',
    'skill:task-worktree', 'skill:task-finish', 'skill:git-ops'
}
PY
test -f "$tmp/skills/buildr/task-cockpit/SKILL.md"
test -f "$tmp/skills/buildr/task-cockpit/assets/task-cockpit-template.html"
grep -q 'yyyy-MM-dd-<task-id>.html' "$tmp/skills/buildr/task-cockpit/SKILL.md"
grep -q 'id="cockpit-data"' "$tmp/skills/buildr/task-cockpit/assets/task-cockpit-template.html"
test -f "$tmp/skills/buildr/capability-adaptation/SKILL.md"
test -f "$tmp/skills/buildr/capability-adaptation/agents/openai.yaml"
grep -q '判断的是稳定协作边界，不是用户是否说出 capability 名字' "$tmp/skills/buildr/capability-adaptation/SKILL.md"
test -f "$tmp/skills/buildr/task-asset-review/SKILL.md"
test -f "$tmp/skills/buildr/task-asset-review/agents/openai.yaml"
grep -q '证据胶囊' "$tmp/skills/buildr/task-asset-review/SKILL.md"
grep -q '不得输出 Specs 候选' "$tmp/skills/buildr/task-asset-review/SKILL.md"
if node "$buildr" builtin uninstall openspec-propose --target "$tmp" --reason verify >/tmp/buildr-product-mvp-builtin-uninstall-skill.txt 2>&1; then
  echo "Component-owned builtin uninstall unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'managed by Component openspec' /tmp/buildr-product-mvp-builtin-uninstall-skill.txt
if node "$buildr" builtin restore openspec-propose --target "$tmp" >/tmp/buildr-product-mvp-builtin-restore-skill.txt 2>&1; then
  echo "Component-owned builtin restore unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'component install openspec' /tmp/buildr-product-mvp-builtin-restore-skill.txt

section "Components: inventory and ownership"

node "$buildr" component list --target "$tmp" --json >/tmp/buildr-product-mvp-component-list.json
node "$buildr" component check openspec --target "$tmp" --json >/tmp/buildr-product-mvp-component-check.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-component-check.json'))
item = result['components'][0]
assert result['ok'] is True
assert item['id'] == 'openspec'
assert item['source'] == 'buildr'
assert item['status'] == 'installed'
assert item['installedVersion'] == item['availableVersion'] == '1.4.1+buildr.3'
assert len(item['members']) == 15
assert any(member['path'] == 'skills/openspec/openspec-archive-change' for member in item['members'])
assert any(member['path'] == 'skills/buildr/openspec-contract-guard' for member in item['members'])
assert any(member['path'] == 'components/buildr/openspec/contributions/task-triage-change-ready.md' for member in item['members'])
PY
if node "$buildr" component check openspec --scope projects/demo --target "$tmp" >/tmp/buildr-product-mvp-component-project-scope.txt 2>&1; then
  echo "Project Component scope unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'only workspace scope' /tmp/buildr-product-mvp-component-project-scope.txt
if node "$buildr" skills remove openspec-propose --scope . --target "$tmp" >/tmp/buildr-product-mvp-component-owned-skill.txt 2>&1; then
  echo "Component-owned Skill removal unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'managed by Component openspec' /tmp/buildr-product-mvp-component-owned-skill.txt

section "Components: contributions and lifecycle"

grep -q 'buildr openspec baseline create' "$tmp/.agents/skills/task-triage/SKILL.md"
grep -q -- '--stage pre-sync' "$tmp/.agents/skills/task-finish/SKILL.md"
grep -q -- '--stage post-sync' "$tmp/.agents/skills/task-finish/SKILL.md"
grep -q 'buildr:contribution openspec#change-ready' "$tmp/.agents/skills/task-triage/SKILL.md"
grep -q 'Buildr OpenSpec Sidebar' "$tmp/.agents/skills/openspec-archive-change/SKILL.md"
grep -q 'buildr:contribution openspec#prepend' "$tmp/.agents/skills/openspec-archive-change/SKILL.md"
if grep -q 'Buildr OpenSpec Sidebar' "$tmp/skills/openspec/openspec-archive-change/SKILL.md"; then
  echo "OpenSpec sidebar was written back to the upstream Skill source" >&2
  exit 1
fi
if grep -q 'buildr openspec' "$tmp/skills/buildr/task-triage/SKILL.md" || grep -q 'buildr openspec' "$tmp/skills/buildr/task-finish/SKILL.md"; then
  echo "Component render wrote OpenSpec guard content back to workspace Skill sources" >&2
  exit 1
fi

find "$tmp/projects/demo/openspec" -type f -print -exec openssl dgst -sha256 -r {} \; | sort >/tmp/buildr-product-mvp-project-openspec-before.txt
openspec_version_before="$(openspec --version)"
node "$buildr" component uninstall openspec --agent codex --target "$tmp" --reason verify >/tmp/buildr-product-mvp-component-uninstall.txt
grep -q '已卸载 Component：openspec' /tmp/buildr-product-mvp-component-uninstall.txt
grep -q 'state: "uninstalled"' "$tmp/components/manifest.yml"
test ! -e "$tmp/commands/buildr/openspec/manifest.yml"
test ! -e "$tmp/components/buildr/openspec/contributions/task-triage-change-ready.md"
test ! -e "$tmp/skills/openspec/openspec-propose"
test ! -e "$tmp/.agents/skills/openspec-propose"
test -f "$tmp/.agents/skills/task-triage/SKILL.md"
test -f "$tmp/.agents/skills/task-finish/SKILL.md"
if grep -q 'buildr openspec' "$tmp/.agents/skills/task-triage/SKILL.md" || grep -q 'buildr openspec' "$tmp/.agents/skills/task-finish/SKILL.md"; then
  echo "OpenSpec guard contribution remained after Component uninstall" >&2
  exit 1
fi
test "$(openspec --version)" = "$openspec_version_before"
find "$tmp/projects/demo/openspec" -type f -print -exec openssl dgst -sha256 -r {} \; | sort >/tmp/buildr-product-mvp-project-openspec-after.txt
cmp /tmp/buildr-product-mvp-project-openspec-before.txt /tmp/buildr-product-mvp-project-openspec-after.txt
node "$buildr" sync codex --target "$tmp" >/dev/null
test ! -e "$tmp/skills/openspec/openspec-propose"
node "$buildr" component install openspec --agent codex --target "$tmp" >/tmp/buildr-product-mvp-component-install.txt
grep -q '已安装 Component：openspec' /tmp/buildr-product-mvp-component-install.txt
test -f "$tmp/.agents/skills/openspec-propose/SKILL.md"
test -f "$tmp/.agents/skills/openspec-contract-guard/SKILL.md"
grep -q 'buildr openspec baseline create' "$tmp/.agents/skills/task-triage/SKILL.md"
grep -q -- '--stage pre-sync' "$tmp/.agents/skills/task-finish/SKILL.md"

section "Components: contribution validation"

cp "$tmp/components/buildr/openspec/component.yml" /tmp/buildr-product-mvp-component-contribution-definition.yml
python3 - "$tmp/components/buildr/openspec/component.yml" <<'PY'
import pathlib
import sys
file = pathlib.Path(sys.argv[1])
file.write_text(file.read_text().replace('task-triage#change-ready=', 'task-triage#missing-slot='))
PY
if node "$buildr" render codex --target "$tmp" --scope . >/tmp/buildr-product-mvp-component-contribution-slot.txt 2>&1; then
  echo "Runtime render accepted a missing Skill contribution slot" >&2
  exit 1
fi
grep -q 'Skill contribution slot must appear exactly once' /tmp/buildr-product-mvp-component-contribution-slot.txt
cp /tmp/buildr-product-mvp-component-contribution-definition.yml "$tmp/components/buildr/openspec/component.yml"

node "$buildr" builtin uninstall task-finish --target "$tmp" --reason contribution-target-optional >/dev/null
node "$buildr" render codex --target "$tmp" --scope . >/dev/null
test ! -e "$tmp/.agents/skills/task-finish"
node "$buildr" builtin restore task-finish --target "$tmp" >/dev/null
node "$buildr" render codex --target "$tmp" --scope . >/dev/null
grep -q -- '--stage pre-sync' "$tmp/.agents/skills/task-finish/SKILL.md"

section "Components: upgrades and conflicts"

printf '\nold installed version\n' >> "$tmp/skills/openspec/openspec-explore/SKILL.md"
node --input-type=module - "$tmp" <<'NODE'
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2];
const member = 'skills/openspec/openspec-explore';
const dir = path.join(root, member);
const files = fs.readdirSync(dir).sort().map((name) => path.join(dir, name));
const hash = crypto.createHash('sha256');
for (const file of files) {
  hash.update(path.relative(dir, file).split(path.sep).join('/'));
  hash.update('\0');
  hash.update(fs.readFileSync(file));
  hash.update('\0');
}
const receipt = path.join(root, 'components/buildr/openspec/component.yml');
let content = fs.readFileSync(receipt, 'utf8');
content = content.replace('version: "1.4.1+buildr.3"', 'version: "1.4.0"');
content = content.replace(/skills\/openspec\/openspec-explore=sha256-[a-f0-9]{64}/, `${member}=sha256-${hash.digest('hex')}`);
fs.writeFileSync(receipt, content);
NODE
node "$buildr" sync codex --target "$tmp" >/dev/null
if grep -q 'old installed version' "$tmp/skills/openspec/openspec-explore/SKILL.md"; then
  echo "Old/Live/New safe upgrade did not converge to New" >&2
  exit 1
fi
grep -q 'version: "1.4.1+buildr.3"' "$tmp/components/buildr/openspec/component.yml"

printf '\nverify component local edit\n' >> "$tmp/skills/openspec/openspec-propose/SKILL.md"
component_sibling_before="$(openssl dgst -sha256 -r "$tmp/skills/openspec/openspec-explore/SKILL.md")"
if node "$buildr" sync codex --target "$tmp" >/tmp/buildr-product-mvp-component-modified.txt 2>&1; then
  echo "Component update overwrote a modified member" >&2
  exit 1
fi
grep -q 'sync 暂停：Component 源资产存在冲突' /tmp/buildr-product-mvp-component-modified.txt
grep -q 'openspec-propose' /tmp/buildr-product-mvp-component-modified.txt
grep -q 'verify component local edit' "$tmp/skills/openspec/openspec-propose/SKILL.md"
test "$(openssl dgst -sha256 -r "$tmp/skills/openspec/openspec-explore/SKILL.md")" = "$component_sibling_before"
cp "$product_root/package/targets/workspace/skills/openspec/openspec-propose/SKILL.md" "$tmp/skills/openspec/openspec-propose/SKILL.md"
node "$buildr" sync codex --target "$tmp" >/dev/null

rm "$tmp/skills/openspec/openspec-archive-change/SKILL.md"
if node "$buildr" sync codex --target "$tmp" >/tmp/buildr-product-mvp-component-missing.txt 2>&1; then
  echo "Component update silently restored a missing member" >&2
  exit 1
fi
grep -q 'openspec-archive-change' /tmp/buildr-product-mvp-component-missing.txt
test "$(openssl dgst -sha256 -r "$tmp/skills/openspec/openspec-explore/SKILL.md")" = "$component_sibling_before"
cp "$product_root/package/targets/workspace/skills/openspec/openspec-archive-change/SKILL.md" "$tmp/skills/openspec/openspec-archive-change/SKILL.md"
node "$buildr" sync codex --target "$tmp" >/dev/null
section "Components: runtime cleanup"

node "$buildr" render claude-code --target "$tmp" --scope . >/dev/null
test -f "$tmp/.claude/skills/openspec-propose/SKILL.md"
test -f "$tmp/.claude/skills/openspec-contract-guard/SKILL.md"
grep -q 'buildr openspec baseline create' "$tmp/.claude/skills/task-triage/SKILL.md"
grep -q -- '--stage pre-sync' "$tmp/.claude/skills/task-finish/SKILL.md"
node "$buildr" component uninstall openspec --agent claude-code --target "$tmp" --reason verify-claude >/dev/null
test ! -e "$tmp/.claude/skills/openspec-propose"
test ! -e "$tmp/.claude/skills/openspec-contract-guard"
if grep -q 'buildr openspec' "$tmp/.claude/skills/task-triage/SKILL.md" || grep -q 'buildr openspec' "$tmp/.claude/skills/task-finish/SKILL.md"; then
  echo "Claude Code runtime retained OpenSpec contribution after uninstall" >&2
  exit 1
fi
node "$buildr" doctor --agent codex --target "$tmp" --json >/tmp/buildr-product-mvp-component-runtime-orphan.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-component-runtime-orphan.json'))
assert any(f['code'] == 'components.runtime_orphan' and f['agent'] == 'codex' for f in result['findings'])
PY
node "$buildr" render codex --target "$tmp" --scope . >/dev/null
test ! -e "$tmp/.agents/skills/openspec-propose"
node "$buildr" component install openspec --agent claude-code --target "$tmp" >/dev/null
test -f "$tmp/.claude/skills/openspec-propose/SKILL.md"
grep -q -- '--stage post-sync' "$tmp/.claude/skills/task-finish/SKILL.md"

section "Components: migration and workspace ownership"

legacy_root="$(mktemp -d)"
node "$buildr" init --target "$legacy_root" --name legacy-component >/dev/null
node "$buildr" sync codex --target "$legacy_root" --scope . >/dev/null
legacy_runtime_before="$(openssl dgst -sha256 -r "$legacy_root/.agents/skills/openspec-propose/SKILL.md")"
rm -rf "$legacy_root/components" "$legacy_root/commands/buildr/openspec"
node "$buildr" sync codex --target "$legacy_root" >/dev/null
grep -q 'id: "openspec"' "$legacy_root/components/manifest.yml"
test -f "$legacy_root/commands/buildr/openspec/manifest.yml"
test "$(openssl dgst -sha256 -r "$legacy_root/.agents/skills/openspec-propose/SKILL.md")" = "$legacy_runtime_before"
rm -rf "$legacy_root"

legacy_conflict_root="$(mktemp -d)"
node "$buildr" init --target "$legacy_conflict_root" --name legacy-conflict >/dev/null
rm -rf "$legacy_conflict_root/components" "$legacy_conflict_root/commands/buildr/openspec"
printf '\nlegacy user edit\n' >> "$legacy_conflict_root/skills/openspec/openspec-propose/SKILL.md"
if node "$buildr" sync codex --target "$legacy_conflict_root" >/tmp/buildr-product-mvp-component-legacy-conflict.txt 2>&1; then
  echo "Legacy Component migration overwrote a modified Skill" >&2
  exit 1
fi
test ! -e "$legacy_conflict_root/components/manifest.yml"
grep -q 'legacy user edit' "$legacy_conflict_root/skills/openspec/openspec-propose/SKILL.md"
grep -q 'Legacy Component migration' /tmp/buildr-product-mvp-component-legacy-conflict.txt
rm -rf "$legacy_conflict_root"

workspace_component_root="$(mktemp -d)"
node "$buildr" init --target "$workspace_component_root" --name workspace-component >/dev/null
mkdir -p "$workspace_component_root/commands/workspace/single" "$workspace_component_root/components/workspace/single" "$workspace_component_root/components/workspace/second"
node --input-type=module - "$workspace_component_root" <<'NODE'
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2];
const member = 'commands/workspace/single/manifest.yml';
const memberFile = path.join(root, member);
fs.writeFileSync(memberFile, 'schemaVersion: buildr.commands/v1\ncommands: []\n');
const integrity = `sha256-${crypto.createHash('sha256').update(fs.readFileSync(memberFile)).digest('hex')}`;
const definition = (id) => `schemaVersion: buildr.component/v1\nid: ${id}\nkind: bundle\nversion: "1.0.0"\nsource: workspace\nmembers:\n  rules: []\n  skills: []\n  commandCollections: ["${member}"]\nintegrity: ["${member}=${integrity}"]\n`;
fs.writeFileSync(path.join(root, 'components/workspace/single/component.yml'), definition('single'));
fs.writeFileSync(path.join(root, 'components/workspace/second/component.yml'), definition('second'));
const registry = path.join(root, 'components/manifest.yml');
fs.appendFileSync(registry, `  - id: "single"\n    source: "workspace"\n    path: "components/workspace/single"\n    enabled: false\n    required: false\n    state: "uninstalled"\n  - id: "second"\n    source: "workspace"\n    path: "components/workspace/second"\n    enabled: false\n    required: false\n    state: "uninstalled"\n`);
NODE
node "$buildr" component install single --agent codex --target "$workspace_component_root" >/dev/null
workspace_member_before="$(openssl dgst -sha256 -r "$workspace_component_root/commands/workspace/single/manifest.yml")"
node --input-type=module - "$workspace_component_root/components/manifest.yml" <<'NODE'
import fs from 'node:fs';
const file = process.argv[2];
fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('path: "components/workspace/single"\n    enabled: true\n    required: false', 'path: "components/workspace/single"\n    enabled: true\n    required: true'));
NODE
if node "$buildr" component uninstall single --agent codex --target "$workspace_component_root" >/tmp/buildr-product-mvp-component-required.txt 2>&1; then
  echo "Required Component uninstall unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'Required Component cannot be uninstalled' /tmp/buildr-product-mvp-component-required.txt
test "$(openssl dgst -sha256 -r "$workspace_component_root/commands/workspace/single/manifest.yml")" = "$workspace_member_before"
node --input-type=module - "$workspace_component_root/components/manifest.yml" <<'NODE'
import fs from 'node:fs';
const file = process.argv[2];
fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('path: "components/workspace/single"\n    enabled: true\n    required: true', 'path: "components/workspace/single"\n    enabled: true\n    required: false'));
NODE
if node "$buildr" component install second --agent codex --target "$workspace_component_root" >/tmp/buildr-product-mvp-component-ownership.txt 2>&1; then
  echo "Component ownership conflict unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'owned by Component single' /tmp/buildr-product-mvp-component-ownership.txt
test "$(openssl dgst -sha256 -r "$workspace_component_root/commands/workspace/single/manifest.yml")" = "$workspace_member_before"
node "$buildr" component uninstall single --agent codex --target "$workspace_component_root" >/dev/null
test ! -e "$workspace_component_root/commands/workspace/single/manifest.yml"
rm -rf "$workspace_component_root"

section "Skills"

skill_source="$tmp/package-skill-source"
mkdir -p "$skill_source/scripts" "$skill_source/templates" "$skill_source/assets" "$skill_source/examples" "$skill_source/references"
cat > "$skill_source/SKILL.md" <<'EOF'
---
name: loaded-skill
description: Loaded skill summary
---

# Loaded Skill
EOF
printf 'echo loaded\n' > "$skill_source/scripts/run.sh"
node "$buildr" skills add --source "$skill_source" --scope . --target "$tmp" >/tmp/buildr-product-mvp-skills-add.txt
grep -q '已添加 Skill 源资产：loaded-skill' /tmp/buildr-product-mvp-skills-add.txt
grep -q '下一步：' /tmp/buildr-product-mvp-skills-add.txt
grep -Eq 'description: ("Loaded skill summary"|Loaded skill summary)' "$tmp/skills/manifest.yml"
test -f "$tmp/skills/loaded-skill/SKILL.md"
test -f "$tmp/skills/loaded-skill/scripts/run.sh"
test ! -d "$tmp/.claude/skills/loaded-skill"
node "$buildr" skills add loaded-skill --source "$tmp/skills/loaded-skill" --scope . --target "$tmp" --replace >/tmp/buildr-product-mvp-skills-register.txt
grep -q '已替换 Skill 源资产：loaded-skill' /tmp/buildr-product-mvp-skills-register.txt
if node "$buildr" skills add wrong-id --source "$skill_source" --scope . --target "$tmp" --replace >/tmp/buildr-product-mvp-skills-wrong-id.txt 2>&1; then
  echo "skills add wrong id unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'does not match' /tmp/buildr-product-mvp-skills-wrong-id.txt
printf 'unsupported\n' > "$skill_source/NOTES.md"
if node "$buildr" skills add --source "$skill_source" --scope . --target "$tmp" --replace >/tmp/buildr-product-mvp-skills-unsupported.txt 2>&1; then
  echo "skills add unsupported top-level unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'unsupported top-level' /tmp/buildr-product-mvp-skills-unsupported.txt
node "$buildr" skills add --source "$skill_source" --scope . --target "$tmp" --replace --ignore-unsupported >/tmp/buildr-product-mvp-skills-ignore.txt
grep -q '未装载的顶层内容' /tmp/buildr-product-mvp-skills-ignore.txt
test ! -f "$tmp/skills/loaded-skill/NOTES.md"
if node "$buildr" skills add --source "$skill_source" --scope projects/demo/services/api --target "$tmp" --replace --ignore-unsupported >/tmp/buildr-product-mvp-skills-service.txt 2>&1; then
  echo "skills add service scope unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'Unsupported skills scope' /tmp/buildr-product-mvp-skills-service.txt
if node "$buildr" skills add --source "$skill_source" --scope . --target "$tmp" --replace --ignore-unsupported --json >/tmp/buildr-product-mvp-skills-json.txt 2>&1; then
  echo "skills add --json unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'Unknown argument: --json' /tmp/buildr-product-mvp-skills-json.txt
node "$buildr" skills remove loaded-skill --scope . --target "$tmp" >/tmp/buildr-product-mvp-skills-remove.txt
grep -q '已删除 Skill 源资产：loaded-skill' /tmp/buildr-product-mvp-skills-remove.txt
test ! -d "$tmp/skills/loaded-skill"
node "$buildr" skills add remote-info --remote-source https://example.com/review --scope . --target "$tmp" --description "Remote info source" >/tmp/buildr-product-mvp-skills-remote-add.txt
grep -q '已添加 Skill 远端信息源：remote-info' /tmp/buildr-product-mvp-skills-remote-add.txt
grep -Eq 'id: "?remote-info"?' "$tmp/skills/manifest.yml"
grep -Eq 'mode: "?agent"?' "$tmp/skills/manifest.yml"
node "$buildr" skills remove remote-info --scope . --target "$tmp" >/tmp/buildr-product-mvp-skills-remote-remove.txt
grep -q '已删除 Skill 远端资产：remote-info' /tmp/buildr-product-mvp-skills-remote-remove.txt
node "$buildr" skills add remote-review \
  --remote-source "http://127.0.0.1:$remote_skill_port/page" \
  --resolved-source "http://127.0.0.1:$remote_skill_port/SKILL.md" \
  --integrity "sha256-$remote_skill_hash" \
  --scope . \
  --target "$tmp" >/tmp/buildr-product-mvp-skills-resolved-add.txt
grep -q '已添加 Skill 已解析远端资产：remote-review' /tmp/buildr-product-mvp-skills-resolved-add.txt
grep -q 'resolved:' "$tmp/skills/manifest.yml"
grep -q 'integrity:' "$tmp/skills/manifest.yml"

section "Workspace"

node "$buildr" init --target "$tmp" --name demo-root --profile team >/dev/null
git -C "$tmp" init >/dev/null
test -f "$tmp/AGENTS.md"
test ! -f "$tmp/AGENTS.workspace.md"
test -f "$tmp/.buildr/workspace.yml"
test -f "$tmp/projects/manifest.yml"
test -f "$tmp/components/manifest.yml"
grep -q 'schemaVersion: buildr.components/v1' "$tmp/components/manifest.yml"
grep -q 'id: "openspec"' "$tmp/components/manifest.yml"
test -f "$tmp/components/buildr/openspec/component.yml"
test -f "$tmp/components/buildr/openspec/contributions/task-triage-change-ready.md"
test -f "$tmp/components/buildr/openspec/contributions/task-finish-pre-sync.md"
test -f "$tmp/components/buildr/openspec/contributions/task-finish-post-sync.md"
test -f "$tmp/commands/buildr/openspec/manifest.yml"
grep -q 'schemaVersion: buildr.projects/v1' "$tmp/projects/manifest.yml"
grep -q 'projects: {}' "$tmp/projects/manifest.yml"
grep -q '^/.worktrees/$' "$tmp/.gitignore"
grep -q '^/.buildr/mutations/$' "$tmp/.gitignore"
grep -q '^CLAUDE.md$' "$tmp/.gitignore"
grep -q 'propose 和创建 change artifacts 前' "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md"
grep -q 'artifacts、实现和合并前候选验证都只能写入该 worktree' "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md"
grep -q '最终候选 Git tree' "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md"
grep -q '三级验证门禁' "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md"
grep -q '单任务最小反馈' "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md"
grep -q '任务组受影响范围验证' "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md"
grep -q '最终候选完整验证' "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md"
grep -q '同一候选状态不机械重复该底层检查' "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md"
grep -q 'wait、poll 或 resume 继续同一进程' "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md"
grep -q '暂时无输出不得触发相同命令重复启动' "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md"
grep -q '不在主开发分支重复运行相同 E2E' "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md"
grep -q '改变候选 tree 时，原验证结果失效' "$product_root/package/targets/workspace/skills/buildr/task-worktree/SKILL.md"
grep -q '不因 checkout、commit hash 或分支名称改变而重复运行相同验证' "$product_root/package/targets/workspace/skills/buildr/git-ops/SKILL.md"
grep -q '合并前候选验证使用临时 workspace 或 task worktree 自身' "$product_root/AGENTS.md"
grep -q '不在主开发分支重复 E2E' "$product_root/AGENTS.md"
grep -q '候选 tree 改变时' "$product_root/AGENTS.md"
grep -q '不得在每个普通任务后运行产品总验证或临时 workspace E2E' "$product_root/AGENTS.md"
grep -q '继续等待同一进程，不重复启动相同命令' "$product_root/AGENTS.md"
grep -q '实现型任务的验证编排' "$product_root/package/targets/workspace/skills/buildr/task-triage/SKILL.md"
grep -q '不得把 Buildr 产品仓的 package check' "$product_root/package/targets/workspace/skills/buildr/task-triage/SKILL.md"
grep -q '任务驾驶舱判断' "$product_root/package/targets/workspace/skills/buildr/task-triage/SKILL.md"
grep -q 'task-cockpit' "$tmp/skills/manifest.yml"
test -f "$tmp/skills/buildr/task-cockpit/SKILL.md"
test -f "$tmp/skills/buildr/task-cockpit/assets/task-cockpit-template.html"
grep -q 'openspec/knowledge/task-cockpits/yyyy-MM-dd-<task-id>.html' "$tmp/skills/buildr/task-cockpit/SKILL.md"
grep -q 'data-tab="technical"' "$tmp/skills/buildr/task-cockpit/assets/task-cockpit-template.html"
grep -q 'task-finish' "$tmp/skills/manifest.yml"
test -f "$tmp/skills/buildr/task-finish/SKILL.md"
task_finish_skill="$product_root/package/targets/workspace/skills/buildr/task-finish/SKILL.md"
for required_text in \
  '一次性授权' \
  'openspec status --change <id> --json' \
  'new blank line at EOF' \
  '恰好以一个换行结束' \
  'git rev-parse HEAD^{tree}' \
  'fast-forward-only' \
  '不删除远端任务分支' \
  '工作目录切换到主 workspace'; do
  grep -q "$required_text" "$task_finish_skill"
done
grep -q '修复期间已经优先重跑失败项和受影响专项检查' "$task_finish_skill"
grep -q '候选重新稳定后完成一次新的最终完整验证' "$task_finish_skill"
grep -q 'wait、poll 或 resume 同一进程' "$task_finish_skill"
openspec_apply_skill="$product_root/package/targets/workspace/skills/openspec/openspec-apply-change/SKILL.md"
grep -q 'generatedBy: "1.4.1"' "$openspec_apply_skill"
if grep -q '三级验证门禁' "$openspec_apply_skill"; then
  echo "External openspec-apply-change Skill was modified with Buildr verification orchestration" >&2
  exit 1
fi
grep -q '<!-- buildr:skill-contributions pre-spec-sync -->' "$task_finish_skill"
grep -q '<!-- buildr:skill-contributions post-spec-sync -->' "$task_finish_skill"
grep -q '<!-- buildr:skill-contributions change-ready -->' "$product_root/package/targets/workspace/skills/buildr/task-triage/SKILL.md"
if grep -q 'buildr openspec' "$task_finish_skill" || grep -q 'buildr openspec' "$product_root/package/targets/workspace/skills/buildr/task-triage/SKILL.md"; then
  echo "Generic task Skills contain OpenSpec contract guard commands" >&2
  exit 1
fi
if sed -n '1,4p' "$product_root/package/targets/workspace/skills/buildr/git-ops/SKILL.md" | grep -q '收尾'; then
  echo "git-ops Skill description still claims complete closeout intent" >&2
  exit 1
fi

section "Project"

node "$buildr" project create demo --target "$tmp" >/dev/null

test -f "$tmp/commands/manifest.yml"
grep -q 'schemaVersion: buildr.commands/v1' "$tmp/commands/manifest.yml"
grep -q 'commands: \[\]' "$tmp/commands/manifest.yml"
test -f "$tmp/skills/manifest.yml"
grep -q 'openspec-explore' "$tmp/skills/manifest.yml"
grep -Eq 'source: "?buildr"?' "$tmp/skills/manifest.yml"
test -f "$tmp/skills/openspec/openspec-explore/SKILL.md"
test ! -f "$tmp/ASSETS.md"
test -d "$tmp/projects"
test ! -d "$tmp/shared"
test -d "$tmp/projects/demo/openspec/specs"
test -d "$tmp/projects/demo/openspec/knowledge"
test -d "$tmp/projects/demo/openspec/changes"
test -f "$tmp/projects/demo/services/manifest.yml"
test -f "$tmp/projects/demo/skills/manifest.yml"
grep -q 'schemaVersion: buildr.services/v1' "$tmp/projects/demo/services/manifest.yml"
grep -q 'project: "demo"' "$tmp/projects/demo/services/manifest.yml"
grep -q 'schemaVersion: buildr.skills/v1' "$tmp/projects/demo/skills/manifest.yml"
grep -q 'demo:' "$tmp/projects/manifest.yml"
grep -q 'title: "demo"' "$tmp/projects/manifest.yml"
grep -q 'kind: "workspace"' "$tmp/projects/manifest.yml"

node "$buildr" project create platform --target "$tmp" --repo "file://$project_repo" --title "Platform" --description "Platform assets" >/tmp/buildr-product-mvp-project-repo.txt
test -d "$tmp/projects/platform/.git"
grep -q 'platform:' "$tmp/projects/manifest.yml"
grep -q 'title: "Platform"' "$tmp/projects/manifest.yml"
grep -q 'description: "Platform assets"' "$tmp/projects/manifest.yml"
grep -q 'url: "file://' "$tmp/projects/manifest.yml"
grep -q '^/projects/platform/$' "$tmp/.gitignore"
if node "$buildr" project create linked --target "$tmp" --repo "$project_repo" >/tmp/buildr-product-mvp-project-local-path.txt 2>&1; then
  echo "project create --repo local path unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'external local Project links are not supported' /tmp/buildr-product-mvp-project-local-path.txt

existing_agents_root="$(mktemp -d)"
printf '# Existing root entry\n' > "$existing_agents_root/AGENTS.md"
printf 'user-owned\n' > "$existing_agents_root/USER-NOTES.md"
node "$buildr" init --target "$existing_agents_root" --name existing-root --profile team >/dev/null
grep -q '^# Existing root entry$' "$existing_agents_root/AGENTS.md"
grep -q 'rules/buildr/core.md' "$existing_agents_root/AGENTS.md"
test ! -f "$existing_agents_root/AGENTS.workspace.md"
test ! -f "$existing_agents_root/README.md"
python3 - "$existing_agents_root/.gitignore" <<'PY'
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
path.write_text('\n'.join(line for line in path.read_text().splitlines() if line != 'CLAUDE.md') + '\n')
PY
node "$buildr" sync codex --target "$existing_agents_root" >/dev/null
grep -q '^CLAUDE.md$' "$existing_agents_root/.gitignore"
node "$buildr" sync claude-code --target "$existing_agents_root" --scope . >/dev/null
git -C "$existing_agents_root" init -q
git -C "$existing_agents_root" check-ignore -q CLAUDE.md
grep -q '^# Existing root entry$' "$existing_agents_root/AGENTS.md"
grep -q '^user-owned$' "$existing_agents_root/USER-NOTES.md"
node "$buildr" doctor --agent claude-code --target "$existing_agents_root" --json >/tmp/buildr-product-mvp-existing-root-doctor.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-existing-root-doctor.json'))
assert result['ok'] is True
assert result['summary']['error'] == 0
PY
rm -rf "$existing_agents_root"

section "Doctor agent filter"

node "$buildr" doctor --target "$tmp" --agent codex --json >/tmp/buildr-product-mvp-doctor-codex.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-doctor-codex.json'))
assert result['agentRuntime']['requested'] == 'codex'
assert result['agentRuntime']['supported'] is True
assert result['runtime']['claudeCode'] == []
assert result['runtime']['codex']
assert not any('claude' in f['code'] for f in result['findings'])
assert not any('claude' in step['code'] for step in result['nextSteps'])
PY

node "$buildr" doctor --target "$tmp" --agent claude-code --json >/tmp/buildr-product-mvp-doctor-claude-code.json || true
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-doctor-claude-code.json'))
assert result['agentRuntime']['requested'] == 'claude-code'
assert result['agentRuntime']['supported'] is True
assert result['runtime']['claudeCode']
assert result['runtime']['codex'] == []
assert not any('codex' in f['code'] for f in result['findings'])
assert not any('codex' in step['code'] for step in result['nextSteps'])
assert any(command.startswith('buildr rules render claude-code --scope .') or command.startswith('buildr skills render claude-code --scope .') for finding in result['findings'] for command in finding.get('commands', []))
PY

node "$buildr" doctor --target "$tmp" --agent unsupported-agent --json >/tmp/buildr-product-mvp-doctor-unsupported.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-doctor-unsupported.json'))
assert result['agentRuntime']['requested'] == 'unsupported-agent'
assert result['agentRuntime']['supported'] is False
assert result['summary']['warning'] >= 1
assert result['runtime']['claudeCode'] == []
assert result['runtime']['codex'] == []
finding = next(f for f in result['findings'] if f['code'] == 'runtime.agent_unsupported')
assert finding['mustNotUseFallbackAdapter'] is True
assert finding['userActionRequired'] is True
assert '请联系 Buildr 作者反馈该 Agent' in finding['message']
PY
test ! -f "$tmp/.buildr/skills/buildr/SKILL.md"

node "$buildr" doctor --target "$tmp" --agent Codex --json >/tmp/buildr-product-mvp-doctor-case.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-doctor-case.json'))
assert result['agentRuntime']['requested'] == 'Codex'
assert result['agentRuntime']['supported'] is False
assert result['runtime']['claudeCode'] == []
assert result['runtime']['codex'] == []
PY

if node "$buildr" doctor --target "$tmp" --agent "Cursor Agent" --json >/tmp/buildr-product-mvp-doctor-invalid.json 2>/tmp/buildr-product-mvp-doctor-invalid.err; then
  echo "invalid agent id unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'Agent id must contain only letters, digits, dots, underscores, or dashes' /tmp/buildr-product-mvp-doctor-invalid.err

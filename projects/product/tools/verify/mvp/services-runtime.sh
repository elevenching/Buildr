section "Service"

node "$buildr" service create demo/api "$remote_repo" --target "$tmp" --type backend >/dev/null
test -d "$tmp/projects/demo/services/api/.git"
grep -q 'url:' "$tmp/projects/demo/services/manifest.yml"
grep -q 'type: "backend"' "$tmp/projects/demo/services/manifest.yml"
grep -q '^/projects/demo/services/api/$' "$tmp/.gitignore"
test "$(git -C "$tmp/projects/demo/services/api" branch --show-current)" = main
cat > "$tmp/projects/demo/services/api/AGENTS.md" <<'EOF'
# API rules
EOF
mkdir -p "$tmp/projects/demo/services/api/modules/orders"
cat > "$tmp/projects/demo/services/api/modules/orders/AGENTS.md" <<'EOF'
# Orders module rules
EOF

node "$buildr" service create demo/feature-api "$remote_repo" --branch feature --target "$tmp" --type backend >/dev/null
test "$(git -C "$tmp/projects/demo/services/feature-api" branch --show-current)" = feature
test -f "$tmp/projects/demo/services/feature-api/FEATURE.md"
grep -q 'branch: "feature"' "$tmp/projects/demo/services/manifest.yml"
grep -q 'defaultBranch: "main"' "$tmp/projects/demo/services/manifest.yml"
if node "$buildr" service create demo/feature-api "$remote_repo" --branch main --target "$tmp" >/tmp/buildr-product-mvp-service-branch-conflict.txt 2>&1; then
  echo "service create accepted conflicting branch intent" >&2
  exit 1
fi
grep -q 'branch intent conflicts' /tmp/buildr-product-mvp-service-branch-conflict.txt

node "$buildr" service create demo/local "$local_repo" --target "$tmp" --type library >/dev/null
grep -q 'local:' "$tmp/projects/demo/services/manifest.yml"
grep -q 'type: "library"' "$tmp/projects/demo/services/manifest.yml"
grep -q '^/projects/demo/services/local/$' "$tmp/.gitignore"
cat > "$tmp/projects/demo/services/local/AGENTS.md" <<'EOF'
# Local service rules
EOF
node "$buildr" service create demo/rules-compat "$local_repo" --target "$tmp" --type backend --rules services/rules-compat/AGENTS.md >/tmp/buildr-product-mvp-service-rules.txt 2>&1
grep -q -- '--rules is deprecated' /tmp/buildr-product-mvp-service-rules.txt
test -d "$tmp/projects/demo/services/rules-compat"
if grep -Eq 'rules:|rulesSource|rules\.source' "$tmp/projects/demo/services/manifest.yml"; then
  echo "service create persisted rules.source" >&2
  exit 1
fi

node "$buildr" bootstrap guide >/tmp/buildr-product-mvp-canonical-bootstrap-guide.txt
if grep -q -- '--rules' /tmp/buildr-product-mvp-canonical-bootstrap-guide.txt; then
  echo "bootstrap guide recommends legacy service create --rules" >&2
  exit 1
fi
grep -q 'Service 规则入口是 Service 目录中的 `AGENTS.md`' /tmp/buildr-product-mvp-canonical-bootstrap-guide.txt

section "Registry convergence"

cat > "$tmp/projects.yml" <<'EOF'
schemaVersion: 1
projects: {}
EOF
mkdir -p "$tmp/projects/legacy-only/services/old-api"
git -C "$tmp/projects/legacy-only/services/old-api" init >/dev/null
cat > "$tmp/projects/legacy-only/services.yml" <<'EOF'
services:
  old-api:
    repo:
      kind: local
      path: services/old-api
      url: git@example.com:demo/old-api.git
      remote: origin
      defaultBranch: main
    type: backend
    rules:
      source: services/old-api/AGENTS.md
    extra: drop-me
EOF
cat > "$tmp/projects/manifest.yml" <<'EOF'
schemaVersion: buildr.projects/v1
projects:
  demo:
    title: "demo"
    path: "wrong"
    extra: "drop-me"
    repo:
      kind: "workspace"
  ghost:
    title: "ghost"
    description: "ghost Git project"
    path: "projects/ghost"
    repo:
      kind: "git"
      url: "git@example.com:demo/ghost.git"
EOF
tail -n +2 "$tmp/skills/manifest.yml" > "$tmp/skills/manifest.tmp"
mv "$tmp/skills/manifest.tmp" "$tmp/skills/manifest.yml"
node "$buildr" doctor --target "$tmp" --scope projects/demo --json >/tmp/buildr-product-mvp-registry-doctor-before.json || true
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-registry-doctor-before.json'))
codes = {f['code'] for f in result['findings']}
assert 'projects.legacy_registry_present' in codes
assert 'projects.registry_invalid' in codes
assert 'skills.schema_version_invalid' in codes
PY
node --input-type=module - "$tmp/skills/manifest.yml" <<'NODE'
import fs from 'node:fs';
import YAML from 'yaml';
const file = process.argv[2];
const current = YAML.parse(fs.readFileSync(file, 'utf8'));
fs.writeFileSync(file, YAML.stringify({ schemaVersion: 'buildr.skills/v1', skills: current.skills }, { lineWidth: 0 }));
NODE
node "$buildr" doctor --target "$tmp" --scope projects/demo --json >/tmp/buildr-product-mvp-registry-doctor-legacy.json || true
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-registry-doctor-legacy.json'))
assert any(f['code'] == 'skills.schema_version_legacy' for f in result['findings'])
PY
if node "$buildr" sync codex --target "$tmp" >/tmp/buildr-product-mvp-registry-update.txt 2>&1; then
  echo "sync unexpectedly passed final doctor with an intentionally missing registered Project" >&2
  exit 1
fi
grep -q '最终 doctor 未通过' /tmp/buildr-product-mvp-registry-update.txt
test ! -f "$tmp/projects.yml"
test ! -f "$tmp/projects/legacy-only/services.yml"
test ! -d "$tmp/projects/ghost"
grep -q 'legacy-only:' "$tmp/projects/manifest.yml"
grep -q 'ghost:' "$tmp/projects/manifest.yml"
grep -q 'old-api:' "$tmp/projects/legacy-only/services/manifest.yml"
grep -q 'kind: "git"' "$tmp/projects/legacy-only/services/manifest.yml"
grep -q 'url: "git@example.com:demo/old-api.git"' "$tmp/projects/legacy-only/services/manifest.yml"
if grep -q 'rules:' "$tmp/projects/legacy-only/services/manifest.yml" || grep -q 'extra:' "$tmp/projects/legacy-only/services/manifest.yml"; then
  echo "legacy service manifest migration kept unsupported fields" >&2
  exit 1
fi
grep -q 'schemaVersion: buildr.skills/v2' "$tmp/skills/manifest.yml"
grep -q 'description: "TODO:' "$tmp/projects/manifest.yml"
node "$buildr" doctor --target "$tmp" --scope projects/legacy-only --json >/tmp/buildr-product-mvp-registry-doctor-after.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-registry-doctor-after.json'))
assert result['summary']['error'] == 0
assert any(f['code'] in ('projects.description_todo', 'services.description_todo') for f in result['findings'])
PY
node "$buildr" doctor --target "$tmp" --scope projects/ghost --json >/tmp/buildr-product-mvp-ghost-doctor.json || true
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-ghost-doctor.json'))
assert any(f['code'] == 'project.missing' for f in result['findings'])
PY
python3 - "$tmp/projects/manifest.yml" <<'PY'
from pathlib import Path
path = Path(__import__('sys').argv[1])
lines = path.read_text().splitlines()
out = []
skip = False
for line in lines:
    if line == '  ghost:':
        skip = True
        continue
    if skip and line.startswith('  ') and not line.startswith('    '):
        skip = False
    if not skip:
        out.append(line)
path.write_text('\n'.join(out) + '\n')
PY

section "Runtime: Skill installation"

node "$buildr" skill install claude-code --target "$skill_install_target" >/tmp/buildr-product-mvp-skill-install.txt
grep -q '.claude/skills/buildr/SKILL.md' /tmp/buildr-product-mvp-skill-install.txt
test -f "$skill_install_target/.claude/skills/buildr/SKILL.md"
grep -q 'Buildr Skill' "$skill_install_target/.claude/skills/buildr/SKILL.md"
grep -q '当前 Agent Adapter' "$skill_install_target/.claude/skills/buildr/SKILL.md"
grep -q '当前安装 adapter：`claude-code`。' "$skill_install_target/.claude/skills/buildr/SKILL.md"
grep -q 'buildr runtime check claude-code' "$skill_install_target/.claude/skills/buildr/SKILL.md"
mkdir -p "$skill_install_target/conflict/.claude/skills/buildr"
printf 'manual\n' > "$skill_install_target/conflict/.claude/skills/buildr/SKILL.md"
if node "$buildr" skill install claude-code --target "$skill_install_target/conflict" >/tmp/buildr-product-mvp-skill-install-conflict.txt 2>&1; then
  echo "Buildr Skill install unexpectedly overwrote non-managed file" >&2
  exit 1
fi
grep -q 'Refusing to overwrite non-Buildr-managed file' /tmp/buildr-product-mvp-skill-install-conflict.txt

section "Runtime: workspace diagnostics"

node "$buildr" doctor --target "$tmp" --scope projects/demo --json >/tmp/buildr-product-mvp-doctor.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-doctor.json'))
assert 'summary' in result
assert 'workspace' in result
assert result['projectRegistry']['exists'] is True
assert any(project['name'] == 'demo' and project['title'] == 'demo' for project in result['projectRegistry']['projects'])
assert result['workspace']['initialized'] is True
assert result['workspace']['rootOrganization'] is True
assert any(service['name'] == 'api' for service in result['services'])
assert any(service['name'] == 'local' for service in result['services'])
PY

node "$buildr" doctor --target "$tmp" --scope projects/platform --json >/tmp/buildr-product-mvp-project-repo-doctor.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-project-repo-doctor.json'))
project = next(project for project in result['projects'] if project['name'] == 'platform')
assert project['repo']['kind'] == 'git'
assert project['ignoredByWorkspace'] is True
assert not any(f['code'] == 'gitignore.project_repo_not_ignored' for f in result['findings'])
PY

mkdir -p "$tmp/projects/orphan"
node "$buildr" doctor --target "$tmp" --json >/tmp/buildr-product-mvp-orphan-project-doctor.json || true
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-orphan-project-doctor.json'))
assert any(f['code'] == 'projects.unregistered' and 'project create orphan' in f.get('command', '') for f in result['findings'])
PY
rm -rf "$tmp/projects/orphan"

node "$buildr" project create foundation --target "$tmp" >/dev/null
mkdir -p "$tmp/projects/foundation/services/common"
git -C "$tmp/projects/foundation/services/common" init >/dev/null
cat > "$tmp/projects/foundation/services.yml" <<'EOF'
services:
  common:
    repo:
      kind: local
      path: services/common
    type: library
EOF
node "$buildr" sync codex --target "$tmp" >/tmp/buildr-product-mvp-update-legacy-services.txt
test ! -f "$tmp/projects/foundation/services.yml"
grep -q 'common:' "$tmp/projects/foundation/services/manifest.yml"
node "$buildr" doctor --target "$tmp" --scope projects/foundation --json >/tmp/buildr-product-mvp-foundation-doctor.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-foundation-doctor.json'))
assert result['summary']['error'] == 0
assert any(service['project'] == 'foundation' and service['name'] == 'common' for service in result['services'])
PY

mkdir -p "$tmp/shared/services/legacy"
if node "$buildr" doctor --target "$tmp" --scope shared --json >/tmp/buildr-product-mvp-shared-scope.json 2>/tmp/buildr-product-mvp-shared-scope.err; then
  echo "shared scope unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'shared scopes are not supported' /tmp/buildr-product-mvp-shared-scope.err

section "Runtime: Claude Code projection"

(cd "$tmp" && node "$buildr" runtime check claude-code --scope projects/demo --target "$tmp" >/tmp/buildr-product-mvp-runtime-before.txt || true)
(cd "$tmp" && node "$buildr" rules render claude-code --scope projects/demo --target "$tmp" >/dev/null)
assert_compact_claude_bridge "$tmp/CLAUDE.md"
assert_compact_claude_bridge "$tmp/projects/demo/CLAUDE.md"
assert_compact_claude_bridge "$tmp/projects/demo/services/api/CLAUDE.md"
assert_compact_claude_bridge "$tmp/projects/demo/services/api/modules/orders/CLAUDE.md"
assert_compact_claude_bridge "$tmp/projects/demo/services/local/CLAUDE.md"
(cd "$tmp" && node "$buildr" rules render claude-code --scope projects/demo/services/api --target "$tmp" >/tmp/buildr-product-mvp-service-rules-render.txt)
grep -q '\[unchanged\] projects/demo/services/api/modules/orders/CLAUDE.md' /tmp/buildr-product-mvp-service-rules-render.txt
if grep -q 'projects/demo/services/local/CLAUDE.md' /tmp/buildr-product-mvp-service-rules-render.txt; then
  echo "Service rules render included a sibling Service" >&2
  exit 1
fi
(cd "$tmp" && node "$buildr" runtime check claude-code --scope projects/demo --target "$tmp" >/tmp/buildr-product-mvp-runtime-after.txt || true)

grep -q 'CLAUDE.md' /tmp/buildr-product-mvp-runtime-after.txt
grep -q 'product Agent Skill buildr' /tmp/buildr-product-mvp-runtime-after.txt
grep -q 'workspace Skill openspec-explore' /tmp/buildr-product-mvp-runtime-after.txt
grep -q 'buildr skill install claude-code --target' /tmp/buildr-product-mvp-runtime-after.txt
grep -q 'buildr skills render claude-code --scope projects/demo' /tmp/buildr-product-mvp-runtime-after.txt
test ! -f "$tmp/.claude/skills/buildr/SKILL.md"
if grep -q 'bootstrap install-skill' /tmp/buildr-product-mvp-runtime-after.txt; then
  echo "runtime check suggested bootstrap install-skill" >&2
  exit 1
fi
node "$buildr" skill install claude-code --target "$tmp" >/dev/null
test -f "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '当前 Agent Adapter' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '当前安装 adapter：`claude-code`。' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q 'buildr bootstrap guide' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '### Workspace' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '### Project' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '### Service' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '### Components' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '二次确认' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '### Rules' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '### Commands' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '### Skills' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '### Agent 运行时渲染' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '## 完成标准' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '优先使用 Buildr CLI' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '状态变更后确认最新 doctor 结果' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '根据用户目标和 doctor 结果' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '创建或修复 Project/Service 必须来自用户意图' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q 'buildr runtime list --json' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q 'buildr doctor --agent claude-code --target <dir> --json' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '请联系 Buildr 作者反馈该 Agent' "$tmp/.claude/skills/buildr/SKILL.md"
grep -q '建立事实基线' "$tmp/.claude/skills/buildr/SKILL.md"
if grep -q '## 轻约束' "$tmp/.claude/skills/buildr/SKILL.md"; then
  echo "Buildr Skill regressed to standalone constraints section" >&2
  exit 1
fi
if grep -q '## 命令地图' "$tmp/.claude/skills/buildr/SKILL.md"; then
  echo "Buildr Skill regressed to standalone command map" >&2
  exit 1
fi
if grep -q '| 目的 |' "$tmp/.claude/skills/buildr/SKILL.md"; then
  echo "Buildr Skill regressed to table-style CLI reference" >&2
  exit 1
fi
if grep -q 'Use this skill' "$tmp/.claude/skills/buildr/SKILL.md"; then
  echo "Buildr Skill still contains English body copy" >&2
  exit 1
fi
node "$buildr" skills render claude-code --scope projects/demo --target "$tmp" >/tmp/buildr-product-mvp-default-skills-render.txt
grep -q '.claude/skills/openspec-explore/SKILL.md' /tmp/buildr-product-mvp-default-skills-render.txt
grep -q '.claude/skills/remote-review/SKILL.md' /tmp/buildr-product-mvp-default-skills-render.txt
test -f "$tmp/.claude/skills/openspec-explore/SKILL.md"
test -f "$tmp/.claude/skills/openspec-contract-guard/SKILL.md"
test -f "$tmp/.claude/skills/task-finish/SKILL.md"
test -f "$tmp/.claude/skills/remote-review/SKILL.md"

section "Runtime: Codex reconciliation"

node "$buildr" sync codex --target "$tmp" --scope . >/tmp/buildr-product-mvp-codex-sync.txt
test -f "$tmp/.agents/skills/buildr/SKILL.md"
test -f "$tmp/.agents/skills/openspec-explore/SKILL.md"
test -f "$tmp/.agents/skills/openspec-contract-guard/SKILL.md"
test -f "$tmp/.agents/skills/task-finish/SKILL.md"
grep -q '当前安装 adapter：`codex`。' "$tmp/.agents/skills/buildr/SKILL.md"
node "$buildr" runtime check codex --scope . --target "$tmp" >/tmp/buildr-product-mvp-codex-runtime.txt
grep -q 'Codex runtime check' /tmp/buildr-product-mvp-codex-runtime.txt
grep -q 'workspace Skill openspec-explore is up to date' /tmp/buildr-product-mvp-codex-runtime.txt
grep -q 'projects/demo/services/api/modules/orders/AGENTS.md' /tmp/buildr-product-mvp-codex-runtime.txt
test ! -d "$tmp/.codex"

printf '\nverify local edit\n' >> "$tmp/skills/openspec/openspec-propose/SKILL.md"
if node "$buildr" sync codex --target "$tmp" --scope . >/tmp/buildr-product-mvp-codex-sync-modified.txt 2>&1; then
  echo "sync codex unexpectedly ignored modified Component member" >&2
  exit 1
fi
grep -q 'sync 暂停' /tmp/buildr-product-mvp-codex-sync-modified.txt
grep -q 'openspec-propose' /tmp/buildr-product-mvp-codex-sync-modified.txt
cp "$product_root/package/targets/workspace/skills/openspec/openspec-propose/SKILL.md" "$tmp/skills/openspec/openspec-propose/SKILL.md"
node "$buildr" sync codex --target "$tmp" --scope . >/tmp/buildr-product-mvp-codex-sync-after-restore.txt

section "Runtime: drift and legacy compatibility"

printf 'projects/demo/\n' >> "$tmp/.gitignore"
node "$buildr" doctor --target "$tmp" --scope projects/demo --json >/tmp/buildr-product-mvp-doctor-parent-ignore.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-doctor-parent-ignore.json'))
assert not any(f['code'] == 'gitignore.service_repo_not_ignored' for f in result['findings'])
PY

mkdir -p "$tmp/skills/demo-skill" "$tmp/.claude/skills/demo-skill"
cat > "$tmp/skills/manifest.yml" <<'EOF'
skills:
  - id: demo-skill
    path: demo-skill
EOF
cat > "$tmp/skills/demo-skill/SKILL.md" <<'EOF'
---
name: demo-skill
---

Demo skill.
EOF
cp "$tmp/skills/demo-skill/SKILL.md" "$tmp/.claude/skills/demo-skill/SKILL.md"
(cd "$tmp" && node "$buildr" runtime check claude-code --scope projects/demo --target "$tmp" >/tmp/buildr-product-mvp-legacy-skill-before.txt || true)
grep -q 'stale=1' /tmp/buildr-product-mvp-legacy-skill-before.txt
grep -q 'buildr skills render claude-code --scope projects/demo' /tmp/buildr-product-mvp-legacy-skill-before.txt
(cd "$tmp" && node "$buildr" skills render claude-code --scope projects/demo --target "$tmp" >/dev/null)
test -f "$tmp/.claude/skills/buildr/SKILL.md"
test -f "$tmp/.claude/skills/demo-skill/SKILL.md"
(cd "$tmp" && node "$buildr" runtime check claude-code --scope projects/demo --target "$tmp" >/tmp/buildr-product-mvp-legacy-skill-after.txt)
grep -q 'stale=0 orphan=0 conflict=0' /tmp/buildr-product-mvp-legacy-skill-after.txt

if node "$buildr" doctor --target "$tmp" --scope organizations/default/projects/old-demo --json >/tmp/buildr-product-mvp-legacy-doctor.json 2>/tmp/buildr-product-mvp-legacy-doctor.err; then
  echo "legacy organizations scope unexpectedly succeeded" >&2
  exit 1
fi
grep -q 'organizations/<org>/ scopes are not supported' /tmp/buildr-product-mvp-legacy-doctor.err

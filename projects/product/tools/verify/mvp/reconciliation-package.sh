section "Runtime reconciliation"

node "$buildr" init --target "$reconcile_tmp" >/dev/null
node "$buildr" skills render codex --scope . --target "$reconcile_tmp" >/dev/null
node "$buildr" skills remove task-triage --scope . --target "$reconcile_tmp" >/dev/null
node "$buildr" skills render codex --scope . --target "$reconcile_tmp" >/dev/null
test ! -e "$reconcile_tmp/.agents/skills/task-triage"

node "$buildr" skills add agent-plan-test --remote-source https://example.com/agent-plan-test --description test --scope . --target "$reconcile_tmp" >/dev/null
node "$buildr" skills render codex --scope . --target "$reconcile_tmp" >/dev/null
test -f "$reconcile_tmp/.agents/buildr/skill-install-plans/agent-plan-test.md"
node "$buildr" skills remove agent-plan-test --scope . --target "$reconcile_tmp" >/dev/null
node "$buildr" skills render codex --scope . --target "$reconcile_tmp" >/dev/null
test ! -e "$reconcile_tmp/.agents/buildr/skill-install-plans/agent-plan-test.md"

node "$buildr" project create alpha --target "$reconcile_tmp" >/dev/null
node "$buildr" project create beta --target "$reconcile_tmp" >/dev/null
node "$buildr" skills add --source "$product_root/package/targets/workspace/skills/buildr/git-ops" --scope projects/alpha --target "$reconcile_tmp" >/dev/null
node "$buildr" skills add --source "$product_root/package/targets/workspace/skills/buildr/git-ops" --scope projects/beta --target "$reconcile_tmp" >/dev/null
node "$buildr" skills render codex --scope . --target "$reconcile_tmp" >/dev/null
printf '\nBeta-only change.\n' >> "$reconcile_tmp/projects/beta/skills/git-ops/SKILL.md"
node "$buildr" skills render codex --scope projects/alpha --target "$reconcile_tmp" >/dev/null
rm -rf "$reconcile_tmp/.agents/skills/openspec-explore"
if node "$buildr" skills render codex --scope . --target "$reconcile_tmp" >/tmp/buildr-product-mvp-project-skill-conflict.txt 2>&1; then
  echo "workspace render unexpectedly accepted different Project Skill content" >&2
  exit 1
fi
grep -q '内容不同' /tmp/buildr-product-mvp-project-skill-conflict.txt
test ! -e "$reconcile_tmp/.agents/skills/openspec-explore"

section "OpenSpec audit fixture"

audit_fixture="$(mktemp -d)"
mkdir -p "$audit_fixture/projects/product/tools/verification/openspec" \
  "$audit_fixture/projects/product/openspec/specs/audit-fixture" \
  "$audit_fixture/projects/product/openspec/changes/archive/2026-01-01-audit-fixture/.buildr"
cp "$product_root/tools/verification/openspec/contract-audit.mjs" "$audit_fixture/projects/product/tools/verification/openspec/"
git -C "$audit_fixture" init >/dev/null
git -C "$audit_fixture" config user.email buildr@example.com
git -C "$audit_fixture" config user.name Buildr
cat > "$audit_fixture/projects/product/openspec/specs/audit-fixture/spec.md" <<'EOF'
# Audit fixture
EOF
cat > "$audit_fixture/projects/product/openspec/changes/archive/2026-01-01-audit-fixture/.buildr/contract-pre-sync-receipt.json" <<'EOF'
{"schemaVersion":"buildr.openspec-contract-receipt/v1","change":"audit-fixture","postSyncVerified":true,"postSyncDeltaHash":"historical","capabilities":{"audit-fixture":{}},"postSyncSpecIntegrities":{"audit-fixture":"sha256-historical"}}
EOF
git -C "$audit_fixture" add projects/product/openspec
git -C "$audit_fixture" commit -m baseline >/dev/null
printf '\nUnauthorized manual edit.\n' >> "$audit_fixture/projects/product/openspec/specs/audit-fixture/spec.md"
if node "$audit_fixture/projects/product/tools/verification/openspec/contract-audit.mjs" >/tmp/buildr-product-mvp-contract-audit-history.txt 2>&1; then
  echo "historical OpenSpec receipt unexpectedly authorized a new canonical spec edit" >&2
  exit 1
fi
grep -q 'without a matching receipt from the current candidate' /tmp/buildr-product-mvp-contract-audit-history.txt

candidate_change="$audit_fixture/projects/product/openspec/changes/archive/2026-01-02-audit-fixture-current"
mkdir -p "$candidate_change/.buildr" "$candidate_change/specs/audit-fixture"
cat > "$candidate_change/specs/audit-fixture/spec.md" <<'EOF'
## MODIFIED Requirements

### Requirement: Audit fixture
The fixture MUST bind the current candidate receipt.
EOF
audit_integrity="$(node --input-type=module -e "import crypto from 'node:crypto';import fs from 'node:fs';const content=fs.readFileSync(process.argv[1],'utf8').replace(/\\r\\n/g,'\\n').replace(/[ \\t]+$/gm,'').replace(/\\n+$/,'\\n');process.stdout.write('sha256-'+crypto.createHash('sha256').update(content).digest('hex'));" "$audit_fixture/projects/product/openspec/specs/audit-fixture/spec.md")"
cat > "$candidate_change/.buildr/contract-pre-sync-receipt.json" <<EOF
{"schemaVersion":"buildr.openspec-contract-receipt/v1","change":"audit-fixture-current","postSyncVerified":true,"postSyncDeltaHash":"fixture","capabilities":{"audit-fixture":{}},"postSyncSpecIntegrities":{"audit-fixture":"$audit_integrity"}}
EOF
node "$audit_fixture/projects/product/tools/verification/openspec/contract-audit.mjs" >/tmp/buildr-product-mvp-contract-audit-nested.txt
grep -q 'audit-fixture associated with current candidate receipts' /tmp/buildr-product-mvp-contract-audit-nested.txt
rm -rf "$audit_fixture"

section "Packaged governance assets"

git_ops_skill="$product_root/package/targets/workspace/skills/buildr/git-ops/SKILL.md"
grep -q '优先使用常用、直接和简练的语言' "$product_root/package/targets/workspace/rules/buildr/core.md"
grep -q '文件末尾必须恰好保留一个换行符；不得在 EOF 前生成额外空白行' "$product_root/package/targets/workspace/rules/buildr/core.md"
grep -q '结合当前状态以及适用的 Rule、Skill 和项目约定' "$product_root/package/targets/workspace/rules/buildr/core.md"
grep -q '任务已经完整结束时，应明确说明任务已完成，不机械追加无关建议' "$product_root/package/targets/workspace/rules/buildr/core.md"
for required_text in \
  '<type>(<scope>): <subject>' \
  '`feat` 新功能' \
  '`fix` 修复' \
  '`docs` 文档' \
  '`style` 格式' \
  '`refactor` 重构' \
  '`perf` 性能' \
  '`test` 测试' \
  '`build` 构建或依赖' \
  '`ci` CI' \
  '`chore` 其他维护' \
  '`revert` 撤销' \
  'scope 仅在范围明确时使用，不猜测' \
  '正文可选' \
  'BREAKING CHANGE:' \
  '遵循 Buildr Core 和当前 scope 更具体的' \
  '默认 rebase 到最新目标分支' \
  'rebase 前后必须比较最终候选 Git tree' \
  '默认只通过 fast-forward' \
  '不创建 merge commit' \
  '已推送或多人共享的任务分支不自动 rebase 或 force push' \
  '等待用户确认'; do
  grep -q "$required_text" "$git_ops_skill"
done
if grep -q '默认使用中文' "$git_ops_skill"; then
  echo "git-ops Skill copied the Core commit-language default" >&2
  exit 1
fi

section "npm: tarball contract"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to verify the Buildr npm package." >&2
  exit 1
fi

if [[ -n "${BUILDR_CANDIDATE_TARBALL:-}" || -n "${BUILDR_CANDIDATE_PACK_METADATA:-}" ]]; then
  if [[ -z "${BUILDR_CANDIDATE_TARBALL:-}" || -z "${BUILDR_CANDIDATE_PACK_METADATA:-}" ]]; then
    echo "shared candidate package requires both tarball and pack metadata" >&2
    exit 1
  fi
  test -f "$BUILDR_CANDIDATE_TARBALL"
  test -f "$BUILDR_CANDIDATE_PACK_METADATA"
  cp "$BUILDR_CANDIDATE_PACK_METADATA" /tmp/buildr-product-mvp-npm-pack.json
else
  npm pack "$product_root" --pack-destination "$npm_pack_dir" --json >/tmp/buildr-product-mvp-npm-pack.json
fi
tarball="$(
  NPM_PACK_DIR="$npm_pack_dir" PRODUCT_ROOT="$product_root" TARBALL_OVERRIDE="${BUILDR_CANDIDATE_TARBALL:-}" python3 - <<'PY'
import json
import os
import sys

data = json.load(open('/tmp/buildr-product-mvp-npm-pack.json'))
if len(data) != 1:
    raise SystemExit(f'expected one npm pack result, got {len(data)}')
pkg = data[0]
metadata = json.load(open(os.path.join(os.environ['PRODUCT_ROOT'], 'package.json')))
assert metadata['version'] != '0.0.0'
assert metadata.get('private') is not True
assert metadata['license'] == 'MIT'
assert metadata['bin']['buildr'] == 'tools/buildr'
files = {item['path'] for item in pkg['files']}
required = {
    'LICENSE',
    'package.json',
    'tools/buildr',
    'tools/shared/fetch-remote-text.mjs',
    'tools/verification/openspec/contract.mjs',
    'README.md',
    'docs/cli-reference.md',
    'docs/known-limitations.md',
    'examples/minimal-workspace/README.md',
    'package/README.md',
    'package/manifest.yml',
    'package/bootstrap/guide.md',
    'package/bootstrap/contract.yml',
    'package/targets/runtime/skills/buildr/SKILL.md',
    'package/targets/workspace/AGENTS.md',
    'package/targets/workspace/.buildr/workspace.yml',
    'package/targets/workspace/projects/manifest.yml',
    'package/targets/workspace/projects/services/manifest.yml',
    'package/targets/workspace/projects/skills/manifest.yml',
    'package/targets/workspace/gitignore',
    'package/targets/workspace/commands/manifest.yml',
    'package/targets/workspace/commands/buildr/openspec/manifest.yml',
    'package/targets/workspace/components/manifest.yml',
    'package/targets/workspace/components/buildr/openspec/component.yml',
    'package/targets/workspace/components/buildr/openspec/contributions/task-triage-change-ready.md',
    'package/targets/workspace/components/buildr/openspec/contributions/task-finish-pre-sync.md',
    'package/targets/workspace/components/buildr/openspec/contributions/task-finish-post-sync.md',
    'package/targets/workspace/projects/AGENTS.project.md',
    'package/targets/workspace/rules/manifest.yml',
    'package/targets/workspace/rules/buildr/core.md',
    'package/targets/workspace/skills/manifest.yml',
    'package/targets/workspace/skills/buildr/task-triage/SKILL.md',
    'package/targets/workspace/skills/buildr/task-worktree/SKILL.md',
    'package/targets/workspace/skills/buildr/task-finish/SKILL.md',
    'package/targets/workspace/skills/buildr/git-ops/SKILL.md',
    'package/targets/workspace/skills/openspec/openspec-explore/SKILL.md',
}
missing = sorted(required - files)
if missing:
    raise SystemExit(f'npm package missing required files: {missing}')
forbidden_exact = {
    'ASSETS.md',
    'buildr',
    'rules/AGENTS.private.md',
    'rules/git.md',
    'rules/openspec.md',
    'rules/runtime.md',
    'rules/task-triage.md',
    'rules/worktree.md',
    'package/bootstrap/bootstrap.contract.yml',
    'tools/check-runtime-skills.mjs',
    'tools/render-codex.mjs',
}
forbidden_prefixes = (
    '.claude/',
    '.agents/',
    '.codex/',
    '.cursor/',
    '.qoder/',
    '.trae/',
    'openspec/',
    'projects/',
    'package/workspace/',
    'package/agent-skills/',
)
for file in sorted(files):
    if file in forbidden_exact or file.startswith(forbidden_prefixes):
        raise SystemExit(f'npm package included forbidden file: {file}')
tarball = os.environ.get('TARBALL_OVERRIDE') or os.path.join(os.environ['NPM_PACK_DIR'], pkg['filename'])
if os.path.basename(tarball) != pkg['filename']:
    raise SystemExit('candidate tarball filename does not match npm pack metadata')
print(tarball)
PY
)"

section "npm: install and onboarding"

npm install -g --prefix "$npm_prefix" "$tarball" >/tmp/buildr-product-mvp-npm-install.txt
installed_buildr="$npm_prefix/bin/buildr"
test -x "$installed_buildr"

"$installed_buildr" skill install claude-code --target "$npm_skill_workspace" >/tmp/buildr-product-mvp-npm-skill-install.txt
test -f "$npm_skill_workspace/.claude/skills/buildr/SKILL.md"
grep -q 'Buildr Skill' "$npm_skill_workspace/.claude/skills/buildr/SKILL.md"
"$installed_buildr" init --agent codex --target "$npm_workspace" --name npm-demo --profile team >/tmp/buildr-product-mvp-npm-init-codex.txt
grep -q 'Buildr onboarding 已完成：codex' /tmp/buildr-product-mvp-npm-init-codex.txt
test -f "$npm_workspace/projects/manifest.yml"
test -f "$npm_workspace/commands/manifest.yml"
"$installed_buildr" doctor --agent codex --target "$npm_workspace" --json >/tmp/buildr-product-mvp-npm-doctor-codex.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-npm-doctor-codex.json'))
assert result['ok'] is True
assert result['summary']['error'] == 0
assert all(not scope['counts']['missing'] and not scope['counts']['stale'] and not scope['counts']['conflict'] for scope in result['runtime']['codex'])
PY
test -f "$npm_workspace/.agents/skills/buildr/SKILL.md"
"$installed_buildr" commands check --target "$npm_workspace" --json >/tmp/buildr-product-mvp-npm-commands.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-npm-commands.json'))
assert result['ok'] is True
assert result['manifest']['valid'] is True
assert any(command['id'] == 'openspec' and command['sources'] == ['commands/buildr/openspec/manifest.yml'] for command in result['commands'])
PY
grep -q 'id: "openspec"' "$npm_workspace/components/manifest.yml"
grep -q 'openspec-explore' "$npm_workspace/skills/manifest.yml"
grep -Eq 'source: "?buildr"?' "$npm_workspace/skills/manifest.yml"
test -f "$npm_workspace/skills/openspec/openspec-explore/SKILL.md"
section "npm: Project and Service lifecycle"

"$installed_buildr" project create demo --target "$npm_workspace" >/dev/null
grep -q 'demo:' "$npm_workspace/projects/manifest.yml"
"$installed_buildr" service create demo/api "$remote_repo" --target "$npm_workspace" --type backend >/dev/null
"$installed_buildr" doctor --target "$npm_workspace" --scope projects/demo --json >/tmp/buildr-product-mvp-npm-doctor.json
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-npm-doctor.json'))
assert result['workspace']['initialized'] is True
assert result['projectRegistry']['exists'] is True
assert any(service['name'] == 'api' for service in result['services'])
PY
section "npm: runtime projection"

"$installed_buildr" skill install claude-code --target "$npm_workspace" >/tmp/buildr-product-mvp-npm-workspace-skill-install.txt
(cd "$npm_workspace" && "$installed_buildr" runtime check claude-code --scope projects/demo --target "$npm_workspace" >/tmp/buildr-product-mvp-npm-runtime-before.txt || true)
(cd "$npm_workspace" && "$installed_buildr" rules render claude-code --scope projects/demo --target "$npm_workspace" >/dev/null)
(cd "$npm_workspace" && "$installed_buildr" skills render claude-code --scope projects/demo --target "$npm_workspace" >/dev/null)
test -f "$npm_workspace/.claude/skills/openspec-explore/SKILL.md"
assert_compact_claude_bridge "$npm_workspace/CLAUDE.md"
assert_compact_claude_bridge "$npm_workspace/projects/demo/CLAUDE.md"
test -f "$npm_workspace/.claude/skills/buildr/SKILL.md"
test -f "$npm_workspace/.claude/skills/openspec-explore/SKILL.md"
section "npm: installed help"

"$installed_buildr" bootstrap guide >/tmp/buildr-product-mvp-npm-bootstrap-guide.txt
grep -q 'buildr service create' /tmp/buildr-product-mvp-npm-bootstrap-guide.txt

section "npm: bootstrap contract"

node "$buildr" bootstrap guide >/tmp/buildr-product-mvp-bootstrap-guide.txt
grep -q 'Buildr Skill' /tmp/buildr-product-mvp-bootstrap-guide.txt
grep -q '兜底入口' /tmp/buildr-product-mvp-bootstrap-guide.txt
grep -q '优先使用 Buildr CLI' /tmp/buildr-product-mvp-bootstrap-guide.txt
grep -q 'buildr runtime list --json' /tmp/buildr-product-mvp-bootstrap-guide.txt
grep -q 'buildr doctor --agent <agent>' /tmp/buildr-product-mvp-bootstrap-guide.txt
grep -q '请联系 Buildr 作者反馈该 Agent' /tmp/buildr-product-mvp-bootstrap-guide.txt
grep -q 'buildr component list/check' /tmp/buildr-product-mvp-bootstrap-guide.txt
grep -q 'claude-code' /tmp/buildr-product-mvp-bootstrap-guide.txt

main_status_after="$(git -C "$main_worktree" status --porcelain=v1 --untracked-files=all)"
if [[ "$main_status_after" != "$main_status_before" ]]; then
  echo "candidate verification changed the main development worktree" >&2
  diff <(printf '%s\n' "$main_status_before") <(printf '%s\n' "$main_status_after") >&2 || true
  exit 1
fi
if grep -q 'bootstrap install-skill' /tmp/buildr-product-mvp-bootstrap-guide.txt; then
  echo "bootstrap guide mentioned bootstrap install-skill" >&2
  exit 1
fi
if grep -q 'buildr skills add' /tmp/buildr-product-mvp-bootstrap-guide.txt; then
  echo "bootstrap guide included Skills management detail" >&2
  exit 1
fi
if grep -q 'buildr runtime check claude-code' /tmp/buildr-product-mvp-bootstrap-guide.txt; then
  echo "bootstrap guide included runtime adapter detail" >&2
  exit 1
fi

section "Runtime conflict safeguards"

cat > "$tmp/skills/manifest.yml" <<'EOF'
skills:
  - id: buildr
    path: buildr
EOF
mkdir -p "$tmp/skills/buildr"
cat > "$tmp/skills/buildr/SKILL.md" <<'EOF'
---
name: buildr
---

Conflicting workspace skill.
EOF
if (cd "$tmp" && node "$buildr" skills render claude-code --scope . --target "$tmp" >/tmp/buildr-product-mvp-skill-conflict.txt 2>&1); then
  echo "conflicting Buildr skill unexpectedly rendered" >&2
  exit 1
fi
grep -q 'Skill id conflict: buildr' /tmp/buildr-product-mvp-skill-conflict.txt

echo "Buildr Product MVP verification passed."

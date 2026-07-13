section "Runtime discovery and help"

runtime_list_dir="$(mktemp -d)"
(cd "$runtime_list_dir" && node "$buildr" runtime list --json >/tmp/buildr-product-mvp-runtime-list.json)
python3 - <<'PY'
import json
result = json.load(open('/tmp/buildr-product-mvp-runtime-list.json'))
assert result['supportedAgents'] == ['claude-code', 'codex', 'cursor', 'qoder', 'trae', 'trae-work', 'workbuddy']
assert result['requiredRenderCapabilities'] == ['rules-entry', 'product-buildr-skill', 'workspace-project-skills', 'skill-install-plans', 'runtime-check']
assert result['unsupportedAgentGuidance']['mustNotUseFallbackAdapter'] is True
assert '请联系 Buildr 作者反馈该 Agent' in result['unsupportedAgentGuidance']['nextStep']
for agent in result['supportedAgents']:
    adapter = result['agents'][agent]
    assert set(result['requiredRenderCapabilities']) == set(adapter['renderCapabilities'])
    assert adapter['recommendedCommands']['doctor'].startswith(f'buildr doctor --agent {agent}')
assert result['agents']['codex']['renderCapabilities']['rules-entry']['mode'] == 'native'
assert result['agents']['codex']['renderCapabilities']['rules-entry']['writesFiles'] is False
for agent, projection in [('claude-code', 'rendered'), ('codex', 'native')]:
    rules = result['agents'][agent]['renderCapabilities']['rules-entry']
    assert rules['scopeSyntax'] == 'workspace-relative-path'
    assert rules['sourceDiscovery'] == {
        'pattern': '**/AGENTS.md',
        'mode': 'recursive-scope',
        'includesAncestors': True,
    }
    assert rules['projection']['mode'] == projection
assert result['agents']['claude-code']['renderCapabilities']['rules-entry']['projection']['targetPattern'] == '<source-dir>/CLAUDE.md'
PY
rm -rf "$runtime_list_dir"

assert_help_no_side_effects() {
  local expected="$1"
  shift
  local help_dir
  help_dir="$(mktemp -d)"
  (cd "$help_dir" && node "$buildr" "$@" --help >/tmp/buildr-product-mvp-help.txt)
  test -s /tmp/buildr-product-mvp-help.txt
  grep -q "$expected" /tmp/buildr-product-mvp-help.txt
  if find "$help_dir" -mindepth 1 -print -quit | grep -q .; then
    echo "help command wrote files: buildr $*" >&2
    exit 1
  fi
  rm -rf "$help_dir"
}

assert_help_no_side_effects 'Usage: buildr <command>'
assert_help_no_side_effects 'buildr init' init
assert_help_no_side_effects 'buildr project create' project create
assert_help_no_side_effects 'buildr service create' service create
assert_help_no_side_effects 'buildr doctor' doctor
assert_help_no_side_effects 'buildr runtime list' runtime list
assert_help_no_side_effects 'buildr runtime check' runtime check
assert_help_no_side_effects 'buildr sync' sync
assert_help_no_side_effects 'buildr render' render
assert_help_no_side_effects 'buildr skill install' skill install
assert_help_no_side_effects 'buildr skills add' skills add
assert_help_no_side_effects 'buildr skills remove' skills remove
assert_help_no_side_effects 'buildr skills render' skills render
assert_help_no_side_effects 'buildr commands add' commands add
assert_help_no_side_effects 'buildr commands remove' commands remove
assert_help_no_side_effects 'buildr commands check' commands check
assert_help_no_side_effects 'buildr component list' component list
assert_help_no_side_effects 'buildr component check' component check
assert_help_no_side_effects 'buildr component install' component install
assert_help_no_side_effects 'buildr component uninstall' component uninstall
assert_help_no_side_effects 'buildr builtin list' builtin list
assert_help_no_side_effects 'buildr builtin uninstall' builtin uninstall
assert_help_no_side_effects 'buildr builtin restore' builtin restore
assert_help_no_side_effects 'buildr update' update
assert_help_no_side_effects 'buildr update check' update check
assert_help_no_side_effects 'buildr package check' package check
assert_help_no_side_effects 'buildr package build' package build
assert_help_no_side_effects 'buildr bootstrap guide' bootstrap guide

node "$buildr" --help >/tmp/buildr-product-mvp-root-help.txt
grep -q 'Public workspace commands:' /tmp/buildr-product-mvp-root-help.txt
grep -q 'Product maintenance / workflow internals:' /tmp/buildr-product-mvp-root-help.txt
grep -q '表面分类说明用途与支持边界，不是权限或安全限制' /tmp/buildr-product-mvp-root-help.txt
grep -q 'package check/build' /tmp/buildr-product-mvp-root-help.txt
grep -q 'openspec baseline/check' /tmp/buildr-product-mvp-root-help.txt
node "$buildr" service create --help >/tmp/buildr-product-mvp-service-help.txt
grep -q 'Service 规则入口是 Service 目录中的 AGENTS.md' /tmp/buildr-product-mvp-service-help.txt
grep -q -- '--branch <branch>' /tmp/buildr-product-mvp-service-help.txt
if grep -q -- '--rules' /tmp/buildr-product-mvp-root-help.txt /tmp/buildr-product-mvp-service-help.txt; then
  echo "canonical help recommends legacy service create --rules" >&2
  exit 1
fi
node "$buildr" package build --help >/tmp/buildr-product-mvp-package-build-help.txt
grep -q '供 Buildr 产品维护者' /tmp/buildr-product-mvp-package-build-help.txt
node "$buildr" openspec check --help >/tmp/buildr-product-mvp-openspec-check-help.txt
grep -q '供 Buildr OpenSpec workflow' /tmp/buildr-product-mvp-openspec-check-help.txt
node "$buildr" skills add --help >/tmp/buildr-product-mvp-skills-add-help.txt
if grep -Eq 'package:(<[^>]+>|[A-Za-z0-9._-]+)' /tmp/buildr-product-mvp-skills-add-help.txt "$product_root/package/bootstrap/guide.md" "$product_root/package/targets/runtime/skills/buildr/SKILL.md"; then
  echo "public Skill authoring guidance exposes internal package source identity" >&2
  exit 1
fi
grep -q '内部 source identity' "$product_root/openspec/knowledge/buildr-current-state.md"
grep -q '内部 source identity' "$product_root/package/README.md"

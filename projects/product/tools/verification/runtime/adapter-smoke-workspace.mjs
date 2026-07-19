#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getRuntimeAdapter } from '../../runtime/adapter-contract.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const buildr = path.join(productRoot, 'tools', 'buildr');
const addedAdapters = new Set(['cursor', 'qoder', 'trae', 'trae-work', 'workbuddy']);
const [adapterId, targetArgument] = process.argv.slice(2);

if (!addedAdapters.has(adapterId) || !targetArgument) {
  console.error('Usage: node tools/verification/runtime/adapter-smoke-workspace.mjs <cursor|qoder|trae|trae-work|workbuddy> <empty-target-dir>');
  process.exit(2);
}

const target = path.resolve(targetArgument);
if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
  console.error(`Smoke target must be empty: ${target}`);
  process.exit(2);
}
fs.mkdirSync(target, { recursive: true });

function run(args) {
  const result = spawnSync(process.execPath, [buildr, ...args], { cwd: productRoot, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
  return result;
}

run(['init', '--target', target, '--name', `adapter-smoke-${adapterId}`, '--profile', 'personal']);
fs.appendFileSync(path.join(target, 'AGENTS.md'), '\nSMOKE_ROOT_RULE_7B41\n');
run(['project', 'create', 'smoke', '--target', target, '--description', 'Agent adapter smoke project']);

const active = path.join(target, 'projects', 'smoke', 'services', 'active');
const sibling = path.join(target, 'projects', 'smoke', 'services', 'sibling');
fs.mkdirSync(active, { recursive: true });
fs.mkdirSync(sibling, { recursive: true });
fs.writeFileSync(path.join(target, 'projects', 'smoke', 'AGENTS.md'), '# Smoke Project Rules\nSMOKE_PROJECT_RULE_2D93\n');
fs.writeFileSync(path.join(active, 'AGENTS.md'), '# Active Service Rules\nSMOKE_ACTIVE_RULE_A6F8\n');
fs.writeFileSync(path.join(sibling, 'AGENTS.md'), '# Sibling Service Rules\nSMOKE_SIBLING_MUST_NOT_APPEAR_C105\n');
fs.writeFileSync(path.join(active, 'probe.txt'), 'ACTIVE_FILE_MARKER_E824\n');
fs.writeFileSync(path.join(sibling, 'probe.txt'), 'SIBLING_FILE_MARKER_40DC\n');

const skillSource = path.join(target, '.smoke-source', 'adapter-smoke-skill');
fs.mkdirSync(skillSource, { recursive: true });
fs.writeFileSync(path.join(skillSource, 'SKILL.md'), `---\nname: adapter-smoke-skill\ndescription: Use when asked for the Buildr adapter smoke Skill marker.\n---\n\nReturn exactly SMOKE_SKILL_DISCOVERED_19AF.\n`);
run(['skills', 'add', 'adapter-smoke-skill', '--source', skillSource, '--target', target]);
const capabilitiesFile = path.join(target, 'projects', 'smoke', 'capabilities.yml');
const capabilities = fs.readFileSync(capabilitiesFile, 'utf8');
if (!capabilities.includes('skills: []')) throw new Error(`Unexpected Project capabilities template: ${capabilitiesFile}`);
fs.writeFileSync(capabilitiesFile, capabilities.replace('skills: []', 'skills:\n  - adapter-smoke-skill'));
run(['sync', adapterId, '--target', target]);

const adapter = getRuntimeAdapter(adapterId);
const rulesProfile = adapter.traits.rules.kind === 'reference-bridge' ? 'reference-bridge' : 'scoped-rule-files';
const prompt = `# Buildr Agent Adapter One-Shot Smoke\n\nRun one read-only marker check for ${adapterId} in this workspace. Do not search the whole workspace, inspect application storage, test reload behavior, or edit files.\n\n1. Record the exact Agent product version and surface.\n2. Read projects/smoke/services/active/probe.txt and report the SMOKE_*_RULE markers that actually apply. Do not open the sibling directory.\n3. Invoke the workspace Skill adapter-smoke-skill referenced by this Project context and report its exact result.\n\nReturn only JSON:\n\n{\n  "adapterId": "${adapterId}",\n  "version": null,\n  "surface": null,\n  "profile": "${rulesProfile}",\n  "rules": {\n    "root": "pass|fail|not_observed",\n    "project": "pass|fail|not_observed",\n    "active": "pass|fail|not_observed",\n    "siblingIsolated": "pass|fail|not_observed",\n    "observedMarkers": []\n  },\n  "skill": { "status": "pass|fail|not_observed", "result": null },\n  "evidence": [],\n  "blockingUnknowns": []\n}\n`;

fs.writeFileSync(path.join(target, 'SMOKE_PROMPT.md'), prompt);
fs.rmSync(path.join(target, '.smoke-source'), { recursive: true, force: true });

console.log(`Prepared ${adapterId} smoke workspace: ${target}`);
console.log(`When a real-product smoke is needed, open one new ${adapterId} conversation/task in that directory and paste SMOKE_PROMPT.md once.`);

#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const reportOnly = process.argv.includes('--report');
const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const entry = path.join(productRoot, 'tools', 'buildr');
const cliRoot = path.join(productRoot, 'tools', 'cli');
const problems = [];

const allowedTopLevelEntries = new Set([
  'buildr',
  'cli',
  'install-buildr-cli',
  'runtime',
  'shared',
  'uninstall-buildr-cli',
  'verification',
  'verify',
  'verify-buildr-product',
  'verify-buildr-product-affected',
  'verify-buildr-product-mvp',
]);
for (const entry of fs.readdirSync(path.join(productRoot, 'tools'))) {
  if (!allowedTopLevelEntries.has(entry)) problems.push(`unexpected top-level tools entry: tools/${entry}`);
}
for (const directory of ['runtime', 'shared', 'verification']) {
  if (!fs.statSync(path.join(productRoot, 'tools', directory), { throwIfNoEntry: false })?.isDirectory()) {
    problems.push(`missing tools responsibility directory: tools/${directory}`);
  }
}

function lineCount(file) {
  return fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/).length;
}

const entryContent = fs.readFileSync(entry, 'utf8');
const entryLines = entryContent.trimEnd().split(/\r?\n/);
if (entryLines.length > 20) problems.push(`tools/buildr must remain a thin executable (found ${entryLines.length} lines)`);
if (!entryContent.includes("from './cli/bootstrap.mjs'")) problems.push('tools/buildr must delegate to tools/cli/bootstrap.mjs');
if (/function\s+(?:doctor|packageCheck|createProject|skillsAdd|componentInstall)\b/.test(entryContent)) problems.push('tools/buildr contains domain implementation');

const required = [
  'bootstrap.mjs', 'command/registry.mjs', 'command/help.mjs',
  'application/compose-runtime.mjs', 'application/doctor.mjs', 'application/package-maintenance.mjs',
  'domains/workspace.mjs', 'domains/rules.mjs', 'domains/skills.mjs', 'domains/commands.mjs',
  'domains/components.mjs', 'domains/openspec.mjs', 'domains/runtime.mjs',
  'shared/platform.mjs', 'shared/infrastructure.mjs',
  'application/doctor/scope-diagnostics.mjs', 'application/doctor/service-diagnostics.mjs',
  'application/doctor/runtime-diagnostics.mjs',
  'application/package-maintenance/static-validation.mjs',
  'application/package-maintenance/smoke-checks.mjs', 'application/package-maintenance/output.mjs',
];
for (const relative of required) {
  if (!fs.existsSync(path.join(cliRoot, relative))) problems.push(`missing CLI runtime module: tools/cli/${relative}`);
}

if (fs.existsSync(cliRoot)) {
  const files = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.name.endsWith('.mjs')) files.push(absolute);
    }
  };
  visit(cliRoot);
  const rank = { shared: 0, domains: 1, application: 2, command: 3 };
  const graph = new Map();
  for (const file of files) {
    const relative = path.relative(cliRoot, file).split(path.sep).join('/');
    const content = fs.readFileSync(file, 'utf8');
    if (/import\s+\*\s+as\s+platform\b/.test(content) && relative !== 'application/compose-runtime.mjs') {
      problems.push(`wide platform namespace import: ${relative}`);
    }
    if (/const\s+(register[A-Za-z0-9_]+)\s*=\s*\(\.\.\.args\)\s*=>\s*runtime\.\1\(\.\.\.args\)/.test(content)) {
      problems.push(`unused self-registration forwarding wrapper: ${relative}`);
    }
    const sourceLayer = relative.split('/')[0];
    const imports = [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
    const edges = [];
    for (const specifier of imports.filter((item) => item.startsWith('.'))) {
      const target = path.resolve(path.dirname(file), specifier);
      if (!fs.existsSync(target)) problems.push(`${relative} imports missing module ${specifier}`);
      if (!target.startsWith(cliRoot + path.sep)) continue;
      const targetRelative = path.relative(cliRoot, target).split(path.sep).join('/');
      const targetLayer = targetRelative.split('/')[0];
      edges.push(targetRelative);
      if (rank[sourceLayer] !== undefined && rank[targetLayer] !== undefined && rank[targetLayer] > rank[sourceLayer]) {
        problems.push(`reverse layer import: ${relative} -> ${targetRelative}`);
      }
    }
    graph.set(relative, edges);
  }
  const visiting = new Set();
  const visited = new Set();
  const visitCycle = (file, stack = []) => {
    if (visiting.has(file)) problems.push(`CLI runtime import cycle: ${[...stack, file].join(' -> ')}`);
    if (visited.has(file) || visiting.has(file)) return;
    visiting.add(file);
    for (const next of graph.get(file) || []) visitCycle(next, [...stack, file]);
    visiting.delete(file);
    visited.add(file);
  };
  for (const file of graph.keys()) visitCycle(file);
}

const facadeLimits = new Map([
  ['tools/runtime/render-claude-code.mjs', 100],
  ['tools/cli/application/doctor.mjs', 250],
  ['tools/cli/application/package-maintenance.mjs', 550],
  ['tools/verify-buildr-product-affected', 100],
  ['tools/verify-buildr-product-mvp', 30],
]);
for (const [relative, limit] of facadeLimits) {
  const file = path.join(productRoot, relative);
  if (!fs.existsSync(file)) problems.push(`missing stable facade: ${relative}`);
  else if (lineCount(file) > limit) problems.push(`${relative} must remain a composition facade (found ${lineCount(file)} lines, limit ${limit})`);
}

const rendererModules = ['arguments.mjs', 'manifests.mjs', 'contributions.mjs', 'sources.mjs', 'render-plan.mjs'];
for (const module of rendererModules) {
  if (!fs.existsSync(path.join(productRoot, 'tools', 'runtime', 'skills', module))) problems.push(`missing runtime Skill renderer module: ${module}`);
}
const mvpScenarios = ['setup.sh', 'runtime-help.sh', 'workspace-project.sh', 'assets.sh', 'services-runtime.sh', 'reconciliation-package.sh'];
const mvpEntryContent = fs.readFileSync(path.join(productRoot, 'tools', 'verify-buildr-product-mvp'), 'utf8');
for (const scenario of mvpScenarios) {
  if (!fs.existsSync(path.join(productRoot, 'tools', 'verify', 'mvp', scenario))) problems.push(`missing MVP verifier scenario: ${scenario}`);
  if (!mvpEntryContent.includes(`source "$scenario_root/${scenario}"`)) problems.push(`MVP verifier entry does not compose scenario: ${scenario}`);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(productRoot, 'package.json'), 'utf8'));
if (!(packageJson.files || []).includes('tools/cli/')) problems.push('package.json files must publish tools/cli/');
if (!(packageJson.files || []).includes('tools/runtime/skills')) problems.push('package.json files must publish tools/runtime/skills');
if (packageJson.exports) problems.push('internal CLI modules must not be declared through package exports');

const registry = path.join(cliRoot, 'command', 'registry.mjs');
if (fs.existsSync(registry)) {
  const source = fs.readFileSync(registry, 'utf8');
  if (!source.includes('COMMAND_REGISTRY')) problems.push('command registry must expose one explicit COMMAND_REGISTRY');
  const keys = [...source.matchAll(/key:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  if (duplicates.length) problems.push(`duplicate command registry keys: ${[...new Set(duplicates)].join(', ')}`);
  const expectedKeys = [
    'init', 'bootstrap guide', 'package check', 'package build', 'project create', 'service create',
    'doctor', 'mutation recover', 'runtime list', 'commands check', 'commands add', 'commands remove',
    'openspec baseline create', 'openspec check', 'component list', 'component check', 'component install',
    'component uninstall', 'rules add', 'rules remove', 'builtin list', 'builtin uninstall', 'builtin restore',
    'update check', 'update', 'render', 'sync', 'skills add', 'skills remove', 'skill install',
    'runtime check', 'skills render', 'rules render',
  ];
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) problems.push('command registry keys differ from the supported CLI surface');
}

if (problems.length) {
  const heading = reportOnly ? 'CLI architecture gaps:' : 'CLI architecture verification failed:';
  console.error(heading);
  for (const problem of problems) console.error(`- ${problem}`);
  if (!reportOnly) process.exit(1);
} else {
  console.log('CLI architecture verification passed: thin entry, runtime inventory, one-way imports, command registry, and npm boundary.');
}

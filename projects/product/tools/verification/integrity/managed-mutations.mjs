#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const packageManifest = JSON.parse(fs.readFileSync(path.join(productRoot, 'package.json'), 'utf8'));
const productionFiles = [];
for (const entry of packageManifest.files.filter((file) => file.startsWith('tools/'))) {
  if (entry.startsWith('tools/verification/')) continue;
  const absolute = path.join(productRoot, entry);
  if (!fs.existsSync(absolute)) continue;
  if (fs.statSync(absolute).isFile()) {
    if (!path.basename(entry).startsWith('verify-')) productionFiles.push(entry);
    continue;
  }
  const visit = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const child = path.join(dir, item.name);
      if (item.isDirectory()) visit(child);
      else if (!item.name.startsWith('verify-') && item.name.endsWith('.mjs')) {
        productionFiles.push(path.relative(productRoot, child).split(path.sep).join('/'));
      }
    }
  };
  visit(absolute);
}
productionFiles.sort();
const allowed = new Map([
  ['tools/cli/shared/infrastructure.mjs', new Set([
    'atomicWriteFile', 'snapshotMutationPath', 'restoreMutationSnapshot', 'withWorkspaceMutation',
  ])],
  ['tools/cli/domains/workspace.mjs', new Set(['createProject', 'createService'])],
  ['tools/cli/domains/rules.mjs', new Set(['rulesRemoveUnsafe'])],
  ['tools/cli/domains/skills.mjs', new Set(['copySupportedSkillSource', 'skillsRemoveUnsafe'])],
  ['tools/cli/domains/components.mjs', new Set(['removeComponentMember', 'installComponentMember'])],
  ['tools/cli/domains/package-assets.mjs', new Set(['convergeServiceManifest', 'convergeRegistryManifests'])],
  ['tools/cli/application/package-maintenance.mjs', new Set([
    'syncPackageBuiltins', 'builtinUninstallUnsafe',
  ])],
  ['tools/cli/application/package-maintenance/output.mjs', new Set(['buildPackageOutput', 'packageBuild'])],
  ['tools/cli/application/package-maintenance/smoke-checks.mjs', new Set([
    'verifyRecursiveRules', 'verifyWorkspaceAssetLifecycle', 'verifyInitializedWorkspace',
    'verifyExistingAgentsCompatibility', 'runPackageSmokeChecks',
  ])],
  ['tools/cli/application/workspace-operations.mjs', new Set(['mutationRecover'])],
  ['tools/runtime/adapter-contract.mjs', new Set(['reconcileRuntimePlan'])],
  ['tools/runtime/skills/render-plan.mjs', new Set(['applySkillRenderPlan'])],
  ['tools/runtime/render-claude-code-rules.mjs', new Set(['applyRulesRenderPlan'])],
]);

const violations = [];
for (const relativeFile of productionFiles) {
  const lines = fs.readFileSync(path.join(productRoot, relativeFile), 'utf8').split(/\r?\n/);
  let currentFunction = '<top-level>';
  for (const [index, line] of lines.entries()) {
    const declaration = line.match(/^\s*(?:export\s+)?function\s+([A-Za-z0-9_]+)/);
    if (declaration) currentFunction = declaration[1];
    if (!/fs\.(?:rmSync|writeFileSync|appendFileSync|copyFileSync|cpSync|renameSync)\s*\(/.test(line)) continue;
    if (!allowed.get(relativeFile)?.has(currentFunction)) violations.push(`${relativeFile}:${index + 1}: direct mutation in ${currentFunction}`);
  }
}

if (violations.length) {
  console.error('Managed mutation verification failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

const allowedFunctionCount = [...allowed.values()].reduce((count, functions) => count + functions.size, 0);
console.log(`Managed mutation verification passed. Reviewed ${productionFiles.length} production files and ${allowedFunctionCount} explicit mutation functions.`);

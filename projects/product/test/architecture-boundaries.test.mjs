import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function lines(relative) {
  return fs.readFileSync(path.join(productRoot, relative), 'utf8').trimEnd().split(/\r?\n/);
}

test('兼容 facade 保持薄入口', () => {
  assert.ok(lines('tools/runtime/render-claude-code.mjs').length <= 100);
  assert.ok(lines('tools/cli/application/doctor.mjs').length <= 250);
  assert.ok(lines('tools/cli/application/package-maintenance.mjs').length <= 550);
  assert.ok(lines('tools/verify-buildr-product-affected').length <= 100);
});

test('package verification 使用稳定 registry 且不恢复共享 smoke runner', () => {
  const application = fs.readFileSync(path.join(productRoot, 'tools/cli/application/package-maintenance.mjs'), 'utf8');
  const smoke = fs.readFileSync(path.join(productRoot, 'tools/cli/application/package-maintenance/smoke-checks.mjs'), 'utf8');
  const registry = fs.readFileSync(path.join(productRoot, 'tools/cli/application/package-maintenance/verification-registry.mjs'), 'utf8');
  assert.match(application, /selectPackageVerifiers/);
  assert.doesNotMatch(smoke, /runPackageSmokeChecks/);
  for (const selector of ['static', 'workspace', 'commands', 'rules', 'skills', 'runtime']) {
    assert.match(registry, new RegExp(`id: '${selector}'`));
  }
});

test('CLI platform namespace 只允许 composition root 聚合', () => {
  const cliRoot = path.join(productRoot, 'tools', 'cli');
  const violations = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith('.mjs') && /import \* as platform/.test(fs.readFileSync(file, 'utf8'))) {
        const relative = path.relative(productRoot, file).split(path.sep).join('/');
        if (relative !== 'tools/cli/application/compose-runtime.mjs') violations.push(relative);
      }
    }
  };
  visit(cliRoot);
  assert.deepEqual(violations, []);
});

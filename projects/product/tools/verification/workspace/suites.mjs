import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));

export const workspaceSuites = Object.freeze([
  Object.freeze({ id: 'workspace-lifecycle', name: 'Workspace E2E: workspace lifecycle', file: path.join(directory, 'workspace-lifecycle.mjs'), budgetMs: 20000 }),
  Object.freeze({ id: 'ownership-recovery', name: 'Workspace E2E: ownership recovery', file: path.join(directory, 'ownership-recovery.mjs'), budgetMs: 20000 }),
  Object.freeze({ id: 'runtime-reconciliation', name: 'Workspace E2E: runtime reconciliation', file: path.join(directory, 'runtime-reconciliation.mjs'), budgetMs: 30000 }),
]);

export function selectWorkspaceSuites(selectors = []) {
  if (selectors.length === 0) return [...workspaceSuites];
  const byId = new Map(workspaceSuites.map((suite) => [suite.id, suite]));
  const selected = [];
  const seen = new Set();
  for (const selector of selectors) {
    const suite = byId.get(selector);
    if (!suite) throw new Error(`Unknown Workspace E2E suite: ${selector}`);
    if (!seen.has(selector)) selected.push(suite);
    seen.add(selector);
  }
  return selected;
}

export function workspaceSuiteSteps(options = {}) {
  const productRoot = options.productRoot ?? path.resolve(directory, '../../..');
  const env = options.env ?? process.env;
  return workspaceSuites.map((suite) => ({
    name: suite.name,
    command: process.execPath,
    args: [suite.file],
    cwd: productRoot,
    env,
    budgetMs: suite.budgetMs,
  }));
}

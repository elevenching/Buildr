import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { verificationSteps } from '../registry.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));

export const workspaceSuites = Object.freeze(verificationSteps
  .filter((step) => step.executor.type === 'workspace-suite')
  .map((step) => Object.freeze({
    id: step.executor.selector,
    name: step.name,
    file: path.join(directory, `${step.executor.selector}.mjs`),
    budgetMs: step.budgetMs,
  })));

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

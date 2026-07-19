export const CANDIDATE_TOTAL_BUDGET_MS = 120000;

export const CANDIDATE_STEP_BUDGETS_MS = Object.freeze({
  'capability CLI integration': 30000,
  'runtime adapter parity': 30000,
  'package check': 25000,
  'OpenSpec contract fixtures': 20000,
  'managed data integrity': 15000,
  'CLI compatibility': 15000,
  'repository onboarding from a clean checkout': 15000,
  'runtime adapter smoke workspace generator': 10000,
  'CLI package parity': 10000,
  'release tarball smoke': 10000,
});

export function candidateStepBudget(name) {
  return CANDIDATE_STEP_BUDGETS_MS[name];
}

export function budgetStatus(durationMs, budgetMs) {
  return durationMs <= budgetMs ? 'within' : 'over';
}

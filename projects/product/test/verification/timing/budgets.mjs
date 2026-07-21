import { verificationSteps } from '../registry.mjs';

export const CANDIDATE_TOTAL_BUDGET_MS = 120000;

export const CANDIDATE_STEP_BUDGETS_MS = Object.freeze(Object.fromEntries(
  verificationSteps
    .filter((step) => step.profiles.includes('candidate') && step.budgetMs != null)
    .map((step) => [step.name, step.budgetMs]),
));

export function candidateStepBudget(name) {
  return CANDIDATE_STEP_BUDGETS_MS[name];
}

export function budgetStatus(durationMs, budgetMs) {
  return durationMs <= budgetMs ? 'within' : 'over';
}

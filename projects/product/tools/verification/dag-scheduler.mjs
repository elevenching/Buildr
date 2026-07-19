import { VERIFICATION_CONCURRENCY } from './registry.mjs';

function failedDependency(step, results) {
  return (step.dependsOn ?? []).find((id) => results.has(id) && results.get(id).status !== 'passed');
}

function dependenciesPassed(step, results) {
  return (step.dependsOn ?? []).every((id) => results.get(id)?.status === 'passed');
}

export async function runVerificationDag(plan, options = {}) {
  const execute = options.execute;
  if (typeof execute !== 'function') throw new Error('runVerificationDag requires an execute function');
  const limits = options.concurrency ?? VERIFICATION_CONCURRENCY;
  const pending = new Map(plan.steps.map((step) => [step.id, step]));
  const active = new Map();
  const activeByClass = new Map();
  const results = new Map();

  const capacityAvailable = (step) => {
    if (active.size >= limits.global) return false;
    const classLimit = limits.classes[step.concurrencyClass];
    if (!Number.isInteger(classLimit) || classLimit < 1) throw new Error(`Invalid concurrency limit for ${step.concurrencyClass}`);
    if ((activeByClass.get(step.concurrencyClass) ?? 0) >= classLimit) return false;
    const exclusiveRunning = [...active.values()].some((item) => item.step.concurrencyClass === 'exclusive');
    if (exclusiveRunning) return false;
    if (step.concurrencyClass === 'exclusive' && active.size > 0) return false;
    return true;
  };

  const launch = (step) => {
    pending.delete(step.id);
    activeByClass.set(step.concurrencyClass, (activeByClass.get(step.concurrencyClass) ?? 0) + 1);
    options.onStart?.(step);
    const promise = Promise.resolve().then(() => execute(step)).then((result) => ({
      id: step.id,
      name: step.name,
      ...result,
    }), (error) => ({
      id: step.id,
      name: step.name,
      status: 'failed',
      exitCode: 1,
      durationMs: 0,
      stdout: '',
      stderr: `${error.stack || error.message}\n`,
    })).then((result) => {
      active.delete(step.id);
      activeByClass.set(step.concurrencyClass, activeByClass.get(step.concurrencyClass) - 1);
      results.set(step.id, result);
      options.onComplete?.(result, step);
      return result;
    });
    active.set(step.id, { step, promise });
  };

  while (pending.size > 0 || active.size > 0) {
    let progressed = false;
    for (const step of [...pending.values()]) {
      const blockedBy = failedDependency(step, results);
      if (!blockedBy) continue;
      pending.delete(step.id);
      const result = {
        id: step.id,
        name: step.name,
        status: 'blocked',
        exitCode: null,
        durationMs: 0,
        stdout: '',
        stderr: '',
        blockedBy,
        reason: `dependency ${blockedBy} did not pass`,
      };
      results.set(step.id, result);
      options.onComplete?.(result, step);
      progressed = true;
    }
    for (const step of [...pending.values()]) {
      if (!dependenciesPassed(step, results) || !capacityAvailable(step)) continue;
      launch(step);
      progressed = true;
      if (step.concurrencyClass === 'exclusive') break;
    }
    if (active.size > 0) {
      await Promise.race([...active.values()].map((item) => item.promise));
      continue;
    }
    if (pending.size > 0 && !progressed) throw new Error(`Verification DAG stalled: ${[...pending.keys()].join(', ')}`);
  }

  return plan.steps.map((step) => results.get(step.id));
}

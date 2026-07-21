import os from 'node:os';
import path from 'node:path';
import { runVerificationDag } from './dag-scheduler.mjs';
import { createVerificationExecutor } from './executor.mjs';

export function printPlan(plan, stream = process.stdout) {
  stream.write(`Verification plan: ${plan.steps.length} step(s)\n`);
  if (plan.paths.length > 0) {
    stream.write('Changed paths:\n');
    for (const item of plan.paths) stream.write(`  ${item}\n`);
  }
  for (const step of plan.steps) {
    stream.write(`\n${step.id} — ${step.name}\n`);
    for (const reason of step.reasons) stream.write(`  selected: ${reason}\n`);
    if (step.dependsOn.length > 0) stream.write(`  depends: ${step.dependsOn.join(', ')}\n`);
  }
}

export async function executePlan(plan, options) {
  const prefix = options.prefix ?? 'verify';
  const diagnosticsDirectory = options.diagnosticsDirectory ?? path.join(os.tmpdir(), 'buildr-verification-diagnostics');
  const artifactDirectory = options.artifactDirectory ?? path.join(os.tmpdir(), 'buildr-verification-candidate-package');
  const execute = createVerificationExecutor({ ...options, diagnosticsDirectory, artifactDirectory });
  const results = await runVerificationDag(plan, {
    execute,
    concurrency: options.concurrency,
    schedulingMode: options.schedulingMode,
    onStart: (step) => {
      options.stream?.write(`\n[${prefix}] ${step.id}: ${step.name}\n`);
      options.onStart?.(step);
    },
    onComplete: (result, step) => options.onComplete?.(result, step),
  });
  for (const result of results) {
    if (result.stdout) options.stream?.write(result.stdout);
    if (result.stderr) options.errorStream?.write(result.stderr);
    options.stream?.write(`[${prefix}] ${result.status}: ${result.id} (${result.durationMs} ms)\n`);
    if (result.status === 'blocked') options.stream?.write(`  ${result.reason}\n`);
  }
  return { results, diagnosticsDirectory, artifactDirectory, passed: results.every((result) => result.status === 'passed') };
}

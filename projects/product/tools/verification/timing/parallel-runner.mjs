import process from 'node:process';
import { spawn } from 'node:child_process';

export async function runVerificationStep(step) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (exitCode, error = null) => {
      if (settled) return;
      settled = true;
      if (error) stderr += `${error.message}\n`;
      resolve({
        name: step.name,
        status: exitCode === 0 ? 'passed' : 'failed',
        exitCode,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
      });
    };
    const child = spawn(step.command, step.args ?? [], {
      cwd: step.cwd,
      env: step.env ?? process.env,
      shell: step.shell ?? false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => finish(1, error));
    child.on('close', (code, signal) => {
      if (signal) stderr += `terminated by signal ${signal}\n`;
      finish(Number.isInteger(code) ? code : 1);
    });
  });
}

export async function runVerificationBatch(steps, options = {}) {
  for (const step of steps) options.onStart?.(step);
  const results = await Promise.all(steps.map((step) => runVerificationStep(step)));
  for (let index = 0; index < results.length; index += 1) options.onComplete?.(results[index], steps[index]);
  return results;
}

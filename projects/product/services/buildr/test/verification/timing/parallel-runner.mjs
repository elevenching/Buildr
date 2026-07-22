import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

function diagnosticBaseName(step) {
  return String(step.diagnosticId ?? step.name ?? 'verification-step')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'verification-step';
}

export function writeVerificationDiagnostics(step, stdout, stderr) {
  if (!step.diagnosticsDirectory) return {};
  const directory = path.resolve(step.diagnosticsDirectory);
  fs.mkdirSync(directory, { recursive: true });
  const base = diagnosticBaseName(step);
  const stdoutPath = path.join(directory, `${base}.stdout.log`);
  const stderrPath = path.join(directory, `${base}.stderr.log`);
  fs.writeFileSync(stdoutPath, stdout || '', 'utf8');
  fs.writeFileSync(stderrPath, stderr || '', 'utf8');
  return { stdoutPath, stderrPath };
}

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
      const durationMs = Date.now() - startedAt;
      const budgetMs = Number.isFinite(step.budgetMs) ? step.budgetMs : undefined;
      const diagnosticPaths = writeVerificationDiagnostics(step, stdout, stderr);
      resolve({
        name: step.name,
        status: exitCode === 0 ? 'passed' : 'failed',
        exitCode,
        durationMs,
        stdout,
        stderr,
        ...diagnosticPaths,
        ...(budgetMs === undefined ? {} : { budgetMs, budgetStatus: durationMs <= budgetMs ? 'within' : 'over' }),
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

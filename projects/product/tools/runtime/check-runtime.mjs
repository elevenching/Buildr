import path from 'node:path';
import process from 'node:process';
import { getRuntimeAdapter } from './adapter-contract.mjs';
import { checkRuntimeProjection, printRuntimeProjectionReport } from './projection.mjs';
import { parseRenderClaudeCodeArgs } from './render-claude-code.mjs';

export function checkRuntimeAdapter(argv, options = {}) {
  const adapterId = options.adapterId;
  const adapter = getRuntimeAdapter(adapterId);
  const repoRoot = options.repoRoot ?? process.cwd();
  const args = parseRenderClaudeCodeArgs(argv, options.command ?? `buildr runtime check ${adapter.id}`);
  const result = checkRuntimeProjection({ repoRoot, targetRoot: path.resolve(repoRoot, args.target), scope: args.scope, adapterId: adapter.id });
  return {
    ...result,
    environmentChecks: {
      installation: { status: 'not-checked', probe: adapter.traits.checker.installationProbe.kind },
      version: { status: 'not-checked', probe: adapter.traits.checker.versionProbe.kind },
    },
    activation: adapter.traits.activation,
  };
}

export function printRuntimeAdapterCheckReport(result) {
  printRuntimeProjectionReport(result, getRuntimeAdapter(result.adapterId).displayName);
}

export const RUNTIME_CHECKERS = Object.freeze({ projection: checkRuntimeAdapter });
export const RUNTIME_CHECK_PRINTERS = Object.freeze({ projection: printRuntimeAdapterCheckReport });

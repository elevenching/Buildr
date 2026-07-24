#!/usr/bin/env node

import process from 'node:process';
import { checkRuntimeAdapter, printRuntimeAdapterCheckReport } from './check-runtime.mjs';
import { repairCommands } from './projection.mjs';

export function codexRepairCommands(result) { return repairCommands(result, 'codex'); }
export function printCodexRuntimeCheckReport(result) { printRuntimeAdapterCheckReport(result); }

export function checkCodexRuntime(argv, options = {}) {
  return checkRuntimeAdapter(argv, { ...options, adapterId: 'codex', command: options.command ?? 'buildr runtime check codex' });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = checkCodexRuntime(process.argv.slice(2), { command: 'node src/infrastructure/runtime/check-codex.mjs' });
    printCodexRuntimeCheckReport(result);
    process.exit(result.exitCode);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}

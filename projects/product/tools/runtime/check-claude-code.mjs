#!/usr/bin/env node

import process from 'node:process';
import { checkRuntimeAdapter, printRuntimeAdapterCheckReport } from './check-runtime.mjs';
import { repairCommands } from './projection.mjs';

export function claudeCodeRepairCommands(result) { return repairCommands(result, 'claude-code'); }
export function printRuntimeCheckReport(result) { printRuntimeAdapterCheckReport(result); }

export function checkClaudeCodeRuntime(argv, options = {}) {
  return checkRuntimeAdapter(argv, { ...options, adapterId: 'claude-code', command: options.command ?? 'buildr runtime check claude-code' });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = checkClaudeCodeRuntime(process.argv.slice(2), { command: 'node tools/runtime/check-claude-code.mjs' });
    printRuntimeCheckReport(result);
    process.exit(result.exitCode);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}

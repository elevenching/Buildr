#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { parseRenderClaudeCodeArgs } from './render-claude-code.mjs';
import { checkRuntimeProjection, printRuntimeProjectionReport, repairCommands } from './projection.mjs';

export function codexRepairCommands(result) { return repairCommands(result, 'codex'); }
export function printCodexRuntimeCheckReport(result) { printRuntimeProjectionReport(result, 'Codex'); }

export function checkCodexRuntime(argv, options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const args = parseRenderClaudeCodeArgs(argv, options.command ?? 'buildr runtime check codex');
  return checkRuntimeProjection({ repoRoot, targetRoot: path.resolve(repoRoot, args.target), scope: args.scope, adapterId: 'codex' });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = checkCodexRuntime(process.argv.slice(2), { command: 'node tools/runtime/check-codex.mjs' });
    printCodexRuntimeCheckReport(result);
    process.exit(result.exitCode);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}

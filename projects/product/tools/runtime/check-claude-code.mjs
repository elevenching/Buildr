#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { parseRenderClaudeCodeArgs } from './render-claude-code.mjs';
import { checkRuntimeProjection, printRuntimeProjectionReport, repairCommands } from './projection.mjs';

export function claudeCodeRepairCommands(result) { return repairCommands(result, 'claude-code'); }
export function printRuntimeCheckReport(result) { printRuntimeProjectionReport(result, 'Claude Code'); }

export function checkClaudeCodeRuntime(argv, options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const args = parseRenderClaudeCodeArgs(argv, options.command ?? 'buildr runtime check claude-code');
  return checkRuntimeProjection({ repoRoot, targetRoot: path.resolve(repoRoot, args.target), scope: args.scope, adapterId: 'claude-code' });
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

import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import YAML from 'yaml';
import { checkClaudeCodeRuntime, printRuntimeCheckReport } from '../../runtime/check-claude-code.mjs';
import { hasManagedSkillMarker, parseInstallClaudeCodeBuildrSkillArgs } from '../../runtime/render-claude-code.mjs';
import { buildRuleDiscoveryPlan, hasManagedRulesMarker, renderClaudeCodeRules, resolveRuleScope } from '../../runtime/render-claude-code-rules.mjs';
import { checkCodexRuntime, printCodexRuntimeCheckReport } from '../../runtime/check-codex.mjs';
import { assembleRuntimeProjection } from '../../runtime/projection.mjs';
import {
  RUNTIME_ADAPTERS,
  SUPPORTED_AGENT_IDS,
  UNSUPPORTED_AGENT_GUIDANCE,
  getRuntimeAdapter,
  isSupportedAgent,
  reconcileRuntimePlan,
  runtimeDiscoveryPayload,
} from '../../runtime/adapter-contract.mjs';

const PACKAGE_WORKSPACE_TARGET = 'package/targets/workspace';
const PACKAGE_RUNTIME_TARGET = 'package/targets/runtime';
const PACKAGE_BOOTSTRAP_CONTRACT = 'package/bootstrap/contract.yml';
const LEGACY_PACKAGE_PATHS = [
  'package/workspace',
  'package/agent-skills',
  'package/bootstrap/bootstrap.contract.yml',
];
const OPENSPEC_CONTRACT_BASELINE_SCHEMA = 'buildr.openspec-contract-baseline/v1';
const OPENSPEC_CONTRACT_RECEIPT_SCHEMA = 'buildr.openspec-contract-receipt/v1';
const OPENSPEC_CONTRACT_SUPPORTED_UPSTREAM_VERSIONS = new Set(['1.4.1']);
const RUNTIME_CHECKERS = { 'claude-code': checkClaudeCodeRuntime, codex: checkCodexRuntime };
const RUNTIME_CHECK_PRINTERS = { 'claude-code': printRuntimeCheckReport, codex: printCodexRuntimeCheckReport };
const BUILDR_REQUIRED_BLOCK_START = '<!-- buildr:required begin -->';

export {
  fs, crypto, os, path, process, fileURLToPath, execFileSync, spawnSync, YAML,
  checkClaudeCodeRuntime, printRuntimeCheckReport,
  hasManagedSkillMarker, parseInstallClaudeCodeBuildrSkillArgs,
  buildRuleDiscoveryPlan, hasManagedRulesMarker, renderClaudeCodeRules, resolveRuleScope,
  checkCodexRuntime, printCodexRuntimeCheckReport, assembleRuntimeProjection,
  RUNTIME_ADAPTERS, SUPPORTED_AGENT_IDS, UNSUPPORTED_AGENT_GUIDANCE,
  getRuntimeAdapter, isSupportedAgent, reconcileRuntimePlan, runtimeDiscoveryPayload,
  PACKAGE_WORKSPACE_TARGET, PACKAGE_RUNTIME_TARGET, PACKAGE_BOOTSTRAP_CONTRACT,
  LEGACY_PACKAGE_PATHS, OPENSPEC_CONTRACT_BASELINE_SCHEMA,
  OPENSPEC_CONTRACT_RECEIPT_SCHEMA, OPENSPEC_CONTRACT_SUPPORTED_UPSTREAM_VERSIONS,
  RUNTIME_CHECKERS, RUNTIME_CHECK_PRINTERS,
  BUILDR_REQUIRED_BLOCK_START,
};

#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const generator = path.join(productRoot, 'tools', 'verification', 'runtime', 'adapter-smoke-workspace.mjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-adapter-smoke-generator-'));

try {
  for (const adapterId of ['cursor', 'workbuddy']) {
    const target = path.join(root, adapterId);
    const result = spawnSync(process.execPath, [generator, adapterId, target], { cwd: productRoot, encoding: 'utf8' });
    assert.equal(result.status, 0, `${adapterId}: ${result.stdout}\n${result.stderr}`);
    const prompt = fs.readFileSync(path.join(target, 'SMOKE_PROMPT.md'), 'utf8');
    assert.ok(fs.readFileSync(path.join(target, 'AGENTS.md'), 'utf8').includes('SMOKE_ROOT_RULE_7B41'));
    assert.ok(fs.readFileSync(path.join(target, 'projects/smoke/AGENTS.md'), 'utf8').includes('SMOKE_PROJECT_RULE_2D93'));
    assert.ok(fs.readFileSync(path.join(target, 'projects/smoke/services/active/AGENTS.md'), 'utf8').includes('SMOKE_ACTIVE_RULE_A6F8'));
    assert.ok(fs.readFileSync(path.join(target, 'projects/smoke/services/sibling/AGENTS.md'), 'utf8').includes('SMOKE_SIBLING_MUST_NOT_APPEAR_C105'));
    assert.match(prompt, /One-Shot Smoke/);
    assert.doesNotMatch(prompt, /required explicit reload|required a new conversation\/task/i);
    assert.match(prompt, new RegExp(`"profile": "${['trae-work', 'workbuddy'].includes(adapterId) ? 'reference-bridge' : 'scoped-rule-files'}"`));
    const skillRoot = ['cursor', 'trae'].includes(adapterId) ? '.agents' : adapterId === 'qoder' ? '.qoder' : adapterId === 'workbuddy' ? '.codebuddy' : '.trae';
    assert.ok(fs.readFileSync(path.join(target, skillRoot, 'skills', 'adapter-smoke-skill', 'SKILL.md'), 'utf8').includes('SMOKE_SKILL_DISCOVERED_19AF'));
  }
  console.log('adapter smoke workspace generator verification passed');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

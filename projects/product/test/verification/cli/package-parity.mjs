#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readSharedCandidatePackage } from '../release/candidate-package.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const checkoutCli = path.join(productRoot, 'bin', 'buildr.mjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-cli-parity-'));

function spawn(command, args, options = {}) {
  return spawnSync(command, args, { cwd: options.cwd || productRoot, encoding: 'utf8', env: process.env });
}

function runCheckout(args) {
  return spawn(process.execPath, [checkoutCli, ...args]);
}

function snapshot(directory) {
  const result = {};
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else result[path.relative(directory, absolute).split(path.sep).join('/')] = fs.readFileSync(absolute, 'utf8');
    }
  };
  visit(directory);
  return result;
}

function normalizeWorkspaceSnapshot(value) {
  const workspaceId = value['.buildr/workspace.yml']?.match(/^id:\s*([0-9a-f-]{36})$/m)?.[1];
  const skillsWorkspaceId = value['skills/manifest.yml']?.match(/^workspaceId:\s*([0-9a-f-]{36})$/m)?.[1];
  assert.ok(workspaceId, 'Workspace metadata must contain a UUID');
  assert.equal(skillsWorkspaceId, workspaceId, 'Workspace and Skills manifests must share one UUID');
  const projectIds = [...(value['projects/manifest.yml'] || '').matchAll(/^    id:\s*([0-9a-f-]{36})$/gm)].map((match) => match[1]);
  return Object.fromEntries(Object.entries(value).map(([file, content]) => {
    let normalized = content.replaceAll(workspaceId, '<workspace-id>');
    projectIds.forEach((projectId, index) => { normalized = normalized.replaceAll(projectId, `<project-id-${index + 1}>`); });
    return [file, normalized];
  }));
}

try {
  const packDir = path.join(root, 'pack');
  const prefix = path.join(root, 'prefix');
  fs.mkdirSync(packDir, { recursive: true });
  const shared = readSharedCandidatePackage();
  let tarball = shared?.tarball;
  if (!tarball) {
    const packed = spawn('npm', ['pack', '--json', '--pack-destination', packDir]);
    assert.equal(packed.status, 0, packed.stderr);
    tarball = path.join(packDir, JSON.parse(packed.stdout)[0].filename);
  }
  const installed = spawn('npm', ['install', '--prefix', prefix, tarball]);
  assert.equal(installed.status, 0, installed.stderr);
  const packagedCli = path.join(prefix, 'node_modules', '.bin', 'buildr');
  for (const relative of ['index.html', 'styles.css', 'app.js']) {
    assert.ok(fs.existsSync(path.join(prefix, 'node_modules', '@buildr-ai', 'buildr', 'src', 'interfaces', 'local-app', 'web', relative)), `packaged local app asset is missing: ${relative}`);
  }

  const runPackaged = (args) => spawn(packagedCli, args);
  for (const args of [
    [], ['--version'], ['-V'], ['version'], ['version', '--json'],
    ['help', 'doctor'], ['help', 'app'], ['help', 'init'], ['service', 'create'], ['doctr'], ['doctr', '--json'],
    ['runtime', 'list', '--json'],
  ]) {
    const checkout = runCheckout(args);
    const packaged = runPackaged(args);
    assert.equal(packaged.status, checkout.status, `exit status differs: ${args.join(' ')}`);
    assert.equal(packaged.stdout, checkout.stdout, `stdout differs: ${args.join(' ')}`);
    assert.equal(packaged.stderr, checkout.stderr, `stderr differs: ${args.join(' ')}`);
  }

  const checkoutWorkspace = path.join(root, 'checkout-workspace');
  const packagedWorkspace = path.join(root, 'packaged-workspace');
  for (const [runner, workspace] of [[runCheckout, checkoutWorkspace], [runPackaged, packagedWorkspace]]) {
    let result = runner(['init', '--agent', 'codex', '--target', workspace, '--name', 'parity', '--profile', 'team']);
    assert.equal(result.status, 0, result.stderr);
    result = runner(['project', 'create', 'demo', '--target', workspace]);
    assert.equal(result.status, 0, result.stderr);
  }
  assert.deepEqual(normalizeWorkspaceSnapshot(snapshot(packagedWorkspace)), normalizeWorkspaceSnapshot(snapshot(checkoutWorkspace)));

  console.log('CLI package parity verification passed: help, failures, JSON discovery, and workspace mutations match checkout and npm tarball entrypoints.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

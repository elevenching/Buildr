#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const productRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const checkoutCli = path.join(productRoot, 'tools', 'buildr');
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

try {
  const packDir = path.join(root, 'pack');
  const prefix = path.join(root, 'prefix');
  fs.mkdirSync(packDir, { recursive: true });
  const packed = spawn('npm', ['pack', '--json', '--pack-destination', packDir]);
  assert.equal(packed.status, 0, packed.stderr);
  const tarball = path.join(packDir, JSON.parse(packed.stdout)[0].filename);
  const installed = spawn('npm', ['install', '--prefix', prefix, tarball]);
  assert.equal(installed.status, 0, installed.stderr);
  const packagedCli = path.join(prefix, 'node_modules', '.bin', 'buildr');

  const runPackaged = (args) => spawn(packagedCli, args);
  for (const args of [[], ['service', 'create'], ['runtime', 'list', '--json']]) {
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
  assert.deepEqual(snapshot(packagedWorkspace), snapshot(checkoutWorkspace));

  console.log('CLI package parity verification passed: help, failures, JSON discovery, and workspace mutations match checkout and npm tarball entrypoints.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

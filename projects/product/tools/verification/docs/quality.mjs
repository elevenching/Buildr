#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const explicit = process.env.BUILDR_CHANGED_PATHS_JSON ? JSON.parse(process.env.BUILDR_CHANGED_PATHS_JSON) : [];
const files = [];

function visit(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      if (['node_modules', '.git', 'archive'].includes(entry.name)) continue;
      visit(path.join(target, entry.name));
    }
  } else if (/\.(?:md|html)$/.test(target)) files.push(target);
}

if (explicit.length > 0) for (const relative of explicit) visit(path.join(productRoot, relative));
else for (const entry of ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md', 'docs', 'package/README.md', 'openspec']) visit(path.join(productRoot, entry));

const problems = [];
for (const file of [...new Set(files)].sort()) {
  const relative = path.relative(productRoot, file).split(path.sep).join('/');
  const content = fs.readFileSync(file, 'utf8');
  content.split(/\r?\n/).forEach((line, index) => {
    if (/[ \t]+$/.test(line)) problems.push(`${relative}:${index + 1}: trailing whitespace`);
  });
  if (file.endsWith('.md')) {
    for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      let target = match[1].trim().replace(/^<|>$/g, '');
      if (!target || /^(?:https?:|mailto:|#)/.test(target)) continue;
      target = target.split('#')[0].split('?')[0];
      if (!target) continue;
      const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
      if (!resolved.startsWith(`${productRoot}${path.sep}`) && resolved !== productRoot) problems.push(`${relative}: link escapes Product root: ${match[1]}`);
      else if (!fs.existsSync(resolved)) problems.push(`${relative}: missing relative link: ${match[1]}`);
    }
  }
}

if (problems.length > 0) {
  process.stderr.write(`Documentation quality failed:\n${problems.map((item) => `- ${item}`).join('\n')}\n`);
  process.exitCode = 1;
} else process.stdout.write(`Documentation quality passed: ${files.length} file(s).\n`);

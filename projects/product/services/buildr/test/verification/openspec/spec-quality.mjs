#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(process.env.BUILDR_PROJECT_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..'));
const specsRoot = path.join(productRoot, 'openspec', 'specs');
const placeholderPatterns = [
  { label: 'TBD', pattern: /\bTBD\b/i },
  { label: 'created by archiving', pattern: /created\s+by\s+archiving/i },
  { label: 'TODO', pattern: /\bTODO\b/i },
  { label: 'placeholder', pattern: /\bplaceholder\b/i },
  { label: '中文占位文本', pattern: /待补充|待完善|占位/ },
];

export function purposeBody(markdown) {
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const purposeIndex = lines.findIndex((line) => /^##\s+Purpose\s*$/.test(line));
  if (purposeIndex === -1) return null;
  const endOffset = lines.slice(purposeIndex + 1).findIndex((line) => /^##\s+/.test(line));
  const endIndex = endOffset === -1 ? lines.length : purposeIndex + 1 + endOffset;
  return lines.slice(purposeIndex + 1, endIndex).join('\n').trim();
}

export function purposeFinding(markdown) {
  const purpose = purposeBody(markdown);
  if (purpose === null) return '缺少 `## Purpose` 段';
  const meaningfulPurpose = purpose.replace(/<!--[\s\S]*?-->/g, '').trim();
  if (!meaningfulPurpose) return '`## Purpose` 段为空';
  const placeholder = placeholderPatterns.find(({ pattern }) => pattern.test(meaningfulPurpose));
  return placeholder ? `Purpose 包含占位文本：${placeholder.label}` : null;
}

assert.equal(purposeFinding('# Spec\n\n## Requirements\n'), '缺少 `## Purpose` 段');
assert.equal(purposeFinding('# Spec\n\n## Purpose\n\n<!-- later -->\n\n## Requirements\n'), '`## Purpose` 段为空');
for (const placeholder of ['TBD', 'created by archiving a change', 'TODO', 'placeholder', '待补充', '待完善', '占位']) {
  assert.match(purposeFinding(`# Spec\n\n## Purpose\n${placeholder}\n\n## Requirements\n`) || '', /Purpose 包含占位文本/);
}
assert.equal(purposeFinding('# Spec\n\n## Purpose\n描述当前有效契约。\n\n## Requirements\n\n### Requirement: TODO 项作为业务数据\n允许正文使用 TODO。\n'), null);

if (!fs.existsSync(specsRoot)) {
  console.error(`OpenSpec spec quality check cannot find canonical specs root: ${specsRoot}`);
  process.exit(1);
}
const specFiles = fs.readdirSync(specsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(specsRoot, entry.name, 'spec.md'))
  .filter((file) => fs.existsSync(file)).sort();
const findings = specFiles.flatMap((file) => {
  const finding = purposeFinding(fs.readFileSync(file, 'utf8'));
  return finding ? [`${path.relative(productRoot, file)}: ${finding}`] : [];
});
if (findings.length) {
  console.error('OpenSpec canonical spec quality check failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log(`OpenSpec canonical spec quality check passed: ${specFiles.length} Purpose sections are complete.`);

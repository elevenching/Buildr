import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  inspectCandidateFile,
  inspectPackageMetadata,
  inspectTarballFiles,
} from '../tools/verification/release/open-source-candidate.mjs';
import { resolveReleaseContract } from '../tools/verification/release/release-contract.mjs';

test('open-source candidate content rules block secrets without echoing values', () => {
  const secret = ['-----BEGIN ', 'PRIVATE KEY-----'].join('');
  const findings = inspectCandidateFile('fixture.txt', secret);
  assert.equal(findings[0].rule, 'secret.private-key');
  assert.equal(JSON.stringify(findings).includes(secret), false);
  assert.equal(inspectCandidateFile('README.md', 'https://github.com/elevenching/Buildr').length, 0);
  assert.equal(inspectCandidateFile('fixture.md', 'buildr@example.com').length, 0);
  assert.equal(inspectCandidateFile('fixture.md', ['person', 'private.test'].join('@'))[0].rule, 'private.email-address');
});

test('open-source metadata and tarball contracts enforce public identity and inventory', () => {
  const valid = {
    name: '@buildr-ai/buildr',
    bin: { buildr: './tools/buildr' },
    repository: { url: 'git+https://github.com/elevenching/Buildr.git', directory: 'projects/product' },
    homepage: 'https://github.com/elevenching/Buildr#readme',
    bugs: { url: 'https://github.com/elevenching/Buildr/issues' },
    publishConfig: { access: 'public' },
  };
  assert.deepEqual(inspectPackageMetadata(valid), []);
  assert.equal(inspectPackageMetadata({ ...valid, name: '@wrong/buildr' })[0].rule, 'package.identity');
  const files = ['LICENSE', 'README.md', 'package.json', 'tools/buildr', 'package/manifest.yml'].map((path) => ({ path }));
  assert.deepEqual(inspectTarballFiles(files), []);
  assert.equal(inspectTarballFiles([...files, { path: 'openspec/spec.md' }]).at(-1).rule, 'tarball.forbidden');
});

test('release contract maps prerelease to next and stable to latest', () => {
  assert.deepEqual(resolveReleaseContract('0.1.0-rc.1', 'v0.1.0-rc.1'), {
    version: '0.1.0-rc.1', refName: 'v0.1.0-rc.1', npmTag: 'next', prerelease: true,
  });
  assert.equal(resolveReleaseContract('0.1.0', 'v0.1.0').npmTag, 'latest');
  assert.throws(() => resolveReleaseContract('0.1.0', 'v0.1.1'), /does not match/);
});

test('publish workflow is tag-gated, OIDC-ready, and token-free', () => {
  const workflow = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.github/workflows/publish.yml'), 'utf8');
  for (const required of [
    'tags:', 'id-token: write', 'environment: npm-production', 'release-contract.mjs',
    './tools/verify-buildr-product', 'npm publish --access public', 'gh release create',
  ]) assert.equal(workflow.includes(required), true, required);
  assert.equal(workflow.includes('NODE_AUTH_TOKEN'), false);
});

const forbiddenProjectRootEntries = new Set([
  'bin',
  'package',
  'package-lock.json',
  'package.json',
  'scripts',
  'src',
  'test',
]);

const allowedProjectRootEntries = new Set([
  'AGENTS.md',
  'README.md',
  'buildr',
  'capabilities.yml',
  'commands.yml',
  'docs',
  'openspec',
  'services',
  'verification.yml',
]);

const requiredServiceRootEntries = new Set([
  'AGENTS.md',
  'bin',
  'package',
  'package-lock.json',
  'package.json',
  'scripts',
  'src',
  'test',
]);

export function validateProductSourceLayout({ projectEntries, serviceEntries, bridgeSource }) {
  const findings = [];

  for (const entry of projectEntries) {
    if (forbiddenProjectRootEntries.has(entry)) findings.push(`Project root must not own ${entry}`);
    else if (!allowedProjectRootEntries.has(entry)) findings.push(`unclassified Product root entry: ${entry}`);
  }
  for (const entry of requiredServiceRootEntries) {
    if (!serviceEntries.includes(entry)) findings.push(`Buildr Service root is missing ${entry}`);
  }
  if (!/^#!\/usr\/bin\/env node\s+import ['"]\.\/services\/buildr\/bin\/buildr\.mjs['"];?\s*$/u.test(bridgeSource)) {
    findings.push('projects/product/buildr must be a thin Service CLI bridge');
  }

  return findings;
}

export const productSourceLayoutContract = Object.freeze({
  allowedProjectRootEntries: [...allowedProjectRootEntries].sort(),
  forbiddenProjectRootEntries: [...forbiddenProjectRootEntries].sort(),
  requiredServiceRootEntries: [...requiredServiceRootEntries].sort(),
});

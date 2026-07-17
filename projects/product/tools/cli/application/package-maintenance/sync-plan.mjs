export function createPackageSyncPlan({
  assertSafeSyncMutationPaths,
  missingAncestorForMutation,
  mutationPathFingerprint,
  packageRegistryMutationPaths,
  path,
  readPackageManifest,
  targetPathFromBuiltin,
  toPosixRelative,
}) {
  function packageBuiltinMutationPaths(targetRoot, manifest = readPackageManifest()) {
    const affected = new Set([
      path.join(targetRoot, 'AGENTS.md'),
      path.join(targetRoot, '.gitignore'),
      path.join(targetRoot, 'rules', 'manifest.yml'),
      path.join(targetRoot, 'skills', 'manifest.yml'),
      path.join(targetRoot, 'commands', 'manifest.yml'),
      path.join(targetRoot, '.buildr', 'builtin-receipts.json'),
      ...packageRegistryMutationPaths(targetRoot),
    ]);
    for (const builtin of [...manifest.builtins.rules, ...manifest.builtins.skills]) {
      if (builtin.component) continue;
      const target = targetPathFromBuiltin(targetRoot, builtin);
      affected.add(target);
      const missingParent = missingAncestorForMutation(targetRoot, path.dirname(target));
      if (missingParent) affected.add(missingParent);
    }
    return assertSafeSyncMutationPaths(targetRoot, [...affected]);
  }

  function builtinSyncPlanSignature(targetRoot, findings, affectedPaths) {
    return JSON.stringify({
      findings: findings.map(({ type, id, required, status, path: targetPath, component }) => ({ type, id, required, status, path: targetPath, component: component || null })),
      affectedPaths: affectedPaths.map((item) => ({ path: toPosixRelative(targetRoot, item), fingerprint: mutationPathFingerprint(item) })).sort((left, right) => left.path.localeCompare(right.path)),
    });
  }

  return { packageBuiltinMutationPaths, builtinSyncPlanSignature };
}

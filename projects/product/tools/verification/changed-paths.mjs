import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { normalizeProductPath } from './planner.mjs';

function git(gitRoot, args, options = {}) {
  return execFileSync('git', args, { cwd: gitRoot, encoding: options.encoding ?? 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function zeroSeparated(output) {
  return output.split('\0').filter(Boolean);
}

export function resolveVerificationBase(gitRoot, requestedBase) {
  const candidates = requestedBase ? [requestedBase] : [];
  if (!requestedBase) {
    try {
      const upstream = git(gitRoot, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']).trim();
      if (upstream) candidates.push(upstream);
    } catch {}
    candidates.push('origin/dev');
  }
  for (const candidate of candidates) {
    try {
      git(gitRoot, ['rev-parse', '--verify', `${candidate}^{commit}`]);
      return candidate;
    } catch {}
  }
  throw new Error(requestedBase ? `Unknown Git base: ${requestedBase}` : 'Unable to resolve verification base; pass --base <ref>');
}

export function collectChangedProductPaths(options) {
  const productRoot = fs.realpathSync(path.resolve(options.productRoot));
  if ((options.explicitPaths ?? []).length > 0) {
    return { base: null, paths: [...new Set(options.explicitPaths.map(normalizeProductPath))].sort(), source: 'explicit' };
  }
  const gitRoot = fs.realpathSync(git(productRoot, ['rev-parse', '--show-toplevel']).trim());
  const productPrefix = path.relative(gitRoot, productRoot).split(path.sep).join('/');
  if (productPrefix.startsWith('../') || path.isAbsolute(productPrefix)) throw new Error('Product root is outside Git root');
  const base = resolveVerificationBase(gitRoot, options.base);
  const pathspec = productPrefix || '.';
  const commands = [
    ['diff', '--name-only', '-z', `${base}...HEAD`, '--', pathspec],
    ['diff', '--cached', '--name-only', '-z', '--', pathspec],
    ['diff', '--name-only', '-z', '--', pathspec],
    ['ls-files', '--others', '--exclude-standard', '-z', '--', pathspec],
  ];
  const workspacePaths = commands.flatMap((args) => zeroSeparated(git(gitRoot, args)));
  const paths = [];
  for (const workspacePath of workspacePaths) {
    const normalizedWorkspacePath = workspacePath.replaceAll('\\', '/');
    if (productPrefix && normalizedWorkspacePath !== productPrefix && !normalizedWorkspacePath.startsWith(`${productPrefix}/`)) continue;
    const relative = productPrefix ? normalizedWorkspacePath.slice(productPrefix.length + 1) : normalizedWorkspacePath;
    if (relative) paths.push(normalizeProductPath(relative));
  }
  return { base, paths: [...new Set(paths)].sort(), source: 'git' };
}

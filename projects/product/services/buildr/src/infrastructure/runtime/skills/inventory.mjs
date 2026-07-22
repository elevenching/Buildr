import fs from 'node:fs';
import path from 'node:path';
import { getRuntimeAdapter, skillDestinationRoot } from '../adapter-contract.mjs';
import { enumerateSkillSourceFiles, readSkillProjectionReceipt, sha256Integrity } from './projection-files.mjs';
import { parseSkillFrontmatterName } from './primitives.mjs';

function inventoryDigest(files) {
  const inventory = files.map((file) => ({
    path: file.relativePath,
    integrity: sha256Integrity(file.content),
    executable: file.executable,
  }));
  return sha256Integrity(Buffer.from(JSON.stringify(inventory), 'utf8'));
}

function walkSkillDirectories(root, output = []) {
  if (!fs.existsSync(root)) return output;
  for (const name of fs.readdirSync(root).sort()) {
    const directory = path.join(root, name);
    const stat = fs.lstatSync(directory);
    if (stat.isSymbolicLink() || !stat.isDirectory()) continue;
    if (fs.existsSync(path.join(directory, 'SKILL.md'))) output.push(directory);
    else walkSkillDirectories(directory, output);
  }
  return output;
}

function receiptForRuntimePath(destinationRoot, adapter, runtimePath) {
  const file = path.join(destinationRoot, 'buildr', 'skill-projection-receipts', adapter.id, ...`${runtimePath}.json`.split('/'));
  return { file, receipt: readSkillProjectionReceipt(file, { adapterId: adapter.id, runtimePath }) };
}

export function buildEffectiveSkillInventory({ adapterId, workspaceRoot, userHome, candidateIds = null }) {
  const adapter = getRuntimeAdapter(adapterId);
  const wanted = candidateIds ? new Set(candidateIds) : null;
  const entries = [];
  for (const destination of ['workspace', 'user']) {
    const destinationRoot = skillDestinationRoot(adapter, destination, workspaceRoot, { userHome });
    const skillsRoot = path.join(destinationRoot, 'skills');
    for (const directory of walkSkillDirectories(skillsRoot)) {
      const skillFile = path.join(directory, 'SKILL.md');
      let skillId;
      try { skillId = parseSkillFrontmatterName(skillFile); } catch { continue; }
      if (wanted && !wanted.has(skillId)) continue;
      const runtimePath = path.relative(skillsRoot, directory).split(path.sep).join('/');
      const files = enumerateSkillSourceFiles(directory);
      const { file: receiptFile, receipt } = receiptForRuntimePath(destinationRoot, adapter, runtimePath);
      entries.push({
        skillId,
        runtimePath,
        destination,
        path: directory,
        sourceCategory: receipt ? 'buildr-managed' : 'external-filesystem',
        receiptPath: receipt ? receiptFile : null,
        receipt,
        assetIdentity: receipt?.assetIdentity || null,
        sourceIdentity: receipt?.sourceIdentity || null,
        sourceWorkspaceId: receipt?.sourceWorkspaceId || null,
        sourceDigest: receipt?.sourceDigest || inventoryDigest(files),
        renderDigest: receipt?.renderDigest || inventoryDigest(files),
        files: files.map((file) => ({ path: file.relativePath, integrity: sha256Integrity(file.content), executable: file.executable })),
      });
    }
  }
  return {
    schemaVersion: 'buildr.effective-skill-inventory/v1',
    adapterId,
    evidence: adapter.traits.skills.destinations.discovery.evidence,
    opaqueSources: adapter.traits.skills.destinations.discovery.opaqueSources || [],
    entries,
  };
}

export function classifySkillCandidate(candidate, inventory, destination) {
  const sameName = inventory.entries.filter((entry) => entry.skillId === candidate.skillId);
  const target = sameName.find((entry) => entry.destination === destination);
  const user = sameName.find((entry) => entry.destination === 'user');
  const partial = inventory.evidence === 'partial';
  if (!target && destination === 'workspace' && user?.assetIdentity === candidate.assetIdentity && user.renderDigest === candidate.renderDigest) return { status: 'satisfied_by_user', blocking: false, observed: [user], evidence: inventory.evidence };
  if (!target && sameName.length) {
    const observed = sameName[0];
    if (!observed.receipt) return { status: observed.renderDigest === candidate.renderDigest ? 'equivalent_external' : 'name_conflict', blocking: true, observed: sameName, evidence: inventory.evidence };
    return { status: 'foreign_owner', blocking: true, observed: sameName, evidence: inventory.evidence };
  }
  if (!target) return { status: partial ? 'visibility_partial' : 'absent', blocking: false, observed: sameName, evidence: inventory.evidence };
  if (target.assetIdentity === candidate.assetIdentity) {
    if (target.renderDigest === candidate.renderDigest) return { status: 'already_projected', blocking: false, observed: [target], evidence: inventory.evidence };
    if (destination === 'user' && target.sourceWorkspaceId && target.sourceWorkspaceId !== candidate.sourceWorkspaceId) {
      return { status: 'foreign_owner', blocking: true, observed: [target], evidence: inventory.evidence };
    }
    return { status: 'update', blocking: false, observed: [target], evidence: inventory.evidence };
  }
  if (target.receipt?.schemaVersion === 'buildr.runtime-skill-projection/v1') return { status: 'update', blocking: false, observed: [target], evidence: inventory.evidence, migration: 'legacy_receipt_v1' };
  if (!target.receipt) return { status: target.renderDigest === candidate.renderDigest ? 'equivalent_external' : 'name_conflict', blocking: true, observed: [target], evidence: inventory.evidence };
  return { status: 'foreign_owner', blocking: true, observed: [target], evidence: inventory.evidence };
}

import { registerSharedInfrastructure } from '../shared/infrastructure.mjs';
import { registerDomainsRuntime } from '../domains/runtime.mjs';
import { registerDomainsWorkspace } from '../domains/workspace.mjs';
import { registerDomainsComponents } from '../domains/components.mjs';
import { registerDomainsCommands } from '../domains/commands.mjs';
import { registerDomainsRules } from '../domains/rules.mjs';
import { registerDomainsOpenspec } from '../domains/openspec.mjs';
import { registerApplicationDoctor } from '../application/doctor.mjs';
import { registerDomainsPackageAssets } from '../domains/package-assets.mjs';
import { registerDomainsSkills } from '../domains/skills.mjs';
import { registerApplicationPackageMaintenance } from '../application/package-maintenance.mjs';
import { registerApplicationWorkspaceOperations } from '../application/workspace-operations.mjs';
import { registerApplicationRuntime } from '../application/runtime.mjs';
import { registerApplicationCliUpdate } from '../application/cli-update.mjs';
import * as platform from '../shared/platform.mjs';

const REGISTRATIONS = [
  registerSharedInfrastructure,
  registerDomainsRuntime,
  registerDomainsWorkspace,
  registerDomainsComponents,
  registerDomainsCommands,
  registerDomainsRules,
  registerDomainsOpenspec,
  registerApplicationDoctor,
  registerDomainsPackageAssets,
  registerDomainsSkills,
  registerApplicationPackageMaintenance,
  registerApplicationWorkspaceOperations,
  registerApplicationCliUpdate,
  registerApplicationRuntime,
];

export function createRuntime() {
  const runtime = { ...platform };
  for (const register of REGISTRATIONS) register(runtime);
  return runtime;
}

import { registerWorkspaceInfrastructure } from '../infrastructure/filesystem/index.mjs';
import { registerDomainsRuntime } from './domains/runtime.mjs';
import { registerDomainsWorkspace } from './domains/workspace.mjs';
import { registerDomainsComponents } from './domains/components.mjs';
import { registerDomainsCommands } from './domains/commands.mjs';
import { registerDomainsRules } from './domains/rules.mjs';
import { registerDomainsOpenspec } from './domains/openspec.mjs';
import { registerApplicationDoctor } from './doctor.mjs';
import { registerDomainsPackageAssets } from './domains/package-assets.mjs';
import { registerDomainsSkills } from './domains/skills.mjs';
import { registerApplicationPackageMaintenance } from './package-maintenance.mjs';
import { registerApplicationWorkspaceOperations } from './workspace-operations.mjs';
import { registerApplicationRuntime } from './runtime.mjs';
import { registerApplicationCliUpdate } from './cli-update.mjs';
import * as platform from '../infrastructure/platform.mjs';

const REGISTRATIONS = [
  registerWorkspaceInfrastructure,
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

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PUBLIC_JSON_SCHEMAS, withJsonSchema } from '../../application/json-contracts.mjs';

const packageJsonPath = fileURLToPath(new URL('../../../package.json', import.meta.url));

export function readCliIdentity() {
  const metadata = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (!metadata.name || !metadata.version) throw new Error('Buildr package identity is incomplete.');
  return { package: metadata.name, version: metadata.version };
}

export function isVersionRequest(rawArgs) {
  return rawArgs.length === 1 && ['--version', '-V', 'version'].includes(rawArgs[0])
    || rawArgs.length === 2 && rawArgs[0] === 'version' && rawArgs[1] === '--json';
}

export function printVersion(rawArgs) {
  const identity = readCliIdentity();
  if (rawArgs.includes('--json')) {
    console.log(JSON.stringify(withJsonSchema(PUBLIC_JSON_SCHEMAS.version, identity), null, 2));
    return;
  }
  console.log(identity.version);
}

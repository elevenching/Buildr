import process from 'node:process';
import { dispatch } from './registry.mjs';

export function runCli(argv = process.argv) {
  return dispatch(argv);
}

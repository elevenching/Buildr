#!/usr/bin/env node

import process from 'node:process';
import { runCli } from '../src/interfaces/cli/main.mjs';

try {
  runCli(process.argv);
} catch (error) {
  console.error(process.env.BUILDR_DEBUG_STACK === '1' && error.stack ? error.stack : error.message);
  process.exit(1);
}

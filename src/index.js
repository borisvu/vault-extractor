#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { processVault } from './processor.js';
import { initConfig } from './config.js';
import { setupLogger } from './logger.js';

const argv = yargs(hideBin(process.argv))
  .option('config', {
    alias: 'c',
    type: 'string',
    description: 'Path to configuration file',
  })
  .option('log', {
    alias: 'l',
    type: 'string',
    description: 'Path to log file',
  })
  .option('init-config', {
    type: 'string',
    description: 'Generate template config file at specified path',
  })
  .check((argv) => {
    if (argv['init-config']) return true;
    if (!argv.config) throw new Error('--config is required');
    return true;
  })
  .help().argv;

async function main() {
  try {
    // Setup logging if specified
    const logger = setupLogger(argv.log);

    // Handle config initialization
    if (argv['init-config']) {
      await initConfig(argv['init-config']);
      logger.info(`Template config file created at: ${argv['init-config']}`);
      return;
    }

    // Process the vault
    await processVault(argv.config, logger);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

// Run the application
main().catch(() => {
  process.exitCode = 1;
});

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
    requiresArg: true,
    nargs: 1,
  })
  .check((argv) => {
    // If init-config is specified, config is not required
    if (argv['init-config']) {
      return true;
    }

    // For all other operations, config is required
    if (!argv.config) {
      throw new Error('--config is required unless using --init-config');
    }
    return true;
  })
  .help().argv;

async function main() {
  try {
    // Setup logging if specified
    const logger = setupLogger(argv.log);

    // Handle config initialization
    if (argv['init-config']) {
      const configPath = argv['init-config'];
      if (!configPath) {
        throw new Error('--init-config requires a path argument');
      }
      await initConfig(configPath);
      logger.info(`Template config file created at: ${configPath}`);
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

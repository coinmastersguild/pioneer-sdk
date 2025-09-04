#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { testCommand } from './commands/test';
import { portfolioCommand } from './commands/portfolio';
import { walletCommand } from './commands/wallet';
import { configCommand } from './commands/config';
const program = new Command();

program
  .name('pioneer')
  .description('Pioneer SDK CLI - Streamlined testing and development tools')
  .version('1.0.0');

// Add commands
program.addCommand(testCommand);
program.addCommand(portfolioCommand);
program.addCommand(walletCommand);
program.addCommand(configCommand);

// Global error handling
program.exitOverride();

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error);
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
#!/usr/bin/env node
// @ts-nocheck

import { Command } from 'commander';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import SDK from '@coinmasters/pioneer-sdk';
// @ts-ignore - Using any types for fastest build
import { ChainToNetworkId, shortListSymbolToCaip } from '@pioneer-platform/pioneer-caip';
import { getPaths, addressNListToBIP32 } from '@pioneer-platform/pioneer-coins';
import ora from 'ora';

// Define a local getChainEnumValue function to replace the one from @coinmasters/types
const getChainEnumValue = (chain: string): string => {
  return chain.toUpperCase();
};

// Load environment variables
dotenv.config();
dotenv.config({ path: '../../.env' });
dotenv.config({ path: './.env' });

// Set up the command-line program
const program = new Command();

// Version and description
program
  .name('pioneer')
  .description('Command-line interface for Pioneer SDK')
  .version('0.1.0');

// Initialize SDK function
async function initializeSdk(options: { blockchains?: string[] } = {}) {
  const spinner = ora('Initializing Pioneer SDK...').start();
  
  try {
    // Set the API spec URL
    const spec = process.env.PIONEER_API_SPEC || 'https://pioneers.dev/spec/swagger.json';
    
    // Generate a random username and queryKey if not provided
    const username = process.env.PIONEER_USERNAME || `user:${Math.random()}`.substring(0, 13);
    const queryKey = process.env.PIONEER_QUERY_KEY || `sdk:cli:${Math.random()}`;
    
    // Set up supported blockchains
    const supportedChains = [
      'ETH',
      'BTC',
      'AVAX',
      'MATIC',
      'THOR',
      'DOGE',
      'BCH',
      'LTC',
      'GAIA',
      'OSMO'
    ];
    
    // Use specified blockchains or default to all supported
    const chainsList = options.blockchains || supportedChains;
    
    // Convert chain strings to network IDs
    const blockchains = chainsList.map(
      (chainStr: string) => ChainToNetworkId[getChainEnumValue(chainStr)],
    );
    
    spinner.text = 'Generating paths for blockchains...';
    
    // Generate paths for the blockchains
    const paths = getPaths(blockchains);
    
    // Configuration for the SDK
    const config: any = {
      username,
      queryKey,
      spec,
      keepkeyApiKey: process.env.KEEPKEY_API_KEY || 'e4ea6479-5ea4-4c7d-b824-e075101bf9fd',
      paths,
      blockchains,
      nodes: [],
      pubkeys: [],
      balances: [],
    };
    
    spinner.text = 'Creating SDK instance...';
    
    // Create SDK instance
    const app = new SDK(spec, config);
    
    // Initialize the SDK
    spinner.text = 'Connecting to Pioneer API...';
    const result = await app.init({}, {});
    
    spinner.succeed('Pioneer SDK initialized successfully!');
    
    // Display success information
    console.log('\n' + chalk.green('✓') + ' Connected to Pioneer API');
    console.log(chalk.green('✓') + ' Username: ' + chalk.cyan(username));
    console.log(chalk.green('✓') + ' Blockchains: ' + chalk.cyan(chainsList.join(', ')));
    console.log(chalk.green('✓') + ' Paths: ' + chalk.cyan(paths.length.toString()));
    
    // Return the SDK instance
    return app;
  } catch (error) {
    spinner.fail('Failed to initialize Pioneer SDK');
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Hello world command
program
  .command('hello')
  .description('Initialize the SDK and display connection details')
  .option('-b, --blockchains <chains>', 'Comma-separated list of blockchains to enable (e.g., ETH,BTC,THOR)')
  .action(async (options) => {
    try {
      // Parse blockchains if provided
      const blockchains = options.blockchains ? options.blockchains.split(',') : undefined;
      
      // Initialize the SDK
      const sdk = await initializeSdk({ blockchains });
      
      console.log('\n' + chalk.yellow('Pioneer SDK is ready to use!'));
      console.log(chalk.yellow('Try other commands to explore more functionality.'));
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
    }
  });

// Add a command to show balances
program
  .command('balances')
  .description('Display balances for all enabled blockchains')
  .option('-b, --blockchains <chains>', 'Comma-separated list of blockchains to enable (e.g., ETH,BTC,THOR)')
  .option('-r, --refresh', 'Force refresh balances instead of using cache')
  .action(async (options) => {
    try {
      // Parse blockchains if provided
      const blockchains = options.blockchains ? options.blockchains.split(',') : undefined;
      
      // Initialize the SDK
      const sdk = await initializeSdk({ blockchains });
      
      // Get balances
      const spinner = ora('Fetching balances...').start();
      
      if (options.refresh) {
        await sdk.refresh();
      }
      
      const balances = sdk.balances;
      spinner.succeed('Balances retrieved successfully!');
      
      // Display balances
      console.log('\n' + chalk.yellow('Your Balances:'));
      console.log('---------------------------------------');
      console.log(chalk.cyan('Symbol') + '\t' + chalk.cyan('Amount') + '\t\t' + chalk.cyan('Value (USD)'));
      console.log('---------------------------------------');
      
      if (balances.length === 0) {
        console.log(chalk.gray('No balances found'));
      } else {
        balances.forEach(balance => {
          const symbol = balance.symbol || 'Unknown';
          const amount = balance.balance || '0';
          const value = balance.valueUsd ? `$${parseFloat(balance.valueUsd).toFixed(2)}` : 'N/A';
          console.log(`${symbol}\t${amount}\t\t${value}`);
        });
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
    }
  });

// Parse command-line arguments
program.parse(process.argv);

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 
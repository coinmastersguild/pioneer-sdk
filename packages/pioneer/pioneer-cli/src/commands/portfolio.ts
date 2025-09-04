import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { PioneerSDK } from '../lib/sdk';

export const portfolioCommand = new Command('portfolio')
  .description('Manage and view portfolio data')
  .option('-d, --device <id>', 'Device ID to query')
  .option('-r, --refresh', 'Force refresh portfolio data')
  .option('-f, --format <format>', 'Output format (json, table)', 'table')
  .action(async (options) => {
    console.log(chalk.cyan('💼 Pioneer Portfolio Manager\n'));
    
    const spinner = ora('Connecting to Pioneer SDK...').start();
    
    try {
      const sdk = new PioneerSDK();
      await sdk.init();
      
      spinner.text = 'Fetching portfolio data...';
      
      const portfolio = await sdk.getPortfolio({
        deviceId: options.device,
        refresh: options.refresh
      });
      
      spinner.stop();
      
      if (options.format === 'json') {
        console.log(JSON.stringify(portfolio, null, 2));
      } else {
        // Table format
        console.log(chalk.green(`\n💰 Total Portfolio Value: $${portfolio.totalValueUsd?.toFixed(2) || '0.00'} USD`));
        console.log(chalk.cyan(`📱 Paired Devices: ${portfolio.pairedDevices || 0}`));
        
        if (portfolio.devices && portfolio.devices.length > 0) {
          console.log(chalk.yellow('\n📊 Device Breakdown:'));
          portfolio.devices.forEach((device: any) => {
            console.log(`  🔌 ${device.label}: $${device.totalValueUsd.toFixed(2)} USD (${device.balanceCount} assets)`);
          });
        }
        
        if (portfolio.balances && portfolio.balances.length > 0) {
          console.log(chalk.yellow('\n💎 Top Assets:'));
          const topAssets = portfolio.balances
            .sort((a: any, b: any) => b.valueUsd - a.valueUsd)
            .slice(0, 10);
            
          topAssets.forEach((asset: any) => {
            const percentage = ((asset.valueUsd / portfolio.totalValueUsd) * 100).toFixed(2);
            console.log(`  • ${asset.symbol}: $${asset.valueUsd.toFixed(2)} (${percentage}%)`);
          });
        }
      }
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('❌ Failed to fetch portfolio:'), error);
      process.exit(1);
    }
  });
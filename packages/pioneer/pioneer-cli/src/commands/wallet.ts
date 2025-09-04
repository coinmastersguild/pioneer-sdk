import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { PioneerSDK } from '../lib/sdk';
import { WalletOption } from '@coinmasters/types';

export const walletCommand = new Command('wallet')
  .description('Wallet management commands')
  .option('-p, --pair <wallet>', 'Pair with wallet (keepkey, metamask, keplr)')
  .option('-s, --status', 'Show wallet connection status')
  .option('-b, --balances', 'Show wallet balances')
  .option('-a, --addresses', 'Show wallet addresses')
  .action(async (options) => {
    console.log(chalk.cyan('🔐 Pioneer Wallet Manager\n'));
    
    const spinner = ora('Initializing SDK...').start();
    
    try {
      const sdk = new PioneerSDK();
      await sdk.init();
      
      if (options.pair) {
        spinner.text = `Pairing with ${options.pair}...`;
        
        const walletMap: Record<string, WalletOption> = {
          'keepkey': WalletOption.KEEPKEY,
          'metamask': WalletOption.METAMASK,
          'keplr': WalletOption.KEPLR
        };
        
        const walletOption = walletMap[options.pair.toLowerCase()];
        if (!walletOption) {
          throw new Error(`Unknown wallet: ${options.pair}`);
        }
        
        const result = await sdk.pairWallet(walletOption);
        spinner.stop();
        
        if (result.success) {
          console.log(chalk.green(`✅ Successfully paired with ${options.pair}`));
        } else {
          throw new Error(`Failed to pair with ${options.pair}`);
        }
      }
      
      if (options.status) {
        spinner.text = 'Checking wallet status...';
        const status = await sdk.getWalletStatus();
        spinner.stop();
        
        console.log(chalk.yellow('\n📊 Wallet Status:'));
        console.log(`  Connected: ${status.connected ? chalk.green('Yes') : chalk.red('No')}`);
        console.log(`  Wallet Type: ${status.walletType || 'None'}`);
        console.log(`  Paired Devices: ${status.pairedDevices || 0}`);
      }
      
      if (options.balances) {
        spinner.text = 'Fetching balances...';
        const balances = await sdk.getBalances();
        spinner.stop();
        
        console.log(chalk.yellow(`\n💰 Found ${balances.length} assets`));
        
        // Show top 10 by value
        const topAssets = balances
          .filter((b: any) => b.valueUsd > 0)
          .sort((a: any, b: any) => b.valueUsd - a.valueUsd)
          .slice(0, 10);
        
        topAssets.forEach((asset: any) => {
          console.log(`  • ${asset.symbol}: $${asset.valueUsd.toFixed(2)}`);
        });
      }
      
      if (options.addresses) {
        spinner.text = 'Fetching addresses...';
        const pubkeys = await sdk.getPubkeys();
        spinner.stop();
        
        console.log(chalk.yellow(`\n🔑 Addresses:`));
        
        // Group by chain
        const byChain: Record<string, any[]> = {};
        pubkeys.forEach((pk: any) => {
          const chain = pk.networkId || 'Unknown';
          if (!byChain[chain]) byChain[chain] = [];
          byChain[chain].push(pk);
        });
        
        Object.entries(byChain).forEach(([chain, addresses]) => {
          console.log(`\n  ${chalk.cyan(chain)}:`);
          addresses.slice(0, 3).forEach((addr: any) => {
            console.log(`    ${addr.master || addr.address}`);
          });
          if (addresses.length > 3) {
            console.log(`    ... and ${addresses.length - 3} more`);
          }
        });
      }
      
      spinner.stop();
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });
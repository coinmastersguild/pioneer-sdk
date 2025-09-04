import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_PATH = path.join(os.homedir(), '.pioneer', 'cli-config.json');

interface Config {
  specUrl?: string;
  chains?: string[];
  walletType?: string;
  verbose?: boolean;
  apiKey?: string;
}

export const configCommand = new Command('config')
  .description('Configure Pioneer CLI settings')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .option('-g, --get <key>', 'Get a configuration value')
  .option('-l, --list', 'List all configuration values')
  .option('-r, --reset', 'Reset to default configuration')
  .option('-i, --init', 'Initialize configuration interactively')
  .action(async (options) => {
    console.log(chalk.cyan('⚙️  Pioneer CLI Configuration\n'));
    
    // Ensure config directory exists
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Load existing config
    let config: Config = {};
    if (fs.existsSync(CONFIG_PATH)) {
      try {
        config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      } catch (error) {
        console.warn(chalk.yellow('⚠️  Failed to load existing config, using defaults'));
      }
    }
    
    if (options.init) {
      // Interactive setup
      const response = await prompts([
        {
          type: 'text',
          name: 'specUrl',
          message: 'Pioneer API URL',
          initial: config.specUrl || 'https://pioneers.dev/spec/swagger.json'
        },
        {
          type: 'multiselect',
          name: 'chains',
          message: 'Select chains to enable',
          choices: [
            { title: 'Bitcoin (BTC)', value: 'BTC', selected: true },
            { title: 'Ethereum (ETH)', value: 'ETH', selected: true },
            { title: 'Avalanche (AVAX)', value: 'AVAX', selected: true },
            { title: 'Base', value: 'BASE', selected: true },
            { title: 'Binance Smart Chain', value: 'BSC', selected: true },
            { title: 'Polygon (MATIC)', value: 'MATIC', selected: true },
            { title: 'Optimism', value: 'OP', selected: false },
            { title: 'Arbitrum', value: 'ARB', selected: false },
            { title: 'Cosmos (GAIA)', value: 'GAIA', selected: false },
            { title: 'Osmosis (OSMO)', value: 'OSMO', selected: false },
            { title: 'THORChain', value: 'THOR', selected: false },
            { title: 'Maya', value: 'MAYA', selected: false }
          ]
        },
        {
          type: 'select',
          name: 'walletType',
          message: 'Default wallet type',
          choices: [
            { title: 'KeepKey', value: 'keepkey' },
            { title: 'MetaMask', value: 'metamask' },
            { title: 'Keplr', value: 'keplr' }
          ]
        },
        {
          type: 'confirm',
          name: 'verbose',
          message: 'Enable verbose logging?',
          initial: false
        }
      ]);
      
      config = { ...config, ...response };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      console.log(chalk.green('\n✅ Configuration saved successfully!'));
    }
    
    if (options.set) {
      const [key, ...valueParts] = options.set.split('=');
      const value = valueParts.join('=');
      
      if (!key || !value) {
        console.error(chalk.red('❌ Invalid format. Use: --set key=value'));
        process.exit(1);
      }
      
      // Parse arrays
      if (key === 'chains' && value.includes(',')) {
        config[key as keyof Config] = value.split(',').map((s: string) => s.trim()) as any;
      } else if (key === 'verbose') {
        (config as any)[key] = value === 'true';
      } else {
        config[key as keyof Config] = value as any;
      }
      
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      console.log(chalk.green(`✅ Set ${key} = ${value}`));
    }
    
    if (options.get) {
      const value = config[options.get as keyof Config];
      if (value !== undefined) {
        console.log(chalk.green(`${options.get}: ${JSON.stringify(value)}`));
      } else {
        console.log(chalk.yellow(`⚠️  No value set for: ${options.get}`));
      }
    }
    
    if (options.list) {
      if (Object.keys(config).length === 0) {
        console.log(chalk.yellow('⚠️  No configuration set. Run with --init to setup.'));
      } else {
        console.log(chalk.yellow('Current Configuration:\n'));
        Object.entries(config).forEach(([key, value]) => {
          console.log(`  ${chalk.cyan(key)}: ${JSON.stringify(value)}`);
        });
      }
    }
    
    if (options.reset) {
      const confirm = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Are you sure you want to reset all configuration?',
        initial: false
      });
      
      if (confirm.value) {
        if (fs.existsSync(CONFIG_PATH)) {
          fs.unlinkSync(CONFIG_PATH);
        }
        console.log(chalk.green('✅ Configuration reset to defaults'));
      }
    }
  });
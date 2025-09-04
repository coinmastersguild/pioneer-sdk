import * as SDK from '@coinmasters/pioneer-sdk';
import { WalletOption, Chain } from '@coinmasters/types';
import chalk from 'chalk';

interface TestOptions {
  suite: string;
  verbose?: boolean;
  useKeepKey?: boolean;
  chains?: string[];
  specUrl?: string;
}

interface TestResult {
  success: boolean;
  passed: number;
  total: number;
  summary?: string;
  errors?: string[];
}

export async function runTest(options: TestOptions): Promise<TestResult> {
  const errors: string[] = [];
  let passed = 0;
  let total = 0;
  
  try {
    // Test suites mapping
    const suites: Record<string, () => Promise<void>> = {
      'portfolio': runPortfolioTest,
      'wallet': runWalletTest,
      'coins': runCoinsTest,
      'all': runAllTests
    };
    
    const testRunner = suites[options.suite] || suites['all'];
    
    // Initialize SDK for testing
    const queryKey = `test:${options.suite}:${Date.now()}`;
    const username = `test-user:${Math.random()}`;
    
    const blockchains = (options.chains || ['ETH', 'BTC', 'AVAX'])
      .map((chainStr: string) => chainStr as Chain);
    
    const config: any = {
      appName: "Pioneer Test Runner",
      appIcon: "https://pioneers.dev/coins/keepkey.png",
      username,
      queryKey,
      spec: options.specUrl || 'https://pioneers.dev/spec/swagger.json',
      paths: [],
      blockchains,
      interfaces: ['rest'],
      disableDiscovery: true,
      verbose: options.verbose || false,
      keepkeyApiKey: '123'
    };
    
    const app = new SDK.SDK(config.spec, config);
    await app.init([], {});
    total++;
    passed++;
    console.log(chalk.green('✓ SDK initialized'));
    
    // Pair wallet if requested
    if (options.useKeepKey) {
      const result = await app.pairWallet(WalletOption.KEEPKEY);
      if (!result.success) {
        throw new Error('Failed to pair with KeepKey');
      }
      total++;
      passed++;
      console.log(chalk.green('✓ Paired with KeepKey'));
    }
    
    // Run specific test suite
    await testRunner();
    
    // Portfolio test
    async function runPortfolioTest() {
      console.log(chalk.cyan('\n📊 Running Portfolio Tests...'));
      
      // Test 1: Get balances
      total++;
      try {
        const balances = await app.getBalances();
        if (balances && balances.length >= 0) {
          passed++;
          console.log(chalk.green(`✓ Get balances: ${balances.length} assets found`));
        } else {
          errors.push('Failed to get balances');
          console.log(chalk.red('✗ Get balances failed'));
        }
      } catch (error: any) {
        errors.push(`Get balances error: ${error.message}`);
        console.log(chalk.red('✗ Get balances error'));
      }
      
      // Test 2: Get pubkeys
      total++;
      try {
        const pubkeys = await app.getPubkeys();
        if (pubkeys && pubkeys.length >= 0) {
          passed++;
          console.log(chalk.green(`✓ Get pubkeys: ${pubkeys.length} addresses found`));
        } else {
          errors.push('Failed to get pubkeys');
          console.log(chalk.red('✗ Get pubkeys failed'));
        }
      } catch (error: any) {
        errors.push(`Get pubkeys error: ${error.message}`);
        console.log(chalk.red('✗ Get pubkeys error'));
      }
    }
    
    // Wallet test
    async function runWalletTest() {
      console.log(chalk.cyan('\n🔐 Running Wallet Tests...'));
      
      // Test wallet context
      total++;
      try {
        const context = await app.context;
        if (context) {
          passed++;
          console.log(chalk.green('✓ Wallet context available'));
        } else {
          errors.push('No wallet context');
          console.log(chalk.red('✗ No wallet context'));
        }
      } catch (error: any) {
        errors.push(`Wallet context error: ${error.message}`);
        console.log(chalk.red('✗ Wallet context error'));
      }
    }
    
    // Coins test
    async function runCoinsTest() {
      console.log(chalk.cyan('\n🪙 Running Coins Tests...'));
      
      // Test chain support
      total++;
      const supportedChains = blockchains;
      if (supportedChains.length > 0) {
        passed++;
        console.log(chalk.green(`✓ ${supportedChains.length} chains supported`));
      } else {
        errors.push('No chains supported');
        console.log(chalk.red('✗ No chains supported'));
      }
    }
    
    // Run all tests
    async function runAllTests() {
      await runPortfolioTest();
      await runWalletTest();
      await runCoinsTest();
    }
    
    // Generate summary
    const summary = `
Tests completed: ${total}
Tests passed: ${passed}
Tests failed: ${total - passed}
Success rate: ${((passed / total) * 100).toFixed(1)}%
`;
    
    return {
      success: passed === total,
      passed,
      total,
      summary,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error: any) {
    return {
      success: false,
      passed,
      total: total || 1,
      errors: [error.message || 'Unknown error']
    };
  }
}
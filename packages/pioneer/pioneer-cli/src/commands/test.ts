import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { runTest } from '../tests/runner';

export const testCommand = new Command('test')
  .description('Run e2e tests for Pioneer SDK')
  .option('-s, --suite <suite>', 'Test suite to run (portfolio, wallet, coins, etc.)', 'all')
  .option('-v, --verbose', 'Verbose output')
  .option('-k, --keepkey', 'Test with KeepKey hardware wallet')
  .option('-c, --chains <chains>', 'Comma-separated list of chains to test')
  .option('--spec <url>', 'Pioneer API spec URL', 'https://pioneers.dev/spec/swagger.json')
  .action(async (options) => {
    console.log(chalk.cyan('🧪 Pioneer SDK Test Runner\n'));
    
    const spinner = ora('Initializing test environment...').start();
    
    try {
      // Parse chains if provided
      const chains = options.chains ? options.chains.split(',') : undefined;
      
      // Run the test suite
      const result = await runTest({
        suite: options.suite,
        verbose: options.verbose,
        useKeepKey: options.keepkey,
        chains,
        specUrl: options.spec
      });
      
      spinner.stop();
      
      if (result.success) {
        console.log(chalk.green(`\n✅ All tests passed! (${result.passed}/${result.total})`));
        if (result.summary) {
          console.log(chalk.cyan('\n📊 Test Summary:'));
          console.log(result.summary);
        }
      } else {
        console.log(chalk.red(`\n❌ Tests failed! (${result.passed}/${result.total})`));
        if (result.errors && result.errors.length > 0) {
          console.log(chalk.red('\n🔥 Errors:'));
          result.errors.forEach((error: string) => {
            console.log(chalk.red(`  • ${error}`));
          });
        }
        process.exit(1);
      }
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('❌ Test execution failed:'), error);
      process.exit(1);
    }
  });
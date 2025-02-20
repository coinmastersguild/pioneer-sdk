#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';

const program = new Command();

const COMPONENTS = ['portfolio', 'transfer', 'receive', 'swap'];
const COMPONENT_BASE_URL = 'https://raw.githubusercontent.com/coinmastersguild/pioneer-sdk/main/packages/components/src';

async function checkChakraUI() {
  try {
    const packageJson = await fs.readJson('./package.json');
    return !!packageJson.dependencies?.['@chakra-ui/react'];
  } catch {
    return false;
  }
}

async function installComponent(componentName: string) {
  const spinner = ora(`Installing ${componentName} component...`).start();

  try {
    // Create components directory if it doesn't exist
    await fs.ensureDir('./components/ui');

    // Check for Chakra UI
    const hasChakraUI = await checkChakraUI();
    if (!hasChakraUI) {
      spinner.warn(chalk.yellow(
        'Chakra UI is not installed. Please install it with:\n' +
        'npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion'
      ));
    }

    // Fetch component code
    const response = await axios.get(`${COMPONENT_BASE_URL}/${componentName}/index.tsx`);
    const componentCode = response.data;

    // Write component file
    const componentPath = path.join('./components/ui', `${componentName}.tsx`);
    await fs.writeFile(componentPath, componentCode);

    spinner.succeed(chalk.green(`Successfully installed ${componentName} component`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed to install ${componentName} component`));
    console.error(error);
    process.exit(1);
  }
}

async function removeComponent(componentName: string) {
  const spinner = ora(`Removing ${componentName} component...`).start();

  try {
    const componentPath = path.join('./components/ui', `${componentName}.tsx`);
    await fs.remove(componentPath);
    spinner.succeed(chalk.green(`Successfully removed ${componentName} component`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed to remove ${componentName} component`));
    console.error(error);
    process.exit(1);
  }
}

program
  .name('pioneer-sdk')
  .description('CLI tool for managing Pioneer SDK components')
  .version('0.1.0');

program
  .command('install')
  .description('Install Pioneer SDK components')
  .argument('<components...>', 'Component names to install')
  .action(async (components: string[]) => {
    for (const component of components) {
      if (!COMPONENTS.includes(component.toLowerCase())) {
        console.error(chalk.red(`Invalid component: ${component}`));
        console.log(chalk.yellow('Available components:'));
        COMPONENTS.forEach(c => console.log(`  - ${c}`));
        process.exit(1);
      }
      await installComponent(component.toLowerCase());
    }
  });

program
  .command('list')
  .description('List available components')
  .action(() => {
    console.log(chalk.blue('Available components:'));
    COMPONENTS.forEach(component => {
      console.log(`  - ${component}`);
    });
  });

program
  .command('remove')
  .description('Remove installed components')
  .argument('<components...>', 'Component names to remove')
  .action(async (components: string[]) => {
    for (const component of components) {
      if (!COMPONENTS.includes(component.toLowerCase())) {
        console.error(chalk.red(`Invalid component: ${component}`));
        process.exit(1);
      }
      await removeComponent(component.toLowerCase());
    }
  });

program.parse(); 

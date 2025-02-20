#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';

const program = new Command();

const COMPONENTS = ['Portfolio'];
const COMPONENT_BASE_URL = 'https://raw.githubusercontent.com/coinmastersguild/pioneer-sdk/master/packages/components/src';

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
    await fs.ensureDir('./components/pioneer');

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
    const componentPath = path.join('./components/pioneer', `${componentName}.tsx`);
    await fs.writeFile(componentPath, componentCode);

    spinner.succeed(chalk.green(`Successfully installed ${componentName} component`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed to install ${componentName} component`));
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
  .description('Install Portfolio component')
  .action(async () => {
    await installComponent('Portfolio');
  });

program.parse(); 

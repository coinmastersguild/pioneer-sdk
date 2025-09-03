#!/usr/bin/env tsx
/*
    E2E Portfolio Display Test
    
    Clean, focused portfolio display with:
    - Native assets vs Tokens separation
    - Beautiful table formatting
    - Summations and totals
    - Color-coded output
*/

import chalk from 'chalk';
import Table from 'cli-table3';
import * as SDK from '@coinmasters/pioneer-sdk';
import { WalletOption, Chain, getChainEnumValue } from '@coinmasters/types';
import { ChainToNetworkId } from '@pioneer-platform/pioneer-caip';
import { getPaths } from '@pioneer-platform/pioneer-coins';
import wait from 'wait-promise';

// Load environment
require("dotenv").config();
require('dotenv').config({path: "../.env"});
require('dotenv').config({path: "../../.env"});
require('dotenv').config({path: "../../../.env"});

const log = require("@pioneer-platform/loggerdog")();

// Configuration
const SPEC_URL = process.env['VITE_PIONEER_URL_SPEC'] || 'https://pioneers.dev/spec/swagger.json';
const SUPPORTED_CHAINS = ['ETH', 'BTC', 'AVAX', 'BASE', 'BSC', 'MATIC', 'OP', 'ARB'];

interface Balance {
  symbol: string;
  chain: string;
  identifier: string;
  balance: string;
  valueUsd: number;
  price?: number;
  isNative: boolean;
  networkId?: string;
  contractAddress?: string;
}

interface PortfolioSummary {
  nativeAssets: Balance[];
  tokens: Balance[];
  totalNativeValueUsd: number;
  totalTokenValueUsd: number;
  totalValueUsd: number;
  chainBreakdown: Map<string, { native: number; tokens: number; total: number }>;
}

// Helper function to truncate with middle ellipsis
function middleEllipsis(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    const ellipsis = '...';
    const availableLength = maxLength - ellipsis.length;
    const startLength = Math.ceil(availableLength / 2);
    const endLength = Math.floor(availableLength / 2);
    return str.substring(0, startLength) + ellipsis + str.substring(str.length - endLength);
}

async function initializeSDK() {
  console.log(chalk.cyan('🚀 Initializing Pioneer SDK...\n'));
  
  const queryKey = `sdk:portfolio-display:${Date.now()}`;
  const username = `user:${Math.random()}`;
  
  const blockchains = SUPPORTED_CHAINS.map(
    (chainStr: any) => ChainToNetworkId[getChainEnumValue(chainStr)],
  );
  
  // Generate paths for blockchains
  const paths = getPaths(blockchains);
  
  const config: any = {
    appName: "Portfolio Display Test",
    appIcon: "https://pioneers.dev/coins/keepkey.png",
    username,
    queryKey,
    spec: SPEC_URL,
    paths,
    blockchains,
    interfaces: ['rest'],
    disableDiscovery: true,
    verbose: false,
    keepkeyApiKey: process.env.KEEPKEY_API_KEY || 'e4ea6479-5ea4-4c7d-b824-e075101bf9fd'
  };
  
  const app = new SDK.SDK(config.spec, config);
  
  const startTime = Date.now();
  await app.init({}, {});
  const initTime = Date.now() - startTime;
  
  console.log(chalk.green(`✅ SDK initialized in ${initTime}ms`));
  console.log(chalk.green(`📊 Found ${app.pubkeys.length} pubkeys and ${app.paths.length} paths\n`));
  
  return app;
}

function isNativeAsset(balance: any): boolean {
  // Native assets typically don't have a contract address
  // and their symbol matches the chain symbol
  const nativeSymbols = ['ETH', 'BTC', 'AVAX', 'BNB', 'MATIC', 'BCH', 'LTC', 'DOGE', 'DASH'];
  
  if (balance.contract || balance.contractAddress || balance.address) {
    return false;
  }
  
  // Check if symbol matches native chain symbols
  if (nativeSymbols.includes(balance.symbol)) {
    return true;
  }
  
  // Check identifier pattern for native assets
  if (balance.identifier && !balance.identifier.includes('/')) {
    return false;
  }
  
  return !balance.isToken;
}

function processBalances(rawBalances: any[]): PortfolioSummary {
  const nativeAssets: Balance[] = [];
  const tokens: Balance[] = [];
  const chainBreakdown = new Map<string, { native: number; tokens: number; total: number }>();
  
  rawBalances.forEach(balance => {
    const isNative = isNativeAsset(balance);
    const valueUsd = parseFloat(balance.valueUsd || '0');
    const chain = balance.chain || balance.networkId || 'Unknown';
    
    const processedBalance: Balance = {
      symbol: balance.symbol || balance.ticker || 'Unknown',
      chain: balance.caip || balance.identifier || chain, // Use CAIP if available
      identifier: balance.identifier || balance.caip || '',
      balance: balance.balance || '0',
      valueUsd,
      price: balance.priceUsd || balance.price,
      isNative,
      networkId: balance.networkId,
      contractAddress: balance.contract || balance.contractAddress
    };
    
    // Add to appropriate category
    if (isNative) {
      nativeAssets.push(processedBalance);
    } else {
      tokens.push(processedBalance);
    }
    
    // Update chain breakdown
    if (!chainBreakdown.has(chain)) {
      chainBreakdown.set(chain, { native: 0, tokens: 0, total: 0 });
    }
    
    const chainStats = chainBreakdown.get(chain)!;
    if (isNative) {
      chainStats.native += valueUsd;
    } else {
      chainStats.tokens += valueUsd;
    }
    chainStats.total += valueUsd;
  });
  
  // Sort by value
  nativeAssets.sort((a, b) => b.valueUsd - a.valueUsd);
  tokens.sort((a, b) => b.valueUsd - a.valueUsd);
  
  const totalNativeValueUsd = nativeAssets.reduce((sum, asset) => sum + asset.valueUsd, 0);
  const totalTokenValueUsd = tokens.reduce((sum, asset) => sum + asset.valueUsd, 0);
  
  return {
    nativeAssets,
    tokens,
    totalNativeValueUsd,
    totalTokenValueUsd,
    totalValueUsd: totalNativeValueUsd + totalTokenValueUsd,
    chainBreakdown
  };
}

function displayPortfolioTable(summary: PortfolioSummary) {
  console.log(chalk.cyan('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                     PORTFOLIO OVERVIEW                        '));
  console.log(chalk.cyan('═══════════════════════════════════════════════════════════════\n'));
  
  // Native Assets Table
  if (summary.nativeAssets.length > 0) {
    console.log(chalk.yellow.bold('🪙  NATIVE ASSETS'));
    
    const nativeTable = new Table({
      head: ['Symbol', 'Chain / CAIP', 'Balance', 'Price', 'Value USD'],
      colWidths: [12, 50, 20, 15, 15],
      style: {
        head: ['cyan'],
        border: ['gray']
      },
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      }
    });
    
    summary.nativeAssets.slice(0, 15).forEach(asset => {
      const caip = asset.chain.length > 45 ? middleEllipsis(asset.chain, 45) : asset.chain;
      nativeTable.push([
        chalk.cyan(asset.symbol),
        chalk.gray(caip),
        parseFloat(asset.balance).toFixed(8),
        asset.price ? chalk.yellow(`$${parseFloat(String(asset.price)).toFixed(2)}`) : 'N/A',
        chalk.green(`$${parseFloat(String(asset.valueUsd)).toFixed(2)}`)
      ]);
    });
    
    console.log(nativeTable.toString());
    console.log(chalk.yellow(`  Total Native Assets: ${chalk.green.bold(`$${summary.totalNativeValueUsd.toFixed(2)}`)}\n`));
  }
  
  // Tokens Table
  if (summary.tokens.length > 0) {
    console.log(chalk.magenta.bold('🎯  TOKENS'));
    
    const tokenTable = new Table({
      head: ['Symbol', 'Chain / CAIP', 'Balance', 'Price', 'Value USD'],
      colWidths: [12, 50, 20, 15, 15],
      style: {
        head: ['cyan'],
        border: ['gray']
      },
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      }
    });
    
    // Show top 20 tokens
    const tokensToShow = summary.tokens.slice(0, 20);
    tokensToShow.forEach(token => {
      const caip = token.chain.length > 45 ? middleEllipsis(token.chain, 45) : token.chain;
      tokenTable.push([
        chalk.magenta(token.symbol),
        chalk.gray(caip),
        parseFloat(token.balance).toFixed(8),
        token.price ? chalk.yellow(`$${parseFloat(String(token.price)).toFixed(4)}`) : 'N/A',
        chalk.green(`$${parseFloat(String(token.valueUsd)).toFixed(2)}`)
      ]);
    });
    
    console.log(tokenTable.toString());
    
    if (summary.tokens.length > 20) {
      console.log(chalk.gray(`  ... and ${summary.tokens.length - 20} more tokens`));
    }
    
    console.log(chalk.magenta(`  Total Tokens: ${chalk.green.bold(`$${summary.totalTokenValueUsd.toFixed(2)}`)}\n`));
  }
  
  // Chain Breakdown Table
  if (summary.chainBreakdown.size > 0) {
    console.log(chalk.blue.bold('📊  CHAIN BREAKDOWN'));
    
    const chainTable = new Table({
      head: ['Chain', 'Native', 'Tokens', 'Total', '% of Portfolio'],
      colWidths: [50, 15, 15, 15, 17],
      style: {
        head: ['cyan'],
        border: ['gray']
      },
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      }
    });
    
    const sortedChains = Array.from(summary.chainBreakdown.entries())
      .sort((a, b) => b[1].total - a[1].total);
    
    sortedChains.forEach(([chain, stats]) => {
      const percentage = ((stats.total / summary.totalValueUsd) * 100).toFixed(2);
      const displayChain = chain.length > 45 ? middleEllipsis(chain, 45) : chain;
      chainTable.push([
        chalk.blue(displayChain),
        chalk.yellow(`$${stats.native.toFixed(2)}`),
        chalk.magenta(`$${stats.tokens.toFixed(2)}`),
        chalk.green(`$${stats.total.toFixed(2)}`),
        chalk.white(`${percentage}%`)
      ]);
    });
    
    console.log(chainTable.toString());
  }
  
  // Summary Footer
  console.log(chalk.cyan('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.white.bold('  TOTAL PORTFOLIO VALUE: ') + chalk.green.bold(`$${summary.totalValueUsd.toFixed(2)}`));
  console.log(chalk.cyan('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.gray(`  Native: $${summary.totalNativeValueUsd.toFixed(2)} (${((summary.totalNativeValueUsd / summary.totalValueUsd) * 100).toFixed(1)}%)`));
  console.log(chalk.gray(`  Tokens: $${summary.totalTokenValueUsd.toFixed(2)} (${((summary.totalTokenValueUsd / summary.totalValueUsd) * 100).toFixed(1)}%)`));
  console.log(chalk.gray(`  Assets: ${summary.nativeAssets.length} native + ${summary.tokens.length} tokens = ${summary.nativeAssets.length + summary.tokens.length} total`));
  console.log(chalk.cyan('═══════════════════════════════════════════════════════════════\n'));
}

async function main() {
  try {
    console.log(chalk.cyan.bold('\n🎯 Pioneer Portfolio Display Test\n'));
    console.log(chalk.gray('═══════════════════════════════════════════════════════════════\n'));
    
    // Initialize SDK
    const app = await initializeSDK();
    
    // Get balances
    console.log(chalk.cyan('📊 Fetching portfolio data...\n'));
    const balancesStart = Date.now();
    
    // Get balances for all chains
    const balances = await app.getBalances();
    
    const balancesFetchTime = Date.now() - balancesStart;
    console.log(chalk.green(`✅ Fetched ${balances.length} balances in ${balancesFetchTime}ms\n`));
    
    // Process and categorize balances
    const portfolioSummary = processBalances(balances);
    
    // Display the portfolio in tables
    displayPortfolioTable(portfolioSummary);
    
    // Performance metrics
    console.log(chalk.gray('Performance Metrics:'));
    console.log(chalk.gray(`  • SDK Initialization: ${balancesFetchTime}ms`));
    console.log(chalk.gray(`  • Balance Fetch: ${balancesFetchTime}ms`));
    console.log(chalk.gray(`  • Total Time: ${Date.now() - balancesStart}ms\n`));
    
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);
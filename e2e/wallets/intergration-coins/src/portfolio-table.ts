#!/usr/bin/env node
/*
    Portfolio Table Display Test
    
    Clean portfolio display with native/token separation
    Uses existing dependencies from intergration-coins
*/

import * as console from 'console';

require("dotenv").config();
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'});
require("dotenv").config({path:'../../../../.env'});

const TAG = " | portfolio-table | ";
import { WalletOption, Chain, getChainEnumValue } from '@coinmasters/types';
import { getPaths } from '@pioneer-platform/pioneer-coins';

const log = require("@pioneer-platform/loggerdog")();
let SDK = require('@coinmasters/pioneer-sdk');
let wait = require('wait-promise');
let {ChainToNetworkId} = require('@pioneer-platform/pioneer-caip');
let sleep = wait.sleep;

// Simple table rendering without external dependencies
function renderTable(headers: string[], rows: any[][], footer?: string) {
    const colWidths = headers.map((h, i) => {
        const maxWidth = Math.max(
            h.length,
            ...rows.map(r => String(r[i] || '').length)
        );
        return Math.min(maxWidth + 2, 30);
    });
    
    const separator = '─';
    const topLine = '┌' + colWidths.map(w => separator.repeat(w)).join('┬') + '┐';
    const midLine = '├' + colWidths.map(w => separator.repeat(w)).join('┼') + '┤';
    const bottomLine = '└' + colWidths.map(w => separator.repeat(w)).join('┴') + '┘';
    
    console.log(topLine);
    console.log('│' + headers.map((h, i) => ` ${h.padEnd(colWidths[i] - 2)} `).join('│') + '│');
    console.log(midLine);
    
    rows.forEach(row => {
        console.log('│' + row.map((cell, i) => ` ${String(cell).padEnd(colWidths[i] - 2)} `).join('│') + '│');
    });
    
    console.log(bottomLine);
    if (footer) {
        console.log(footer);
    }
}

const test_portfolio_display = async function() {
    let tag = TAG + " | test_portfolio_display | ";
    try {
        console.log('\n🎯 ═══════════════════════════════════════════════════════════════');
        console.log('🎯                    PORTFOLIO TABLE TEST                        ');
        console.log('🎯 ═══════════════════════════════════════════════════════════════\n');
        
        // Setup SDK
        const queryKey = "sdk:portfolio-table:" + Math.random();
        const username = "user:" + Math.random();
        
        let supportedChains = ['ETH', 'BTC', 'AVAX', 'BASE', 'BSC', 'MATIC', 'OP', 'DOGE', 'DASH', 'LTC', 'BCH'];
        
        let blockchains = supportedChains.map(
            (chainStr: any) => ChainToNetworkId[getChainEnumValue(chainStr)],
        );
        
        // Generate paths for blockchains
        let paths = getPaths(blockchains);
        console.log(`📝 Generated ${paths.length} paths for ${blockchains.length} blockchains`);
        
        const spec = process.env['VITE_PIONEER_URL_SPEC'] || 'https://pioneers.dev/spec/swagger.json';
        console.log("📡 Using spec:", spec);
        
        const config: any = {
            appName: "Portfolio Table Test",
            appIcon: "https://pioneers.dev/coins/keepkey.png", 
            username,
            queryKey,
            spec,
            paths,
            blockchains,
            interfaces: ['rest'],
            disableDiscovery: true,
            verbose: false,
            keepkeyApiKey: process.env.KEEPKEY_API_KEY || 'e4ea6479-5ea4-4c7d-b824-e075101bf9fd'
        };
        
        console.log("🚀 Initializing SDK...");
        const startInit = Date.now();
        const app = new SDK.SDK(spec, config);
        await app.init({}, {});
        const initTime = Date.now() - startInit;
        console.log(`✅ SDK initialized in ${initTime}ms`);
        console.log(`📊 Found ${app.pubkeys.length} pubkeys and ${app.paths.length} paths\n`);
        
        // Get balances
        console.log("💰 Fetching balances...");
        const startBalances = Date.now();
        const balances = await app.getBalances();
        const balanceTime = Date.now() - startBalances;
        console.log(`✅ Fetched ${balances.length} balances in ${balanceTime}ms\n`);
        
        // Separate native from tokens
        const nativeAssets: any[] = [];
        const tokens: any[] = [];
        let totalNativeUsd = 0;
        let totalTokenUsd = 0;
        
        // Chain breakdown
        const chainTotals: Record<string, {native: number, tokens: number}> = {};
        
        balances.forEach((balance: any) => {
            const isNative = !balance.contract && !balance.isToken && 
                           ['ETH', 'BTC', 'AVAX', 'BNB', 'MATIC', 'BCH', 'LTC', 'DOGE', 'DASH'].includes(balance.symbol);
            
            const valueUsd = parseFloat(balance.valueUsd || '0');
            const chain = balance.networkId || balance.blockchain || 'Unknown';
            
            if (!chainTotals[chain]) {
                chainTotals[chain] = { native: 0, tokens: 0 };
            }
            
            if (isNative) {
                nativeAssets.push(balance);
                totalNativeUsd += valueUsd;
                chainTotals[chain].native += valueUsd;
            } else {
                tokens.push(balance);
                totalTokenUsd += valueUsd;
                chainTotals[chain].tokens += valueUsd;
            }
        });
        
        // Sort by value
        nativeAssets.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));
        tokens.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));
        
        const totalUsd = totalNativeUsd + totalTokenUsd;
        
        // Display Native Assets
        if (nativeAssets.length > 0) {
            console.log('🪙  NATIVE ASSETS\n');
            const nativeRows = nativeAssets.slice(0, 10).map(asset => [
                asset.symbol || 'Unknown',
                asset.networkId || asset.blockchain || 'Unknown',
                parseFloat(asset.balance || '0').toFixed(6),
                asset.priceUsd ? `$${parseFloat(asset.priceUsd).toFixed(2)}` : 'N/A',
                `$${parseFloat(asset.valueUsd || '0').toFixed(2)}`
            ]);
            
            renderTable(
                ['Symbol', 'Chain', 'Balance', 'Price', 'Value USD'],
                nativeRows,
                `  📊 Total Native: $${totalNativeUsd.toFixed(2)}`
            );
            console.log('');
        }
        
        // Display Tokens
        if (tokens.length > 0) {
            console.log('🎯  TOKENS\n');
            const tokenRows = tokens.slice(0, 15).map(token => [
                token.symbol || 'Unknown',
                token.networkId || token.blockchain || 'Unknown',
                parseFloat(token.balance || '0').toFixed(6),
                token.priceUsd ? `$${parseFloat(token.priceUsd).toFixed(4)}` : 'N/A',
                `$${parseFloat(token.valueUsd || '0').toFixed(2)}`
            ]);
            
            renderTable(
                ['Symbol', 'Chain', 'Balance', 'Price', 'Value USD'],
                tokenRows,
                tokens.length > 15 ? 
                    `  ... and ${tokens.length - 15} more tokens\n  📊 Total Tokens: $${totalTokenUsd.toFixed(2)}` :
                    `  📊 Total Tokens: $${totalTokenUsd.toFixed(2)}`
            );
            console.log('');
        }
        
        // Display Chain Breakdown
        console.log('📊  CHAIN BREAKDOWN\n');
        const chainRows = Object.entries(chainTotals)
            .sort((a, b) => (b[1].native + b[1].tokens) - (a[1].native + a[1].tokens))
            .slice(0, 10)
            .map(([chain, totals]) => {
                const chainTotal = totals.native + totals.tokens;
                const percentage = totalUsd > 0 ? ((chainTotal / totalUsd) * 100).toFixed(1) : '0.0';
                return [
                    chain,
                    `$${totals.native.toFixed(2)}`,
                    `$${totals.tokens.toFixed(2)}`,
                    `$${chainTotal.toFixed(2)}`,
                    `${percentage}%`
                ];
            });
        
        renderTable(
            ['Chain', 'Native', 'Tokens', 'Total', '% Portfolio'],
            chainRows
        );
        
        // Summary
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log(`  💰 TOTAL PORTFOLIO VALUE: $${totalUsd.toFixed(2)}`);
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`  Native: $${totalNativeUsd.toFixed(2)} (${totalUsd > 0 ? ((totalNativeUsd/totalUsd)*100).toFixed(1) : '0'}%)`);
        console.log(`  Tokens: $${totalTokenUsd.toFixed(2)} (${totalUsd > 0 ? ((totalTokenUsd/totalUsd)*100).toFixed(1) : '0'}%)`);
        console.log(`  Assets: ${nativeAssets.length} native + ${tokens.length} tokens = ${balances.length} total`);
        console.log('═══════════════════════════════════════════════════════════════\n');
        
        // Performance Summary
        console.log('⚡ Performance Metrics:');
        console.log(`  • SDK Init: ${initTime}ms`);
        console.log(`  • Balance Fetch: ${balanceTime}ms`);
        console.log(`  • Total Time: ${Date.now() - startInit}ms\n`);
        
        console.log('✅ Portfolio table test completed successfully!\n');
        
    } catch(e) {
        console.error(tag, "ERROR:", e);
        throw e;
    }
}

// Run the test
test_portfolio_display()
    .then(() => {
        console.log("✅ Test completed successfully");
        process.exit(0);
    })
    .catch(error => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });
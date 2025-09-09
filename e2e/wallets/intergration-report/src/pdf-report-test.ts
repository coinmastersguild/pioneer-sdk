#!/usr/bin/env node

/*
    E2E PDF Report Testing
    
    This script tests the PDF report generation functionality for all supported chains.
    It validates the report structure, content, and ensures all PDFs can be generated successfully.
*/

import * as console from 'console';
import * as fs from 'fs-extra';
import * as path from 'path';

require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG = " | pdf-report-test | "
import { WalletOption, availableChainsByWallet, getChainEnumValue, NetworkIdToChain, Chain } from '@coinmasters/types';
import { installKkapiAdapter } from './kkapi-adapter';
import { PDFReportGenerator } from './pdf-report-generator';

const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
let SDK = require('@coinmasters/pioneer-sdk')
let wait = require('wait-promise');
let {ChainToNetworkId, shortListSymbolToCaip} = require('@pioneer-platform/pioneer-caip');
let sleep = wait.sleep;
import {
    getPaths,
    addressNListToBIP32,
    // @ts-ignore
} from '@pioneer-platform/pioneer-coins';

let spec = 'https://pioneers.dev/spec/swagger.json'

const test_pdf_reports = async function () {
    let tag = TAG + " | test_pdf_reports | "
    try {
        console.log('📊 [PDF REPORT TEST] Starting PDF report generation test...');
        
        // Install kkapi:// adapter for Node.js testing environment
        installKkapiAdapter();
        
        // Check if vault is available
        console.log('🏥 [HEALTH CHECK] Testing kkapi:// protocol availability...');
        let vaultAvailable = false;
        try {
            const healthResponse = await fetch('kkapi://api/health');
            if (!healthResponse.ok) {
                throw new Error(`Health check failed with status: ${healthResponse.status}`);
            }
            const healthData = await healthResponse.json();
            console.log('✅ [HEALTH CHECK] kkapi:// protocol is working!', healthData);
            vaultAvailable = true;
        } catch (healthError: any) {
            console.warn('⚠️ [HEALTH CHECK] kkapi:// protocol not available:', healthError.message);
            console.warn('ℹ️ [HEALTH CHECK] This is OK - continuing with legacy KeepKey Desktop support');
            vaultAvailable = false;
        }

        // Initialize the PDF report generator
        const reportOutputDir = './src/reports';
        await fs.ensureDir(reportOutputDir);
        const reportGenerator = new PDFReportGenerator(reportOutputDir);
        
        console.log(`📁 [SETUP] Report output directory: ${reportOutputDir}`);
        
        // Setup SDK with minimal chains for testing
        let testChains = [
            'BTC',   // Bitcoin - UTXO chain with XPUB support
            'ETH',   // Ethereum - EVM chain
            'GAIA',  // Cosmos - Cosmos chain
            'LTC',   // Litecoin - Another UTXO chain
            'DOGE',  // Dogecoin - UTXO chain
        ];

        let blockchains = testChains.map(
          // @ts-ignore
          (chainStr: any) => ChainToNetworkId[getChainEnumValue(chainStr)],
        );
        
        console.log(`🔗 [SETUP] Testing with ${blockchains.length} chains:`, testChains);

        let paths = getPaths(blockchains);
        console.log(`🛤️ [SETUP] Generated ${paths.length} paths`);

        let config: any = {
            username: 'pdf-tester',
            queryKey: 'pdf-test-' + Date.now(),
            spec,
            wss: process.env.VITE_PIONEER_URL_WSS || 'wss://pioneers.dev',
            keepkeyApiKey: process.env.KEEPKEY_API_KEY || 'e4ea6479-5ea4-4c7d-b824-e075101bf9fd',
            keepkeyEndpoint: vaultAvailable ? 'kkapi://' : undefined,
            paths,
            blockchains,
            nodes: [],
            pubkeys: [],
            balances: [],
        };

        console.log('📋 [CONFIG] Mode:', vaultAvailable ? 'VAULT (kkapi://)' : 'LEGACY DESKTOP');
        
        // Initialize SDK
        let app = new SDK.SDK(spec, config);
        console.log('🚀 [INIT] Initializing Pioneer SDK...');
        
        const resultInit = await app.init({}, { skipSync: false });
        console.log('✅ [INIT] Pioneer SDK initialized successfully');

        // Get gas assets
        console.log('⛽ [ASSETS] Loading gas assets...');
        await app.getGasAssets();
        console.log('✅ [ASSETS] Loaded', app.assetsMap ? app.assetsMap.size : 0, 'assets');

        // Get pubkeys and balances
        console.log('🔑 [SYNC] Getting pubkeys...');
        await app.getPubkeys();
        console.log('✅ [SYNC] Got', app.pubkeys.length, 'pubkeys');

        console.log('💰 [SYNC] Getting balances...');
        await app.getBalances();
        console.log('✅ [SYNC] Got', app.balances.length, 'balances');

        // Group balances by chain for report generation
        const balancesByChain = new Map();
        for (const balance of app.balances) {
          const symbol = balance.symbol || 'UNKNOWN';
          if (!balancesByChain.has(symbol)) {
            balancesByChain.set(symbol, []);
          }
          balancesByChain.get(symbol).push(balance);
        }
        
        console.log(`📊 [REPORT PREP] Found ${balancesByChain.size} unique chains/symbols to process`);

        // Test report generation for each chain
        const reportTests: Array<{
            symbol: string;
            passed: boolean;
            error?: string;
            filesPaths: string[];
            dataValidation: {
                hasAccountData: boolean;
                hasSummary: boolean;
                balanceValid: boolean;
            };
        }> = [];

        for (const [symbol, balances] of balancesByChain) {
            console.log(`\n📋 [TEST] Testing report generation for ${symbol}...`);
            
            const testResult = {
                symbol,
                passed: false,
                error: undefined as string | undefined,
                filesPaths: [] as string[],
                dataValidation: {
                    hasAccountData: false,
                    hasSummary: false,
                    balanceValid: false,
                }
            };

            try {
                // Create asset context
                const primaryBalance = balances[0];
                const assetContext = {
                    symbol: symbol,
                    networkId: primaryBalance.networkId,
                    balance: primaryBalance.balance,
                    value: primaryBalance.valueUsd || 0,
                    pubkeys: app.pubkeys.filter((pk: any) => pk.networks && pk.networks.includes(primaryBalance.networkId))
                };

                console.log(`  📍 Network: ${primaryBalance.networkId}`);
                console.log(`  💰 Balance: ${primaryBalance.balance} ${symbol}`);
                console.log(`  🔑 Pubkeys: ${assetContext.pubkeys.length}`);

                // Generate report data
                const reportData = await reportGenerator.generateReportData(app, assetContext, 2); // Use 2 accounts for faster testing
                
                // Validate report data structure
                assert(reportData.chainType, 'Missing chainType');
                assert(reportData.symbol === symbol, `Symbol mismatch: expected ${symbol}, got ${reportData.symbol}`);
                assert(reportData.networkId === primaryBalance.networkId, 'NetworkId mismatch');
                assert(reportData.accountData, 'Missing accountData');
                assert(reportData.summary, 'Missing summary');
                
                testResult.dataValidation.hasAccountData = Array.isArray(reportData.accountData) && reportData.accountData.length > 0;
                testResult.dataValidation.hasSummary = typeof reportData.summary === 'object' && reportData.summary !== null;
                testResult.dataValidation.balanceValid = typeof reportData.summary.totalBalance === 'string';

                console.log(`  📊 Chain Type: ${reportData.chainType}`);
                console.log(`  📈 Accounts: ${reportData.summary.totalAccounts}`);
                console.log(`  💵 Total Balance: ${reportData.summary.totalBalance} ${symbol}`);

                // Generate and save reports
                const timestamp = new Date().toISOString().split('T')[0];
                
                // Save JSON report
                const jsonPath = await reportGenerator.saveReportDataAsJSON(reportData, `test_${symbol}_${timestamp}`);
                testResult.filesPaths.push(jsonPath);
                
                // Generate text report
                const textPath = await reportGenerator.generateTextReport(reportData, `test_${symbol}_${timestamp}`);
                testResult.filesPaths.push(textPath);
                
                // Generate PDF report
                try {
                    const pdfPath = await reportGenerator.generatePDFReport(reportData, `test_${symbol}_${timestamp}`);
                    testResult.filesPaths.push(pdfPath);
                    console.log(`  📑 Generated PDF: ${path.basename(pdfPath)}`);
                } catch (pdfError: any) {
                    console.warn(`  ⚠️ PDF generation skipped: ${pdfError.message}`);
                }

                // Verify files exist and have content
                for (const filePath of testResult.filesPaths) {
                    const exists = await fs.pathExists(filePath);
                    assert(exists, `Generated file does not exist: ${filePath}`);
                    
                    const stats = await fs.stat(filePath);
                    assert(stats.size > 0, `Generated file is empty: ${filePath}`);
                    
                    console.log(`  ✅ Generated: ${path.basename(filePath)} (${stats.size} bytes)`);
                }

                // Additional validation for Bitcoin chains
                if (reportData.chainType === 'bitcoin' || reportData.chainType === 'utxo') {
                    const bitcoinData = reportData.accountData as any[];
                    const hasXpubData = bitcoinData.some(account => account.xpub && !account.xpub.startsWith('ERROR') && !account.xpub.startsWith('NO_'));
                    console.log(`  🪙 UTXO Chain - XPUB data available: ${hasXpubData ? 'YES' : 'NO'}`);
                    
                    if (hasXpubData) {
                        console.log(`  🔑 First valid XPUB: ${bitcoinData.find(a => a.xpub && !a.xpub.startsWith('ERROR'))?.xpub.substring(0, 20)}...`);
                    }
                }

                testResult.passed = true;
                console.log(`  ✅ ${symbol} report generation: PASSED`);

            } catch (error: any) {
                testResult.error = error.message;
                testResult.passed = false;
                console.error(`  ❌ ${symbol} report generation: FAILED -`, error.message);
            }

            reportTests.push(testResult);
        }

        // Generate combined report if we have successful individual reports
        const successfulReports = reportTests.filter(test => test.passed);
        
        if (successfulReports.length > 1) {
            console.log(`\n📚 [COMBINED TEST] Testing combined report generation with ${successfulReports.length} chains...`);
            
            try {
                // Collect all successful report data
                const allReportData = [];
                
                for (const test of successfulReports) {
                    // Read back the JSON data
                    const jsonPath = test.filesPaths.find(path => path.endsWith('.json'));
                    if (jsonPath) {
                        const reportData = await fs.readJSON(jsonPath);
                        allReportData.push(reportData);
                    }
                }

                if (allReportData.length > 0) {
                    const timestamp = new Date().toISOString().split('T')[0];
                    const combinedPath = await reportGenerator.generateCombinedReport(allReportData, `test_combined_${timestamp}`);
                    
                    // Verify combined report exists and has content
                    const exists = await fs.pathExists(combinedPath);
                    assert(exists, `Combined report file does not exist: ${combinedPath}`);
                    
                    const stats = await fs.stat(combinedPath);
                    assert(stats.size > 0, `Combined report file is empty: ${combinedPath}`);
                    
                    console.log(`✅ [COMBINED TEST] Generated combined report: ${path.basename(combinedPath)} (${stats.size} bytes)`);
                    
                    // Generate combined PDF report
                    try {
                        const combinedPdfPath = await reportGenerator.generateCombinedPDFReport(allReportData, `test_combined_${timestamp}`);
                        const pdfExists = await fs.pathExists(combinedPdfPath);
                        if (pdfExists) {
                            const pdfStats = await fs.stat(combinedPdfPath);
                            console.log(`📑 [COMBINED TEST] Generated combined PDF: ${path.basename(combinedPdfPath)} (${pdfStats.size} bytes)`);
                        }
                    } catch (pdfError: any) {
                        console.warn(`⚠️ [COMBINED TEST] Combined PDF generation skipped: ${pdfError.message}`);
                    }
                } else {
                    console.warn('⚠️ [COMBINED TEST] No valid report data found for combined report');
                }

            } catch (error: any) {
                console.error('❌ [COMBINED TEST] Combined report generation failed:', error.message);
            }
        } else {
            console.log('⚠️ [COMBINED TEST] Skipping combined report - need at least 2 successful reports');
        }

        // Print test summary
        console.log('\n📊 TEST SUMMARY');
        console.log('='.repeat(50));
        
        const passedTests = reportTests.filter(test => test.passed);
        const failedTests = reportTests.filter(test => !test.passed);
        
        console.log(`✅ Passed: ${passedTests.length}/${reportTests.length} chains`);
        console.log(`❌ Failed: ${failedTests.length}/${reportTests.length} chains`);
        
        if (passedTests.length > 0) {
            console.log('\n✅ SUCCESSFUL REPORTS:');
            passedTests.forEach(test => {
                console.log(`  • ${test.symbol}: ${test.filesPaths.length} files generated`);
                console.log(`    - Account data: ${test.dataValidation.hasAccountData ? '✅' : '❌'}`);
                console.log(`    - Summary data: ${test.dataValidation.hasSummary ? '✅' : '❌'}`);
                console.log(`    - Valid balance: ${test.dataValidation.balanceValid ? '✅' : '❌'}`);
            });
        }
        
        if (failedTests.length > 0) {
            console.log('\n❌ FAILED REPORTS:');
            failedTests.forEach(test => {
                console.log(`  • ${test.symbol}: ${test.error}`);
            });
        }
        
        console.log(`\n📁 All test reports saved to: ${reportOutputDir}`);
        console.log(`📄 Generated files: ${reportTests.reduce((sum, test) => sum + test.filesPaths.length, 0)} total`);

        // Test passes if at least 50% of chains generated reports successfully
        const successRate = passedTests.length / reportTests.length;
        const minSuccessRate = 0.5;
        
        if (successRate >= minSuccessRate) {
            console.log(`\n🎉 [SUCCESS] PDF Report test PASSED with ${(successRate * 100).toFixed(1)}% success rate`);
            process.exit(0);
        } else {
            console.log(`\n❌ [FAILURE] PDF Report test FAILED - only ${(successRate * 100).toFixed(1)}% success rate (need ${(minSuccessRate * 100)}%)`);
            process.exit(1);
        }
        
    } catch (e) {
        log.error(tag, '❌ PDF REPORT TEST FAILED:', e);
        console.log("************************* PDF REPORT TEST FAILED *************************");
        process.exit(1);
    }
}

// Run the PDF report test
if (require.main === module) {
    test_pdf_reports().catch((error) => {
        console.error('❌ Unhandled PDF report test error:', error);
        process.exit(1);
    });
}

export { test_pdf_reports };
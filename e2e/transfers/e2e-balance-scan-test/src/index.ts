/*
    Balance Scan Validation Suite

    Comprehensive test to validate that Pioneer SDK correctly:
    1. Discovers balances across multiple address indices (0-8)
    2. Maintains accurate balances after context switching
    3. Never loses balance data when switching between pubkeys

    This test specifically targets the issue where address 0 shows 0 balance
    even when it contains funds (e.g., 20+ CACAO).

    Test Flow:
    - Add paths for addresses 0-8 (mix of before and after init)
    - Initialize SDK and pair device
    - Validate all addresses with balances are discovered
    - Switch between pubkey contexts multiple times
    - Verify balances persist across all context switches
    - Manually query Pioneer API to confirm no missing balances
*/

require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG  = " | balance-scan-test | "
import { getChainEnumValue } from "@coinmasters/types";
const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
let SDK = require('@coinmasters/pioneer-sdk')
let wait = require('wait-promise');
let {ChainToNetworkId} = require('@pioneer-platform/pioneer-caip');
let sleep = wait.sleep;

import {
    getPaths,
} from '@pioneer-platform/pioneer-coins';

const test_balance_scan = async function (this: any) {
    let tag = TAG + " | test_balance_scan | "
    try {
        log.info(tag, "🏁 Starting Balance Scan Validation Suite");
        log.info(tag, "🕐 Start time:", new Date().toISOString());

        // Test configuration
        const queryKey = "sdk:balance-scan-test:"+Math.random();
        log.info(tag,"queryKey: ",queryKey)
        assert(queryKey)

        const username = "user:"+Math.random()
        assert(username)

        // Use local Pioneer server for testing
        let spec = 'http://127.0.0.1:9001/spec/swagger.json'

        // Test MAYA chain for CACAO balance validation
        let chains: string[] = ['MAYA']

        const allByCaip = chains.map(chainStr => {
            const chain = getChainEnumValue(chainStr);
            if (chain) {
                return ChainToNetworkId[chain];
            }
            return;
        });

        let blockchains = allByCaip.filter(Boolean)
        log.info(tag,"blockchains: ",blockchains)

        // Get default paths (includes address 0)
        let paths = getPaths(blockchains)
        log.info(tag,"Default paths: ",paths.length)

        // ===== PHASE 1: Add paths BEFORE init (indices 1-4) =====
        log.info(tag, '')
        log.info(tag, '📍 PHASE 1: Adding paths 1-4 BEFORE SDK init')
        log.info(tag, '   Testing path discovery with pre-init configuration')
        log.info(tag, '')

        const mayaNetwork = 'cosmos:mayachain-mainnet-v1'

        // Add MAYA paths for indices 1-4 BEFORE init
        for (let i = 1; i <= 4; i++) {
            paths.push({
                note: `MAYA account ${i} (pre-init)`,
                networks: [mayaNetwork],
                type: 'address',
                addressNList: [2147483692, 2147484579, 2147483648, 0, i],
                addressNListMaster: [2147483692, 2147484579, 2147483648, 0, i],
                curve: 'secp256k1',
                showDisplay: false
            })
            log.info(tag, `   Added path for address index ${i} (m/44'/931'/0'/0/${i})`)
        }

        let config:any = {
            username,
            queryKey,
            spec,
            keepkeyApiKey:process.env.KEEPKEY_API_KEY,
            blockchains,
            paths,
        };

        log.info(tag, "🔧 Creating SDK instance...");
        let app = new SDK.SDK(spec,config)

        log.info(tag, "🚀 Initializing SDK and connecting to device...");
        const initStart = Date.now();
        let resultInit = await app.init({}, {})
        const initTime = Date.now() - initStart;

        log.info(tag, `✅ SDK initialized in ${initTime}ms`);
        log.info(tag, "👛 Wallets found:", app.wallets.length);
        log.info(tag, "🔑 Pubkeys found:", app.pubkeys.length);
        log.info(tag, "💰 Initial balances found:", app.balances.length);

        // Log all MAYA pubkeys discovered after init
        const mayaPubkeys = app.pubkeys.filter((pk: any) => pk.networks?.includes(mayaNetwork));
        log.info(tag, '')
        log.info(tag, `📍 MAYA pubkeys after init: ${mayaPubkeys.length}`)
        mayaPubkeys.forEach((pk: any, idx: number) => {
            const addressIndex = pk.addressNList ? pk.addressNList[pk.addressNList.length - 1] : 'unknown';
            log.info(tag, `   ${idx + 1}. ${pk.note || 'unnamed'} - Address: ${pk.address || pk.pubkey}`)
            log.info(tag, `      Index: ${addressIndex}, Path: m/44'/931'/0'/0/${addressIndex}`)
        });
        log.info(tag, '')

        // Log all MAYA balances discovered
        const mayaBalances = app.balances.filter((b: any) =>
            b.caip?.startsWith('cosmos:mayachain-mainnet-v1')
        );
        log.info(tag, `💰 MAYA balances after init: ${mayaBalances.length}`)
        mayaBalances.forEach((b: any, idx: number) => {
            log.info(tag, `   ${idx + 1}. ${b.symbol || 'CACAO'}: ${b.balance} (${b.address || b.pubkey})`)
        });
        log.info(tag, '')

        // ===== PHASE 2: Add paths AFTER init (indices 5-8) =====
        log.info(tag, '')
        log.info(tag, '📍 PHASE 2: Adding paths 5-8 AFTER SDK init')
        log.info(tag, '   Testing dynamic path addition and balance discovery')
        log.info(tag, '')

        // Add MAYA paths for indices 5-8 AFTER init using app.addPath
        for (let i = 5; i <= 8; i++) {
            const newPath = {
                note: `MAYA account ${i} (post-init)`,
                networks: [mayaNetwork],
                type: 'address',
                addressNList: [2147483692, 2147484579, 2147483648, 0, i],
                addressNListMaster: [2147483692, 2147484579, 2147483648, 0, i],
                curve: 'secp256k1',
                showDisplay: false,
                script_type: 'mayachain' // Add script type for Cosmos chains
            }

            log.info(tag, `   Adding path for address index ${i}...`)
            try {
                await app.addPath(newPath);
                log.info(tag, `   ✅ Path ${i} added successfully`)
            } catch (err: any) {
                log.error(tag, `   ❌ Failed to add path ${i}:`, err.message)
            }
        }

        // Wait for balance sync
        await sleep(2000);

        // Re-check pubkeys and balances after adding new paths
        const mayaPubkeysAfter = app.pubkeys.filter((pk: any) => pk.networks?.includes(mayaNetwork));
        log.info(tag, '')
        log.info(tag, `📍 MAYA pubkeys after post-init additions: ${mayaPubkeysAfter.length}`)
        mayaPubkeysAfter.forEach((pk: any, idx: number) => {
            const addressIndex = pk.addressNList ? pk.addressNList[pk.addressNList.length - 1] : 'unknown';
            log.info(tag, `   ${idx + 1}. ${pk.note || 'unnamed'} - Address: ${pk.address || pk.pubkey}`)
            log.info(tag, `      Index: ${addressIndex}`)
        });
        log.info(tag, '')

        const mayaBalancesAfter = app.balances.filter((b: any) =>
            b.caip?.startsWith('cosmos:mayachain-mainnet-v1')
        );
        log.info(tag, `💰 MAYA balances after post-init additions: ${mayaBalancesAfter.length}`)
        mayaBalancesAfter.forEach((b: any, idx: number) => {
            log.info(tag, `   ${idx + 1}. ${b.symbol || 'CACAO'}: ${b.balance} (${b.address || b.pubkey})`)
        });
        log.info(tag, '')

        // ===== PHASE 3: Context Switching Validation =====
        log.info(tag, '')
        log.info(tag, '🔄 PHASE 3: Context Switching Validation')
        log.info(tag, '   Simulating vault behavior with multiple pubkey/asset switches')
        log.info(tag, '')

        const cacaoCaip = 'cosmos:mayachain-mainnet-v1/slip44:931';

        // Set initial asset context
        log.info(tag, `📌 Setting initial asset context: ${cacaoCaip}`)
        await app.setAssetContext({caip: cacaoCaip});

        // Verify asset context
        if (!app.assetContext) {
            throw new Error('❌ Asset context not set after setAssetContext!');
        }
        log.info(tag, `✅ Asset context set:`, {
            caip: app.assetContext.caip,
            symbol: app.assetContext.symbol,
            pubkeysCount: app.assetContext.pubkeys?.length || 0,
            balancesCount: app.assetContext.balances?.length || 0
        });

        // Store all addresses with non-zero balances for validation
        const addressesWithBalances = new Map<string, number>();
        mayaBalancesAfter.forEach((b: any) => {
            if (parseFloat(b.balance) > 0) {
                const addr = b.address || b.pubkey || 'unknown';
                addressesWithBalances.set(addr, parseFloat(b.balance));
            }
        });

        log.info(tag, '')
        log.info(tag, `📊 Addresses with non-zero balances: ${addressesWithBalances.size}`)
        addressesWithBalances.forEach((balance, address) => {
            log.info(tag, `   ${address}: ${balance} CACAO`)
        });
        log.info(tag, '')

        // Perform multiple context switches
        const switchCount = mayaPubkeysAfter.length;
        log.info(tag, `🔄 Performing ${switchCount} context switches...`)
        log.info(tag, '')

        for (let i = 0; i < switchCount; i++) {
            const pubkey = mayaPubkeysAfter[i];
            const addressIndex = pubkey.addressNList ? pubkey.addressNList[pubkey.addressNList.length - 1] : 'unknown';

            log.info(tag, `🔄 Switch ${i + 1}/${switchCount}: Switching to address index ${addressIndex}`)
            log.info(tag, `   Address: ${pubkey.address || pubkey.pubkey}`)
            log.info(tag, `   Note: ${pubkey.note || 'unnamed'}`)

            // Set pubkey context
            await app.setPubkeyContext(pubkey);
            log.info(tag, `   ✅ Pubkey context set`)

            // Verify pubkeyContext persisted
            if (!app.pubkeyContext) {
                throw new Error(`❌ pubkeyContext lost after switch to index ${addressIndex}!`);
            }

            // Re-set asset context (simulates vault behavior)
            await app.setAssetContext({caip: cacaoCaip});

            // Check if this address should have a balance
            const currentAddress = pubkey.address || pubkey.pubkey;
            const expectedBalance = addressesWithBalances.get(currentAddress);

            // Look up balance in app.balances
            const foundBalance = app.balances.find((b: any) =>
                (b.address === currentAddress || b.pubkey === currentAddress || b.master === pubkey.master) &&
                b.caip === cacaoCaip
            );

            if (expectedBalance !== undefined && expectedBalance > 0) {
                log.info(tag, `   💰 Expected balance: ${expectedBalance} CACAO`)

                if (foundBalance) {
                    const actualBalance = parseFloat(foundBalance.balance);
                    log.info(tag, `   💰 Found balance: ${actualBalance} CACAO`)

                    if (Math.abs(actualBalance - expectedBalance) < 0.00001) {
                        log.info(tag, `   ✅ Balance matches expected value`)
                    } else {
                        log.error(tag, `   ❌ BALANCE MISMATCH!`)
                        log.error(tag, `      Expected: ${expectedBalance}`)
                        log.error(tag, `      Found: ${actualBalance}`)
                        throw new Error(`Balance mismatch for address ${currentAddress}!`);
                    }
                } else {
                    log.error(tag, `   ❌ MISSING BALANCE!`)
                    log.error(tag, `      Address: ${currentAddress}`)
                    log.error(tag, `      Expected: ${expectedBalance} CACAO`)
                    log.error(tag, `      Found: Nothing in app.balances`)

                    // Debug: Show all balances for this CAIP
                    log.error(tag, `      All balances for ${cacaoCaip}:`)
                    app.balances.filter((b: any) => b.caip === cacaoCaip).forEach((b: any) => {
                        log.error(tag, `         - ${b.address || b.pubkey}: ${b.balance}`)
                    });

                    throw new Error(`Missing balance for address ${currentAddress} after context switch!`);
                }
            } else {
                log.info(tag, `   ℹ️  No balance expected for this address`)
                if (foundBalance && parseFloat(foundBalance.balance) > 0) {
                    log.warn(tag, `   ⚠️  Unexpected balance found: ${foundBalance.balance} CACAO`)
                }
            }

            log.info(tag, '')

            // Small delay between switches
            await sleep(500);
        }

        // ===== PHASE 4: Manual Pioneer API Validation =====
        log.info(tag, '')
        log.info(tag, '🔍 PHASE 4: Manual Pioneer API Validation')
        log.info(tag, '   Directly querying Pioneer API for all addresses')
        log.info(tag, '')

        // Query Pioneer API for each pubkey
        for (let i = 0; i < mayaPubkeysAfter.length; i++) {
            const pubkey = mayaPubkeysAfter[i];
            const addressIndex = pubkey.addressNList ? pubkey.addressNList[pubkey.addressNList.length - 1] : 'unknown';
            const address = pubkey.address || pubkey.pubkey;

            log.info(tag, `🔎 Querying Pioneer API for address index ${addressIndex}...`)
            log.info(tag, `   Address: ${address}`)

            try {
                // Query balance via Pioneer API
                const balanceResponse = await app.pioneer.GetBalance({
                    network: 'MAYA',
                    address: address
                });

                if (balanceResponse && balanceResponse.data) {
                    const apiBalance = parseFloat(balanceResponse.data.balance || '0');
                    log.info(tag, `   📊 API Response: ${apiBalance} CACAO`)

                    // Compare with SDK balance
                    const sdkBalance = app.balances.find((b: any) =>
                        (b.address === address || b.pubkey === address) &&
                        b.caip === cacaoCaip
                    );

                    if (sdkBalance) {
                        const sdkBalanceValue = parseFloat(sdkBalance.balance);
                        log.info(tag, `   💰 SDK Balance: ${sdkBalanceValue} CACAO`)

                        if (Math.abs(apiBalance - sdkBalanceValue) < 0.00001) {
                            log.info(tag, `   ✅ SDK and API balances match`)
                        } else {
                            log.error(tag, `   ❌ SDK/API BALANCE MISMATCH!`)
                            log.error(tag, `      API: ${apiBalance}`)
                            log.error(tag, `      SDK: ${sdkBalanceValue}`)
                        }
                    } else if (apiBalance > 0) {
                        log.error(tag, `   ❌ MISSING IN SDK!`)
                        log.error(tag, `      API shows ${apiBalance} CACAO`)
                        log.error(tag, `      But SDK has no balance for this address`)
                        throw new Error(`SDK missing balance for ${address} (API shows ${apiBalance} CACAO)`);
                    } else {
                        log.info(tag, `   ℹ️  No balance (confirmed by API)`)
                    }
                } else {
                    log.warn(tag, `   ⚠️  No response from Pioneer API`)
                }
            } catch (err: any) {
                log.error(tag, `   ❌ Error querying Pioneer API:`, err.message)
            }

            log.info(tag, '')
        }

        // ===== FINAL VALIDATION =====
        log.info(tag, '')
        log.info(tag, '📊 ===== FINAL VALIDATION SUMMARY =====')
        log.info(tag, '')
        log.info(tag, `✅ Total pubkeys discovered: ${mayaPubkeysAfter.length}`)
        log.info(tag, `✅ Total balances tracked: ${mayaBalancesAfter.length}`)
        log.info(tag, `✅ Addresses with funds: ${addressesWithBalances.size}`)
        log.info(tag, `✅ Context switches tested: ${switchCount}`)
        log.info(tag, '')

        // Verify no balances were lost
        let missingBalances = 0;
        addressesWithBalances.forEach((expectedBalance, address) => {
            const foundBalance = app.balances.find((b: any) =>
                (b.address === address || b.pubkey === address) &&
                b.caip === cacaoCaip
            );

            if (!foundBalance || parseFloat(foundBalance.balance) === 0) {
                log.error(tag, `❌ MISSING: ${address} should have ${expectedBalance} CACAO`)
                missingBalances++;
            }
        });

        if (missingBalances > 0) {
            throw new Error(`❌ TEST FAILED: ${missingBalances} address(es) with balances are missing or showing 0!`);
        }

        log.info(tag, '')
        log.info(tag, '========================================')
        log.info(tag, '✅ BALANCE SCAN TEST SUITE COMPLETED')
        log.info(tag, '   All balances discovered and maintained')
        log.info(tag, '   No data loss across context switches')
        log.info(tag, '========================================')
        log.info(tag, '')

    } catch (e) {
        log.error(tag, '❌ TEST FAILED:', e)
        process.exit(666)
    }
}

test_balance_scan()

/*
    E2E Staking Test Suite
    
    This test suite focuses on Cosmos staking operations:
    - Delegate to validators
    - Undelegate from validators  
    - Claim staking rewards
    - Validator API testing
    
    ============================================================================
    🔧 CONFIGURATION - Edit TEST_CONFIG object to enable/disable specific tests
    ============================================================================
    
    TEST_VALIDATOR_API: Test validator fetching APIs
    TEST_STAKING_POSITIONS_API: Test staking positions detection
    TEST_DIRECT_STAKING_API: Test direct staking API calls
    TEST_CLAIM_REWARDS: Test reward claiming (🎯 RECOMMENDED TO START)
    TEST_DELEGATE: Test delegation transactions
    TEST_UNDELEGATE: Test undelegation transactions
    TEST_STAKING_INTEGRATION: Test staking data integration
    ACTUALLY_EXECUTE_TRANSACTIONS: Set to true to actually execute transactions
    NETWORKS: Array of networks to test
    
    Example for reward claiming only:
    {
        TEST_CLAIM_REWARDS: true,
        TEST_DELEGATE: false,
        TEST_UNDELEGATE: false,
        ACTUALLY_EXECUTE_TRANSACTIONS: true,  // To actually claim rewards
        NETWORKS: ['GAIA']  // Cosmos Hub only
    }
*/

require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG = " | staking-e2e-test | "
// @ts-ignore
import { shortListSymbolToCaip, caipToNetworkId, networkIdToCaip } from '@pioneer-platform/pioneer-caip';
import { getChainEnumValue } from "@coinmasters/types";
const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
let SDK = require('@coinmasters/pioneer-sdk')
let wait = require('wait-promise');
let {ChainToNetworkId} = require('@pioneer-platform/pioneer-caip');
let sleep = wait.sleep;

import {
    getPaths,
    // @ts-ignore
} from '@pioneer-platform/pioneer-coins';

interface StakingPosition {
    type: 'delegation' | 'reward' | 'unbonding';
    balance: string;
    ticker: string;
    valueUsd: number;
    validator: string;
    validatorAddress: string;
    validatorMoniker?: string;
    validatorName?: string;
    networkId: string;
    caip: string;
}

interface Validator {
    address: string;
    moniker: string;
    commission: string;
    status: string;
    tokens: string;
    description?: {
        moniker: string;
        identity: string;
        website: string;
        details: string;
    };
}

const test_staking_service = async function () {
    let tag = TAG + " | test_staking_service | "
    try {
        console.time('staking-test-start');
        
        // 🎯 Simple Configuration - Focus on undelegation signing test
        const TEST_CONFIG = {
            TEST_VALIDATOR_API: false,
            TEST_STAKING_POSITIONS_API: true,   // Need to find existing delegations
            TEST_DIRECT_STAKING_API: true,      // 🔍 Enable to check direct API
            TEST_CLAIM_REWARDS: false,          // Disable for now
            TEST_DELEGATE: false,
            TEST_UNDELEGATE: true,              // 🎯 Enable undelegation test
            TEST_STAKING_INTEGRATION: false,
            ACTUALLY_EXECUTE_TRANSACTIONS: true, // 🚀 Enable to test actual signing
            NETWORKS: ['GAIA']                   // Cosmos Hub only
        };
        
        log.info(tag, "🔧 Test Configuration:", TEST_CONFIG);
        
        // Test configuration
        const queryKey = "sdk:staking-test:"+Math.random();
        log.info(tag, "queryKey: ", queryKey)
        
        const username = "staking-user:"+Math.random()
        assert(username)

        // Use local or remote Pioneer API
        let spec = process.env.PIONEER_SPEC || 'https://pioneers.dev/spec/swagger.json'
        // let spec = 'http://127.0.0.1:9001/spec/swagger.json'  // For local testing

        // Focus on Cosmos chains that support staking
        let stakingChains = TEST_CONFIG.NETWORKS

        const allByCaip = stakingChains.map(chainStr => {
            const chain = getChainEnumValue(chainStr);
            if (chain) {
                return ChainToNetworkId[chain];
            }
            return;
        }).filter(Boolean);
        
        let blockchains = allByCaip
        log.info(tag, "Staking blockchains: ", blockchains)

        // Get paths for staking chains
        let paths = getPaths(blockchains)
        log.info(tag, "Staking paths: ", paths.length)

        let config: any = {
            username,
            queryKey,
            spec,
            wss: process.env.VITE_PIONEER_URL_WSS || 'wss://pioneers.dev',
            keepkeyApiKey: process.env.KEEPKEY_API_KEY || 'e4ea6479-5ea4-4c7d-b824-e075101bf9fd',
            keepkeyEndpoint: 'http://127.0.0.1:1647',
            paths,
            blockchains,
            nodes: [],
            pubkeys: [],
            balances: [],
        };

        log.info(tag, "Initializing Pioneer SDK for staking tests...")
        log.info(tag, "🌐 WebSocket URL:", config.wss)
        log.info(tag, "🔑 KeepKey API Key:", config.keepkeyApiKey ? 'configured' : 'missing')
        log.info(tag, "🔌 KeepKey Endpoint:", config.keepkeyEndpoint)
        
        let app = new SDK.SDK(spec, config)
        let resultInit = await app.init({}, {})
        
        log.info(tag, "✅ Pioneer SDK initialized")
        
        // Manual step-by-step initialization like working test
        log.info(tag, "🔍 Starting getGasAssets()...")
        await app.getGasAssets()
        log.info(tag, "✅ getGasAssets() complete")
        
        log.info(tag, "🔍 Starting getPubkeys()...")
        await app.getPubkeys()
        log.info(tag, "✅ getPubkeys() complete - pubkeys count:", app.pubkeys.length)
        
        log.info(tag, "🔍 Starting getCharts()...")
        await app.getCharts()
        log.info(tag, "✅ getCharts() complete - balances count:", app.balances.length)

        // Verify basic requirements
        assert(app.blockchains, "Blockchains not initialized")
        assert(app.pubkeys, "Pubkeys not initialized")
        assert(app.balances, "Balances not initialized")
        assert(app.pioneer, "Pioneer API not initialized")
        
        // Debug: Check what we have after initialization
        log.info(tag, "📊 After initialization:")
        log.info(tag, `  - Pubkeys: ${app.pubkeys.length}`)
        log.info(tag, `  - Balances: ${app.balances.length}`)
        log.info(tag, `  - KeepKey SDK: ${app.keepKeySdk ? 'initialized' : 'not initialized'}`)
        
        if (app.pubkeys.length > 0) {
            log.info(tag, "🔑 Available pubkeys:")
            app.pubkeys.forEach((pubkey: any, index: number) => {
                log.info(tag, `  ${index + 1}. ${pubkey.address} (${pubkey.networks.join(', ')})`)
            })
        }
        
        if (app.balances.length > 0) {
            log.info(tag, "💰 Available balances:")
            app.balances.slice(0, 10).forEach((balance: any, index: number) => {
                log.info(tag, `  ${index + 1}. ${balance.balance} ${balance.ticker} (${balance.type || 'normal'})`)
            })
        }

        // **TEST 1: Validator API Testing**
        if (TEST_CONFIG.TEST_VALIDATOR_API) {
            log.info(tag, "")
            log.info(tag, "=".repeat(60))
            log.info(tag, "🧪 TEST 1: Validator API Testing")
            log.info(tag, "=".repeat(60))
        } else {
            log.info(tag, "⏭️ Skipping TEST 1: Validator API Testing")
        }
        
        const validatorTests = new Map<string, Validator[]>()
        
        if (TEST_CONFIG.TEST_VALIDATOR_API) {
            for (const networkId of blockchains) {
                log.info(tag, `Testing validator API for ${networkId}...`)
                
                try {
                    let network: string;
                    if (networkId === 'cosmos:cosmoshub-4') {
                        network = 'cosmos';
                    } else if (networkId === 'cosmos:osmosis-1') {
                        network = 'osmosis';
                    } else {
                        log.warn(tag, `Unsupported networkId for validator testing: ${networkId}`)
                        continue;
                    }
                    
                    // Test GetValidators API
                    log.info(tag, `Fetching validators for ${network}...`)
                    const validatorsResponse = await app.pioneer.GetValidators({ network })
                    
                    if (validatorsResponse && validatorsResponse.data && validatorsResponse.data.length > 0) {
                        const validators = validatorsResponse.data
                        log.info(tag, `✅ Found ${validators.length} validators for ${network}`)
                        
                        // Validate validator structure
                        const firstValidator = validators[0]
                        assert(firstValidator.address, `Validator missing address`)
                        assert(firstValidator.moniker, `Validator missing moniker`)
                        assert(firstValidator.commission !== undefined, `Validator missing commission`)
                        assert(firstValidator.status, `Validator missing status`)
                        
                        // Store for later use in delegation tests
                        validatorTests.set(networkId, validators.slice(0, 3)) // Keep top 3 validators
                        
                        // Log sample validators
                        log.info(tag, `Sample validators for ${network}:`)
                        validators.slice(0, 3).forEach((validator: Validator, index: number) => {
                            log.info(tag, `  ${index + 1}. ${validator.moniker} - ${(parseFloat(validator.commission) * 100).toFixed(2)}% commission`)
                        })
                    } else {
                        log.warn(tag, `⚠️ No validators found for ${network}`)
                    }
                    
                } catch (error) {
                    log.error(tag, `❌ Error fetching validators for ${networkId}:`, error)
                    // Continue with other networks
                }
            }
        }

        // **TEST 2: Existing Staking Positions Detection**
        if (TEST_CONFIG.TEST_STAKING_POSITIONS_API) {
            log.info(tag, "")
            log.info(tag, "=".repeat(60))
            log.info(tag, "🧪 TEST 2: Existing Staking Positions Detection")
            log.info(tag, "=".repeat(60))
        } else {
            log.info(tag, "⏭️ Skipping TEST 2: Existing Staking Positions Detection")
        }
        
        // Find existing staking positions
        let existingStakingPositions: any[] = []
        
        if (TEST_CONFIG.TEST_STAKING_POSITIONS_API) {
            existingStakingPositions = app.balances.filter((balance: any) => 
                balance.chart === 'staking' || balance.type === 'delegation' || balance.type === 'reward' || balance.type === 'unbonding'
            )
            
            log.info(tag, `Found ${existingStakingPositions.length} existing staking positions`)
            
            if (existingStakingPositions.length > 0) {
                log.info(tag, "📊 Existing staking positions:")
                existingStakingPositions.forEach((position: any, index: number) => {
                    log.info(tag, `  ${index + 1}. ${position.type} - ${position.balance} ${position.ticker} (${position.validator || 'N/A'})`)
                })
            } else {
                log.info(tag, "ℹ️ No existing staking positions found")
            }
        }

        // **TEST 3: Direct Staking Position API Testing**
        if (TEST_CONFIG.TEST_DIRECT_STAKING_API) {
            log.info(tag, "")
            log.info(tag, "=".repeat(60))
            log.info(tag, "🧪 TEST 3: Direct Staking Position API Testing")
            log.info(tag, "=".repeat(60))
        } else {
            log.info(tag, "⏭️ Skipping TEST 3: Direct Staking Position API Testing")
        }
        
        const stakingPositionsByNetwork = new Map<string, StakingPosition[]>()
        
        if (TEST_CONFIG.TEST_DIRECT_STAKING_API) {
            for (const networkId of blockchains) {
            log.info(tag, `Testing staking positions API for ${networkId}...`)
            
            // Find pubkeys for this network
            const networkPubkeys = app.pubkeys.filter((pubkey: any) => 
                pubkey.networks.includes(networkId)
            )
            
            if (networkPubkeys.length === 0) {
                log.warn(tag, `No pubkeys found for ${networkId}`)
                continue
            }
            
            try {
                let network: string;
                if (networkId === 'cosmos:cosmoshub-4') {
                    network = 'cosmos';
                } else if (networkId === 'cosmos:osmosis-1') {
                    network = 'osmosis';
                } else {
                    log.warn(tag, `Unsupported networkId for staking positions: ${networkId}`)
                    continue;
                }
                
                for (const pubkey of networkPubkeys) {
                    log.info(tag, `Checking staking positions for ${pubkey.address} on ${network}...`)
                    
                    const stakingResponse = await app.pioneer.GetStakingPositions({
                        network: network,
                        address: pubkey.address
                    })
                    
                    if (stakingResponse && stakingResponse.data && stakingResponse.data.length > 0) {
                        const positions = stakingResponse.data
                        log.info(tag, `✅ Found ${positions.length} staking positions for ${pubkey.address}`)
                        
                        // Store positions for later use
                        stakingPositionsByNetwork.set(networkId, positions)
                        
                        // Also add to existingStakingPositions for reward claiming
                        positions.forEach((position: StakingPosition) => {
                            // Add missing fields for compatibility
                            if (!position.networkId) position.networkId = networkId
                            if (!position.caip) position.caip = networkIdToCaip(networkId) || networkId
                            existingStakingPositions.push(position)
                        })
                        
                        // Log position details
                        positions.forEach((position: StakingPosition, index: number) => {
                            log.info(tag, `  ${index + 1}. ${position.type}: ${position.balance} ${position.ticker} (${position.validator})`)
                        })
                        
                        // Debug: Log the actual API response structure
                        log.info(tag, `Raw API response for ${network}:`, JSON.stringify(positions, null, 2))
                        
                        // Validate position structure
                        positions.forEach((position: StakingPosition, index: number) => {
                            log.info(tag, `🔍 DEBUG: Position ${index + 1} detailed structure:`, {
                                type: position.type,
                                balance: position.balance,
                                ticker: position.ticker,
                                validator: position.validator,
                                validatorAddress: position.validatorAddress,
                                validatorMoniker: position.validatorMoniker,
                                validatorName: position.validatorName,
                                allKeys: Object.keys(position)
                            });
                            
                            log.info(tag, `Position ${index + 1} raw data:`, position)
                            assert(position.type, 'Position must have type')
                            assert(position.balance, 'Position must have balance')
                            assert(position.ticker, 'Position must have ticker')
                            
                            if (position.type === 'delegation') {
                                if (!position.validatorAddress) {
                                    log.error(tag, `❌ CRITICAL: Delegation position missing validatorAddress`)
                                    log.error(tag, `Position data:`, position)
                                    log.error(tag, `Available fields:`, Object.keys(position))
                                    throw new Error(`API response missing validatorAddress for delegation position. This is required for transactions.`)
                                }
                            }
                            
                            if (position.type === 'reward') {
                                if (!position.validatorAddress) {
                                    log.error(tag, `❌ CRITICAL: Reward position missing validatorAddress`)
                                    log.error(tag, `Position data:`, position)
                                    log.error(tag, `Available fields:`, Object.keys(position))
                                    throw new Error(`API response missing validatorAddress for reward position. This is required for claiming rewards.`)
                                }
                            }
                        })
                        
                        break // Found positions for this network, no need to check other pubkeys
                    } else {
                        log.info(tag, `ℹ️ No staking positions found for ${pubkey.address} on ${network}`)
                    }
                }
                
            } catch (error) {
                log.error(tag, `❌ Error fetching staking positions for ${networkId}:`, error)
                // Continue with other networks
            }
        }
        }

        // **TEST 4: Undelegation Flow Testing**
        if (TEST_CONFIG.TEST_UNDELEGATE) {
            log.info(tag, "")
            log.info(tag, "=".repeat(60))
            log.info(tag, "🧪 TEST 4: Undelegation Flow Testing")
            log.info(tag, "=".repeat(60))
        } else {
            log.info(tag, "⏭️ Skipping TEST 4: Undelegation Flow Testing")
        }
        
        if (TEST_CONFIG.TEST_UNDELEGATE) {
            // Find delegation positions to undelegate from
            const delegationPositions = existingStakingPositions.filter((position: any) => 
                position.type === 'delegation' && parseFloat(position.balance) > 0
            )
            
            if (delegationPositions.length > 0) {
                log.info(tag, `Found ${delegationPositions.length} delegation positions available for undelegation`)
                
                // Test undelegation with the first delegation position
                const targetDelegation = delegationPositions[0]
                log.info(tag, `🎯 Testing undelegation from: ${targetDelegation.validator}`)
                log.info(tag, `📊 Current delegation: ${targetDelegation.balance} ${targetDelegation.ticker}`)
                
                const networkId = targetDelegation.networkId || caipToNetworkId(targetDelegation.caip)
                const caip = targetDelegation.caip
                
                // Set asset context for undelegation
                await app.setAssetContext({ caip })
                
                // Calculate small undelegation amount (10% of current delegation)
                const currentBalance = parseFloat(targetDelegation.balance)
                const undelegateAmount = Math.max(0.01, currentBalance * 0.1) // At least 0.01 or 10%
                
                log.info(tag, `📉 Attempting to undelegate ${undelegateAmount} ${targetDelegation.ticker}...`)
                
                try {
                    // Build undelegation transaction
                    const undelegatePayload = {
                        validatorAddress: targetDelegation.validatorAddress || targetDelegation.validator,
                        amount: undelegateAmount,
                        memo: 'E2E Undelegation Test'
                    }
                    
                    log.info(tag, `🔨 Building undelegation transaction...`)
                    log.info(tag, `📤 Payload:`, undelegatePayload)
                    
                    // Test actual undelegation transaction building
                    try {
                        const unsignedTx = await app.buildUndelegateTx(caip, undelegatePayload)
                        log.info(tag, `✅ Undelegation transaction built successfully`)
                        log.info(tag, `📋 Transaction structure:`, JSON.stringify(unsignedTx, null, 2))
                        
                        // Validate transaction structure
                        assert(unsignedTx.signDoc, 'Transaction must have signDoc')
                        assert(unsignedTx.signDoc.msgs, 'Transaction must have messages')
                        assert(unsignedTx.signDoc.msgs[0].type === 'cosmos-sdk/MsgUndelegate', 'Must be MsgUndelegate')
                        assert(unsignedTx.signDoc.msgs[0].value.delegator_address, 'Must have delegator_address')
                        assert(unsignedTx.signDoc.msgs[0].value.validator_address, 'Must have validator_address')
                        assert(unsignedTx.signDoc.msgs[0].value.amount, 'Must have amount')
                        
                        log.info(tag, `✅ Undelegation transaction structure validated`)
                        
                        if (TEST_CONFIG.ACTUALLY_EXECUTE_TRANSACTIONS) {
                            log.info(tag, `🚀 EXECUTING UNDELEGATION TRANSACTION...`)
                            log.info(tag, `⚠️ This will start unbonding period (21 days for Cosmos)`)
                            
                            // Sign the transaction
                            log.info(tag, `✍️ Signing transaction...`)
                            const signedTx = await app.signTx({ caip, unsignedTx })
                            log.info(tag, `✅ Transaction signed successfully`)
                            
                            // Broadcast the transaction
                            log.info(tag, `📡 Broadcasting transaction...`)
                            const broadcast = await app.broadcastTx(caip, signedTx)
                            log.info(tag, `✅ Transaction broadcasted:`, broadcast)
                            
                            // Follow the transaction
                            log.info(tag, `👀 Following transaction...`)
                            const followResult = await app.followTransaction(caip, broadcast)
                            log.info(tag, `✅ Transaction completed:`, followResult)
                            
                        } else {
                            log.info(tag, `ℹ️ Skipping execution - set ACTUALLY_EXECUTE_TRANSACTIONS to true to execute`)
                        }
                        
                    } catch (buildError) {
                        log.error(tag, `❌ Error building undelegation transaction:`, buildError)
                        // Continue with test - this is expected if no actual delegation exists
                    }
                    
                } catch (error) {
                    log.error(tag, `❌ Error in undelegation flow:`, error)
                }
                
            } else {
                log.info(tag, `ℹ️ No delegation positions found for undelegation testing`)
            }
        }

        // **TEST 5: Delegation Flow Testing**
        if (TEST_CONFIG.TEST_DELEGATE) {
            log.info(tag, "")
            log.info(tag, "=".repeat(60))
            log.info(tag, "🧪 TEST 5: Delegation Flow Testing")
            log.info(tag, "=".repeat(60))
        } else {
            log.info(tag, "⏭️ Skipping TEST 5: Delegation Flow Testing")
        }
        
        if (TEST_CONFIG.TEST_DELEGATE) {
            // Test delegation for each network with available balance
            for (const networkId of blockchains) {
                log.info(tag, `Testing delegation flow for ${networkId}...`)
                
                const caip = networkIdToCaip(networkId)
                if (!caip) {
                    log.warn(tag, `Could not convert networkId to CAIP: ${networkId}`)
                    continue
                }
                
                // Find available balance for delegation
                const availableBalance = app.balances.find((balance: any) => 
                    balance.caip === caip && balance.chart !== 'staking'
                )
                
                if (!availableBalance || parseFloat(availableBalance.balance) <= 0) {
                    log.info(tag, `ℹ️ No available balance for delegation on ${networkId}`)
                    continue
                }
                
                // Get validators for this network
                const validators = validatorTests.get(networkId)
                if (!validators || validators.length === 0) {
                    log.info(tag, `ℹ️ No validators available for delegation on ${networkId}`)
                    continue
                }
                
                // Set asset context
                await app.setAssetContext({ caip })
                
                // Calculate small delegation amount
                const currentBalance = parseFloat(availableBalance.balance)
                const delegateAmount = Math.min(0.1, currentBalance * 0.1) // Max 0.1 or 10% of balance
                
                if (delegateAmount < 0.01) {
                    log.info(tag, `ℹ️ Balance too low for delegation test on ${networkId}`)
                    continue
                }
                
                // Select first validator for delegation
                const targetValidator = validators[0]
                
                log.info(tag, `🎯 Testing delegation to: ${targetValidator.moniker}`)
                log.info(tag, `💰 Available balance: ${currentBalance} ${availableBalance.ticker}`)
                log.info(tag, `📈 Delegation amount: ${delegateAmount} ${availableBalance.ticker}`)
                
                try {
                    // Build delegation transaction payload
                    const delegatePayload = {
                        validatorAddress: targetValidator.address,
                        amount: delegateAmount,
                        memo: 'E2E Delegation Test'
                    }
                    
                    log.info(tag, `🔨 Building delegation transaction...`)
                    log.info(tag, `📤 Payload:`, delegatePayload)
                    
                    // Test actual delegation transaction building
                    try {
                        const unsignedTx = await app.buildDelegateTx(caip, delegatePayload)
                        log.info(tag, `✅ Delegation transaction built successfully`)
                        log.info(tag, `📋 Transaction structure:`, JSON.stringify(unsignedTx, null, 2))
                        
                        // Validate transaction structure
                        assert(unsignedTx.signDoc, 'Transaction must have signDoc')
                        assert(unsignedTx.signDoc.msgs, 'Transaction must have messages')
                        assert(unsignedTx.signDoc.msgs[0].type === 'cosmos-sdk/MsgDelegate', 'Must be MsgDelegate')
                        assert(unsignedTx.signDoc.msgs[0].value.delegator_address, 'Must have delegator_address')
                        assert(unsignedTx.signDoc.msgs[0].value.validator_address, 'Must have validator_address')
                        assert(unsignedTx.signDoc.msgs[0].value.amount, 'Must have amount')
                        
                        log.info(tag, `✅ Delegation transaction structure validated`)
                        
                        if (TEST_CONFIG.ACTUALLY_EXECUTE_TRANSACTIONS) {
                            log.info(tag, `🚀 EXECUTING DELEGATION TRANSACTION...`)
                            
                            // Sign the transaction
                            log.info(tag, `✍️ Signing transaction...`)
                            const signedTx = await app.signTx({ caip, unsignedTx })
                            log.info(tag, `✅ Transaction signed successfully`)
                            
                            // Broadcast the transaction
                            log.info(tag, `📡 Broadcasting transaction...`)
                            const broadcast = await app.broadcastTx(caip, signedTx)
                            log.info(tag, `✅ Transaction broadcasted:`, broadcast)
                            
                            // Follow the transaction
                            log.info(tag, `👀 Following transaction...`)
                            const followResult = await app.followTransaction(caip, broadcast)
                            log.info(tag, `✅ Transaction completed:`, followResult)
                            
                        } else {
                            log.info(tag, `ℹ️ Skipping execution - set ACTUALLY_EXECUTE_TRANSACTIONS to true to execute`)
                        }
                        
                    } catch (buildError) {
                        log.error(tag, `❌ Error building delegation transaction:`, buildError)
                        // Continue with test - this is expected if no balance available
                    }
                    
                } catch (error) {
                    log.error(tag, `❌ Error in delegation flow:`, error)
                }
            }
        }

        // **TEST 6: Reward Claiming Testing**
        if (TEST_CONFIG.TEST_CLAIM_REWARDS) {
            log.info(tag, "")
            log.info(tag, "=".repeat(60))
            log.info(tag, "🧪 TEST 6: Reward Claiming Testing")
            log.info(tag, "=".repeat(60))
        } else {
            log.info(tag, "⏭️ Skipping TEST 6: Reward Claiming Testing")
        }
        
        if (TEST_CONFIG.TEST_CLAIM_REWARDS) {
            // Find reward positions
            const rewardPositions = existingStakingPositions.filter((position: any) => 
                position.type === 'reward' && parseFloat(position.balance) > 0
            )
            
            if (rewardPositions.length > 0) {
                log.info(tag, `Found ${rewardPositions.length} reward positions available for claiming`)
                
                rewardPositions.forEach((reward: any, index: number) => {
                    log.info(tag, `  ${index + 1}. ${reward.balance} ${reward.ticker} from ${reward.validatorAddress}`)
                })
                
                // Test reward claiming with the first reward position
                const targetReward = rewardPositions[0]
                const networkId = targetReward.networkId || caipToNetworkId(targetReward.caip)
                const caip = targetReward.caip
                
                log.info(tag, `🎯 Testing reward claiming for: ${targetReward.validatorAddress}`)
                log.info(tag, `💰 Available rewards: ${targetReward.balance} ${targetReward.ticker}`)
                
                try {
                    // Build reward claiming transaction payload
                    const claimPayload = {
                        validatorAddress: targetReward.validatorAddress,
                        memo: 'E2E Reward Claim Test'
                    }
                    
                    log.info(tag, `🔨 Building reward claim transaction...`)
                    log.info(tag, `📤 Payload:`, claimPayload)
                    
                    // Test actual reward claiming transaction building
                    try {
                        const unsignedTx = await app.buildClaimRewardsTx(caip, claimPayload)
                        log.info(tag, `✅ Reward claim transaction built successfully`)
                        log.info(tag, `📋 Transaction structure:`, JSON.stringify(unsignedTx, null, 2))
                        
                        // Validate transaction structure
                        assert(unsignedTx.signDoc, 'Transaction must have signDoc')
                        assert(unsignedTx.signDoc.msgs, 'Transaction must have messages')
                        assert(unsignedTx.signDoc.msgs[0].type === 'cosmos-sdk/MsgWithdrawDelegationReward', 'Must be MsgWithdrawDelegationReward')
                        assert(unsignedTx.signDoc.msgs[0].value.delegator_address, 'Must have delegator_address')
                        assert(unsignedTx.signDoc.msgs[0].value.validator_address, 'Must have validator_address')
                        
                        log.info(tag, `✅ Reward claim transaction structure validated`)
                        
                        if (TEST_CONFIG.ACTUALLY_EXECUTE_TRANSACTIONS) {
                            log.info(tag, `🚀 EXECUTING REWARD CLAIM TRANSACTION...`)
                            
                            // Sign the transaction
                            log.info(tag, `✍️ Signing transaction...`)
                            log.info(tag, `📋 Signing with CAIP: ${caip}`)
                            log.info(tag, `📋 Signing with unsignedTx keys: ${Object.keys(unsignedTx)}`)
                            const signedTx = await app.signTx({ caip, unsignedTx })
                            log.info(tag, `✅ Transaction signed successfully`)
                            
                            // Broadcast the transaction
                            log.info(tag, `📡 Broadcasting transaction...`)
                            const broadcast = await app.broadcastTx(caip, signedTx)
                            log.info(tag, `✅ Transaction broadcasted:`, broadcast)
                            
                            // Follow the transaction
                            log.info(tag, `👀 Following transaction...`)
                            const followResult = await app.followTransaction(caip, broadcast)
                            log.info(tag, `✅ Transaction completed:`, followResult)
                            
                        } else {
                            log.info(tag, `ℹ️ Skipping execution - set ACTUALLY_EXECUTE_TRANSACTIONS to true to execute`)
                        }
                        
                    } catch (buildError) {
                        log.error(tag, `❌ Error building reward claim transaction:`, buildError)
                        // Continue with test - this is expected if no rewards available
                    }
                    
                } catch (error) {
                    log.error(tag, `❌ Error in reward claiming flow:`, error)
                }
                
            } else {
                log.info(tag, `ℹ️ No reward positions found for claiming testing`)
                
                // Try to find delegation positions that might have rewards
                const delegationPositions = existingStakingPositions.filter((position: any) => 
                    position.type === 'delegation' && parseFloat(position.balance) > 0
                )
                
                if (delegationPositions.length > 0) {
                    log.info(tag, `💡 Found ${delegationPositions.length} delegation positions that might have rewards:`)
                    delegationPositions.forEach((delegation: any, index: number) => {
                        log.info(tag, `  ${index + 1}. ${delegation.balance} ${delegation.ticker} delegated to ${delegation.validatorAddress}`)
                    })
                    
                    // Test claiming ALL rewards from all delegations
                    const validatorAddresses = delegationPositions.map((delegation: any) => 
                        delegation.validatorAddress
                    )
                    
                    const caip = delegationPositions[0].caip
                    
                    log.info(tag, `🎯 Testing CLAIM ALL REWARDS from ${validatorAddresses.length} validators`)
                    
                    try {
                        const claimAllPayload = {
                            validatorAddresses: validatorAddresses,
                            memo: 'E2E Claim All Rewards Test'
                        }
                        
                        log.info(tag, `🔨 Building claim all rewards transaction...`)
                        log.info(tag, `📤 Payload:`, claimAllPayload)
                        
                        const unsignedTx = await app.buildClaimAllRewardsTx(caip, claimAllPayload)
                        log.info(tag, `✅ Claim all rewards transaction built successfully`)
                        log.info(tag, `📋 Transaction structure:`, JSON.stringify(unsignedTx, null, 2))
                        
                        // Validate transaction structure
                        assert(unsignedTx.signDoc, 'Transaction must have signDoc')
                        assert(unsignedTx.signDoc.msgs, 'Transaction must have messages')
                        assert(unsignedTx.signDoc.msgs.length === validatorAddresses.length, `Must have ${validatorAddresses.length} messages`)
                        
                        // Validate each message
                        unsignedTx.signDoc.msgs.forEach((msg: any, index: number) => {
                            assert(msg.type === 'cosmos-sdk/MsgWithdrawDelegationReward', `Message ${index} must be MsgWithdrawDelegationReward`)
                            assert(msg.value.delegator_address, `Message ${index} must have delegator_address`)
                            assert(msg.value.validator_address, `Message ${index} must have validator_address`)
                        })
                        
                        log.info(tag, `✅ Claim all rewards transaction structure validated`)
                        
                        if (TEST_CONFIG.ACTUALLY_EXECUTE_TRANSACTIONS) {
                            log.info(tag, `🚀 EXECUTING CLAIM ALL REWARDS TRANSACTION...`)
                            log.info(tag, `💰 Claiming rewards from ${validatorAddresses.length} validators`)
                            
                            // Sign the transaction
                            log.info(tag, `✍️ Signing transaction...`)
                            const signedTx = await app.signTx({ caip, unsignedTx })
                            log.info(tag, `✅ Transaction signed successfully`)
                            
                            // Broadcast the transaction
                            log.info(tag, `📡 Broadcasting transaction...`)
                            const broadcast = await app.broadcastTx(caip, signedTx)
                            log.info(tag, `✅ Transaction broadcasted:`, broadcast)
                            
                            // Follow the transaction
                            log.info(tag, `👀 Following transaction...`)
                            const followResult = await app.followTransaction(caip, broadcast)
                            log.info(tag, `✅ Transaction completed:`, followResult)
                            
                        } else {
                            log.info(tag, `ℹ️ Skipping execution - set ACTUALLY_EXECUTE_TRANSACTIONS to true to execute`)
                        }
                        
                    } catch (buildError) {
                        log.error(tag, `❌ Error building claim all rewards transaction:`, buildError)
                    }
                }
            }
        }

        // **TEST 7: Staking Integration Validation**
        if (TEST_CONFIG.TEST_STAKING_INTEGRATION) {
            log.info(tag, "")
            log.info(tag, "=".repeat(60))
            log.info(tag, "🧪 TEST 7: Staking Integration Validation")
            log.info(tag, "=".repeat(60))
        } else {
            log.info(tag, "⏭️ Skipping TEST 7: Staking Integration Validation")
        }
        
        if (TEST_CONFIG.TEST_STAKING_INTEGRATION) {
            // Validate that staking positions are properly integrated into the app
            const allStakingInBalances = app.balances.filter((balance: any) => 
                balance.chart === 'staking' || ['delegation', 'reward', 'unbonding'].includes(balance.type)
            )
            
            log.info(tag, `Total staking positions in app.balances: ${allStakingInBalances.length}`)
            
            if (allStakingInBalances.length > 0) {
                const delegations = allStakingInBalances.filter((p: any) => p.type === 'delegation')
                const rewards = allStakingInBalances.filter((p: any) => p.type === 'reward')
                const unbonding = allStakingInBalances.filter((p: any) => p.type === 'unbonding')
                
                log.info(tag, `📊 Breakdown:`)
                log.info(tag, `  - Delegations: ${delegations.length}`)
                log.info(tag, `  - Rewards: ${rewards.length}`)
                log.info(tag, `  - Unbonding: ${unbonding.length}`)
                
                // Validate pricing integration
                const stakingWithPricing = allStakingInBalances.filter((p: any) => 
                    p.priceUsd && p.priceUsd > 0 && p.valueUsd && p.valueUsd > 0
                )
                
                log.info(tag, `💰 Positions with pricing: ${stakingWithPricing.length}/${allStakingInBalances.length}`)
                
                // Calculate total staking value
                const totalStakingValue = allStakingInBalances.reduce((sum: number, position: any) => 
                    sum + (parseFloat(position.valueUsd) || 0), 0
                )
                
                log.info(tag, `💵 Total staking value: $${totalStakingValue.toFixed(2)}`)
            }
        }

        // **TEST RESULTS VALIDATION**
        log.info(tag, "")
        log.info(tag, "=".repeat(60))
        log.info(tag, "🏁 STAKING TEST SUITE RESULTS")
        log.info(tag, "=".repeat(60))
        
        console.timeEnd('staking-test-start')
        
        // Check critical requirements for test success
        let testsPassed = 0
        let testsTotal = 0
        let criticalFailures = []
        
        // CRITICAL: KeepKey device connection
        testsTotal++
        if (app.pubkeys.length > 0) {
            log.info(tag, `✅ KeepKey device connected: ${app.pubkeys.length} pubkeys loaded`)
            testsPassed++
        } else {
            log.error(tag, `❌ CRITICAL FAILURE: KeepKey device not connected (0 pubkeys)`)
            criticalFailures.push("KeepKey device not connected - no pubkeys loaded")
        }
        
        // CRITICAL: Staking positions found
        testsTotal++
        if (existingStakingPositions.length > 0) {
            log.info(tag, `✅ Staking positions found: ${existingStakingPositions.length}`)
            testsPassed++
        } else {
            log.error(tag, `❌ CRITICAL FAILURE: No staking positions found`)
            criticalFailures.push("No staking positions found - nothing to claim rewards from")
        }
        
        // CRITICAL: Transaction execution (if enabled)
        if (TEST_CONFIG.ACTUALLY_EXECUTE_TRANSACTIONS) {
            testsTotal++
            // This will be updated by the transaction execution logic
            log.info(tag, `⏳ Transaction execution: Checking if any transactions were executed...`)
            
            // For now, mark as failed since we know no transactions were executed
            log.error(tag, `❌ CRITICAL FAILURE: No transactions were executed`)
            criticalFailures.push("No transactions were executed - test set to execute but nothing happened")
        }
        
        // Final test result
        log.info(tag, "")
        log.info(tag, "=".repeat(60))
        if (criticalFailures.length > 0) {
            log.error(tag, "❌ STAKING TEST SUITE FAILED!")
            log.error(tag, "")
            log.error(tag, "💥 CRITICAL FAILURES:")
            criticalFailures.forEach((failure, index) => {
                log.error(tag, `  ${index + 1}. ${failure}`)
            })
            log.error(tag, "")
            log.error(tag, "🔧 TO FIX:")
            log.error(tag, "  1. Connect and unlock your KeepKey device")
            log.error(tag, "  2. Ensure you have existing staking positions with rewards")
            log.error(tag, "  3. Make sure your device is properly paired")
            log.error(tag, "")
            
            // Exit with error code
            process.exit(1)
        } else {
            log.info(tag, "🎉 STAKING TEST SUITE COMPLETED SUCCESSFULLY!")
            log.info(tag, `📊 Tests passed: ${testsPassed}/${testsTotal}`)
        }
        log.info(tag, "")
        
        // All staking functionality is now implemented and ready to use:
        log.info(tag, "✅ Implementation Status:")
        log.info(tag, "  ✅ buildDelegateTx() method - IMPLEMENTED")
        log.info(tag, "  ✅ buildUndelegateTx() method - IMPLEMENTED") 
        log.info(tag, "  ✅ buildClaimRewardsTx() method - IMPLEMENTED")
        log.info(tag, "  ✅ buildClaimAllRewardsTx() method - IMPLEMENTED")
        log.info(tag, "  ✅ Staking transaction templates - IMPLEMENTED")
        log.info(tag, "  ✅ KeepKey SDK staking signing methods - IMPLEMENTED")
        log.info(tag, "")
        log.info(tag, "💡 To test staking functionality:")
        log.info(tag, "  1. Make sure your KeepKey device is connected and unlocked")
        log.info(tag, "  2. Ensure you have existing staking positions with rewards")
        log.info(tag, "  3. Run this test - it will ask you to sign transactions if positions are found")
        
    } catch (e) {
        log.error(tag, "❌ STAKING TEST FAILED:", e)
        process.exit(1)
    }
}

// Run the staking test suite
test_staking_service()

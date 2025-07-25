#!/usr/bin/env node

/**
 * Fix missing device metadata for cached pubkeys
 * This will allow the portfolio endpoint to see paired devices
 */

async function fixDeviceMetadata() {
    console.log('🔧 Fixing missing device metadata for cached pubkeys...');
    
    try {
        // Check current status
        console.log('📊 Checking current cache status...');
        const statusResponse = await fetch('http://localhost:1646/api/cache/status');
        const status = await statusResponse.json();
        console.log('Current status:', status);
        
        if (status.cached_pubkeys === 0) {
            console.log('❌ No cached pubkeys found - nothing to fix');
            return;
        }
        
        // Check current portfolio
        console.log('\n🏦 Checking current portfolio...');
        const portfolioResponse = await fetch('http://localhost:1646/api/portfolio');
        const portfolio = await portfolioResponse.json();
        console.log('Current portfolio:', portfolio);
        
        if (portfolio.pairedDevices > 0) {
            console.log('✅ Device metadata already exists - no fix needed');
            return;
        }
        
        console.log(`\n🎯 PROBLEM: ${status.cached_pubkeys} pubkeys but ${portfolio.pairedDevices} paired devices`);
        console.log('💡 This means device metadata is missing from cache_metadata table');
        
        // The issue is that we can't directly write to SQLite from JavaScript
        // But we can trigger the vault to create metadata by calling an API
        
        console.log('\n🔄 Attempting to trigger vault self-healing...');
        
        // Try to trigger a portfolio refresh which should detect the issue
        try {
            const refreshResponse = await fetch('http://localhost:1646/api/portfolio?refresh=true');
            const refreshData = await refreshResponse.json();
            console.log('Refresh response:', refreshData);
        } catch (error) {
            console.log('Refresh failed (expected):', error.message);
        }
        
        // Check if vault created device metadata
        console.log('\n🔍 Checking if device metadata was created...');
        const portfolioAfter = await fetch('http://localhost:1646/api/portfolio');
        const portfolioAfterData = await portfolioAfter.json();
        console.log('Portfolio after refresh:', portfolioAfterData);
        
        if (portfolioAfterData.pairedDevices > 0) {
            console.log('✅ SUCCESS: Device metadata was created!');
            console.log(`💰 Total portfolio value: $${portfolioAfterData.totalValueUsd}`);
        } else {
            console.log('❌ Device metadata still missing');
            console.log('\n💡 MANUAL FIX NEEDED:');
            console.log('   The vault needs to have the device metadata table populated');
            console.log('   This requires either:');
            console.log('   1. Reconnecting the KeepKey device to trigger frontload');
            console.log('   2. Manually inserting device metadata into SQLite');
            console.log('   3. Fixing the vault to auto-detect orphaned pubkeys');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the fix
fixDeviceMetadata().catch(console.error); 
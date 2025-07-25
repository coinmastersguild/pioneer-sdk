#!/usr/bin/env node

/**
 * Test script to fetch real portfolio data using cached pubkeys
 * This will call the Pioneer API directly and test the real integration
 */

async function testPortfolioFetch() {
    console.log('🚀 Testing portfolio fetch with cached pubkeys...');
    
    // Use the REAL example data from your curl command that worked
    const pioneerPayload = {
        assets: [
            {
                caip: "eip155:1/slip44:60",
                pubkey: "xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj"
            },
            {
                caip: "bip122:000000000019d6689c085ae165831e93/slip44:0", 
                pubkey: "xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj"
            }
        ]
    };
    
    console.log('🔍 Using real pubkey data...');
    
    try {
        // Test Pioneer API directly
        console.log('📡 Calling Pioneer API directly...');
        const response = await fetch('https://pioneers.dev/api/v1/portfolio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pioneerPayload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pioneer API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Pioneer API Response:');
        console.log(JSON.stringify(data, null, 2));
        
        // Calculate total USD value
        let totalUsd = 0;
        if (data && Array.isArray(data)) {
            totalUsd = data.reduce((sum, balance) => {
                const value = parseFloat(balance.valueUsd || balance.value_usd || 0);
                return sum + value;
            }, 0);
        }
        
        console.log(`\n💰 TOTAL USD VALUE FROM PIONEER: $${totalUsd.toFixed(2)}`);
        
        // Test vault endpoint 
        console.log('\n🏦 Testing vault endpoint...');
        const vaultResponse = await fetch('http://localhost:1646/api/portfolio');
        const vaultData = await vaultResponse.json();
        console.log('🏦 Vault response:');
        console.log(JSON.stringify(vaultData, null, 2));
        
        console.log(`\n🎯 COMPARISON:`);
        console.log(`📡 Pioneer API Total: $${totalUsd.toFixed(2)}`);
        console.log(`🏦 Vault Total: $${vaultData.totalValueUsd?.toFixed(2) || '0.00'}`);
        
        if (totalUsd > 0 && vaultData.totalValueUsd === 0) {
            console.log('\n⚠️  PROBLEM IDENTIFIED:');
            console.log('   📡 Pioneer API has real portfolio data!');
            console.log('   🏦 But vault shows $0.00 (no device metadata cached)');
            console.log('\n💡 SOLUTION NEEDED:');
            console.log('   1. Vault needs to save device metadata during frontload');
            console.log('   2. Vault needs to fetch portfolio balances from Pioneer API');
            console.log('   3. Vault needs to cache portfolio data properly');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the test
testPortfolioFetch().catch(console.error); 
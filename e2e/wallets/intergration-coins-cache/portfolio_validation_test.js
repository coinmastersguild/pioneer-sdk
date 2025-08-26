/**
 * Portfolio Validation Test
 * Tests that portfolio data from the vault cache is properly structured
 * with networks information for all pubkeys
 */

const axios = require('axios');

// Configuration
const VAULT_API_URL = 'http://localhost:1646';
const REQUIRED_FIELDS = {
  pubkey: ['path', 'caip', 'pubkey', 'networks'],
  balance: ['caip', 'balance', 'valueUsd'],
  asset: ['caip', 'balance', 'priceUsd']
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function logError(message) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logDebug(message, data) {
  console.log(`${colors.cyan}🔍 ${message}${colors.reset}`, data || '');
}

async function fetchPortfolioData() {
  try {
    const response = await axios.get(`${VAULT_API_URL}/api/portfolio`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch portfolio: ${error.message}`);
  }
}

function validatePubkey(pubkey, index) {
  const errors = [];
  const warnings = [];
  
  // Check required fields
  for (const field of REQUIRED_FIELDS.pubkey) {
    if (pubkey[field] === undefined || pubkey[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Specific validation for networks
  if (!pubkey.networks || !Array.isArray(pubkey.networks)) {
    errors.push('networks must be a non-empty array');
  } else if (pubkey.networks.length === 0) {
    warnings.push('networks array is empty');
  } else {
    // Validate network format (should be CAIP-like identifiers)
    for (const network of pubkey.networks) {
      if (typeof network !== 'string') {
        errors.push(`Invalid network type: ${typeof network} (expected string)`);
      } else if (!network.includes(':')) {
        warnings.push(`Network ID doesn't follow CAIP format: ${network}`);
      }
    }
  }
  
  // Validate path format
  if (pubkey.path && !pubkey.path.startsWith('m/')) {
    warnings.push(`Path doesn't start with 'm/': ${pubkey.path}`);
  }
  
  // Validate pubkey format (xpub, ypub, zpub, or address)
  if (pubkey.pubkey) {
    const validPrefixes = ['xpub', 'ypub', 'zpub', '0x', '1', '3', 'bc1'];
    const hasValidPrefix = validPrefixes.some(prefix => 
      pubkey.pubkey.toLowerCase().startsWith(prefix.toLowerCase())
    );
    if (!hasValidPrefix) {
      warnings.push(`Unusual pubkey format: ${pubkey.pubkey.substring(0, 10)}...`);
    }
  }
  
  return { errors, warnings };
}

function validateBalance(balance, index) {
  const errors = [];
  const warnings = [];
  
  // Check required fields
  for (const field of REQUIRED_FIELDS.balance) {
    if (balance[field] === undefined || balance[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate CAIP format
  if (balance.caip && !balance.caip.includes(':') && !balance.caip.includes('/')) {
    warnings.push(`CAIP doesn't follow expected format: ${balance.caip}`);
  }
  
  // Validate numeric values
  if (balance.balance !== undefined) {
    const balanceNum = parseFloat(balance.balance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      errors.push(`Invalid balance value: ${balance.balance}`);
    }
  }
  
  if (balance.valueUsd !== undefined) {
    const valueNum = parseFloat(balance.valueUsd);
    if (isNaN(valueNum) || valueNum < 0) {
      errors.push(`Invalid USD value: ${balance.valueUsd}`);
    }
  }
  
  return { errors, warnings };
}

function validateAsset(asset, index) {
  const errors = [];
  const warnings = [];
  
  // Check required fields
  for (const field of REQUIRED_FIELDS.asset) {
    if (asset[field] === undefined || asset[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate price
  if (asset.priceUsd !== undefined && asset.priceUsd !== null) {
    const priceNum = parseFloat(asset.priceUsd);
    if (isNaN(priceNum) || priceNum < 0) {
      warnings.push(`Unusual price value: ${asset.priceUsd}`);
    }
  }
  
  return { errors, warnings };
}

async function runPortfolioValidation() {
  logInfo('Starting Portfolio Validation Test...\n');
  
  try {
    // Fetch portfolio data
    logInfo('Fetching portfolio data from vault cache...');
    const portfolio = await fetchPortfolioData();
    
    logSuccess(`Portfolio fetched successfully`);
    logInfo(`Total Value USD: $${portfolio.totalValueUsd || 0}`);
    logInfo(`Devices: ${portfolio.devices || 0}`);
    logInfo(`Networks: ${portfolio.networks || 0}`);
    logInfo(`Assets: ${portfolio.assets || 0}`);
    logInfo(`Pubkeys: ${portfolio.pubkeys || 0}`);
    logInfo(`Balances: ${portfolio.balances || 0}`);
    
    let totalErrors = 0;
    let totalWarnings = 0;
    
    // Validate pubkeys
    if (portfolio.pubkeys && Array.isArray(portfolio.pubkeys)) {
      logInfo(`\nValidating ${portfolio.pubkeys.length} pubkeys...`);
      
      const pubkeyErrors = [];
      const pubkeyWarnings = [];
      
      portfolio.pubkeys.forEach((pubkey, index) => {
        const validation = validatePubkey(pubkey, index);
        if (validation.errors.length > 0) {
          pubkeyErrors.push({
            index,
            path: pubkey.path,
            caip: pubkey.caip,
            errors: validation.errors,
            networks: pubkey.networks
          });
        }
        if (validation.warnings.length > 0) {
          pubkeyWarnings.push({
            index,
            path: pubkey.path,
            warnings: validation.warnings
          });
        }
      });
      
      if (pubkeyErrors.length > 0) {
        logError(`Found ${pubkeyErrors.length} pubkeys with errors:`);
        pubkeyErrors.forEach(item => {
          console.log(`  ${colors.red}Pubkey ${item.index} (${item.path}):`);
          item.errors.forEach(err => console.log(`    - ${err}`));
          if (item.networks) {
            console.log(`    Networks: ${JSON.stringify(item.networks)}`);
          }
          console.log(colors.reset);
        });
        totalErrors += pubkeyErrors.length;
      } else {
        logSuccess(`All pubkeys have valid structure and networks!`);
      }
      
      if (pubkeyWarnings.length > 0) {
        logWarning(`Found ${pubkeyWarnings.length} pubkeys with warnings:`);
        pubkeyWarnings.forEach(item => {
          console.log(`  ${colors.yellow}Pubkey ${item.index} (${item.path}):`);
          item.warnings.forEach(warn => console.log(`    - ${warn}`));
          console.log(colors.reset);
        });
        totalWarnings += pubkeyWarnings.length;
      }
      
      // Show sample of valid pubkeys with networks
      const validPubkeys = portfolio.pubkeys.filter(p => 
        p.networks && Array.isArray(p.networks) && p.networks.length > 0
      );
      
      if (validPubkeys.length > 0) {
        logInfo(`\nSample of valid pubkeys with networks:`);
        validPubkeys.slice(0, 3).forEach(pubkey => {
          console.log(`  ${colors.green}Path: ${pubkey.path}`);
          console.log(`    Networks: ${JSON.stringify(pubkey.networks)}`);
          console.log(`    CAIP: ${pubkey.caip}${colors.reset}`);
        });
      }
    }
    
    // Validate balances
    if (portfolio.balances && Array.isArray(portfolio.balances)) {
      logInfo(`\nValidating ${portfolio.balances.length} balances...`);
      
      const balanceErrors = [];
      portfolio.balances.forEach((balance, index) => {
        const validation = validateBalance(balance, index);
        if (validation.errors.length > 0) {
          balanceErrors.push({
            index,
            caip: balance.caip,
            errors: validation.errors
          });
        }
      });
      
      if (balanceErrors.length > 0) {
        logError(`Found ${balanceErrors.length} balances with errors`);
        totalErrors += balanceErrors.length;
      } else {
        logSuccess(`All balances are valid!`);
      }
    }
    
    // Validate assets
    if (portfolio.assets && Array.isArray(portfolio.assets)) {
      logInfo(`\nValidating ${portfolio.assets.length} assets...`);
      
      const assetErrors = [];
      portfolio.assets.forEach((asset, index) => {
        const validation = validateAsset(asset, index);
        if (validation.errors.length > 0) {
          assetErrors.push({
            index,
            caip: asset.caip,
            errors: validation.errors
          });
        }
      });
      
      if (assetErrors.length > 0) {
        logError(`Found ${assetErrors.length} assets with errors`);
        totalErrors += assetErrors.length;
      } else {
        logSuccess(`All assets are valid!`);
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    logInfo('VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    if (totalErrors === 0 && totalWarnings === 0) {
      logSuccess('✨ PERFECT! All portfolio data is valid with proper network mappings!');
      return true;
    } else if (totalErrors === 0) {
      logSuccess(`PASSED with ${totalWarnings} warnings`);
      return true;
    } else {
      logError(`FAILED with ${totalErrors} errors and ${totalWarnings} warnings`);
      return false;
    }
    
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// Run the test
(async () => {
  const success = await runPortfolioValidation();
  process.exit(success ? 0 : 1);
})();
import React from 'react';
import { useEffect, useState } from 'react'
import { SDK } from '@coinmasters/pioneer-sdk'
import { availableChainsByWallet, getChainEnumValue, WalletOption } from '@coinmasters/types'
// @ts-ignore
import { caipToNetworkId, ChainToNetworkId } from '@pioneer-platform/pioneer-caip'
import { getPaths } from '@pioneer-platform/pioneer-coins'
import { Provider as ChakraProvider } from "@/components/ui/provider"
import { AppProvider } from '@/components/providers/pioneer'
import { LogoIcon } from '@/components/logo'
import { keyframes } from '@emotion/react'
import { Box, Flex, Spinner } from '@chakra-ui/react'
import { v4 as uuidv4 } from 'uuid'
import Dashboard from '@/components/dashboard/Dashboard'
import { usePioneerContext } from '@/components/providers/pioneer'
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "@/components/ui/dialog"
import Settings from '@/components/settings/Settings'
import AddBlockchain from '@/components/blockchain/AddBlockchain'
import { 
  ProductStructuredData,
  OrganizationStructuredData,
  SoftwareApplicationStructuredData 
} from '@/components/SEO/StructuredData'

const scale = keyframes`
  0% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0.5; }
`

// Get environment variables with fallbacks
const PIONEER_URL = import.meta.env.VITE_PIONEER_URL || 'https://pioneers.dev/spec/swagger.json'
const PIONEER_WSS = import.meta.env.VITE_PIONEER_WSS || 'wss://pioneers.dev'

// Global flag to prevent multiple Pioneer initializations in development
let PIONEER_INITIALIZED = false;

function MainApp() {
  const pioneer = usePioneerContext();
  const { 
    state = {},
    isTransitioning = false,
  } = pioneer || {};
  
  const { app } = state;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddBlockchainOpen, setIsAddBlockchainOpen] = useState(false);

  // Add debug logging for component mount and state changes
  useEffect(() => {
    console.log('🏠 [Page] Component mounted');
    return () => console.log('🏠 [Page] Component unmounting');
  }, []);

  useEffect(() => {
    console.log('🔄 [Page] State update:', {
      hasApp: !!app,
      hasAssetContext: !!app?.assetContext,
      isTransitioning,
      hasPioneer: !!pioneer
    });
  }, [app, isTransitioning, pioneer]);

  // Handle settings dialog open state
  const handleSettingsOpenChange = (details: { open: boolean }) => {
    setIsSettingsOpen(details.open);
  };

  // Handle add blockchain dialog open state
  const handleAddBlockchainOpenChange = (details: { open: boolean }) => {
    setIsAddBlockchainOpen(details.open);
  };

  // Show loading state if pioneer is not ready
  if (!pioneer) {
    return (
      <Box bg="black" minHeight="100vh" width="100vw" overflow="hidden">
        <Box 
          width="100%"
          height="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" color="gold" />
        </Box>
      </Box>
    );
  }

  return (
    <Box bg="black" minHeight="100vh" width="100vw" overflow="hidden">
      {/* Add structured data for SEO */}
      <ProductStructuredData />
      <OrganizationStructuredData />
      <SoftwareApplicationStructuredData />
      
      <Box 
        width="100%"
        height="100vh"
        bg="black" 
        overflow="hidden"
        position="relative"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          opacity={isTransitioning ? 1 : 0}
          display={isTransitioning ? 'flex' : 'none'}
          justifyContent="center"
          alignItems="center"
          bg="rgba(0,0,0,0.8)"
          zIndex={999}
          transition="opacity 0.3s ease"
        >
          <Spinner 
            size="xl"
            color="gold"
          />
        </Box>

        <Box
          opacity={isTransitioning ? 0 : 1}
          transform={isTransitioning ? 'scale(0.98)' : 'scale(1)'}
          transition="all 0.3s ease"
          height="100%"
        >
          <Dashboard 
            onSettingsClick={() => setIsSettingsOpen(true)}
            onAddNetworkClick={() => setIsAddBlockchainOpen(true)}
          />
        </Box>
      </Box>

      {/* Settings Dialog */}
      {/* @ts-ignore */}
      <DialogRoot open={isSettingsOpen} onOpenChange={handleSettingsOpenChange}>
        {/* @ts-ignore */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Settings onClose={() => setIsSettingsOpen(false)} />
          </DialogBody>
          <DialogFooter>
            {/* @ts-ignore */}
            <DialogCloseTrigger asChild>
              <Box as="button" color="white" p={2} fontSize="sm">
                Close
              </Box>
            </DialogCloseTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Add Blockchain Dialog */}
      {/* @ts-ignore */}
      <DialogRoot open={isAddBlockchainOpen} onOpenChange={handleAddBlockchainOpenChange}>
        {/* @ts-ignore */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Blockchain</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <AddBlockchain onClose={() => setIsAddBlockchainOpen(false)} />
          </DialogBody>
          <DialogFooter>
            {/* @ts-ignore */}
            <DialogCloseTrigger asChild>
              <Box as="button" color="white" p={2} fontSize="sm">
                Close
              </Box>
            </DialogCloseTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}

function PioneerProvider({ children }: { children: React.ReactNode }) {
  console.log('🚀 Direct Pioneer SDK Provider started!');
  const [pioneerSdk, setPioneerSdk] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Prevent multiple initializations
    if (PIONEER_INITIALIZED) {
      console.log('🚫 Pioneer already initialized, skipping');
      return;
    }

    const initPioneerSDK = async () => {
      console.log('🔥 Starting direct Pioneer SDK initialization');
      PIONEER_INITIALIZED = true;
      
      try {
        setIsLoading(true);
        setError(null);

        // Generate credentials like pioneer-react does
        const username = localStorage.getItem('username') || `user:${uuidv4()}`.substring(0, 13);
        localStorage.setItem('username', username);

        const queryKey = localStorage.getItem('queryKey') || `key:${uuidv4()}`;
        localStorage.setItem('queryKey', queryKey);

        let keepkeyApiKey = localStorage.getItem('keepkeyApiKey');
        if (!keepkeyApiKey) keepkeyApiKey = '57dd3fa6-9344-4bc5-8a92-924629076018';
        localStorage.setItem('keepkeyApiKey', keepkeyApiKey);

        console.log('🔧 Pioneer credentials:', { username, queryKey, keepkeyApiKey });
        console.log('🔧 Pioneer URLs:', { PIONEER_URL, PIONEER_WSS });

        // Get supported blockchains like pioneer-react does
        const walletType = WalletOption.KEEPKEY;
        const allSupported = availableChainsByWallet[walletType];
        let blockchains = allSupported.map(
          // @ts-ignore
          (chainStr: any) => ChainToNetworkId[getChainEnumValue(chainStr)],
        );
        const paths = getPaths(blockchains);

        console.log('🔧 Blockchains:', blockchains);
        console.log('🔧 Paths length:', paths.length);

        // Create Pioneer SDK instance directly
        console.log('🔧 Creating Pioneer SDK instance...');
        const appInit = new SDK(PIONEER_URL, {
          spec: PIONEER_URL,
          wss: PIONEER_WSS,
          appName: 'KeepKey Portfolio',
          appIcon: 'https://pioneers.dev/coins/keepkey.png',
          blockchains,
          keepkeyApiKey,
          username,
          queryKey,
          paths,
          // Add these to match working projects
          ethplorerApiKey: 'EK-xs8Hj-qG4HbLY-LoAu7',
          covalentApiKey: 'cqt_rQ6333MVWCVJFVX3DbCCGMVqRH4q',
          utxoApiKey: 'B_s9XK926uwmQSGTDEcZB3vSAmt5t2',
          walletConnectProjectId: '18224df5f72924a5f6b3569fbd56ae16',
        });

        console.log('🔧 Pioneer SDK instance created, calling init...');
        
        // Add progress tracking
        let progressInterval = setInterval(() => {
          console.log('⏳ Still initializing...', {
            status: appInit.status,
            pioneer: !!appInit.pioneer,
            keepKeySdk: !!appInit.keepKeySdk,
            events: !!appInit.events,
            wallets: appInit.wallets?.length || 0,
            pubkeys: appInit.pubkeys?.length || 0,
            balances: appInit.balances?.length || 0
          });
        }, 3000);
        
        // Add timeout to prevent infinite hanging
        const initTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SDK init timeout after 30 seconds')), 30000)
        );
        
        try {
          // Initialize exactly like e2e test, but handle balance fetching errors gracefully
          console.log("🔧 Calling appInit.init() with empty objects...");
          
          const resultInit = await Promise.race([
            appInit.init({}, {}),
            initTimeout
          ]);
          
          clearInterval(progressInterval);
          
          console.log("✅ Pioneer SDK initialized, resultInit:", resultInit);
          console.log("📊 Wallets:", appInit.wallets.length);
          console.log("🔑 Pubkeys:", appInit.pubkeys.length);
          console.log("💰 Balances:", appInit.balances.length);
          
          // Debug pubkeys to ensure they have required fields
          if (appInit.pubkeys && appInit.pubkeys.length > 0) {
            console.log("🔍 Debugging pubkeys structure:");
            appInit.pubkeys.forEach((pubkey: any, index: number) => {
              console.log(`Pubkey ${index}:`, {
                address: pubkey.address,
                pubkey: pubkey.pubkey,
                networks: pubkey.networks,
                caip: pubkey.caip,
                hasRequiredFields: !!(pubkey.address && pubkey.pubkey && pubkey.networks)
              });
            });
          }
        } catch (initError: any) {
          clearInterval(progressInterval);
          console.error('⏱️ SDK init failed:', initError);
          
          // Check if it's the GetPortfolioBalances error we can handle
          if (initError.message && initError.message.includes('GetPortfolioBalances')) {
            console.warn('⚠️ GetPortfolioBalances failed during init, continuing with limited functionality');
            // The SDK might still be partially initialized, so we can continue
            console.log("📊 Partial initialization - Wallets:", appInit.wallets?.length || 0);
            console.log("🔑 Partial initialization - Pubkeys:", appInit.pubkeys?.length || 0);
            console.log("💰 Partial initialization - Balances:", appInit.balances?.length || 0);
          } else {
            throw new Error('Pioneer SDK initialization timed out. Check the browser console for more details.');
          }
        }
        
        // Verify initialization like e2e test
        if (!appInit.blockchains || !appInit.blockchains[0]) {
          throw new Error('Blockchains not initialized');
        }
        if (!appInit.pubkeys || !appInit.pubkeys[0]) {
          throw new Error('Pubkeys not initialized');
        }
        if (!appInit.balances || !appInit.balances[0]) {
          console.warn('⚠️ No balances found - this is OK if wallet is empty');
        }

        // Set default asset contexts like pioneer-react does
        let assets_enabled = [
          'eip155:1/slip44:60', // ETH
          'bip122:000000000019d6689c085ae165831e93/slip44:0', // BTC
        ];
        const defaultInput = {
          caip: assets_enabled[0],
          networkId: caipToNetworkId(assets_enabled[0]),
        };
        const defaultOutput = {
          caip: assets_enabled[1],
          networkId: caipToNetworkId(assets_enabled[1]),
        };
        
        console.log('🔧 Setting default asset contexts...');
        await appInit.setAssetContext(defaultInput);
        await appInit.setOutboundAssetContext(defaultOutput);

        // Try to get some data to verify the SDK is working
        try {
          console.log('🔍 Testing SDK functionality...');
          
          // Get assets to verify API connection
          const assets = await appInit.getAssets();
          console.log('✅ Got assets:', assets?.length || 0);
          
          // Start background chart fetching to populate staking positions and other chart data
          try {
            console.log('📊 Starting chart fetching (including staking positions)...');
            console.log('📊 Balances before getCharts:', appInit.balances.length);
            
            await appInit.getCharts();
            
            console.log('✅ Chart fetching completed successfully');
            console.log('📊 Balances after getCharts:', appInit.balances.length);
            
            // Debug: Look for staking positions
            const stakingBalances = appInit.balances.filter((b: any) => b.chart === 'staking');
            console.log('📊 Staking positions found:', stakingBalances.length);
            if (stakingBalances.length > 0) {
              console.log('📊 First staking position:', stakingBalances[0]);
            }
            
            // Debug: Look for cosmos balances
            const cosmosBalances = appInit.balances.filter((b: any) => b.networkId?.includes('cosmos'));
            console.log('📊 Cosmos balances found:', cosmosBalances.length);
            if (cosmosBalances.length > 0) {
              console.log('📊 First cosmos balance:', cosmosBalances[0]);
            }
            
          } catch (chartError) {
            console.warn('⚠️ Chart fetching failed, continuing anyway:', chartError);
            console.warn('⚠️ Chart error details:', chartError);
            // Don't throw - this is not critical for basic functionality
          }
          
          // Try to connect to KeepKey if available
          console.log('🔑 Attempting to connect to KeepKey...');
          console.log('🔑 KeepKey SDK before pairing:', !!appInit.keepKeySdk);
          
          try {
            const keepkeyConnected = await appInit.pairWallet('KEEPKEY');
            console.log('🔑 KeepKey connection result:', keepkeyConnected);
            console.log('🔑 KeepKey SDK after pairing:', !!appInit.keepKeySdk);
            
            if (appInit.keepKeySdk) {
              console.log('🔑 ✅ KeepKey SDK is now initialized - calling refresh()');
              await appInit.refresh();
              console.log('🔑 ✅ refresh() completed - dashboard should now be available');
            } else {
              console.log('🔑 ⚠️ KeepKey SDK still not initialized after pairing');
            }
          } catch (pairError) {
            console.error('🔑 ❌ KeepKey pairing failed:', pairError);
            console.log('🔑 This is expected if no KeepKey device is connected');
          }
        } catch (testError) {
          console.log('⚠️ SDK test failed:', testError);
          // Don't throw - these are optional features
        }

        console.log('🎯 Pioneer SDK fully initialized!');
        console.log('🔍 Final SDK state:', {
          status: appInit.status,
          pubkeys: appInit.pubkeys?.length || 0,
          balances: appInit.balances?.length || 0,
          dashboard: !!appInit.dashboard,
          dashboardNetworks: appInit.dashboard?.networks?.length || 0
        });
        
        // Debug: Check what data is actually available
        console.log('🔍 Available data structures:');
        console.log('📊 Balances:', appInit.balances?.length || 0);
        console.log('🔑 Pubkeys:', appInit.pubkeys?.length || 0);
        console.log('🌐 Blockchains:', appInit.blockchains?.length || 0);
        console.log('💰 Dashboard:', !!appInit.dashboard);
        
        if (appInit.balances && appInit.balances.length > 0) {
          console.log('📊 Sample balance:', appInit.balances[0]);
        }
        
        if (appInit.pubkeys && appInit.pubkeys.length > 0) {
          console.log('🔑 Sample pubkey:', appInit.pubkeys[0]);
        }
        
        if (appInit.blockchains && appInit.blockchains.length > 0) {
          console.log('🌐 Sample blockchain:', appInit.blockchains[0]);
        }
        
        if (appInit.dashboard) {
          console.log('💰 Dashboard data:', appInit.dashboard);
        } else {
          console.log('💰 No dashboard data - this indicates sync() was not called!');
          console.log('💰 KeepKey SDK status:', !!appInit.keepKeySdk);
          console.log('💰 This means KeepKey device is not connected or initialized');
        }
        setPioneerSdk(appInit);
      } catch (e) {
        console.error('💥 FATAL: Pioneer SDK initialization failed:', e);
        console.error('💥 Error details:', {
          message: (e as Error)?.message,
          stack: (e as Error)?.stack,
          name: (e as Error)?.name
        });
        PIONEER_INITIALIZED = false; // Reset flag on error
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };

    initPioneerSDK();
  }, []);

  if (error) {
    return (
      <ChakraProvider>
        <Flex 
          width="100vw" 
          height="100vh" 
          justify="center" 
          align="center"
          flexDirection="column" 
          gap={4}
          bg="gray.800"
        >
          <LogoIcon 
            boxSize="8"
            opacity="0.5"
          />
          <div style={{ color: '#EF4444' }}>Failed to initialize Pioneer SDK!</div>
          <div style={{ color: '#6B7280', fontSize: '14px', maxWidth: '80%', textAlign: 'center' }}>
            {error.message}
          </div>
          <div 
            style={{ color: '#60A5FA', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </div>
        </Flex>
      </ChakraProvider>
    )
  }

  if (isLoading) {
    return (
      <ChakraProvider>
        <Flex 
          width="100vw" 
          height="100vh" 
          justify="center" 
          align="center"
          bg="gray.800"
        >
          <LogoIcon 
            boxSize="24"
            animation={`${scale} 2s ease-in-out infinite`}
            opacity="0.8"
          />
        </Flex>
      </ChakraProvider>
    )
  }

  // Create a simple context value
  const contextValue = {
    state: {
      status: 'connected',
      app: pioneerSdk,
      api: pioneerSdk?.pioneer,
      username: pioneerSdk?.username,
      assetContext: pioneerSdk?.assetContext,
      outboundAssetContext: pioneerSdk?.outboundAssetContext,
      balances: pioneerSdk?.balances || [],
      pubkeys: pioneerSdk?.pubkeys || [],
      dashboard: pioneerSdk?.dashboard,
    },
    dispatch: () => {},
  };

  return (
    <ChakraProvider>
      <AppProvider pioneer={contextValue}>
        {children}
      </AppProvider>
    </ChakraProvider>
  );
}

export default function App() {
  return (
    <PioneerProvider>
      <MainApp />
    </PioneerProvider>
  );
}

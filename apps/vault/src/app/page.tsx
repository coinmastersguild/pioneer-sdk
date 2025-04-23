'use client'

import { Box, Flex, Spinner, Button } from "@chakra-ui/react"
import Dashboard from '@/components/dashboard/Dashboard'
import { usePioneerContext } from '@/components/providers/pioneer'
import { useState, useEffect } from 'react'
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

// @ts-ignore - Using any type to avoid issues
type DialogContentType = any;
// @ts-ignore - Using any type to avoid issues
type DialogCloseTriggerType = any;

export default function Home() {
  const { 
    app, 
    isTransitioning,
    currentView 
  } = usePioneerContext();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddBlockchainOpen, setIsAddBlockchainOpen] = useState(false);

  // Add debug logging for component mount and state changes
  useEffect(() => {
    console.log('🏠 [Page] Component mounted');
    return () => console.log('🏠 [Page] Component unmounting');
  }, []);

  // Add recovery mechanism for Fast Refresh
  useEffect(() => {
    // Handle Fast Refresh recovery
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 [Page] Page became visible - checking for recovery needed');
        
        // If we have app but not asset contexts, they might have been lost in a Fast Refresh
        if (app && !app.assetContext) {
          console.log('🔄 [Page] Detected missing asset context after Fast Refresh - recovering');
          
          // Set a default context with a timeout to prevent hanging
          const recoverContext = async () => {
            try {
              // Set a default BTC context as fallback
              const defaultAsset = {
                caip: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
                networkId: 'bitcoin',
                symbol: 'BTC',
                name: 'Bitcoin'
              };
              
              // Use Promise.race with a timeout to prevent hanging
              await Promise.race([
                app.setAssetContext(defaultAsset),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout setting asset context')), 5000)
                )
              ]);
              
              console.log('✅ [Page] Successfully recovered asset context');
            } catch (error) {
              console.error('❌ [Page] Error recovering from Fast Refresh:', error);
              // Force page reload if recovery fails
              if (error instanceof Error && error.message.includes('Timeout')) {
                console.log('🔄 [Page] Recovery timed out - will continue without asset context');
              }
            }
          };
          
          recoverContext();
        }
      }
    };
    
    // Listen for visibility changes which can indicate return from Fast Refresh
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [app]);

  useEffect(() => {
    console.log('🔄 [Page] State update:', {
      currentView,
      isTransitioning,
      hasAssetContext: !!app?.assetContext
    });
  }, [currentView, isTransitioning, app?.assetContext]);

  // Handle settings dialog open state
  const handleSettingsOpenChange = (details: { open: boolean }) => {
    setIsSettingsOpen(details.open);
  };

  // Handle add blockchain dialog open state
  const handleAddBlockchainOpenChange = (details: { open: boolean }) => {
    setIsAddBlockchainOpen(details.open);
  };

  return (
    <Box bg="#000000" minHeight="100vh" width="100%" position="relative">
      {/* Add structured data for SEO */}
      <ProductStructuredData />
      <OrganizationStructuredData />
      <SoftwareApplicationStructuredData />
      
      <Flex 
        minH="100vh" 
        justify="center" 
        align="center" 
        bg="#000000"
        p={4} // Add some padding around the container
      >
        <Box 
          width={{ base: '100%', sm: '375px', md: '800px', lg: '900px' }} 
          bg="#000000" 
          position="relative"
          boxShadow="xl"
          borderRadius="2xl"
          border="1px solid"
          borderColor="gray.800"
          p={4} // Add consistent padding around the inside cards
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
          >
            <Dashboard 
              onSettingsClick={() => setIsSettingsOpen(true)}
              onAddNetworkClick={() => setIsAddBlockchainOpen(true)}
            />
          </Box>
        </Box>

        {/* Settings Dialog */}
        <DialogRoot open={isSettingsOpen} onOpenChange={handleSettingsOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Settings onClose={() => setIsSettingsOpen(false)} />
            </DialogBody>
            <DialogFooter>
              <DialogCloseTrigger asChild>
                <Box color="white" p={2} fontSize="sm" cursor="pointer">
                  Close
                </Box>
              </DialogCloseTrigger>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>

        {/* Add Blockchain Dialog */}
        <DialogRoot open={isAddBlockchainOpen} onOpenChange={handleAddBlockchainOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Blockchain</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <AddBlockchain onClose={() => setIsAddBlockchainOpen(false)} />
            </DialogBody>
            <DialogFooter>
              <DialogCloseTrigger asChild>
                <Box color="white" p={2} fontSize="sm" cursor="pointer">
                  Close
                </Box>
              </DialogCloseTrigger>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </Flex>
      
      {/* Settings Button in bottom right corner */}
      <Button
        position="fixed"
        bottom="20px"
        right="20px"
        size="md"
        borderRadius="full"
        bg="rgba(0,0,0,0.7)"
        color="#FFD700"
        width="50px"
        height="50px"
        onClick={() => setIsSettingsOpen(true)}
        _hover={{ bg: 'rgba(0,0,0,0.9)', color: '#FFE135' }}
        boxShadow="0 4px 12px rgba(0,0,0,0.5)"
        border="1px solid"
        borderColor="gray.800"
        aria-label="Settings"
      >
        <Box as="span" fontSize="xl">⚙️</Box>
      </Button>
    </Box>
  );
}

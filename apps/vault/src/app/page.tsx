'use client'

import { Box, Flex, Spinner } from "@chakra-ui/react"
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
    <Box bg="black" minHeight="100vh" width="100%">
      {/* Add structured data for SEO */}
      <ProductStructuredData />
      <OrganizationStructuredData />
      <SoftwareApplicationStructuredData />
      
      <Flex 
        minH="100vh" 
        justify="center" 
        align="center" 
        bg="black"
      >
        <Box 
          width="375px" 
          height="100vh"
          bg="black" 
          overflow="hidden"
          position="relative"
          boxShadow="xl"
          borderRadius="2xl"
          border="1px solid"
          borderColor="gray.800"
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
              key={`dashboard-${Date.now()}`}
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
                <Box as="button" color="white" p={2} fontSize="sm">
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
                <Box as="button" color="white" p={2} fontSize="sm">
                  Close
                </Box>
              </DialogCloseTrigger>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </Flex>
    </Box>
  );
}

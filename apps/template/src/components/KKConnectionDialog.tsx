import { useState, useEffect } from 'react';
import {
  Button,
  Text,
  Flex,
  Stack,
  Spinner,
  useDisclosure
} from '@chakra-ui/react';
import { FaWallet } from 'react-icons/fa';
import { KeepKeyUiGlyph } from './logo/keepkey-ui-glyph';
import { usePioneer } from '@coinmasters/pioneer-react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger
} from './ui/dialog';

export interface KKConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess?: () => void;
}

export function KKConnectionDialog({
  isOpen,
  onClose,
  onConnectionSuccess
}: KKConnectionDialogProps) {
  const pioneer = usePioneer();
  const [isDesktopRunning, setIsDesktopRunning] = useState(false);
  const [hasCheckedEndpoint, setHasCheckedEndpoint] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if KeepKey Desktop is running
  useEffect(() => {
    const checkEndpoint = async () => {
      try {
        const response = await fetch('http://localhost:1646/docs');
        if (response.status === 200) {
          setIsDesktopRunning(true);
        } else {
          setIsDesktopRunning(false);
        }
      } catch (error) {
        console.log('KeepKey Desktop is not running');
        setIsDesktopRunning(false);
      } finally {
        setHasCheckedEndpoint(true);
      }
    };

    if (isOpen) {
      checkEndpoint();
      // Only poll if not running
      if (!isDesktopRunning) {
        const interval = setInterval(checkEndpoint, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, isDesktopRunning]);

  // Check if already connected
  useEffect(() => {
    if (isOpen && pioneer?.state?.app?.queryKey) {
      // Already connected, close the dialog and notify parent
      onConnectionSuccess?.();
      onClose();
    }
  }, [isOpen, pioneer?.state?.app?.queryKey, onClose, onConnectionSuccess]);

  const launchKeepKey = () => {
    try {
      window.location.assign('keepkey://launch');
    } catch (error) {
      console.error('Failed to launch KeepKey:', error);
      setError('Failed to launch KeepKey Desktop. Please launch it manually.');
    }
  };

  const openInstallPage = () => {
    window.open('https://keepkey.com/get-started', '_blank');
  };

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    
    try {
      // Connect wallet
      if (pioneer?.connectWallet) {
        await pioneer.connectWallet();
        onConnectionSuccess?.();
        onClose();
      } else {
        setError('Pioneer connectWallet method not available');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to KeepKey. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Your KeepKey</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <Stack spacing={6} py={4}>
            {!hasCheckedEndpoint ? (
              <Flex justify="center" align="center" minH="200px">
                <Spinner size="xl" color="blue.500" />
                <Text ml={4}>Checking for KeepKey Desktop...</Text>
              </Flex>
            ) : !isDesktopRunning ? (
              <Stack spacing={6}>
                <Flex 
                  w="200px" 
                  h="200px" 
                  align="center" 
                  justify="center" 
                  mx="auto"
                  position="relative"
                >
                  <KeepKeyUiGlyph 
                    boxSize="120px"
                    opacity={0.5}
                  />
                </Flex>
                <Stack spacing={4}>
                  <Text textAlign="center" fontSize="lg" fontWeight="medium">
                    KeepKey Desktop Not Running
                  </Text>
                  <Text textAlign="center" color="gray.500">
                    Please install and run KeepKey Desktop to continue
                  </Text>
                  <Flex justify="center" gap={4}>
                    <Button
                      leftIcon={<FaWallet />}
                      onClick={launchKeepKey}
                      colorScheme="blue"
                    >
                      Launch KeepKey Desktop
                    </Button>
                    <Button
                      variant="outline"
                      onClick={openInstallPage}
                    >
                      Install KeepKey Desktop
                    </Button>
                  </Flex>
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={6} align="center">
                <KeepKeyUiGlyph 
                  boxSize="120px" 
                  color="blue.500"
                />
                <Text fontSize="lg" fontWeight="medium">
                  Connect to KeepKey
                </Text>
                <Text align="center" color="gray.500">
                  Your KeepKey Desktop is running. Click the button below to connect your KeepKey wallet.
                </Text>
                <Button
                  colorScheme="blue"
                  onClick={handleConnect}
                  isLoading={isConnecting}
                  loadingText="Connecting..."
                  w="full"
                >
                  Connect KeepKey
                </Button>
              </Stack>
            )}
            
            {error && (
              <Text color="red.500" textAlign="center" mt={4}>
                {error}
              </Text>
            )}
          </Stack>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

export const useKKConnectionDialog = () => {
  const disclosure = useDisclosure();
  
  return {
    isOpen: disclosure.open,
    openDialog: disclosure.onOpen,
    closeDialog: disclosure.onClose,
    KKConnectionDialog: ({ onConnectionSuccess }: { onConnectionSuccess?: () => void }) => (
      <KKConnectionDialog 
        isOpen={disclosure.open} 
        onClose={disclosure.onClose} 
        onConnectionSuccess={onConnectionSuccess} 
      />
    )
  };
}; 
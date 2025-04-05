'use client';

import { Button, Text, Flex, Stack, Spinner } from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import { KeepKeyUiGlyph } from './logo/keepkey-ui-glyph';
import { FaCircle, FaWallet } from 'react-icons/fa';
import { Icon } from '@chakra-ui/react';
import { usePioneerContext } from './providers/pioneer';

export interface KKConnectionStatusProps {
  /**
   * Size of the button
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Callback when connection status changes
   */
  onConnectionChange?: (isConnected: boolean) => void;
}

export function KKConnectionStatus({ 
  size = 'md',
  onConnectionChange
}: KKConnectionStatusProps) {
  const pioneer = usePioneerContext();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDesktopRunning, setIsDesktopRunning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  // Size styles mapping
  const sizesMap = {
    sm: { icon: '16px', fontSize: 'xs', buttonSize: 'sm' },
    md: { icon: '20px', fontSize: 'sm', buttonSize: 'md' },
    lg: { icon: '24px', fontSize: 'md', buttonSize: 'lg' },
  };

  // Check if KeepKey Desktop is running
  const checkDesktopRunning = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('http://localhost:1646/docs');
      setIsDesktopRunning(response.status === 200);
    } catch (error) {
      console.log('KeepKey Desktop is not running');
      setIsDesktopRunning(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Initial check
  useEffect(() => {
    checkDesktopRunning();
    // Poll every 10 seconds if not running
    const interval = setInterval(() => {
      if (!isDesktopRunning && !isConnected) {
        checkDesktopRunning();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isDesktopRunning, isConnected]);

  // Check if already connected
  useEffect(() => {
    if (pioneer?.state?.app?.queryKey) {
      setIsConnected(true);
      onConnectionChange?.(true);
    } else {
      setIsConnected(false);
    }
  }, [pioneer?.state?.app?.queryKey, onConnectionChange]);

  // Launch KeepKey Desktop
  const launchKeepKey = () => {
    try {
      window.location.assign('keepkey://launch');
    } catch (error) {
      console.error('Failed to launch KeepKey:', error);
    }
  };

  // Open the installation page
  const openInstallPage = () => {
    window.open('https://keepkey.com/get-started', '_blank');
  };

  // Handle connection
  const handleConnect = async () => {
    if (isConnected) {
      // If already connected, this will toggle to disconnect
      setIsConnected(false);
      onConnectionChange?.(false);
      return;
    }

    // Check if desktop is running first
    if (!isDesktopRunning) {
      await checkDesktopRunning();
      if (!isDesktopRunning) {
        launchKeepKey();
        return;
      }
    }

    setIsConnecting(true);
    try {
      // Connect wallet
      if (pioneer?.connectWallet) {
        await pioneer.connectWallet();
        setIsConnected(true);
        onConnectionChange?.(true);
      } else {
        console.error('Pioneer connectWallet method not available');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnected(false);
      onConnectionChange?.(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // If checking status, show loading state
  if (isChecking) {
    return (
      <Button
        variant="outline"
        bg="gray.800"
        color="white"
        borderColor="gray.600"
        size={sizesMap[size].buttonSize}
        p={2}
        disabled
      >
        <Flex alignItems="center">
          <Spinner size="sm" mr={2} />
          <Text fontSize={sizesMap[size].fontSize}>
            Checking...
          </Text>
        </Flex>
      </Button>
    );
  }

  // If not running and not connected, show connect button
  if (!isDesktopRunning && !isConnected) {
    return (
      <Button
        variant="outline"
        bg="gray.800"
        color="white"
        borderColor="gray.600"
        size={sizesMap[size].buttonSize}
        onClick={launchKeepKey}
        leftIcon={<Icon as={FaWallet} />}
        title="KeepKey Desktop is not running. Click to launch."
      >
        <Text fontSize={sizesMap[size].fontSize}>
          Launch KeepKey
        </Text>
      </Button>
    );
  }

  // If running or connected, show the connection button
  return (
    <Button
      variant={isConnected ? "solid" : "outline"}
      bg={isConnected ? "green.600" : "gray.800"}
      color="white"
      borderColor={isConnected ? "green.500" : "gray.600"}
      size={sizesMap[size].buttonSize}
      p={2}
      onClick={handleConnect}
      isLoading={isConnecting}
      loadingText="Connecting..."
      _hover={{
        bg: isConnected ? "green.500" : "gray.700",
        borderColor: isConnected ? "green.400" : "gray.500"
      }}
    >
      <Flex alignItems="center">
        <KeepKeyUiGlyph 
          height={sizesMap[size].icon} 
          width={sizesMap[size].icon}
          color="currentColor"
          mr={2}
        />
        <Text fontSize={sizesMap[size].fontSize} mr={2}>
          {isConnected ? "Connected" : "Connect KeepKey"}
        </Text>
        {!isConnecting && (
          <Icon 
            as={FaCircle} 
            color={isConnected ? "green.300" : "red.500"} 
            boxSize="8px"
          />
        )}
      </Flex>
    </Button>
  );
} 
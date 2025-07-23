import { useState, useEffect } from "react";
import { Box, Text, Flex, Button, Spinner, Stack } from "@chakra-ui/react";
import { FaEye, FaUsb } from "react-icons/fa";

import { Logo } from './logo/logo';
import { EllipsisDots } from "./EllipsisSpinner";

interface LoadingScreenProps {
  loadingStatus: string;
  deviceConnected: boolean;
  isRestarting?: boolean;
  onLogoClick?: () => void;
  onWatchOnlyMode?: () => void;
  onSettings?: () => void;
}

export const LoadingScreen = ({
  loadingStatus,
  deviceConnected,
  isRestarting = false,
  onLogoClick,
  onWatchOnlyMode,
  onSettings
}: LoadingScreenProps) => {
  const [showWatchOnlyOption, setShowWatchOnlyOption] = useState(false);

  // Show watch-only option after 10 seconds if no device is connected
  useEffect(() => {
    if (!deviceConnected && (loadingStatus.includes('Waiting') || loadingStatus.includes('Searching'))) {
      const timer = setTimeout(() => {
        setShowWatchOnlyOption(true);
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      setShowWatchOnlyOption(false);
    }
  }, [deviceConnected, loadingStatus]);

  return (
    <Box
      height="100vh"
      width="100vw"
      position="relative"
      backgroundImage="url('/images/splash-bg.png')"
      backgroundSize="cover"
      backgroundPosition="center"
    >
      <Flex 
        height="100%"
        width="100%"
        direction="column"
        alignItems="center"
        justifyContent="center"
      >
        {/* Clickable Logo in the center */}
        <Logo 
          width="100px" 
          onClick={onLogoClick}
          style={{
            filter: isRestarting ? 'brightness(1.3)' : 'none',
            transition: 'filter 0.2s ease'
          }}
        />
        
        {/* Clickable hint */}
        <Text 
          fontSize="xs" 
          color="gray.400" 
          mt={2} 
          textAlign="center"
          opacity={isRestarting ? 0.5 : 0.7}
          transition="opacity 0.2s ease"
        >
          {isRestarting ? "Restarting..." : "Click logo to restart"}
        </Text>
        
        {/* Watch-only mode option */}
        {showWatchOnlyOption && (
          <Stack 
            mt={8} 
            gap={4}
            p={6}
            bg="rgba(0, 0, 0, 0.8)"
            borderRadius="lg"
            border="1px solid rgba(200, 167, 92, 0.3)"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.5)"
            align="center"
          >
            <Text fontSize="sm" color="gray.200" textAlign="center">
              No KeepKey device detected
            </Text>
            <Stack direction="row" gap={4}>
              <Button
                colorScheme="blue"
                variant="solid"
                onClick={onWatchOnlyMode}
                size="sm"
              >
                <FaEye style={{ marginRight: '8px' }} />
                Watch-Only Mode
              </Button>
              <Button
                colorScheme="gray"
                variant="outline"
                onClick={onLogoClick}
                size="sm"
              >
                <FaUsb style={{ marginRight: '8px' }} />
                Retry Connection
              </Button>
            </Stack>
            <Text fontSize="xs" color="gray.400" textAlign="center" maxW="300px">
              Watch-Only mode lets you view your portfolio using cached data without connecting your device
            </Text>
          </Stack>
        )}
        
        {/* Loading text at the bottom */}
        <Box
          position="absolute"
          bottom="40px"
          textAlign="center"
          width="auto"
          px={3}
          py={1}
          borderRadius="md"
          bg="rgba(0, 0, 0, 0.5)"
        >
          <Flex gap="2" justifyContent="center" alignItems="center">
            <Spinner size="xs" color={deviceConnected ? "green.400" : "gray.400"} />
            <Text fontSize="xs" color="gray.300">
              {loadingStatus}
            </Text>
            <EllipsisDots interval={300} />
          </Flex>
        </Box>

        {/* Settings button in bottom left */}
        {onSettings && (
          <Button
            position="absolute"
            bottom="20px"
            left="20px"
            size="sm"
            variant="ghost"
            colorScheme="gray"
            onClick={onSettings}
          >
            Settings
          </Button>
        )}
      </Flex>
    </Box>
  );
}; 
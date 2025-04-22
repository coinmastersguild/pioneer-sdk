import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Image,
  Input,
} from '@chakra-ui/react';
import { FaGithub, FaBook, FaHome, FaTrash, FaBroadcastTower, FaRedo, FaBomb, FaSync } from 'react-icons/fa';
import { usePioneerContext } from '@/components/providers/pioneer';

// Theme colors - matching our dashboard theme
const theme = {
  bg: '#000000',
  cardBg: '#111111',
  gold: '#FFD700',
  goldHover: '#FFE135',
  border: '#222222',
};

interface SettingsProps {
  onClose: () => void;
}

const Settings = ({ onClose }: SettingsProps) => {
  const pioneer = usePioneerContext();
  const { state } = pioneer;
  const { app } = state;
  const [loading, setLoading] = useState(false);
  const [toastShown, setToastShown] = useState(false);

  const [maskingSettings, setMaskingSettings] = useState({
    enableMetaMaskMasking: false,
    enableXfiMasking: false,
    enableKeplrMasking: false,
  });
  
  // State for Pioneer URL
  const [pioneerUrl, setPioneerUrl] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  const handleToggle = async (setting: keyof typeof maskingSettings) => {
    try {
      setMaskingSettings(prev => ({
        ...prev,
        [setting]: !prev[setting],
      }));
    } catch (error) {
      console.error('Error toggling setting:', error);
    }
  };

  const handleClearStorage = async () => {
    try {
      setLoading(true);
      // TODO: Implement clear storage functionality
      console.log('Storage cleared');
      onClose();
    } catch (error) {
      console.error('Error clearing storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceReset = async () => {
    try {
      setLoading(true);
      // TODO: Implement force reset functionality
      console.log('App reset');
      onClose();
    } catch (error) {
      console.error('Error resetting app:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnounceProvider = () => {
    try {
      window.postMessage(
        {
          type: 'ANNOUNCE_REQUEST',
          provider: {
            name: 'KeepKey',
            uuid: '350670db-19fa-4704-a166-e52e178b59d4',
            icon: 'https://pioneers.dev/coins/keepkey.png',
            rdns: 'com.keepkey',
          },
        },
        '*'
      );
      console.log('Provider announced');
      onClose();
    } catch (error) {
      console.error('Error announcing provider:', error);
    }
  };
  
  // Handle Pioneer URL update
  const handlePioneerUrlUpdate = () => {
    try {
      // Save the URL to localStorage
      localStorage.setItem('PIONEER_API_SPEC_URL', tempUrl);
      setPioneerUrl(tempUrl);
      setIsEditingUrl(false);
      console.log(`Pioneer URL updated to: ${tempUrl}`);
      
      // Show success message
      setToastShown(true);
    } catch (error) {
      console.error('Error updating Pioneer URL:', error);
    }
  };

  // Handle reset to default Pioneer URL
  const handleResetPioneerUrl = () => {
    const defaultUrl = 'https://pioneers.dev/spec/swagger.json';
    localStorage.setItem('PIONEER_API_SPEC_URL', defaultUrl);
    setPioneerUrl(defaultUrl);
    setTempUrl(defaultUrl);
    console.log('Reset to default Pioneer URL');
  };

  // Handle restart Pioneer SDK
  const handleRestartPioneerSdk = () => {
    try {
      setLoading(true);
      // Force reload to restart the Pioneer SDK
      window.location.reload();
    } catch (error) {
      console.error('Error restarting Pioneer SDK:', error);
      setLoading(false);
    }
  };

  // Get current Pioneer URL on component mount
  useEffect(() => {
    // Try to get from localStorage first, then fallback to environment or default
    const storedUrl = localStorage.getItem('PIONEER_API_SPEC_URL');
    const currentUrl = storedUrl || (app?.pioneerUrl || 'https://pioneers.dev/spec/swagger.json');
    setPioneerUrl(currentUrl);
    setTempUrl(currentUrl);
  }, [app]);

  return (
    <Box height="100vh" bg={theme.bg}>
      {/* Header */}
      <Box 
        borderBottom="1px" 
        borderColor={theme.border}
        p={4}
        bg={theme.cardBg}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Text color={theme.gold} fontWeight="bold">Settings</Text>
        <Button 
          size="sm" 
          variant="ghost" 
          color={theme.gold}
          onClick={onClose}
        >
          Close
        </Button>
      </Box>
      
      {/* Main Content */}
      <Box 
        height="calc(100% - 52px)" 
        overflowY="auto" 
        p={3}
      >
        <VStack gap={4} align="stretch">
          {/* KeepKey Animation */}
          <Box 
            position="relative" 
            width="40%"
            mx="auto"
          >
            <Image
              src="https://i.ibb.co/jR8WcJM/kk.gif"
              alt="KeepKey"
              width="100%"
              objectFit="contain"
            />
          </Box>

          {/* Documentation Links */}
          <Box bg={theme.cardBg} p={4} borderRadius="xl" borderWidth="1px" borderColor={theme.border}>
            <VStack gap={3}>
              <Button
                width="100%"
                size="sm"
                variant="outline"
                color={theme.gold}
                borderColor={theme.border}
                _hover={{ bg: 'rgba(255, 215, 0, 0.1)' }}
                onClick={() => window.open('https://docs.keepkey.info', '_blank')}
              >
                <HStack gap={2}>
                  <FaBook />
                  <Text>KeepKey Documentation</Text>
                </HStack>
              </Button>
              <Button
                width="100%"
                size="sm"
                variant="outline"
                color={theme.gold}
                borderColor={theme.border}
                _hover={{ bg: 'rgba(255, 215, 0, 0.1)' }}
                onClick={() => window.open('https://www.keepkey.com', '_blank')}
              >
                <HStack gap={2}>
                  <FaHome />
                  <Text>About KeepKey</Text>
                </HStack>
              </Button>
            </VStack>
          </Box>

          {/* Log Level Settings */}
          <Box bg={theme.cardBg} p={4} borderRadius="xl" borderWidth="1px" borderColor={theme.border}>
            <Text fontWeight="bold" color={theme.gold} mb={3}>
              Developer Settings
            </Text>
            
            <Box mb={4}>
              <Text color="gray.300" mb={1}>Log Level</Text>
              <select 
                value={logLevel} 
                onChange={handleLogLevelChange}
                style={{
                  backgroundColor: "black",
                  color: "white",
                  borderColor: theme.border,
                  padding: "8px",
                  borderRadius: "4px",
                  width: "100%"
                }}
              >
                {logLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </Box>
            
            <Box 
              borderTop="1px" 
              borderColor={theme.border} 
              my={3}
              pt={3}
            />

          {/* Provider Settings */}
          <Box mb={4}>
            <Text fontWeight="medium" color="gray.300" mb={2}>
              Provider Masking
            </Text>
            <VStack gap={2} align="stretch">
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Text mb="0" color="gray.400" fontSize="sm">
                  Mask MetaMask
                </Text>
                <input 
                  type="checkbox"
                  id="metamask-toggle" 
                  checked={maskingSettings.enableMetaMaskMasking}
                  onChange={() => handleToggle('enableMetaMaskMasking')}
                  style={{ accentColor: theme.gold }}
                />
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Text mb="0" color="gray.400" fontSize="sm">
                  Mask XFI
                </Text>
                <input 
                  type="checkbox"
                  id="xfi-toggle" 
                  checked={maskingSettings.enableXfiMasking}
                  onChange={() => handleToggle('enableXfiMasking')}
                  style={{ accentColor: theme.gold }}
                />
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Text mb="0" color="gray.400" fontSize="sm">
                  Mask Keplr
                </Text>
                <input 
                  type="checkbox"
                  id="keplr-toggle" 
                  checked={maskingSettings.enableKeplrMasking}
                  onChange={() => handleToggle('enableKeplrMasking')}
                  style={{ accentColor: theme.gold }}
                />
              </Box>
            </VStack>
          </Box>
          </Box>

          {/* Advanced Actions */}
          <Box bg={theme.cardBg} p={4} borderRadius="xl" borderWidth="1px" borderColor={theme.border}>
            <Text fontWeight="bold" color="red.400" mb={3}>
              Advanced Options
            </Text>
            <VStack gap={3}>
              <Button
                width="100%"
                size="sm"
                variant="outline"
                colorScheme="red"
                onClick={handleClearStorage}
                disabled={loading}
              >
                <HStack>
                  <FaTrash />
                  <Text>Clear App Storage {loading && '...'}</Text>
                </HStack>
              </Button>
              <Button
                width="100%"
                size="sm"
                variant="outline"
                colorScheme="red"
                onClick={handleForceReset}
                disabled={loading}
              >
                <HStack>
                  <FaBomb />
                  <Text>Force App Reset {loading && '...'}</Text>
                </HStack>
              </Button>
              <Button
                width="100%"
                size="sm"
                variant="outline"
                color={theme.gold}
                borderColor={theme.border}
                _hover={{ bg: 'rgba(255, 215, 0, 0.1)' }}
                onClick={handleAnnounceProvider}
              >
                Announce Provider
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default Settings; 
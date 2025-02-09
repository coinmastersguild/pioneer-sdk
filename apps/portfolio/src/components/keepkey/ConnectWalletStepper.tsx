'use client';

import React, { useEffect, useState } from 'react';
import { Button, Group, Stack, Text, Box, Spinner, HStack, Badge } from "@chakra-ui/react";
import {
  StepsCompletedContent,
  StepsContent,
  StepsItem,
  StepsList,
  StepsNextTrigger,
  StepsPrevTrigger,
  StepsRoot,
} from "@/components/ui/steps";
import axios from 'axios';

interface ConnectWalletStepperProps {
  usePioneer: any;
}

export const ConnectWalletStepper: React.FC<ConnectWalletStepperProps> = ({ usePioneer }) => {
  const { state, connectWallet } = usePioneer();
  const { app } = state;
  const [keepkeyState, setKeepkeyState] = useState(0);
  const [isCheckingServer, setIsCheckingServer] = useState(true);
  const [isServerUp, setIsServerUp] = useState(false);

  // Check Pioneer server status
  useEffect(() => {
    const checkPioneerServer = async () => {
      try {
        setIsCheckingServer(true);
        const isPioneerConnected = !!app?.username;
        setIsServerUp(isPioneerConnected);
      } catch (error) {
        console.error('Error checking Pioneer server:', error);
        setIsServerUp(false);
      } finally {
        setIsCheckingServer(false);
      }
    };

    checkPioneerServer();
  }, [app?.username]);

  // Check KeepKey desktop status
  useEffect(() => {
    const checkKeepKey = async () => {
      try {
        const response = await axios.get('http://localhost:1646/docs');
        if (response.status === 200) {
          setKeepkeyState(2); // Connected
        }
      } catch (error) {
        console.error('KeepKey endpoint not found:', error);
        setKeepkeyState(1); // Disconnected
      }
    };

    const interval = setInterval(checkKeepKey, 5000);
    return () => clearInterval(interval);
  }, []);

  const stateNames: { [key: number]: string } = {
    0: 'unknown',
    1: 'disconnected',
    2: 'connected',
    3: 'busy',
    4: 'errored',
    5: 'paired',
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <StepsRoot orientation="vertical" height="400px" defaultValue={0} count={3}>
      <StepsList>
        <StepsItem index={0} title="Pioneer Server" />
        <StepsItem index={1} title="KeepKey Desktop" />
        <StepsItem index={2} title="Connect Wallet" />
      </StepsList>

      <Stack gap={4}>
        <StepsContent index={0}>
          <Box p={4} borderWidth="1px" borderRadius="md">
            <Stack gap={4}>
              <Text fontSize="lg">Pioneer Server Status</Text>
              {isCheckingServer ? (
                <HStack>
                  <Spinner size="sm" />
                  <Text>Checking server status...</Text>
                </HStack>
              ) : (
                <HStack>
                  <Badge colorScheme={isServerUp ? "green" : "red"}>
                    {isServerUp ? "Connected" : "Disconnected"}
                  </Badge>
                  {isServerUp && <Text>Username: {app?.username}</Text>}
                </HStack>
              )}
            </Stack>
          </Box>
        </StepsContent>

        <StepsContent index={1}>
          <Box p={4} borderWidth="1px" borderRadius="md">
            <Stack gap={4}>
              <Text fontSize="lg">KeepKey Desktop Status</Text>
              <HStack>
                <Badge colorScheme={keepkeyState === 2 ? "green" : "red"}>
                  {stateNames[keepkeyState]}
                </Badge>
                {keepkeyState !== 2 && (
                  <Text color="red.300">
                    Please make sure KeepKey Desktop is running
                  </Text>
                )}
              </HStack>
            </Stack>
          </Box>
        </StepsContent>

        <StepsContent index={2}>
          <Box p={4} borderWidth="1px" borderRadius="md">
            <Stack gap={4}>
              <Text fontSize="lg">Connect Your KeepKey</Text>
              <Button
                colorScheme="blue"
                onClick={handleConnectWallet}
                disabled={keepkeyState !== 2}
              >
                Connect Wallet
              </Button>
            </Stack>
          </Box>
        </StepsContent>

        <StepsCompletedContent>
          <Box p={4} borderWidth="1px" borderRadius="md" bg="green.800">
            <Text textAlign="center" color="white">
              All steps completed! Your wallet is now connected.
            </Text>
          </Box>
        </StepsCompletedContent>

        <Group>
          <StepsPrevTrigger asChild>
            <Button variant="outline" size="sm">
              Previous
            </Button>
          </StepsPrevTrigger>
          <StepsNextTrigger asChild>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </StepsNextTrigger>
        </Group>
      </Stack>
    </StepsRoot>
  );
}; 
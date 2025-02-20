import React from 'react'
import { Box, Button, Flex, Text, Badge, SimpleGrid } from "@chakra-ui/react"
import { Avatar } from "../ui/avatar"
import { useEffect, useState } from "react"
import { LogoIcon } from '../logo'

interface Network {
  networkId: string;
  totalValueUsd: number;
  gasAssetCaip: string;
  gasAssetSymbol: string;
  icon: string;
  color: string;
  totalNativeBalance: string;
}

interface NetworkPercentage {
  networkId: string;
  percentage: number;
}

interface DashboardData {
  networks: Network[];
  totalValueUsd: number;
  networkPercentages: NetworkPercentage[];
}

export interface PortfolioProps {
  pioneer: {
    state: {
      app: {
        dashboard?: DashboardData;
        features?: string[];
      };
    };
  };
}

// Format USD value with better handling of edge cases
const formatUsd = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  // Ensure value is a number and handle string inputs
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0.00';
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const Portfolio: React.FC<PortfolioProps> = ({ pioneer }) => {

  const { state } = pioneer;
  const { app } = state;
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    console.log("Pioneer App State: ", app);

    const fetchDashboardData = async () => {
      if (app?.dashboard) {
        setDashboard(app.dashboard);
      }
    };

    fetchDashboardData();
  }, [app?.dashboard]);

  const handleNetworkSelect = (network: Network) => {
    console.log('Selected network:', network);
    // You can add Pioneer-specific network selection logic here
  };

  const formatBalance = (balance: string) => {
    const [integer, decimal] = balance.split('.');
    const largePart = decimal?.substring(0, 4) || '0000';
    const smallPart = decimal?.substring(4) || '';
    return { integer, largePart, smallPart };
  };

  if (!dashboard) {
    return (
      <Box p={6} maxWidth="1200px" mx="auto">
        <Flex direction="column" align="center" justify="center" minH="100vh">
          <LogoIcon boxSize="24" animation="pulse 2s infinite" />
          <Text mt={4}>Loading dashboard data...</Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box p={6} maxWidth="1200px" mx="auto">
      <Flex align="center" mb={8}>
        <LogoIcon boxSize="12" mr={4} />
        <Box>
          <Text fontSize="3xl" fontWeight="bold">
            KeepKey Dashboard
          </Text>
          <Badge colorScheme="green" fontSize="md">
            Total: ${formatUsd(dashboard.totalValueUsd)}
          </Badge>
        </Box>
      </Flex>

      {/* Features Section */}
      <Box mb={8}>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>
          Features
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          {app?.features?.map((feature: string, index: number) => (
            <Box
              key={index}
              p={5}
              borderRadius="xl"
              bg="whiteAlpha.50"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              transition="all 0.2s"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
                borderColor: 'blue.400',
              }}
            >
              <Text fontSize="md">{feature}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* Networks Section */}
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        Networks
      </Text>
      <Flex flexWrap="wrap" gap={4}>
        {dashboard.networks.map((network, index) => {
          const { integer, largePart, smallPart } = formatBalance(network.totalNativeBalance);
          const percentage = dashboard.networkPercentages.find(
            np => np.networkId === network.networkId
          )?.percentage || 0;

          return (
            <Box
              key={index}
              borderRadius="xl"
              p={6}
              width={{ base: "100%", md: "calc(50% - 1rem)", lg: "calc(33.33% - 1rem)" }}
              cursor="pointer"
              bg="whiteAlpha.50"
              borderColor={`${network.color}33`}
              borderWidth="1px"
              transition="all 0.2s ease-in-out"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'xl',
                borderColor: network.color,
                bg: `${network.color}1A`,
              }}
            >
              <Flex direction="column" gap={4}>
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={3}>
                    <Avatar
                      src={network.icon}
                      bgColor={network.color}
                      size="lg"
                      name={network.gasAssetSymbol}
                    />
                    <Box>
                      <Text fontSize="sm" color="gray.400" maxWidth="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        {network.networkId}
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        {network.gasAssetSymbol}
                      </Text>
                    </Box>
                  </Flex>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => handleNetworkSelect(network)}
                  >
                    Select
                  </Button>
                </Flex>

                <Box>
                  <Text fontSize="3xl" fontWeight="bold" mb={2}>
                    {integer}.
                    <Text as="span" fontSize="2xl">
                      {largePart}
                    </Text>
                    {smallPart && (
                      <Text as="span" fontSize="lg" color="gray.500">
                        {smallPart}
                      </Text>
                    )}
                  </Text>

                  <Flex gap={2} flexWrap="wrap">
                    <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                      ${formatUsd(network.totalValueUsd)}
                    </Badge>
                    {percentage > 0 && (
                      <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                        {percentage.toFixed(1)}%
                      </Badge>
                    )}
                  </Flex>
                </Box>
              </Flex>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}; 

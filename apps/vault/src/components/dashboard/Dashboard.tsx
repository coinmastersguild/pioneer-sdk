'use client'

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  Stack,
  HStack,
  Button,
  Image,
  VStack,
  Grid,
  GridItem,
  useDisclosure,
  useBreakpointValue,
} from '@chakra-ui/react';
import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton"
import { usePioneerContext } from '@/components/providers/pioneer'
import { DonutChart, DonutChartItem, ChartLegend } from '@/components/chart';
import { useRouter } from 'next/navigation';
import CountUp from 'react-countup';
import ConnectionError from '@/components/error/ConnectionError';

// Add sound effect imports
const chachingSound = typeof Audio !== 'undefined' ? new Audio('/sounds/chaching.mp3') : null;

// Play sound utility function
const playSound = (sound: HTMLAudioElement | null) => {
  if (sound) {
    sound.currentTime = 0; // Reset to start
    sound.play().catch(err => console.error('Error playing sound:', err));
  }
};

// Custom scrollbar styles
const scrollbarStyles = {
  css: {
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-track': {
      width: '6px',
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#4A5568',
      borderRadius: '24px',
    },
  }
};

// Theme colors
const theme = {
  bg: '#000000',
  cardBg: '#111111',
  cardBgHover: '#191919',
  gold: '#FFD700',
  goldHover: '#FFE135',
  border: '#222222',
  text: '#FFFFFF',
  textMuted: '#888888',
  success: '#4CAF50',
  danger: '#F44336',
};

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

interface Pubkey {
  networks: string[];
  type: string;
  master: string;
  address: string;
  pubkey: string;
  path: string;
  scriptType: string;
  note: string;
  context: string;
}

interface Dashboard {
  networks: Network[];
  totalValueUsd: number;
  networkPercentages: NetworkPercentage[];
}

interface DashboardProps {
  onSettingsClick: () => void;
  onAddNetworkClick: () => void;
}

// Skeleton loader for network items in the assets list
const NetworkSkeleton = () => (
  <HStack gap="4" p={5} bg={theme.cardBg} borderRadius="2xl" boxShadow="lg">
    <SkeletonCircle size="12" />
    <Stack flex="1" gap={2}> 
      <Skeleton height="5" width="120px" />
      <Skeleton height="4" width="80px" />
    </Stack>
    <Stack align="flex-end" gap={1}> 
      <Skeleton height="5" width="70px" />
      <Skeleton height="4" width="40px" />
    </Stack>
  </HStack>
);

// Skeleton loader for the portfolio chart
const ChartSkeleton = () => (
  <Box p={6} bg={theme.cardBg} borderRadius="xl" borderWidth="1px" borderColor={theme.border}>
    <VStack gap={6} align="stretch">
      <HStack justify="space-between">
        <Stack gap={1}>
          <Skeleton height="6" width="150px" />
          <Skeleton height="8" width="120px" />
        </Stack>
        <SkeletonCircle size="10" />
      </HStack>
      
      <Flex justify="center" align="center" h="200px">
        <Box position="relative" width="200px" height="200px">
          <Box 
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            borderRadius="full"
            bg="#222"
          />
          <Box 
            position="absolute"
            top="15%"
            left="15%"
            width="70%"
            height="70%"
            borderRadius="full"
            bg={theme.bg}
          />
        </Box>
      </Flex>
      
      <VStack gap={3}>
        {[1, 2, 3].map((i) => (
          <HStack key={i} width="100%" justify="space-between">
            <HStack gap={2}>
              <SkeletonCircle size="6" />
              <Skeleton height="4" width="100px" />
            </HStack>
            <Skeleton height="4" width="60px" />
          </HStack>
        ))}
      </VStack>
    </VStack>
  </Box>
);

// Skeleton loader for the assets list
const AssetsListSkeleton = () => (
  <VStack gap={3} align="stretch" width="100%">
    <HStack justify="space-between" p={4}>
      <Skeleton height="6" width="120px" />
      <Skeleton height="4" width="60px" />
    </HStack>
    
    <VStack gap={3} align="stretch" p={4} maxH="500px" overflowY="auto">
      {[1, 2, 3, 4].map((i) => (
        <NetworkSkeleton key={i} />
      ))}
    </VStack>
  </VStack>
);

const Dashboard = ({ onSettingsClick, onAddNetworkClick }: DashboardProps) => {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true); 
  const [showConnectionError, setShowConnectionError] = useState(false); 
  const [activeSliceIndex, setActiveSliceIndex] = useState<number>(0);
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const pioneer = usePioneerContext();
  const { state } = pioneer;
  const { app } = state;
  const router = useRouter();

  const flexDirection = useBreakpointValue({ base: 'column', md: 'row' }) as 'column' | 'row';

  const checkDesktopRunning = async (): Promise<boolean> => {
    console.log("🔍 [Dashboard] Checking if KeepKey Desktop is running...");
    try {
      const response = await fetch('http://localhost:1646/docs', {
        method: 'GET', 
        signal: AbortSignal.timeout(2000) 
      });

      if (response.status === 200) {
        console.log("✅ [Dashboard] KeepKey Desktop is running.");
        return true;
      } else {
        console.warn(`⚠️ [Dashboard] KeepKey Desktop check returned status: ${response.status}`);
        return false;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("❌ [Dashboard] KeepKey Desktop check timed out.");
      } else {
        console.error("❌ [Dashboard] Error checking KeepKey Desktop:", error);
      }
      return false;
    }
  };

  const formatBalance = (balance: string) => {
    try {
      if (!balance) return '0.00';
      const num = parseFloat(balance);
      if (isNaN(num)) return '0.00';
      return num.toFixed(8);
    } catch (e) {
      console.error("Error formatting balance:", e);
      return '0.00';
    }
  };

  const formatUsd = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '$ --';
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const middleEllipsis = (text: string, visibleChars = 16) => {
    if (!text) return '';
    if (text.length <= visibleChars) return text;
    
    const charsToShow = Math.floor(visibleChars / 2);
    return `${text.substring(0, charsToShow)}...${text.substring(text.length - charsToShow)}`;
  };

  useEffect(() => {
    console.log('📊 [Dashboard] Component mounted');
    return () => console.log('📊 [Dashboard] Component unmounting');
  }, []);

  useEffect(() => {
    console.log('📊 [Dashboard] AssetContext changed:', app?.assetContext);
    if (!app?.assetContext) {
      console.log('📊 [Dashboard] AssetContext is null, reloading dashboard');
      fetchDashboard();
    }
  }, [app?.assetContext]);

  useEffect(() => {
    if (!app) return;
    
    const intervalId = setInterval(() => {
      app
        .syncMarket()
        .then(() => {
          console.log("📊 [Dashboard] syncMarket called from Dashboard");
          setLastSync(Date.now());
          fetchDashboard();
        })
        .catch((error: any) => {
          console.error("❌ [Dashboard] Error in syncMarket:", error);
        });
    }, 15000);

    return () => clearInterval(intervalId);
  }, [app]);

  const fetchDashboard = async () => {
    console.log('📊 [Dashboard] Fetching dashboard data');
    setLoading(true);
    try {
      if(app && app.dashboard) {
        const dashboard = app.dashboard;
        console.log('📊 [Dashboard] Dashboard data received:', dashboard);
        
        const newTotalValue = dashboard.totalValueUsd || 0;
        const prevTotalValue = 0;
        
        if (newTotalValue > prevTotalValue && prevTotalValue > 0) {
          console.log("💰 [Dashboard] Portfolio value increased!", { 
            previous: prevTotalValue, 
            current: newTotalValue 
          });
          playSound(chachingSound);
        }
        
        setDashboard(dashboard);
        
        if (dashboard.networks && dashboard.networks.length > 0) {
          const sortedNetworks = [...dashboard.networks]
            .filter((network: Network) => parseFloat(network.totalNativeBalance) > 0)
            .sort((a, b) => b.totalValueUsd - a.totalValueUsd);
            
          if (sortedNetworks.length > 0) {
            const topAsset = sortedNetworks[0];
            const topAssetIndex = dashboard.networks
              .filter((network: Network) => parseFloat(network.totalNativeBalance) > 0)
              .findIndex((network: Network) => network.networkId === topAsset.networkId);
              
            if (topAssetIndex >= 0) {
              console.log('📊 [Dashboard] Setting active slice to top asset:', topAsset.gasAssetSymbol);
              setActiveSliceIndex(topAssetIndex);
            }
          }
        }
      } else {
        console.log('📊 [Dashboard] No dashboard data available');
      }
    } catch (error) {
      console.error('📊 [Dashboard] Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      console.log('📊 [Dashboard] Fetch complete');
    }
  };

  const chartData = dashboard?.networks
    .filter(network => parseFloat(network.totalNativeBalance) > 0)
    .map(network => ({
      name: network.gasAssetSymbol,
      value: network.totalValueUsd,
      color: network.color,
    })) || [];

  const handleHover = (index: number | null) => {
    if (index === null) {
      if (dashboard?.networks && dashboard.networks.length > 0) {
        setTimeout(() => {
          if (activeSliceIndex === null) {
            const sortedNetworks = [...dashboard.networks]
              .filter((network: Network) => parseFloat(network.totalNativeBalance) > 0)
              .sort((a, b) => b.totalValueUsd - a.totalValueUsd);
              
            if (sortedNetworks.length > 0) {
              const topAsset = sortedNetworks[0];
              const topAssetIndex = dashboard.networks
                .filter((network: Network) => parseFloat(network.totalNativeBalance) > 0)
                .findIndex((network: Network) => network.networkId === topAsset.networkId);
                
              if (topAssetIndex >= 0) {
                setActiveSliceIndex(topAssetIndex);
                return;
              }
            }
            setActiveSliceIndex(0);
          }
        }, 50);
      }
    } else if (index !== activeSliceIndex) {
      setActiveSliceIndex(index);
    }
  };

  const formatValueForChart = (value: number) => {
    return formatUsd(value);
  };

  const performInitialCheckAndFetch = async () => {
    const isRunning = await checkDesktopRunning();
    if (isRunning) {
      setShowConnectionError(false); 
      fetchDashboard();
    } else {
      setShowConnectionError(true);
      setLoading(false); 
    }
  };

  const handleRetry = async () => {
    setShowConnectionError(false);
    setLoading(true); 
    await performInitialCheckAndFetch(); 
  };

  useEffect(() => {
    performInitialCheckAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  if (showConnectionError) {
    return <ConnectionError onRetry={handleRetry} />;
  }

  return (
    <Box bg={theme.bg} color="white">

      <Flex 
        direction={flexDirection}
        gap={6} 
        alignItems="stretch"
      >
        <VStack 
          gap={0} 
          align="stretch" 
          flex={{ base: 'none', md: 1 }} 
          w='100%'
          bg={theme.cardBg}
          borderRadius="2xl"
          boxShadow="lg"
          overflow="visible"
        >

          <Flex 
            direction="column" 
            p={6}
            borderBottom="1px solid"
            borderColor="gray.800"
          >
            <Flex justify="space-between" align="center" mb={6} w="100%">
              <Text 
                fontSize="lg" 
                fontWeight="semibold"
              >
                Portfolio Distribution
              </Text>
              
              {loading ? (
                <Skeleton height="32px" width="100px" />
              ) : (
                <Text fontSize="2xl" fontWeight="bold" color={theme.gold}>
                  {formatUsd(dashboard?.totalValueUsd)}
                </Text>
              )}
            </Flex>
            {loading ? (
              <Flex justify="center" align="center" h="220px">
                <SkeletonCircle size="180px" />
              </Flex>
            ) : dashboard && dashboard.networks.length > 0 ? (
              <Flex justify="center" align="center" h="220px">
                <Box position="relative" w="200px" h="200px">
                  <DonutChart
                    data={dashboard.networks.map((network) => ({
                      id: network.networkId,
                      name: network.gasAssetSymbol, 
                      value: network.totalValueUsd,
                      label: network.gasAssetSymbol, 
                      color: network.color,
                    }))}
                    activeIndex={activeSliceIndex}
                  />
                  <Flex 
                    position="absolute" 
                    top="50%" 
                    left="50%" 
                    transform="translate(-50%, -50%)" 
                    direction="column"
                    align="center"
                    justify="center"
                    bg="rgba(0,0,0,0.7)"
                    borderRadius="full"
                    w="100px"
                    h="100px"
                    backdropFilter="blur(5px)"
                  >
                    {activeSliceIndex !== null && dashboard.networks[activeSliceIndex] ? (
                      <>
                        <Text fontSize="xs" color="gray.300" mb={0.5}>
                          {dashboard.networks[activeSliceIndex].gasAssetSymbol}
                        </Text>
                        <Text fontSize="md" fontWeight="bold" color={dashboard.networks[activeSliceIndex].color}>
                          {formatUsd(dashboard.networks[activeSliceIndex].totalValueUsd)}
                        </Text>
                        <Text fontSize="2xs" color="gray.400" mt={0.5}>
                          {dashboard.networkPercentages[activeSliceIndex]?.percentage.toFixed(1)}%
                        </Text>
                      </>
                    ) : (
                      <Text fontSize="sm" fontWeight="medium" color="gray.300">Hover for details</Text>
                    )}
                  </Flex>
                </Box>
              </Flex>
            ) : (
              <Flex justify="center" align="center" h="220px">
                <Text color="gray.500">No assets found</Text>
              </Flex>
            )}
          </Flex>

          {!loading && dashboard && dashboard.networks.length > 0 && (
            <Box px={6} py={4} borderTop="1px solid" borderColor="gray.800">
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="xs" color="gray.500">Asset</Text>
                <Text fontSize="xs" color="gray.500">Allocation</Text>
              </Flex>
              <VStack gap={2} align="stretch" maxH="100px" overflowY="auto" pr={2}
                css={{
                  '&::-webkit-scrollbar': { width: '3px' },
                  '&::-webkit-scrollbar-track': { background: 'transparent' },
                  '&::-webkit-scrollbar-thumb': { background: '#333', borderRadius: '10px' },
                }}
              >
                {loading ? (
                  <Skeleton height="40px" />
                ) : (
                  dashboard.networks
                    .filter(n => n.totalValueUsd > 0)
                    .sort((a, b) => b.totalValueUsd - a.totalValueUsd)
                    .slice(0, 3)
                    .map((network, index) => {
                      const percentage = dashboard.networkPercentages.find(p => p.networkId === network.networkId)?.percentage ?? 0;
                      return (
                        <Flex 
                          key={network.networkId}
                          justify="space-between" 
                          align="center"
                          py={1}
                          px={2}
                          borderRadius="md"
                          bg={activeSliceIndex === index ? `${network.color}15` : 'transparent'}
                          cursor="pointer"
                          transition="all 0.2s"
                          onMouseEnter={() => handleHover(index)}
                          onMouseLeave={() => handleHover(null)}
                        >
                          <HStack>
                            <Box w="2px" h="16px" borderRadius="full" bg={network.color} mr={1} />
                            <Text fontWeight="medium" fontSize="sm">{network.gasAssetSymbol}</Text>
                          </HStack>
                          <Text fontSize="sm" color={network.color} fontWeight="medium">{percentage.toFixed(1)}%</Text>
                        </Flex>
                      );
                    })
                )}
              </VStack>
            </Box>
          )}
        </VStack>

        <VStack 
          gap={4} 
          align="stretch" 
          flex={{ base: 'none', md: 1 }} 
          w='100%'
          bg={theme.cardBg}
          borderRadius="2xl"
          boxShadow="lg"
          overflow="visible"
          display="flex"
          flexDirection="column"
        >
          <Flex justify="space-between" align="center" p={6} borderBottom="1px solid" borderColor="gray.800">
            <HStack>
              <Text fontSize="lg" fontWeight="semibold">
                Your Assets
              </Text>
              {!loading && (
                <Text color="gray.500" fontSize="md">
                  ({dashboard?.networks?.length ?? 0})
                </Text>
              )}
            </HStack>
            <Button
              variant="ghost"
              size="sm"
              color={theme.gold}
              onClick={() => router.push('/assets')} 
              _hover={{ color: theme.goldHover }}
              h="28px"
              minW="auto"
              px={3}
            >
              View All
            </Button>
          </Flex>
          
          <Box 
            flexGrow={1} 
            overflowY="auto"
            maxH={{ base: "350px", md: "400px" }}
            px={6}
            pb={2}
            pt={4}
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#333333',
                borderRadius: '24px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#444444',
              },
            }}
          >
            <VStack gap={3} align="stretch" w="100%">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <NetworkSkeleton key={i} />)
              ) : !dashboard || dashboard.networks.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={10}>No assets found.</Text>
              ) : (
                dashboard.networks
                  .sort((a, b) => b.totalValueUsd - a.totalValueUsd) 
                  .map((network, index) => {
                    const percentage = dashboard.networkPercentages.find(p => p.networkId === network.networkId)?.percentage ?? 0;
                    
                    return (
                      <Box 
                        key={network.networkId}
                        p={2.5}
                        bg="#151515" 
                        borderRadius="xl"
                        borderLeft="2px solid" 
                        borderColor={network.color}
                        cursor="pointer"
                        transition="all 0.2s ease-in-out"
                        _hover={{
                          bg: `${network.color}10`,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 2px 8px ${network.color}20`
                        }}
                        onClick={() => {
                          console.log('📋 [Dashboard] Navigating to asset page:', network);
                          
                          // We always use the full CAIP from gasAssetCaip for navigation
                          const caip = network.gasAssetCaip;
                          
                          console.log('📋 [Dashboard] Using CAIP for navigation:', caip);
                          console.log('📋 [Dashboard] Network object:', network);
                          
                          // Use Base64 encoding for complex IDs to avoid URL encoding issues
                          const encodedCaip = btoa(caip);
                          
                          console.log('📋 [Dashboard] Encoded parameters:', { encodedCaip });
                          
                          // Navigate using encoded parameters to the simplified route
                          router.push(`/asset/${encodedCaip}`);
                        }}
                      >
                        <Flex justify="space-between" align="center">
                          <HStack gap={3} align="center">
                            <Image 
                              src={network.icon} 
                              alt={`${network.gasAssetSymbol} logo`} 
                              boxSize="32px" 
                              borderRadius="full" 
                              p="1px"
                              bg={`${network.color}20`}
                            />
                            <Stack gap={0}> 
                              <Text 
                                fontSize="md" 
                                fontWeight="medium" 
                                color="white"
                                maxW="100px"
                                truncate={true}
                                title={network.gasAssetSymbol} 
                              >
                                {network.gasAssetSymbol}
                              </Text>
                              <Text fontSize="sm" color="gray.400">
                                {parseFloat(network.totalNativeBalance).toFixed(6)}
                              </Text>
                            </Stack>
                          </HStack>
                          <Stack align="flex-end" gap={1}>
                            <Text 
                              fontSize="md" 
                              color={network.color}
                              fontWeight="medium"
                            >
                              ${network.totalValueUsd.toFixed(2)}
                            </Text>
                            <Box 
                              px={2}
                              py={0.5}
                              borderRadius="full"
                              bg={`${network.color}20`}
                              minW="42px"
                              textAlign="center"
                            >
                              <Text 
                                fontSize="xs" 
                                color={network.color}
                                fontWeight="medium"
                              >
                                {percentage.toFixed(1)}%
                              </Text>
                            </Box>
                          </Stack>
                        </Flex>
                      </Box>
                    );
                  })
              )}
            </VStack>
          </Box>

          <Flex 
            p={6} 
            borderTop="1px solid"
            borderColor="gray.800"
            justify="center"
            w="100%"
            mt="auto"
          >
            <Button
              variant="outline"
              borderStyle="dashed"
              color={theme.gold}
              size="md"
              px={4}
              _hover={{ bg: 'rgba(255, 215, 0, 0.05)' }}
              onClick={onAddNetworkClick}
              borderRadius="xl"
              h="40px"
            >
              <HStack gap={2}>
                <Box as="span" fontSize="lg">+</Box>
                <Text>Add Network</Text>
              </HStack>
            </Button>
          </Flex>
        </VStack>
      </Flex> 
    </Box>
  );
};

export default Dashboard; 
import {
  Box,
  Flex,
  Text,
  Badge,
  IconButton,
  Spinner,
} from '@chakra-ui/react';
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar } from '@/components/ui/avatar';
import React, { useEffect, useRef, useState } from 'react';
import { keyframes } from '@emotion/react';
import {
  RiAddBoxFill,
  RiArrowGoBackFill,
  RiArrowGoForwardFill,
} from 'react-icons/ri';
import {toaster} from '@/components/ui/toaster';
export const AccountsSidebar = ({ usePioneer }: any) => {
  const { state, connectWallet } = usePioneer();
  const { app, assets } = state;
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [motionEnabled, setMotionEnabled] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load motion preference from localStorage on component mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('motionEnabled');
    if (savedPreference !== null) {
      setMotionEnabled(JSON.parse(savedPreference));
    }
  }, []);

  const onStart = async () => {
    if (app && app.pairWallet && !isConnecting) {
      console.log('App loaded... connecting');
      await connectWallet('KEEPKEY');
      setIsConnecting(true);
      await app.getPubkeys();
      await app.getBalances();
    }
  };

  useEffect(() => {
    onStart();
  }, [app, app?.assetContext, assets]);

  const onSelect = (asset: any) => {
    if (asset.caip) {
      app.setAssetContext(asset);
      setSelectedAsset(asset.caip);

      // Show a toast with the selected context
      toaster.create({
        title: `Settings context set to ${asset.name}`,
        duration: 3000,
      });
    } else {
      console.error('Invalid asset', asset);
    }
  };

  const formatBalance = (balance: string) => {
    const [integer, decimal] = balance.split('.');
    const largePart = decimal?.slice(0, 4);
    return { integer, largePart };
  };

  const formatUsd = (valueUsd: any) => {
    if (valueUsd == null) return null;
    return valueUsd.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const sortedAssets = [...assets.values()]
      .filter(
          (asset) =>
              asset.type === 'native' && app.blockchains.includes(asset.networkId)
      )
      .sort((a: any, b: any) => {
        const balanceA = app.balances.find(
            (balance: any) => balance.caip === a.caip
        );
        const balanceB = app.balances.find(
            (balance: any) => balance.caip === b.caip
        );
        const valueUsdA = balanceA?.valueUsd || 0;
        const valueUsdB = balanceB?.valueUsd || 0;
        return valueUsdB - valueUsdA;
      });

  // Keyframes for smooth scrolling effect
  const scroll = keyframes`
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  `;

  // Speed of the scroll (can be adjusted)
  const scrollSpeed = '120s';

  // Handle checkbox toggle to control motion
  const handleMotionToggle = () => {
    const newMotionState = !motionEnabled;
    setMotionEnabled(newMotionState);
    localStorage.setItem('motionEnabled', JSON.stringify(newMotionState));
  };

  // Handle left/right scroll buttons
  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200; // Adjust scroll amount as needed
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Width of the arrow buttons (adjust if necessary)
  const arrowButtonWidth = 50;

  return (
      <Box
          height="100%"
          bg="black"
          color="white"
          p={2}
          overflow="hidden"
          position="relative"
      >

        {!assets || assets.size === 0 ? (
            <Flex justifyContent="center" alignItems="center" width="100%">
              <Spinner size="xl" />
              Loading....
            </Flex>
        ) : (
            <Flex position="relative" alignItems="center" overflow="hidden">
              {/* Left Arrow for manual scroll */}
              {/*<IconButton*/}
              {/*    aria-label="Scroll left"*/}
              {/*    icon={<RiArrowGoBackFill />}*/}
              {/*    size="lg"*/}
              {/*    position="absolute"*/}
              {/*    left="0"*/}
              {/*    zIndex="2"*/}
              {/*    onClick={() => handleScroll('left')}*/}
              {/*    colorScheme="gray"*/}
              {/*    background="rgba(0, 0, 0, 0.5)"*/}
              {/*    _hover={{ background: 'rgba(0, 0, 0, 0.7)' }}*/}
              {/*    borderRadius="full"*/}
              {/*    boxShadow="md"*/}
              {/*/>*/}

              {/* Wrapper to provide margins for buffer space */}
              <Box flex="1" mx={`${arrowButtonWidth}px`} overflow="hidden">
                {/* Scrollable assets container (hiding scrollbar) */}
                <Box
                    whiteSpace="nowrap"
                    display="flex"
                    alignItems="center"
                    animation={
                      motionEnabled
                          ? `${scroll} ${scrollSpeed} linear infinite`
                          : 'none'
                    }
                    ref={scrollContainerRef}
                    overflowX="auto"
                    css={{
                      '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar for WebKit browsers
                      '-ms-overflow-style': 'none', // Hide scrollbar for IE and Edge
                      'scrollbar-width': 'none', // Hide scrollbar for Firefox
                    }}
                >
                  {sortedAssets.map((asset: any, index: any) => (
                      <Box
                          key={index}
                          cursor="pointer"
                          onClick={() => onSelect(asset)}
                          p={2}
                          width="auto"
                          height="auto"
                          textAlign="center"
                          display="inline-flex"
                          flexDirection="column"
                          alignItems="center"
                          justifyContent="center"
                          gap={1}
                          border={
                            selectedAsset === asset.caip ? '2px solid green' : 'none'
                          }
                          transition="all 0.3s ease"
                          _hover={{
                            bg: 'gray.700',
                            color: 'white',
                            boxShadow: '0px 0px 8px rgba(255, 255, 255, 0.5)',
                          }}
                      >
                        <Avatar size="sm" src={asset.icon} mb={1} />
                        <Text
                            fontWeight="bold"
                            fontSize="xs"
                        >
                          {asset.name}
                        </Text>
                        {app.balances
                            .filter((balance: any) => balance.caip === asset.caip)
                            .map((balance: any, index: any) => {
                              const { integer, largePart } = formatBalance(
                                  balance.balance
                              );
                              return (
                                  <Text key={index} fontSize="xs">
                                    {integer}.{largePart} {asset.symbol}
                                  </Text>
                              );
                            })}
                        <Badge colorScheme="green" fontSize="xs">
                          {formatUsd(
                              app.balances.find(
                                  (balance: any) => balance.caip === asset.caip
                              )?.valueUsd
                          )}
                        </Badge>
                      </Box>
                  ))}

                  {/* Add Asset Button */}
                  <Box
                      cursor="pointer"
                      onClick={() => {
                        console.log('Add Asset clicked');
                      }}
                      p={2}
                      minWidth="50px"
                      height="auto"
                      textAlign="center"
                      display="inline-flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      gap={1}
                      _hover={{
                        bg: 'gray.700',
                        color: 'white',
                        boxShadow: '0px 0px 8px rgba(255, 255, 255, 0.5)',
                      }}
                  >
                    {/*<IconButton*/}
                    {/*    aria-label="Add Asset"*/}
                    {/*    icon={<RiAddBoxFill />}*/}
                    {/*    size="sm"*/}
                    {/*    isRound*/}
                    {/*    mb={1}*/}
                    {/*/>*/}
                    <Text fontWeight="bold" fontSize="xs">
                      Add Asset
                    </Text>
                  </Box>
                </Box>
              </Box>

              {/* Right Arrow for manual scroll */}
              {/*<IconButton*/}
              {/*    aria-label="Scroll right"*/}
              {/*    icon={<RiArrowGoForwardFill />}*/}
              {/*    size="lg"*/}
              {/*    position="absolute"*/}
              {/*    right="0"*/}
              {/*    zIndex="2"*/}
              {/*    onClick={() => handleScroll('right')}*/}
              {/*    colorScheme="gray"*/}
              {/*    background="rgba(0, 0, 0, 0.5)"*/}
              {/*    _hover={{ background: 'rgba(0, 0, 0, 0.7)' }}*/}
              {/*    borderRadius="full"*/}
              {/*    boxShadow="md"*/}
              {/*/>*/}
            </Flex>
        )}
        <Flex justifyContent="flex-end" alignItems="center" mb={4} width="100%">
          {/*<Checkbox*/}
          {/*    isChecked={!motionEnabled} // Inverse logic: checked means motion is off*/}
          {/*    onChange={handleMotionToggle}*/}
          {/*    colorScheme="yellow"*/}
          {/*    size="sm" // Make the checkbox smaller*/}
          {/*    mr={2} // Add some right margin to give space between the checkbox and the edge*/}
          {/*>*/}
          {/*  <Text fontSize="sm">Motion</Text> /!* Make the text smaller *!/*/}
          {/*</Checkbox>*/}
        </Flex>
      </Box>
  );
};

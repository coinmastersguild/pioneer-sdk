'use client';

import React, { useEffect, useState } from 'react';
import {
    Text,
    Flex,
    Box,
    Spinner,
    Center,
    Heading,
    IconButton,
    HStack,
    Badge,
    Link,
    SimpleGrid
} from '@chakra-ui/react';
import { Button } from "@/components/ui/button";
import { RiReceiptFill, RiSendPlaneFill, RiCloseCircleLine } from "react-icons/ri";
import { FiExternalLink } from 'react-icons/fi';
import { Transfer } from './Transfer';
import { Receive } from './Receive';
import { AccountsSidebar } from './AccountsSidebar';
import { Avatar } from '@/components/ui/avatar';

export default function Wallet({ usePioneer }: any) {
    const { state } = usePioneer();
    const { app } = state;
    const [asset, setAsset] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'send' | 'receive' | null>(null);

    useEffect(() => {
        if (app && app.assetContext) {
            setAsset(app.assetContext);
        }
    }, [app, app?.assetContext]);

    const handleOpenDialog = (tab: 'send' | 'receive') => {
        setActiveTab(tab);
    };

    const handleCloseTab = () => {
        setActiveTab(null);
    };

    if (!app) {
        return (
          <Center height="100vh" bg="gray.900" color="white" flexDirection="column">
              <Spinner size="xl" />
              <Text mt={4}>Loading application...</Text>
          </Center>
        );
    }

    const isSidebarReady = app && Array.isArray(app.blockchains) && app.blockchains.length > 0;

    return (
      <Flex height="100vh" bg="gray.900" color="white">

          {/* Main Content Area */}
          <Flex flex="1" direction="column">
              {/* Top Bar */}
              <Flex
                align="center"
                justify="space-between"
                borderBottom="1px solid"
                borderColor="gray.700"
                p={4}
              >
                  <Heading as="h2" size="md">
                      Asset Page
                  </Heading>
                  {activeTab && (
                    <IconButton
                      aria-label="Close dialog"
                      icon={<RiCloseCircleLine />}
                      onClick={handleCloseTab}
                      variant="ghost"
                      color="white"
                      _hover={{ bg: "gray.700" }}
                    />
                  )}
              </Flex>

              {/* Main Content */}
              <Flex flex="1" p={6} overflowY="auto" justify="center" align="start">
                  {activeTab === 'send' && (
                    <Transfer usePioneer={usePioneer} onClose={handleCloseTab} />
                  )}

                  {activeTab === 'receive' && (
                    <Receive usePioneer={usePioneer} onClose={handleCloseTab} />
                  )}

                  {/* If no active tab, show asset details or a placeholder */}
                  {!activeTab && (
                    <Box width="full" maxWidth="900px">
                        {!asset ? (
                          <Center flexDirection="column" height="full">
                              <Text color="gray.400" mt={4}>
                                  Select an account from the sidebar to view details.
                              </Text>
                          </Center>
                        ) : (
                          <Box
                            display="flex"
                            flexDirection="column"
                            gap={8}
                            divideY="1px"
                            divideColor="gray.700"
                          >
                              {/* Asset Overview */}
                              <Box>
                                  <Flex
                                    border="1px solid"
                                    borderColor="gray.700"
                                    borderRadius="md"
                                    p={4}
                                    direction={{ base: 'column', md: 'row' }}
                                    align="center"
                                  >
                                      <Avatar size="xl" src={asset.icon} mr={{md:4, base:0}} mb={{base:4, md:0}} />
                                      <Box flex="1">
                                          <Text fontSize="xl" fontWeight="bold">
                                              {asset.name} ({asset.symbol})
                                          </Text>
                                          <Text fontSize="sm" color="gray.300" mb={2}>
                                              {asset.caip}
                                          </Text>
                                          <HStack spacing={4} mb={2}>
                                              <Badge colorScheme="green">USD Value: ${parseFloat(asset.valueUsd || 0).toLocaleString()}</Badge>
                                              <Badge colorScheme="orange">Price: ${parseFloat(asset.priceUsd || 0).toLocaleString()}</Badge>
                                              <Badge colorScheme="blue">Balance: {asset.balance}</Badge>
                                          </HStack>
                                          {asset.explorer && (
                                            <Link href={asset.explorer} isExternal color="blue.200" fontSize="sm">
                                                View on Explorer <FiExternalLink style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                                            </Link>
                                          )}
                                      </Box>
                                  </Flex>
                              </Box>

                              {/* Pubkeys / Addresses */}
                              <Box>
                                  <Heading as="h3" size="sm" mb={2}>Associated Addresses</Heading>
                                  <Box
                                    border="1px solid"
                                    borderColor="gray.700"
                                    borderRadius="md"
                                    p={4}
                                    overflowY="auto"
                                    maxHeight="200px"
                                  >
                                      {asset.pubkeys && asset.pubkeys.map((pk: any, idx: number) => (
                                        <Box key={idx} mb={3} p={2} bg="gray.800" borderRadius="md">
                                            <Text fontSize="sm" fontWeight="bold">{pk.type.toUpperCase()} PUBKEY</Text>
                                            <Text fontSize="xs" color="gray.400" noOfLines={1}>{pk.pubkey}</Text>
                                            <Text fontSize="xs" color="gray.200">Address: {pk.address}</Text>
                                            <Text fontSize="xs" color="gray.200">Path: {pk.path}</Text>
                                            {asset.explorerAddressLink && pk.address && (
                                              <Link href={`${asset.explorerAddressLink}${pk.address}`} isExternal color="blue.200" fontSize="xs">
                                                  View Address <FiExternalLink style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                                              </Link>
                                            )}
                                        </Box>
                                      ))}
                                  </Box>
                              </Box>

                              {/* Balances */}
                              <Box>
                                  <Heading as="h3" size="sm" mb={2}>All Balances</Heading>
                                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                      {asset.balances && asset.balances.map((b: any, i: number) => (
                                        <Box
                                          key={i}
                                          border="1px solid"
                                          borderColor="gray.700"
                                          borderRadius="md"
                                          p={4}
                                          bg="gray.800"
                                        >
                                            <HStack justify="space-between" mb={2}>
                                                <Text fontWeight="bold" fontSize="sm">{b.pubkey.slice(0,12)}...</Text>
                                                <Badge colorScheme="green">${parseFloat(b.valueUsd || 0).toFixed(2)}</Badge>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.300">Balance: {b.balance} {b.symbol}</Text>
                                            {asset.explorerXpubLink && b.pubkey && (
                                              <Link href={`${asset.explorerXpubLink}${b.pubkey}`} isExternal color="blue.200" fontSize="xs">
                                                  View Xpub <FiExternalLink style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                                              </Link>
                                            )}
                                        </Box>
                                      ))}
                                  </SimpleGrid>
                              </Box>

                              {/* Actions */}
                              <Box>
                                  <HStack spacing={4}>
                                      <Button colorPalette="green" variant="solid" onClick={() => handleOpenDialog('send')}>
                                          <RiSendPlaneFill style={{ marginRight: '4px' }}/> Send
                                      </Button>
                                      <Button variant="surface" onClick={() => handleOpenDialog('receive')}>
                                          <RiReceiptFill style={{ marginRight: '4px' }}/> Receive
                                      </Button>
                                  </HStack>
                              </Box>
                          </Box>
                        )}
                    </Box>
                  )}
              </Flex>
          </Flex>
      </Flex>
    );
}

'use client';
import { RiAddFill } from "react-icons/ri";


import React, { useEffect, useState, useRef } from 'react';
import { Avatar } from "@/components/ui/avatar"
import { Box, Flex, Text, Input, Button, IconButton, Stack, Spacer, Table, SimpleGrid } from '@chakra-ui/react';
import { FiMic } from 'react-icons/fi';
import { AiOutlinePaperClip, AiOutlineGlobal } from 'react-icons/ai';
import { Card as ChakraCard, Image } from '@chakra-ui/react';

export function Explore({ usePioneer }: any): JSX.Element {
  const { state, connectWallet } = usePioneer();
  const { app } = state;
  const [assets, setAssets] = useState('...');
  const [blockchains, setBlockchains] = useState('...');
  const [data, setData] = React.useState<any[]>([]);
  //
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [timeOut, setTimeOut] = useState<NodeJS.Timeout | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10); // Set your desired page size
  const [totalAssetsCount, setTotalAssetsCount] = useState(0);
  const [selectedBlockchain, setSelectedBlockchain] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);


  const onStart = async function () {

    let globals = await app.pioneer.Globals()
    console.log("globals: ", globals.data)
    setAssets(globals.data.info.assets)
    setBlockchains(globals.data.info.blockchains)

    console.log('assets: ',app.assets)

    // Convert the assets object into a normal array for filtering
    if (app.assets) {
      const tmpAssets = Object.keys(app.assets).map(key => app.assets[key]);
      setAllAssets(tmpAssets);
    }

  }

  // onStart()
  useEffect(() => {
    onStart()
  }, [])


  const fetchPageData = async (page: any, pageSize: any, searchQuery: string) => {
    setIsLoading(true);

    try {
      let skip = page * pageSize;
      console.log('app.pioneer ',app.pioneer)
      let response = await app.pioneer.ListAssetsPageniate({
        limit: pageSize,
        skip: skip,
        query: searchQuery // Pass the search query to the API
      });
      console.log('response:  ',response.data)
      if (page === 0) {
        setData(response.data); // Replace data for new search
      } else {
        setData(existingData => [...existingData, ...response.data]); // Append new data
      }

      setCurrentPage(page);
      setTotalAssetsCount(response.totalCount || totalAssetsCount);
      setIsLoading(false);
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        // Handle error appropriately
        console.error(error);
      }
    }
  }


  // Debounce the query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Whenever query changes (after debounce), filter the asset array
  useEffect(() => {
    const filterAssets = () => {
      const lowerQuery = debouncedQuery.toLowerCase();

      const filtered = allAssets.filter(asset =>
        asset.symbol?.toLowerCase()?.includes(lowerQuery) ||
        asset.name?.toLowerCase()?.includes(lowerQuery) ||
        asset.networkName?.toLowerCase()?.includes(lowerQuery)
      );
      setSearchResults(filtered);
    };

    if (debouncedQuery) {
      filterAssets();
    } else {
      setSearchResults([]); // or set to allAssets if you prefer
    }
  }, [debouncedQuery, allAssets]);

  const items = [
    { id: 1, name: "Laptop", category: "Electronics", price: 999.99 },
    { id: 2, name: "Coffee Maker", category: "Home Appliances", price: 49.99 },
    { id: 3, name: "Desk Chair", category: "Furniture", price: 150.0 },
    { id: 4, name: "Smartphone", category: "Electronics", price: 799.99 },
    { id: 5, name: "Headphones", category: "Accessories", price: 199.99 },
  ]

  const Assets = () => {
    return (
      <Table.Root size="sm" striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Product</Table.ColumnHeader>
            <Table.ColumnHeader>Category</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Price</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map((item) => (
            <Table.Row key={item.id}>
              <Table.Cell>{item.name}</Table.Cell>
              <Table.Cell>{item.category}</Table.Cell>
              <Table.Cell textAlign="end">{item.price}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    )
  }


  return (
    <div>
      <Box bg="gray.900" color="white" minH="100vh" p={8}>
        {/* Header */}
        <Text fontSize="2xl" fontWeight="bold" textAlign="center" mb={8}>
          What can I help with?
        </Text>

        {/* Input Area */}
        <Flex
          bg="gray.800"
          p={4}
          rounded="md"
          align="center"
          boxShadow="md"
          maxW="600px"
          mx="auto"
        >
          {/* Attach and Global Icons */}
          <Flex align="center" gap={2}>
            <IconButton
              aria-label="Attach file"
              variant="ghost"
              color="gray.500"
              fontSize="20px"
            />
            <IconButton
              aria-label="Global icon"
              variant="ghost"
              color="gray.500"
              fontSize="20px"
            />
          </Flex>

          {/* Input Field */}
          <Input
            placeholder="Message KeepKeyGPT"
            color="white"
            px={4}
            _placeholder={{ color: 'gray.500' }}
            flex={1}
            onChange={(e) => setQuery(e.target.value)}
          />

          {/* Microphone Icon */}
          <IconButton
            aria-label="Voice input"
            variant="ghost"
            color="gray.500"
            fontSize="20px"
          />
        </Flex>

        {/* Action Buttons */}
        <Stack direction="row"  mt={6} justify="center">
          <Button variant="outline" colorScheme="green">
            Find an Asset
          </Button>
          <Button variant="outline" colorScheme="orange">
            Explore a blockchain
          </Button>
          <Button variant="outline" colorScheme="yellow">
            explore dApps
          </Button>
        </Stack>

        {/* Search Results as a grid of cards */}
        <SimpleGrid columns={[1, 2, 3]} spacing="6" mt={6}>
          {searchResults.map((asset) => (
            <ChakraCard.Root key={asset.assetId} maxW="sm" overflow="hidden">
              <Image src={asset.icon} alt={asset.name} />
              <ChakraCard.Body gap="2">
                <ChakraCard.Title>{asset.name}</ChakraCard.Title>
                <ChakraCard.Description>
                  Symbol: {asset.symbol}
                </ChakraCard.Description>
                <Text textStyle="2xl" fontWeight="medium" letterSpacing="tight" mt="2">
                  Network: {asset.networkName}
                </Text>
              </ChakraCard.Body>
            </ChakraCard.Root>
          ))}
        </SimpleGrid>
      </Box>
    </div>
  );
}

export default Explore;

'use client';
import { RiAddFill } from "react-icons/ri";


import React, { useEffect, useState, useRef } from 'react';
import { Avatar } from "@/components/ui/avatar"
import { Box, Flex, Text, Input, Button, IconButton, Stack, Spacer, Table, SimpleGrid, HStack } from '@chakra-ui/react';
import { FiMic } from 'react-icons/fi';
import { AiOutlinePaperClip, AiOutlineGlobal } from 'react-icons/ai';
import { Card as ChakraCard, Image } from '@chakra-ui/react';
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";
import { toaster } from '@/components/ui/toaster';

export function Explore({ usePioneer, setCurrentNav }: any): JSX.Element {
  const { state, connectWallet } = usePioneer();
  const { app } = state;
  const [assets, setAssets] = useState('...');
  const [blockchains, setBlockchains] = useState('...');
  const [data, setData] = React.useState<any[]>([]);
  //
  const [query, setQuery] = useState<string>('bitcoin');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [timeOut, setTimeOut] = useState<NodeJS.Timeout | null>(null);
  // Pagination state
  const [selectedBlockchain, setSelectedBlockchain] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Add pagination states
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Memoize the displayed results for the current page
  const displayedResults = React.useMemo(() => {
    // We slice the search results based on page and pageSize,
    // which is an even number.
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return searchResults.slice(start, end);
  }, [searchResults, page, pageSize]);

  const onStart = async function () {
    let globals = await app.pioneer.Globals()
    console.log("globals: ", globals.data)
    setAssets(globals.data.info.assets)
    setBlockchains(globals.data.info.blockchains)

    console.log('assets: ',app.assets)

    // Convert the assets object into a normal array for filtering
    if (app.assets) {
      const tmpAssets = Object.keys(app.assets).map((key) => {
        const asset = app.assets[key];
        if (!asset.caip) {
          asset.caip = key; // Ensure the asset has the caip set
        }
        return asset;
      });
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

  // Add a new function to handle asset clicks
  const handleAssetClick = async (asset: any) => {
    try{
      console.log("Asset clicked:", asset);
      await app.setAssetContext(asset);
      setCurrentNav('wallet')
      // Show a toast with the selected context
      toaster.create({
        title: `Settings context set to ${asset.name}`,
        duration: 3000,
      });
    }catch(error){
      console.error(error)
    }
  };

  return (
    <div>
      <Box bg="gray.900" color="white" minH="100vh" p={8}>
        {/* Header */}
        <Text fontSize="2xl" fontWeight="bold" textAlign="center" mb={8}>
          Explore the KeepKey Dashboard
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
            value={query}
            placeholder="Message KeepKeyGPT"
            color="white"
            px={4}
            _placeholder={{ color: 'gray.500' }}
            flex={1}
            onFocus={() => {
              setQuery('');
            }}
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
        {/*<Stack direction="row"  mt={6} justify="center">*/}
        {/*  <Button variant="outline" colorScheme="green">*/}
        {/*    Find an Asset*/}
        {/*  </Button>*/}
        {/*  <Button variant="outline" colorScheme="orange">*/}
        {/*    Explore a blockchain*/}
        {/*  </Button>*/}
        {/*  <Button variant="outline" colorScheme="yellow">*/}
        {/*    explore dApps*/}
        {/*  </Button>*/}
        {/*</Stack>*/}

        {/* Search Results as a grid of cards */}
        <SimpleGrid columns={[1, 2, 3]} gap={6} mt={6}>
          {displayedResults.map((asset) => (
            <ChakraCard.Root
              key={asset.assetId}
              maxW="sm"
              overflow="hidden"
              onClick={() => handleAssetClick(asset)}
            >
              <Image
                src={asset.icon}
                boxSize={asset.caip ? "150px" : "40px"} 
                borderRadius="full"
                fit="cover"
                alt={asset.name}
              />
              <ChakraCard.Body gap="2">
                <ChakraCard.Title>{asset.name}</ChakraCard.Title>
                <ChakraCard.Description>
                  Symbol: {asset.symbol}
                </ChakraCard.Description>
                <Text textStyle="2xl" fontWeight="medium" letterSpacing="tight" mt="2">
                  caip: {asset.caip}
                </Text>
              </ChakraCard.Body>
            </ChakraCard.Root>
          ))}
        </SimpleGrid>

        {/* Pagination */}
        <PaginationRoot
          count={searchResults.length}
          pageSize={pageSize}
          page={page}
          onPageChange={({ page }) => setPage(page)}
        >
          <HStack mt={4} justify="center">
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </HStack>
        </PaginationRoot>
      </Box>
    </div>
  );
}

export default Explore;

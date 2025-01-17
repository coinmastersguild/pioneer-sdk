'use client';
import { RiAddFill } from "react-icons/ri";


import React, { useEffect, useState, useRef } from 'react';
import { Avatar } from "@/components/ui/avatar"
import { Box, Flex, Text, Input, Button, IconButton, Stack, Spacer, Table } from '@chakra-ui/react';
import { FiMic } from 'react-icons/fi';
import { AiOutlinePaperClip, AiOutlineGlobal } from 'react-icons/ai';

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


  const onStart = async function () {

    let globals = await app.pioneer.Globals()
    console.log("globals: ", globals.data)
    setAssets(globals.data.info.assets)
    setBlockchains(globals.data.info.blockchains)
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

  // Fetch data when debouncedQuery changes
  useEffect(() => {
    if (debouncedQuery) {
      fetchPageData(0, pageSize, debouncedQuery);
    }
  }, [debouncedQuery, pageSize]);

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
              icon={<AiOutlinePaperClip />}
              aria-label="Attach file"
              variant="ghost"
              color="gray.500"
              fontSize="20px"
            />
            <IconButton
              icon={<AiOutlineGlobal />}
              aria-label="Global icon"
              variant="ghost"
              color="gray.500"
              fontSize="20px"
            />
          </Flex>

          {/* Input Field */}
          <Input
            variant="unstyled"
            placeholder="Message KeepKeyGPT"
            color="white"
            px={4}
            _placeholder={{ color: 'gray.500' }}
            flex={1}
          />

          {/* Microphone Icon */}
          <IconButton
            icon={<FiMic />}
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
      </Box>
    </div>
  );
}

export default Explore;

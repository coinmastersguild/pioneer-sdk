"use client";

import React, { useMemo, useState, useEffect } from "react";
import { VStack, Text, Flex, Box, HStack, Badge } from '@chakra-ui/react';
import { FaLock } from 'react-icons/fa';
import { Button as ChakraButton } from '@chakra-ui/react';
import {
  ActionBarContent,
  ActionBarRoot,
  ActionBarSelectionTrigger,
  ActionBarSeparator,
} from '@/components/ui/action-bar';
import { Table } from "@chakra-ui/react"
// Define the shape of inputsData
// Adjust as needed for your data structure.
type InputData = {
  txid: string;
  vout: number;
  locked: boolean;
  value: string;
  address: string;
  confirmations: number;
};

type CoinControlProps = {
  inputsData: InputData[];
  showSats: boolean;
  onToggleUnit: (showSats: boolean) => void;
  onSelectionChange: (totalSelectedValue: number) => void;
};

export function CoinControl({
                              inputsData,
                              showSats,
                              onToggleUnit,
                              onSelectionChange
                            }: CoinControlProps) {
  const [selection, setSelection] = useState<string[]>([]);
  const hasSelection = selection.length > 0;
  const indeterminate = hasSelection && selection.length < inputsData.length;

  const handleSelectAll = () => {
    const allUnlocked = inputsData.filter((i) => !i.locked).map((i) => `${i.txid}:${i.vout}`);
    setSelection(allUnlocked);
  };

  const handleClearSelection = () => {
    setSelection([]);
  };

  const toggleRowSelection = (key: string) => {
    setSelection((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const totalSelectedValue = useMemo(() => {
    let total = 0;
    for (let input of inputsData) {
      const key = `${input.txid}:${input.vout}`;
      if (selection.includes(key)) {
        total += parseInt(input.value, 10);
      }
    }
    return total;
  }, [selection, inputsData]);

  useEffect(() => {
    onSelectionChange(totalSelectedValue);
  }, [totalSelectedValue, onSelectionChange]);

  const displayAmount = (value: string) => {
    const valNumber = parseInt(value, 10);
    return showSats ? `${valNumber} sats` : `${(valNumber / 1e8).toFixed(8)} BTC`;
  };

  return (
    <>
      <Flex w="full" maxW="4xl" justifyContent="space-between" alignItems="center" mb={3} mt={6}>
        <Text color="white" fontWeight="semibold">Available Inputs</Text>
        <Flex gap="2" align="center">
          <Text color="white" fontSize="sm">Show in BTC</Text>
          <Box
            as="button"
            onClick={() => onToggleUnit(!showSats)}
            px="2"
            py="1"
            bg={showSats ? "gray.700" : "teal.600"}
            borderRadius="md"
            color="white"
            fontSize="sm"
            _hover={{ bg: showSats ? "gray.600" : "teal.500" }}
          >
            {showSats ? "Sats" : "BTC"}
          </Box>
          <ChakraButton size="sm" colorScheme="teal" onClick={handleSelectAll}>Select All</ChakraButton>
          <ChakraButton size="sm" variant="outline" colorScheme="gray" onClick={handleClearSelection}>Clear</ChakraButton>
        </Flex>
      </Flex>

      <Table.Root size="sm" interactive>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="6">
              <Box
                as="button"
                w="full"
                h="full"
                textAlign="left"
                onClick={() => {
                  if (selection.length > 0 && !indeterminate) {
                    handleClearSelection();
                  } else {
                    handleSelectAll();
                  }
                }}
                bg={selection.length > 0 && !indeterminate ? "teal.800" : "transparent"}
                _hover={{ bg: "teal.900" }}
                px="2"
                py="1"
                borderRadius="md"
                color="white"
                fontSize="sm"
              >
                All
              </Box>
            </Table.ColumnHeader>
            <Table.ColumnHeader>Address</Table.ColumnHeader>
            <Table.ColumnHeader>Value</Table.ColumnHeader>
            <Table.ColumnHeader>Confirmations</Table.ColumnHeader>
            <Table.ColumnHeader>Lock</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {inputsData.map((input) => {
            const key = `${input.txid}:${input.vout}`;
            const isSelected = selection.includes(key);
            return (
              <Table.Row
                key={key}
                cursor="pointer"
                onClick={() => toggleRowSelection(key)}
                bg={isSelected ? "teal.800" : "transparent"}
                _hover={{ bg: isSelected ? "teal.700" : "gray.700" }}
                tabIndex={0}
                _focusVisible={{ outline: "2px solid teal", outlineOffset: "2px" }}
              >
                <Table.Cell>
                  <Box
                    as="span"
                    display="inline-block"
                    w="3"
                    h="3"
                    borderRadius="full"
                    bg={isSelected ? "teal.400" : "gray.600"}
                  />
                </Table.Cell>
                <Table.Cell>{input.address}</Table.Cell>
                <Table.Cell>{displayAmount(input.value)}</Table.Cell>
                <Table.Cell>{input.confirmations}</Table.Cell>
                <Table.Cell>
                  <ChakraButton variant={input.locked ? "solid" : "outline"} size="sm" disabled={input.locked}>
                    <FaLock />
                  </ChakraButton>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>

      {hasSelection && (
        <Text color="gray.300" fontSize="sm" mt={3}>
          Selected Total: {showSats ? `${totalSelectedValue} sats` : `${(totalSelectedValue / 1e8).toFixed(8)} BTC`}
        </Text>
      )}

      <ActionBarRoot open={hasSelection}>
        <ActionBarContent>
          <ActionBarSelectionTrigger>
            {selection.length} selected
          </ActionBarSelectionTrigger>
          <ActionBarSeparator />
          <ChakraButton variant="outline" size="sm">
            Lock
          </ChakraButton>
          <ChakraButton variant="outline" size="sm">
            Freeze
          </ChakraButton>
        </ActionBarContent>
      </ActionBarRoot>
    </>
  );
}

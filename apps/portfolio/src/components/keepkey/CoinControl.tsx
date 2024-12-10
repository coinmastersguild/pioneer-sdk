"use client";

import React, { useState, useMemo } from 'react';
import {
  Flex,
  Text,
  VStack,
  Button as ChakraButton,
} from '@chakra-ui/react';
import { CheckboxCard } from "@/components/ui/checkbox-card";
import { Table } from "@chakra-ui/react"
import {
  ActionBarContent,
  ActionBarRoot,
  ActionBarSelectionTrigger,
  ActionBarSeparator,
} from "@/components/ui/action-bar"
import { FaLock } from 'react-icons/fa';

interface InputData {
  txid: string;
  vout: number;
  value: string;
  height: number;
  confirmations: number;
  address: string;
  path: string;
  locked?: boolean;
}

interface CoinControlProps {
  inputsData: InputData[];
  showSats: boolean;
  onToggleUnit: (showSats: boolean) => void;
  onSelectionChange: (totalSelectedValue: number) => void;
}

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

  const handleSelectRow = (key: string, selected: boolean) => {
    setSelection((prev) =>
      selected ? [...prev, key] : prev.filter((x) => x !== key)
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

  // Whenever selection changes, notify parent to prefill amount
  React.useEffect(() => {
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
          <CheckboxCard
            label="BTC Units"
            description="Toggle between Sats and BTC"
            selected={!showSats}
            onSelectedChange={(selected) => onToggleUnit(!selected)}
          />
          <ChakraButton size="sm" colorScheme="teal" onClick={handleSelectAll}>Select All</ChakraButton>
          <ChakraButton size="sm" variant="outline" colorScheme="gray" onClick={handleClearSelection}>Clear</ChakraButton>
        </Flex>
      </Flex>

      <Table.Root size="sm" interactive>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="6">
              <CheckboxCard
                label="All"
                description="Select or deselect all inputs"
                selected={selection.length > 0 && !indeterminate}
                onSelectedChange={(selected) => {
                  if (selected) {
                    handleSelectAll();
                  } else {
                    handleClearSelection();
                  }
                }}
              />
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
                data-selected={isSelected ? "" : undefined}
                style={{ background: isSelected ? 'rgba(0, 128, 128, 0.2)' : 'transparent' }}
              >
                <Table.Cell>
                  <CheckboxCard
                    label="Select"
                    description={`${input.address.slice(0,6)}...${input.address.slice(-6)}`}
                    selected={isSelected}
                    onSelectedChange={(selected) => handleSelectRow(key, selected)}
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

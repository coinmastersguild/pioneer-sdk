"use client";

import React, { useCallback } from "react";
import { VStack, Flex, Box, Text, Input } from "@chakra-ui/react";
import { Switch } from "@/components/ui/switch";
import { StepsPrevTrigger, StepsNextTrigger } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { useTransferContext } from "../Transfer";

export function StepSelectOutputs() {
  const {
    app,
    batchEnabled, setBatchEnabled,
    opReturnEnabled, setOpReturnEnabled,
    batchOutputs, setBatchOutputs,
    recipient, setRecipient,
    recipientError,
    opReturnData, setOpReturnData,
    canShowAmount,
    inputAmount, setInputAmount,
    handleSendMax,
    validateAddress
  } = useTransferContext();

  const addBatchOutput = useCallback(() => {
    setBatchOutputs(prev => [...prev, { recipient: '', amount: '' }]);
  }, [setBatchOutputs]);

  const handleBatchRecipientChange = useCallback((index: number, value: string) => {
    setBatchOutputs(prev => {
      const newOutputs = [...prev];
      newOutputs[index].recipient = value;
      return newOutputs;
    });
  }, [setBatchOutputs]);

  const handleBatchAmountChange = useCallback((index: number, value: string) => {
    setBatchOutputs(prev => {
      const newOutputs = [...prev];
      newOutputs[index].amount = value;
      return newOutputs;
    });
  }, [setBatchOutputs]);

  const renderBatchOutputs = () => (
    <VStack w="full" maxW="md" spacing={4} mt={4}>
      {batchOutputs.map((output, index) => (
        <Flex key={index} w="full" gap={2}>
          <Input
            placeholder="Recipient Address"
            value={output.recipient}
            onChange={(e) => handleBatchRecipientChange(index, e.target.value)}
            size="sm"
            bg="gray.800"
            color="white"
            _placeholder={{ color: 'gray.500' }}
          />
          <Input
            placeholder="Amount"
            value={output.amount}
            onChange={(e) => handleBatchAmountChange(index, e.target.value)}
            type="number"
            size="sm"
            bg="gray.800"
            color="white"
            _placeholder={{ color: 'gray.500' }}
          />
        </Flex>
      ))}
      <Button variant="outline" size="sm" onClick={addBatchOutput}>
        Add another output
      </Button>
    </VStack>
  );

  return (
    <VStack spacing={4} align="start">
      <Flex gap={8} align="center" justify="center" mt={4}>
        <Flex align="center" gap={2}>
          <Switch isChecked={batchEnabled} onChange={(e) => setBatchEnabled(e.target.checked)}>
            Batch Output
          </Switch>
        </Flex>
        <Flex align="center" gap={2}>
          <Switch isChecked={opReturnEnabled} onChange={(e) => setOpReturnEnabled(e.target.checked)}>
            OP_RETURN
          </Switch>
        </Flex>
      </Flex>

      {batchEnabled ? (
        renderBatchOutputs()
      ) : (
        <Box w="full" maxW="md" mt={4}>
          <Input
            placeholder="Recipient Address"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
            }}
            size="md"
            bg="gray.800"
            color="white"
            _placeholder={{ color: 'gray.500' }}
          />
          {recipientError && (
            <Text color="red.400" fontSize="xs" mt={1}>
              {recipientError}
            </Text>
          )}
        </Box>
      )}

      {opReturnEnabled && (
        <Box w="full" maxW="md">
          <Input
            placeholder="OP_RETURN Data (hex)"
            value={opReturnData}
            onChange={(e) => setOpReturnData(e.target.value)}
            size="md"
            bg="gray.800"
            color="white"
            _placeholder={{ color: 'gray.500' }}
            mt={4}
          />
        </Box>
      )}

      {canShowAmount && !batchEnabled && (
        <Box w="full" maxW="md" mt={4}>
          <Input
            placeholder="Amount"
            value={inputAmount}
            onChange={(e) => {
              setInputAmount(e.target.value);
            }}
            type="number"
            size="md"
            bg="gray.800"
            color="white"
            _placeholder={{ color: 'gray.500' }}
          />
          <Flex justifyContent="space-between" mt={1} align="center">
            <Text fontSize="sm" color="gray.400">
              Available Balance: {app.assetContext?.balances[0].balance ?? '0'} {app.assetContext?.symbol}
            </Text>
            <Button
              colorScheme="teal"
              size="sm"
              variant="solid"
              onClick={handleSendMax}
            >
              Send Max
            </Button>
          </Flex>
        </Box>
      )}

      <Flex gap={4} mt={4}>
        <StepsPrevTrigger asChild>
          <Button variant="outline" size="sm">Prev</Button>
        </StepsPrevTrigger>
        <StepsNextTrigger asChild>
          <Button variant="outline" size="sm">Next</Button>
        </StepsNextTrigger>
      </Flex>
    </VStack>
  );
}

"use client";

import React from "react";
import { VStack, Text, Flex, HStack, Badge } from "@chakra-ui/react";
import { StepsPrevTrigger, StepsNextTrigger } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { useTransferContext } from "../Transfer";
import { Avatar } from "@/components/ui/avatar";

export function StepSelectInputs() {
  const {
    app,
    coinControlEnabled,
    setCoinControlEnabled,
    inputsData,
    showSats,
    setShowSats,
    handleSelectionChange
  } = useTransferContext();

  const handleReviewUTXOs = () => {
    console.log("Reviewing UTXOs...");
    // Implement UTXO review logic here (e.g., navigate to another page or open a modal)
  };

  return (
    <VStack align="start" spacing={6} mt={6}>
      <Avatar size="xl" src={app.assetContext.icon} />

      <Text color="gray.400" fontSize="sm">
        Asset ID: {app.assetContext?.assetId}
      </Text>
      <HStack spacing={4} mb={2}>
        <Badge colorScheme="green">USD Value: ${parseFloat(app.assetContext.valueUsd || 0).toLocaleString()}</Badge>
        <Badge colorScheme="orange">Price: ${parseFloat(app.assetContext.priceUsd || 0).toLocaleString()}</Badge>
        <Badge colorScheme="blue">Balance: {app.assetContext.balance} BTC</Badge>
      </HStack>

      {/* Large text showing the total available BTC */}
      <Text fontSize="3xl" fontWeight="bold" color="white">
        You have a total available BTC of {app.assetContext.balance}
      </Text>

      {/* Three action buttons */}
      <Flex gap={4}>
        {/* Continue - goes to the next step */}
        <StepsNextTrigger asChild>
          <Button variant="solid" colorScheme="blue" size="md">
            Continue
          </Button>
        </StepsNextTrigger>

        {/* Select Custom Inputs - toggles coinControl */}
        <Button variant="outline" colorScheme="teal" size="md" onClick={() => setCoinControlEnabled(true)}>
          Select Custom Inputs
        </Button>

        {/* Review UTXOs - currently just logs, replace with your logic */}
        <Button variant="outline" colorScheme="gray" size="md" onClick={handleReviewUTXOs}>
          Review UTXO's
        </Button>
      </Flex>

      {/* Optionally, a Previous step trigger if needed */}
      <Flex mt={4}>
        <StepsPrevTrigger asChild>
          <Button variant="outline" size="sm">Prev</Button>
        </StepsPrevTrigger>
      </Flex>
    </VStack>
  );
}

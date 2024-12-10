"use client";

import React from "react";
import { VStack, Flex, Text } from "@chakra-ui/react";
import { StepsPrevTrigger, StepsNextTrigger } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { useTransferContext } from "../Transfer";

export function StepSelectFees() {
  const {
    feeLevel, setFeeLevel,
    buildTx
  } = useTransferContext();

  return (
    <VStack spacing={4}>
      <Text color="gray.300">Select Fee Level</Text>
      <Flex gap={2}>
        <Button variant={feeLevel===1?"solid":"outline"} colorScheme="green" size="sm" onClick={()=>setFeeLevel(1)}>Slow</Button>
        <Button variant={feeLevel===3?"solid":"outline"} colorScheme="green" size="sm" onClick={()=>setFeeLevel(3)}>Medium</Button>
        <Button variant={feeLevel===5?"solid":"outline"} colorScheme="green" size="sm" onClick={()=>setFeeLevel(5)}>Fast</Button>
      </Flex>

      <Button colorScheme="green" onClick={buildTx} size="md" variant="solid">
        Build Transaction
      </Button>

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

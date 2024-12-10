"use client";

import React from "react";
import { VStack, Text, Flex, Image } from "@chakra-ui/react";
import { StepsPrevTrigger, StepsNextTrigger } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { useTransferContext } from "../Transfer";

export function StepSignTx() {
  const {
    signedTx,
    broadcastTx
  } = useTransferContext();

  return (
    <>
      {!signedTx && (
        <VStack spacing={4}>
          <Image
            src="https://via.placeholder.com/150"
            alt="Confirm on Device"
            borderRadius="md"
          />
          <Text color="gray.300">Confirm transaction on your device...</Text>
        </VStack>
      )}
      <Flex gap={4} mt={4}>
        <StepsPrevTrigger asChild>
          <Button variant="outline" size="sm">Prev</Button>
        </StepsPrevTrigger>
        <StepsNextTrigger asChild>
          <Button variant="outline" size="sm" onClick={broadcastTx} isDisabled={!signedTx}>
            Next
          </Button>
        </StepsNextTrigger>
      </Flex>
    </>
  );
}

"use client";

import React from "react";
import { VStack, Text, Flex } from "@chakra-ui/react";
import { StepsPrevTrigger, StepsNextTrigger } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { TxReview } from "@/components/tx";
import { useTransferContext } from "../Transfer";

export function StepConfirmTx() {
  const {
    unsignedTx,
    signedTx,
    signTx
  } = useTransferContext();

  return (
    <>
      {unsignedTx && !signedTx && (
        <VStack
          maxW="full"
          w="full"
          whiteSpace="normal"
          overflowWrap="break-word"
          wordBreak="break-all"
          spacing={4}
          align="stretch"
        >
          <TxReview unsignedTx={unsignedTx.unsignedTx} isBuilding={false} />
          <Text color="gray.300">Review the transaction details above.</Text>
        </VStack>
      )}
      <Flex gap={4} mt={4}>
        <StepsPrevTrigger asChild>
          <Button variant="outline" size="sm">Prev</Button>
        </StepsPrevTrigger>
        <StepsNextTrigger asChild>
          <Button variant="outline" size="sm" onClick={signTx}>
            Sign Transaction
          </Button>
        </StepsNextTrigger>
      </Flex>
    </>
  );
}

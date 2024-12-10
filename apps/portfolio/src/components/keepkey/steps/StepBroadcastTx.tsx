"use client";

import React from "react";
import { VStack, Text, Box, Link, Flex } from "@chakra-ui/react";
import { StepsPrevTrigger } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { useTransferContext } from "../Transfer";

export function StepBroadcastTx() {
  const {
    signedTx,
    broadcastResult,
    txHash,
    explorerTxLink
  } = useTransferContext();

  return (
    <>
      {signedTx && !broadcastResult && (
        <VStack spacing={4}>
          <Button colorScheme="green">Broadcast Transaction</Button>
        </VStack>
      )}

      {broadcastResult && (
        <VStack spacing={4}>
          <Text color="gray.300">Transaction broadcasted successfully!</Text>
          {txHash && (
            <Box mt={4}>
              <Text fontSize="md" color="gray.300">
                Transaction ID:
              </Text>
              <Link
                href={`${explorerTxLink}${txHash}`}
                color="teal.500"
                isExternal
              >
                {txHash}
              </Link>
            </Box>
          )}
        </VStack>
      )}

      <Flex gap={4} mt={4}>
        <StepsPrevTrigger asChild>
          <Button variant="outline" size="sm">Prev</Button>
        </StepsPrevTrigger>
      </Flex>
    </>
  );
}

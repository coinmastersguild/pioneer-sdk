import React from 'react';
import { Box, Heading, Text, VStack, Link } from '@chakra-ui/react';

type TxStatusProps = {
  broadcastResult: any; // Adjust the type as needed
  explorerTxLink?: string;
  txHash?: string;
};

export function TxStatus({ broadcastResult, explorerTxLink, txHash }: TxStatusProps) {
  return (
    <VStack p={4} bg="gray.800" borderRadius="md"  alignItems="center">
      <Heading size="md" color="teal.300">
        Transaction Status
      </Heading>
      {broadcastResult ? (
        <>
          <Text color="green.300">Broadcast Successful!</Text>
          {txHash && explorerTxLink && (
            <Link href={`${explorerTxLink}${txHash}`} color="teal.400">
              View on Explorer
            </Link>
          )}
        </>
      ) : (
        <Text color="red.300">No broadcast result available.</Text>
      )}
    </VStack>
  );
}

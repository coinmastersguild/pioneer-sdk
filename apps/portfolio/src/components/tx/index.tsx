import React from 'react';
import { Box, Spinner, Text, Heading, VStack } from '@chakra-ui/react';

type TxProps = {
  unsignedTx?: any;
  isBuilding: boolean;
};

export function TxReview({ unsignedTx, isBuilding }: TxProps): JSX.Element {

  //classify

  return (
    <VStack p={4} bg="gray.800" borderRadius="md" spacing={4} alignItems="center">
      <Heading size="md" color="teal.300">
        Review Your Unsigned Transaction
      </Heading>
      {isBuilding ? (
        <>
          <Text color="gray.300">Building Transaction...</Text>
          <Spinner size="xl" />
        </>
      ) : unsignedTx ? (
        <Box p={4} bg="gray.900" w="100%" borderRadius="md" overflow="auto">
          method: {unsignedTx.method}
          <br/>
          caip: {unsignedTx.caip}
          <Text color="gray.100" fontSize="sm" whiteSpace="pre-wrap">
            {JSON.stringify(unsignedTx, null, 2)}
          </Text>
        </Box>
      ) : (
        <Text color="gray.300">
          No unsigned transaction data is available.
        </Text>
      )}
    </VStack>
  );
}

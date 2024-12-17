"use client";

import React, { useMemo } from "react";
import {
  VStack,
  Flex,
  Text,
  Button,
  Badge,
  HStack
} from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";
import { useTransferContext } from "../Transfer";

export function StepSelectFees() {
  const {
    feeLevel,
    setFeeLevel,
    buildTx,
    app,       // Assuming app is provided here with assetContext
    gasLimit,  // Assuming gasLimit is provided here
  } = useTransferContext();

  // Ensure gasLimit is numeric
  const numericGasLimit = useMemo(() => {
    if (typeof gasLimit === "string") {
      // If gasLimit is a hex string like "0x5208"
      if (gasLimit.startsWith("0x")) {
        return parseInt(gasLimit, 16);
      }
      return parseFloat(gasLimit);
    }
    return Number(gasLimit || 21000); // default to 21000 if undefined
  }, [gasLimit]);

  // Ensure priceUsd is numeric
  const priceUsd = useMemo(() => {
    if (!app?.assetContext?.priceUsd) return 0;
    const val = app.assetContext.priceUsd;
    if (typeof val === "string") {
      return parseFloat(val.replace(/,/g, ''));
    }
    return Number(val);
  }, [app]);

  const calculateUsdValue = (gweiFee) => {
    if (!app?.assetContext || !priceUsd) {
      console.error("Missing Price Data for Native gas asset or assetContext!");
      return '0.00';
    }

    // If numericGasLimit or priceUsd is zero or NaN, this will return NaN.
    // Make sure numericGasLimit and priceUsd are properly defined.
    const feeInETH = parseFloat(gweiFee) * numericGasLimit * 1e-9;
    const feeInUSD = feeInETH * priceUsd;
    return isNaN(feeInUSD) ? '0.00' : feeInUSD.toFixed(2);
  };

  // Define the three fee levels in Gwei
  const slowGwei = 1;
  const mediumGwei = 3;
  const fastGwei = 5;

  // Pre-calculate USD values for each fee level
  const slowUsd = useMemo(() => calculateUsdValue(slowGwei), [priceUsd, numericGasLimit]);
  const mediumUsd = useMemo(() => calculateUsdValue(mediumGwei), [priceUsd, numericGasLimit]);
  const fastUsd = useMemo(() => calculateUsdValue(fastGwei), [priceUsd, numericGasLimit]);

  return (
    <VStack align="start" spacing={4}>
      <HStack spacing={2}>
        <Avatar size="sm" src={app.assetContext?.icon} />
        <Text fontWeight="bold" fontSize="lg" color="white">
          {app.assetContext?.name}
        </Text>
        {app.assetContext?.priceUsd && (
          <Badge colorScheme="blue">${parseFloat(String(app.assetContext.priceUsd).replace(/,/g, '')).toLocaleString()} USD</Badge>
        )}
      </HStack>

      <VStack align="start" spacing={1}>
        <Text color="gray.300" fontSize="sm">Select Fee</Text>
        <Text fontSize="md" color="gray.300">
          Recommended fee: {mediumGwei} Gwei
          {" "}
          <Badge colorScheme="green">${mediumUsd} USD</Badge>
        </Text>
      </VStack>

      <Flex gap={2} wrap="wrap">
        <Button
          variant={feeLevel === slowGwei ? "solid" : "outline"}
          colorScheme="green"
          size="sm"
          onClick={() => setFeeLevel(slowGwei)}
        >
          Slow ({slowGwei} Gwei){" "}
          <Badge colorScheme="green">${slowUsd} USD</Badge>
        </Button>

        <Button
          variant={feeLevel === mediumGwei ? "solid" : "outline"}
          colorScheme="green"
          size="sm"
          onClick={() => setFeeLevel(mediumGwei)}
        >
          Medium ({mediumGwei} Gwei){" "}
          <Badge colorScheme="green">${mediumUsd} USD</Badge>
        </Button>

        <Button
          variant={feeLevel === fastGwei ? "solid" : "outline"}
          colorScheme="green"
          size="sm"
          onClick={() => setFeeLevel(fastGwei)}
        >
          Fast ({fastGwei} Gwei){" "}
          <Badge colorScheme="green">${fastUsd} USD</Badge>
        </Button>
      </Flex>

      <Button colorScheme="green" onClick={buildTx} size="md" variant="solid" mt={4}>
        Build Transaction
      </Button>
    </VStack>
  );
}

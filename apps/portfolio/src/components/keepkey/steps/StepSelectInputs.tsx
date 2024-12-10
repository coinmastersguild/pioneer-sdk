"use client";

import React from "react";
import { VStack, Text, Flex } from "@chakra-ui/react";
import { Switch } from "@/components/ui/switch";
import { StepsPrevTrigger, StepsNextTrigger } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { useTransferContext } from "../Transfer";
import {CoinControl } from "../Transfer";

export function StepSelectInputs() {
  const {
    app,
    coinControlEnabled, setCoinControlEnabled,
    inputsData, showSats, setShowSats,
    handleSelectionChange
  } = useTransferContext();

  return (
    <VStack align="start" spacing={4} mt={4}>
      <Text color="gray.400" fontSize="sm">
        Asset ID: {app.assetContext?.assetId}
      </Text>

      <Flex align="center" gap={2}>
        <Switch isChecked={coinControlEnabled} onChange={(e) => setCoinControlEnabled(e.target.checked)}>
          Coin Control
        </Switch>
      </Flex>
      {coinControlEnabled && (
        <CoinControl
          inputsData={inputsData}
          showSats={showSats}
          onToggleUnit={setShowSats}
          onSelectionChange={handleSelectionChange}
        />
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

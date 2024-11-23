"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";
//@ts-ignore
import { caipToNetworkId } from "@pioneer-platform/pioneer-caip";
import SwapInput from "../components/SwapInput";
import { RiArrowUpFill } from "react-icons/ri";
import CountUp from "react-countup";

const SelectAssets: React.FC<any> = ({ usePioneer, openModal, setInputAmount, assets_enabled }) => {
  const { state } = usePioneer();
  const { app } = state;

  const switchAssets = () => {
    const currentInput = app.assetContext;
    const currentOutput = app.outboundAssetContext;
    app.setOutboundAssetContext(currentInput);
    app.setAssetContext(currentOutput);
  };

  const onClickOutbound = () => {
    app?.setOutboundAssetContext(null); // Clear outbound context before opening modal
    openModal("Select Outbound");
  };

  const onClickInput = () => {
    app?.setAssetContext(null); // Clear input context before opening modal
    openModal("Select Asset");
  };

  return (
    <div>
      <Flex justifyContent="center" mx="auto" p="2rem">
        <HStack maxWidth="35rem" width="100%">
          {/* Input Asset Box */}
          <Box
            alignItems="center"
            border="1px solid #fff"
            borderRadius="8px"
            display="flex"
            flexDirection="column"
            h="250px"
            justifyContent="center"
            overflowY="auto"
            p="4"
            w="250px"
          >
            {!app.assetContext ? (
              <div onClick={onClickInput}>NO CONTEXT</div>
            ) : (
              <div onClick={onClickInput}>
                <Avatar size="2xl" src={app.assetContext?.icon} />
                <VStack>
                  <Text>Balance: {app.assetContext.balances[0].balance}</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    <CountUp
                      start={0}
                      end={parseFloat(app.assetContext.balances[0].valueUsd || "0")}
                      duration={2.5}
                      separator=","
                      decimals={2}
                      prefix="$"
                    />
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {app.assetContext.symbol}
                  </Text>
                </VStack>
              </div>
            )}
          </Box>

          {/* Switch Assets Button */}
          <Box
            onClick={switchAssets}
            cursor="pointer"
            _hover={{ color: "rgb(128,128,128)" }}
          >
            <RiArrowUpFill size="2em" />
          </Box>

          {/* Output Asset Box */}
          <Box
            alignItems="center"
            border="1px solid #fff"
            borderRadius="8px"
            display="flex"
            flexDirection="column"
            h="250px"
            justifyContent="center"
            overflowY="auto"
            p="4"
            w="250px"
          >
            {!app.outboundAssetContext ? (
              <div onClick={onClickOutbound}>NO CONTEXT</div>
            ) : (
              <div onClick={onClickOutbound}>
                <Avatar size="2xl" src={app.outboundAssetContext?.icon} />
                <VStack>
                  <Text>Balance: {app.outboundAssetContext.balances[0].balance}</Text><Text fontSize="3xl" fontWeight="bold" color="green.500">
                    <CountUp
                      start={0}
                      end={parseFloat(app.outboundAssetContext.balances[0].valueUsd || "0")}
                      duration={2.5}
                      separator=","
                      decimals={2}
                      prefix="$"
                    />
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {app.outboundAssetContext.symbol}
                  </Text>
                </VStack>
              </div>
            )}
          </Box>
        </HStack>
      </Flex>
      <SwapInput usePioneer={usePioneer} setInputAmount={setInputAmount} />
    </div>
  );
};

export default SelectAssets;

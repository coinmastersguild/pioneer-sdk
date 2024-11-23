import React, { useEffect, useState } from 'react';
import {
    Box,
    Flex,
    Spinner,
    Stack,
    Text,
} from '@chakra-ui/react';
import { Avatar } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { toaster } from '@/components/ui/toaster';
//@ts-ignore
import { caipToNetworkId } from '@pioneer-platform/pioneer-caip';
import CountUp from 'react-countup';

export function Assets({ usePioneer, isOutbound, onClose, assets_enabled }: any) {
    const { state } = usePioneer();
    const { app } = state;
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [assetInfo, setAssetInfo] = useState<any>(null);

    const BALANCE_THRESHOLD = 20;

    const onStart = async () => {
        try {
            let allAssetInfo = [];

            for (let caip of assets_enabled) {
                if (!isOutbound) {
                    let balances = app.balances.filter((e: any) => e.caip === caip);
                    if (balances.length > 0 && balances[0].balance > 0) {
                        let assetInfo = app.assetsMap.get(caip);
                        allAssetInfo.push({
                            ...assetInfo,
                            balance: parseFloat(balances[0].valueUsd),
                            icon: balances[0].icon,
                        });
                    }
                } else {
                    let pubkeys = app.pubkeys.filter((e: any) =>
                      e.networks.includes(caipToNetworkId(caip))
                    );
                    if (pubkeys && pubkeys.length > 0) {
                        let assetInfo = app.assetsMap.get(caip);
                        allAssetInfo.push({ ...assetInfo, pubkey: pubkeys[0] });
                    }
                }
            }
            setAssetInfo(allAssetInfo);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        onStart();
    }, []);

    const handleSelectAsset = (asset: any, isDisabled: boolean) => {
        if (isDisabled) {
            toaster.create({
                title: 'Unable to select asset',
                description: 'Balance too low.',
                duration: 3000,
            });
        } else if (asset.caip) {
            if (isOutbound) {
                app.setOutboundAssetContext(asset);
            } else {
                app.setAssetContext(asset);
            }
            setSelectedAsset(asset.caip);
            toaster.create({
                title: `Context set to ${asset.name} (${asset.caip})`,
                duration: 3000,
            });
            onClose();
        }
    };

    if (!assetInfo) {
        return (
          <Flex justifyContent="center" alignItems="center" height="100vh">
              <Spinner size="xl" />
          </Flex>
        );
    }

    return (
      <Stack>
          {assetInfo.map((asset: any, index: any) => {
              let isDisabled = false;
              if (!isOutbound && asset.balance < BALANCE_THRESHOLD) {
                  isDisabled = true;
              }

              return (
                <Box
                  key={index}
                  cursor={isDisabled ? 'not-allowed' : 'pointer'}
                  onClick={() => handleSelectAsset(asset, isDisabled)}
                  p={4}
                  width="100%"
                  display="flex"
                  alignItems="center"
                  border={
                      selectedAsset === asset.caip
                        ? '2px solid green'
                        : '1px solid gray'
                  }
                  borderRadius="md"
                  bg="black"
                  opacity={isDisabled ? 0.5 : 1}
                  _hover={{
                      bg: isDisabled ? 'gray.600' : 'gray.700',
                      color: isDisabled ? 'gray.400' : 'white',
                      boxShadow: isDisabled
                        ? 'none'
                        : '0px 0px 8px rgba(255, 255, 255, 0.5)',
                  }}
                  position="relative"
                >
                    {isDisabled && (
                      <Flex
                        position="absolute"
                        top="0"
                        left="0"
                        width="100%"
                        height="100%"
                        bg="rgba(0, 0, 0, 0.7)"
                        alignItems="center"
                        justifyContent="center"
                        zIndex="1"
                      >
                          <Text fontSize="lg" color="white" fontWeight="bold">
                              Balance too low
                          </Text>
                      </Flex>
                    )}
                    <Flex
                      width="100%"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                        <Flex alignItems="center" zIndex={isDisabled ? '0' : 'auto'}>
                            <Avatar size="lg" src={asset.icon} />
                            <Text
                              fontWeight="bold"
                              fontSize="md"
                              ml={3}
                              color={isDisabled ? 'gray.400' : 'white'}
                            >
                                {asset.symbol}
                            </Text>
                        </Flex>

                        <Flex flexDirection="column" alignItems="center">
                            <Tooltip content={asset.caip}>
                                <Text
                                  fontSize="xs"
                                  color="gray.500"
                                  textAlign="center"
                                  maxWidth="150px"
                                >
                                    {asset.caip}
                                </Text>
                            </Tooltip>
                        </Flex>

                        <Flex justifyContent="flex-end">
                            {!isOutbound && (
                              <Text
                                fontSize="lg"
                                fontWeight="bold"
                                color={isDisabled ? 'gray.400' : 'green.500'}
                              >
                                  <CountUp
                                    start={0}
                                    end={asset.balance}
                                    duration={2.5}
                                    separator=","
                                    decimals={2}
                                    prefix="$"
                                  />
                              </Text>
                            )}
                        </Flex>
                    </Flex>
                </Box>
              );
          })}
      </Stack>
    );
}

export default Assets;

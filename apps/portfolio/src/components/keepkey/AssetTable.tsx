import React, { useEffect, useState } from "react";
import { Table, Text, Box, Badge, Flex, IconButton } from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";
import CountUp from "react-countup";
import {
    AccordionItem,
    AccordionItemContent,
    AccordionItemTrigger,
    AccordionRoot,
} from "@/components/ui/accordion";

// Utility function to create a middle ellipsis string
function middleEllipsis(str = "", left = 6, right = 6) {
    if (str.length <= left + right) return str;
    return str.slice(0, left) + "..." + str.slice(-right);
}

const AssetTable = ({ usePioneer, onSelect }: any) => {
    const { state } = usePioneer();
    const { app } = state;
    const { balances } = app;

    const [filteredBalances, setFilteredBalances] = useState([]);
    const [lastSync, setLastSync] = useState(Date.now()); // Track last sync to force re-renders

    // State to track visibility of zero balances per network
    const [showZeroBalances, setShowZeroBalances] = useState<{ [key: string]: boolean }>({});

    // Set up interval to sync market data every 15 seconds
    useEffect(() => {
        if (!app) return;
        const intervalId = setInterval(() => {
            app
              .syncMarket()
              .then(() => {
                  //console.log("syncMarket called from AssetTable");
                  // Artificially adjust all balances by +0.01 for testing
                  if (app.balances && Array.isArray(app.balances)) {
                      app.balances = app.balances.map((balance: any) => {
                          const oldVal = parseFloat(balance.valueUsd || 0);
                          const newVal = oldVal + 0.01;
                          return { ...balance, valueUsd: newVal.toString() };
                      });
                  }
                  setLastSync(Date.now());
              })
              .catch((error: any) => {
                  console.error("Error in syncMarket:", error);
              });
        }, 15000);

        return () => clearInterval(intervalId);
    }, [app]);

    useEffect(() => {
        const tag = " | onStart | ";
        try {
            const networks = app.blockchains;
            //console.log(tag, "networks", networks);
            //console.log(tag, "balances", app.balances);

            const networkBalances = networks.map((network: any) => {
                const balancesForNetwork = balances.filter(
                  (balance: any) => balance.networkId === network
                );

                const totalValueUsd = balancesForNetwork.reduce(
                  (sum: any, balance: any) => sum + parseFloat(balance.valueUsd || 0),
                  0
                );

                const gasAssetBalance = balancesForNetwork.find((balance: any) =>
                  balance.caip.includes("slip44")
                );

                const icon = gasAssetBalance
                  ? gasAssetBalance.icon
                  : network.icon || balancesForNetwork[0]?.icon;

                return {
                    networkId: network,
                    networkName: network.name,
                    caip: network.caip,
                    icon,
                    totalValueUsd,
                    balances: balancesForNetwork,
                };
            });

            networkBalances.sort((a: any, b: any) => b.totalValueUsd - a.totalValueUsd);

            setFilteredBalances(networkBalances);
        } catch (error) {
            console.error("AssetTable: Error filtering balances", error);
        }
    }, [balances, lastSync, app.blockchains]);

    const handleRowClick = (balance: any) => {
        if (onSelect) {
            onSelect(balance);
        }
    };

    const toggleZeroBalances = (networkId: string) => {
        setShowZeroBalances((prev) => ({
            ...prev,
            [networkId]: !prev[networkId],
        }));
    };

    return (
      <AccordionRoot collapsible>
          {filteredBalances.map((network: any, index: any) => {
              // Split balances into two groups: non-zero and zero
              const nonZeroBalances = network.balances.filter((b: any) => parseFloat(b.balance) > 0);
              const zeroBalances = network.balances.filter((b: any) => parseFloat(b.balance) === 0);

              // Sort them by value
              nonZeroBalances.sort(
                (a: any, b: any) => parseFloat(b.valueUsd || 0) - parseFloat(a.valueUsd || 0)
              );
              zeroBalances.sort(
                (a: any, b: any) => parseFloat(b.valueUsd || 0) - parseFloat(a.valueUsd || 0)
              );

              return (
                <AccordionItem key={index} value={network.networkId}>
                    <AccordionItemTrigger>
                        <Box display="flex" alignItems="center">
                            <Avatar size="xl" src={network.icon} mr={2} />
                            <Text fontWeight="bold" fontSize="sm">
                                {network.networkId}
                            </Text>
                        </Box>
                        <Flex ml="auto" alignItems="center">
                            <Text fontSize="md" fontWeight="medium" mr={2}>
                                Total Value:
                            </Text>
                            <Text fontSize="2xl" fontWeight="bold" color="green.500" mr={4}>
                                <CountUp
                                  start={0}
                                  end={parseFloat(network.totalValueUsd)}
                                  duration={1.0}
                                  prefix="$"
                                  separator=","
                                  decimals={2}
                                  decimal="."
                                />
                            </Text>
                            {/*{zeroBalances.length > 0 && (*/}
                            {/*  <IconButton*/}
                            {/*    aria-label="Toggle zero balances"*/}
                            {/*    size="sm"*/}
                            {/*    variant="ghost"*/}
                            {/*    onClick={(e) => {*/}
                            {/*        e.stopPropagation();*/}
                            {/*        toggleZeroBalances(network.networkId);*/}
                            {/*    }}*/}
                            {/*    icon={<Text>{showZeroBalances[network.networkId] ? "˅" : "˄"}</Text>}*/}
                            {/*  />*/}
                            {/*)}*/}
                        </Flex>
                    </AccordionItemTrigger>
                    <AccordionItemContent>
                        <Table.Root size="sm" mt={4}>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>Asset</Table.ColumnHeader>
                                    <Table.ColumnHeader>Symbol</Table.ColumnHeader>
                                    <Table.ColumnHeader>CAIP</Table.ColumnHeader>
                                    <Table.ColumnHeader>pubkey</Table.ColumnHeader>
                                    <Table.ColumnHeader>identifier</Table.ColumnHeader>
                                    <Table.ColumnHeader>Balance</Table.ColumnHeader>
                                    <Table.ColumnHeader>Value (USD)</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {[...nonZeroBalances, ...(showZeroBalances[network.networkId] ? zeroBalances : [])].map(
                                  (balance: any, idx: any) => (
                                    <Table.Row
                                      onClick={() => handleRowClick(balance)}
                                      _hover={{ bg: "gray.500", cursor: "pointer" }}
                                      key={idx}
                                    >
                                        <Table.Cell>
                                            <Avatar size="sm" src={balance.icon} mr={2} />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Text fontSize="sm">{balance.symbol}</Text>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Text fontSize="sm">{balance.caip}</Text>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Text fontSize="sm">
                                                {balance.pubkey ? middleEllipsis(balance.pubkey, 6, 6) : ""}
                                            </Text>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Text fontSize="sm">
                                                {balance.identifier ? middleEllipsis(balance.identifier, 6, 6) : ""}
                                            </Text>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Text fontSize="sm">{balance.balance}</Text>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Box ml="auto">
                                                <Badge colorScheme="blue">
                                                    <CountUp
                                                      start={0}
                                                      end={parseFloat(balance.valueUsd || 0)}
                                                      duration={1.0}
                                                      prefix="$"
                                                      separator=","
                                                      decimals={2}
                                                      decimal="."
                                                    />
                                                </Badge>
                                            </Box>
                                        </Table.Cell>
                                    </Table.Row>
                                  )
                                )}
                            </Table.Body>
                        </Table.Root>
                    </AccordionItemContent>
                    <br />
                </AccordionItem>
              );
          })}
      </AccordionRoot>
    );
};

export default AssetTable;

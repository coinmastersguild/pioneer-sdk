'use client';

import React, { useEffect, useState } from 'react';
import {
    Text,
    Flex,
    Box,
    Spinner,
    Center,
} from '@chakra-ui/react';
import { Button } from "@/components/ui/button";
import { RiReceiptFill, RiSendPlaneFill, RiCloseCircleFill } from "react-icons/ri";
import { Transfer } from './Transfer';
import { Receive } from './Receive';
import {AccountsSidebar} from './AccountsSidebar';
import {Avatar} from '@/components/ui/avatar';
import AssetCard from './AssetCard';

export default function Wallet({ usePioneer }: any) {
    const { state } = usePioneer();
    const { app } = state;
    const [asset, setAsset] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'send' | 'receive' | null>(null);

    useEffect(() => {
        if (app && app.assetContext) {
            console.log("assetContext: ", app.assetContext);
            setAsset(app.assetContext);
        }
    }, [app, app?.assetContext]);

    const handleOpenDialog = (tab: 'send' | 'receive') => {
        setActiveTab(tab);
    };

    if (!app) {
        return (
            <Center height="100vh" bg="black" color="white">
                <Spinner size="xl" />
                <Text ml={4}>Loading...</Text>
            </Center>
        );
    }

    return (
        <Flex
            direction="column"
            align="center"
            justify="center"
            bg="gray.900"
            color="white"
            borderRadius="md"
            p={4}
            boxShadow="lg"
            minWidth="700px"
            textAlign="center"
            mx="auto"
            position="relative"
        >

            <RiCloseCircleFill
                onClick={() => setActiveTab(null)}
            />


            {/* Asset Context and Buttons */}
            {asset && !activeTab ? (
                <Box mb={4} width="100%">
                    <Avatar size="xl" src={app.assetContext.icon} />

                    <Text fontSize="lg" fontWeight="bold">
                        {app.assetContext.caip}
                    </Text>

                    <Text fontSize="lg" fontWeight="bold">
                        {app.assetContext.name}
                    </Text>

                    <Text fontSize="lg" fontWeight="bold">
                        {app.assetContext.symbol}
                    </Text>

                    {/*<Text fontSize="lg" fontWeight="bold">*/}
                    {/*    {app.assetContext.balances.length}*/}
                    {/*</Text>*/}

                    {/*{app.balances*/}
                    {/*    .filter((balance: any) => balance.caip === asset.caip)*/}
                    {/*    .map((balance: any, index: any) => (*/}
                    {/*        <AssetCard key={index} asset={asset} balance={balance} />*/}
                    {/*    ))}*/}

                    <Button colorPalette="green" variant="solid" onClick={() => handleOpenDialog('send')}>
                        <RiSendPlaneFill /> Send
                    </Button>
                    <br />
                    <Button variant="surface" flex="1" onClick={() => handleOpenDialog('receive')}>
                        <RiReceiptFill /> Receive
                    </Button>
                </Box>
            ) : null}

            {/* No Asset Context */}
            {!asset && !activeTab && (
                <AccountsSidebar usePioneer={usePioneer}></AccountsSidebar>
            )}

            {/* Active Tab Content */}
            {activeTab === 'send' && (
                <Transfer usePioneer={usePioneer} onClose={() => setActiveTab(null)} />
            )}

            {activeTab === 'receive' && (
                <Receive usePioneer={usePioneer} onClose={() => setActiveTab(null)} />
            )}
        </Flex>
    );
}

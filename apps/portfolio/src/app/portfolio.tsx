'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { VStack, Image, Flex, Center, Spinner, Text } from '@chakra-ui/react';
import AssetTable from '@/components/keepkey/AssetTable';
import Swap from '@/components/Swap';
import Charts from '@/components/keepkey/Charts';
import Wallet from '@/components/keepkey/Wallet';
import Connect from '@/components/keepkey/Connect';

//@ts-ignore
export default function Portfolio({ usePioneer, currentNav, setCurrentNav }: any) {
    const { state } = usePioneer();
    const { app, assets } = state;


    const [isConnected, setIsConnected] = useState(false);  // Added isConnected state
    // const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

    const onStart = async () => {
        if (app?.balances) {  // Only start if not already connected
            setIsConnected(true);  // Mark as connected after successful connection

            const searchParams = useSearchParams();
            const caip = searchParams.get('caip');
            const caipIn = searchParams.get('caipIn');
            const caipOut = searchParams.get('caipOut');
            const networkId = searchParams.get('networkId');
            const type = searchParams.get('type'); // e.g., 'tx' or 'swap'
            console.log('Type:', type);
            console.log('caipIn:', caipIn);
            console.log('caipOut:', caipOut);
            console.log('networkId:', networkId);

            if (type === 'swap') {
                if(caipIn) await app.setAssetContext({caip:caipIn})
                if(caipOut) await app.setAssetContext({caip:caipOut})
            } else if (type === 'wallet') {
                if(caip) await app.setAssetContext({caip:caip})
            } else {
                // if(networkId) //TODO filter portfolio by networkId
            }
        }
    };

    useEffect(() => {
        if (!isConnected) {
            onStart();
        }
    }, [app, assets, isConnected]);

    const onSelect = async (asset: any) => {
        console.log('asset: ', asset);
        if (asset.caip) {
            try {
                console.log('Switching to wallet view');
                setCurrentNav('wallet');
                await app.setAssetContext(asset);
                // setSelectedAsset(asset.caip);
            } catch (error) {
                console.error('Error setting asset context:', error);
            }
        }
    };

    if (!app || !isConnected) {
        return (
            <Center height="100vh" bg="black" color="white">
                <VStack>
                    <Image src={'https://i.ibb.co/jR8WcJM/kk.gif'} alt="KeepKey" />
                    <Spinner size="xl" />
                    <Text>Loading data...</Text>
                </VStack>
            </Center>
        );
    }

    return (
        <Flex
            flex="1"
            direction="column"
            minHeight="0"
            overflowY="auto"
            paddingBottom="150px"
            paddingX={["20px", "40px", "80px", "120px"]}
            bg="black"
            color="white"
        >
            {!isConnected ? (
                <Connect setIsConnected={setIsConnected} />
            ) : (
                <>
                    {currentNav === 'portfolio' && (
                        <>
                            <Charts usePioneer={usePioneer} onSelect={onSelect} />
                            <br/>
                            <AssetTable usePioneer={usePioneer} onSelect={onSelect}/>
                        </>
                    )}

                    {currentNav === 'wallet' && (
                        <Wallet usePioneer={usePioneer} />
                    )}

                    {currentNav === 'swap' && (
                        <Swap usePioneer={usePioneer} />
                    )}
                </>
            )}
        </Flex>
    );
}

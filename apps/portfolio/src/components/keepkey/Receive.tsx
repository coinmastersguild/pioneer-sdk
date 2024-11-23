import {Flex, Text} from "@chakra-ui/react";
// import QRCode from "qrcode.react";
import React, { useEffect, useState } from 'react';
import {Avatar} from "@/components/ui/avatar";
export function Receive({ usePioneer }: any) {
    const { state } = usePioneer();
    const { app, assetContext } = state;
    const [avatarUrl, setAvatarUrl] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');
    // const [pubkeys, setPubkeys] = useState([]);
    // const { hasCopied, onCopy } = useClipboard(selectedAddress);

    useEffect(() => {
        // if (assetContext && COIN_MAP_LONG[assetContext.chain as keyof typeof COIN_MAP_LONG]) {
        //     setAvatarUrl(`https://pioneers.dev/coins/${COIN_MAP_LONG[assetContext.chain as keyof typeof COIN_MAP_LONG]}.png`);
        // }
        // if (assetContext?.pubkeys?.length > 0) {
        //     setSelectedAddress(assetContext.pubkeys[0].address || assetContext.pubkeys[0].master);
        // }
    }, [assetContext]);

    useEffect(() => {
        if (app.pubkeys) {
            const filteredPubkeys = app.pubkeys.filter((pubkey: any) =>
                assetContext?.networkId?.startsWith('eip155')
                    ? pubkey.networks.some((networkId: any) => networkId.startsWith('eip155'))
                    : pubkey.networks.includes(assetContext?.networkId)
            );
            // setPubkeys(filteredPubkeys);
            if (filteredPubkeys.length > 0) setSelectedAddress(filteredPubkeys[0]?.address || filteredPubkeys[0]?.master);
        }
    }, [app.pubkeys, assetContext]);

    return (
        <div>
            <Flex justify="space-between" align="center" mb={2}>
                <Avatar size="lg" src={avatarUrl} />
                <Text fontSize="lg" fontWeight="bold" textAlign="center">Receive</Text>
                <br/>
                {selectedAddress}
                {/*<QRCode value={selectedAddress || ""} size={64} />*/}
            </Flex>

            <Flex align="center" justify="center" mt={2}>
                {/*<Button size="sm" onClick={onCopy}>{hasCopied ? 'Copied' : 'Copy Address'}</Button>*/}
            </Flex>
        </div>
    );
}
export default Receive;

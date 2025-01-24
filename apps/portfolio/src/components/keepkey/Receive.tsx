import {Flex, Text, Card, Image} from "@chakra-ui/react";
// import QRCode from "qrcode.react";
import React, { useEffect, useState } from 'react';
import {Avatar} from "@/components/ui/avatar";
export function Receive({ usePioneer }: any) {
    const { state } = usePioneer();
    const { app, assetContext } = state;
    const [avatarUrl, setAvatarUrl] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');
    const [pubkeys, setPubkeys] = useState([]);
    // const { hasCopied, onCopy } = useClipboard(selectedAddress);

    useEffect(() => {
        if (app.assetContext) {
            console.log(app.assetContext);
            setAvatarUrl(app.assetContext.icon)
        }
        // if (assetContext?.pubkeys?.length > 0) {
        //     setSelectedAddress(assetContext.pubkeys[0].address || assetContext.pubkeys[0].master);
        // }
    }, [app, app.assetContext]);

    useEffect(() => {
        if (app.pubkeys) {
            const filteredPubkeys = app.pubkeys.filter((pubkey: any) =>
                assetContext?.networkId?.startsWith('eip155')
                    ? pubkey.networks.some((networkId: any) => networkId.startsWith('eip155'))
                    : pubkey.networks.includes(assetContext?.networkId)
            );
            setPubkeys(filteredPubkeys);
            if (filteredPubkeys.length > 0) setSelectedAddress(filteredPubkeys[0]?.address || filteredPubkeys[0]?.master);
        }
    }, [app.pubkeys, assetContext]);

    return (
        <div>
          <Card.Root maxW="sm" overflow="hidden">
            <Avatar size="xl" src={avatarUrl} />
            <Card.Body gap="2">
              <Card.Title>Receive</Card.Title>
              <Card.Description>

              </Card.Description>
              <Text textStyle="2xl" fontWeight="medium" letterSpacing="tight" mt="2">
                <br/>
                <br/>
                {app.assetContext.pubkeys[0].master || app.assetContext.pubkeys[0].pubkey}
              </Text>
            </Card.Body>
            <Card.Footer gap="2">
              {/*<Button variant="solid">Buy now</Button>*/}
              {/*<Button variant="ghost">Add to cart</Button>*/}
            </Card.Footer>
          </Card.Root>
        </div>
    );
}
export default Receive;

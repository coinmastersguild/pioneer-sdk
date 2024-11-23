'use client';
import { RiAddFill } from "react-icons/ri";

import { Box, Button, Flex, Text } from '@chakra-ui/react';
import React, { useEffect, useState, useRef } from 'react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
} from '@/components/ui/dialog';

import ErrorQuote from './components/ErrorQuote';
import Assets from './components/Assets';
import Pending from './components/Pending';
import CompleteSwap from './steps/CompleteSwap';
import SelectAssets from './steps/SelectAssets';
import BeginSwap from './steps/BeginSwap';
import { useParams } from 'next/navigation';

const MODAL_STRINGS = {
  selectAsset: 'Select Asset',
  memolessWarning: 'Memoless Warning',
  pairWallet: 'Pair Wallet',
  addDestination: 'Add Destination',
  selectQuote: 'Select Quote',
  selectOutbound: 'Select Outbound',
  confirmTrade: 'Confirm Trade',
  pending: 'Show Pending',
  errorQuote: 'Error Quote',
};

let assets_enabled = [
  "eip155:1/slip44:60", // ETH
  "bip122:000000000019d6689c085ae165831e93/slip44:0", // BTC
  "cosmos:thorchain-mainnet-v1/slip44:931", // RUNE
  "bip122:00000000001a91e3dace36e2be3bf030/slip44:3", // DOGE
  "bip122:000000000000000000651ef99cb9fcbe/slip44:145", // BCH
  "bip122:000007d91d1254d60e2dd1ae58038307/slip44:5", // DASH
];

export function Swap({ usePioneer }: any): JSX.Element {
  const { state, connectWallet } = usePioneer();
  const { txid } = useParams<{ txid?: string }>();
  const { app, assetContext, outboundAssetContext, blockchainContext } = state;

  const [step, setStep] = useState(0);
  const [dialogType, setDialogType] = useState<string | null>(null);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<any>({});
  const [quoteId, setQuoteId] = useState<string>('');
  const [inputAmount, setInputAmount] = useState<number>(0);
  const [route, setRoute] = useState<any>(null);
  const [amountSelected, setAmountSelected] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isContinueVisible, setIsContinueVisible] = useState(true);
  const [showGoBack, setShowGoBack] = useState(false);
  const [continueButtonContent, setContinueButtonContent] = useState('Continue');

  const isStartCalled = useRef(false);

  const setHighestValues = async () => {
    // Logic for setting the highest value assets
  };

  useEffect(() => {
    setHighestValues();
  }, [app, app?.balances, app?.assetsMap]);

  useEffect(() => {
    const onStart = async function () {
      if (app && app.pairWallet) {
        await connectWallet('KEEPKEY');
        await app.getPubkeys();
        await app.getBalances();
      }
    };

    if (!isStartCalled.current) {
      onStart();
      isStartCalled.current = true;
    }
  }, [app]);

  const openDialog = (type: string) => {
    setDialogType(type);
    setIsDialogOpen(true);
  };

  const fetchQuote = async () => {
    let tag = " | fetchQuote | "
    try{
      console.log(tag,'Fetching quote...');
      console.log(tag,'inputAmount:',inputAmount)
      console.log(tag,'inputAmount:',typeof(inputAmount))

      if(!app.assetContext || !app.outboundAssetContext) throw Error('Invalid state, must have contexts set!')

      //perform swap
      const swapPayload:any = {
        caipIn: app.assetContext.caip,
        caipOut: app.outboundAssetContext.caip,
        //@ts-ignore
        amount: inputAmount, // Default minimal amount if not specified
        slippagePercentage: 5,
      };

      console.log(tag,'swapPayload: ', swapPayload);
      const txid = await app.swap(swapPayload);
      console.log('txid: ',txid)

      // // Quote fetching logic
      // const pubkeys = app.pubkeys.filter((e: any) => e.networks.includes(assetContext.networkId));
      // let senderAddress = pubkeys[0]?.address || pubkeys[0]?.master;
      // if (!senderAddress) throw new Error('senderAddress not found! wallet not connected');
      // if (senderAddress.includes('bitcoincash:')) {
      //   senderAddress = senderAddress.replace('bitcoincash:', '');
      // }
      //
      // const pubkeysOut = app.pubkeys.filter((e: any) => e.networks.includes(outboundAssetContext.networkId));
      // let recipientAddress = pubkeysOut[0]?.address || pubkeysOut[0]?.master;
      // if (!recipientAddress) throw new Error('recipientAddress not found! wallet not connected');
      // if (recipientAddress.includes('bitcoincash:')) {
      //   recipientAddress = recipientAddress.replace('bitcoincash:', '');
      // }
      //
      // let quote = {
      //   affiliate: '0x658DE0443259a1027caA976ef9a42E6982037A03',
      //   sellAsset: app.assetContext,
      //   sellAmount: inputAmount.toPrecision(8),
      //   buyAsset: app.outboundAssetContext,
      //   recipientAddress, // Fill this based on your logic
      //   senderAddress, // Fill this based on your logic
      //   slippage: '3',
      // }
      // console.log(tag,'quote: ',quote)
      //
      // let result = await app.pioneer.Quote(quote);
      // result = result.data;
      // console.log(tag,'result:',result)
      //
      // if (result && result.length > 0) {
      //   setQuotesData(result);
      //   openModal(MODAL_STRINGS.selectQuote);
      // } else {
      //   alert('No routes found!');
      // }
      //
      // if (result && result.error) {
      //   openModal(MODAL_STRINGS.errorQuote);
      //   setError(result);
      // }

    }catch(e){
      console.error(e)
    }
  };

  const handleClickContinue = () => {
    if (step === 0) {
      fetchQuote();
      setStep((prevStep) => prevStep + 1);
      setShowGoBack(true);
      setIsContinueVisible(true);
      return;
    }
  };

  const handleQuoteSelection = (quote: any) => {
    setQuoteId(quote.id);
    if (quote && quote.quote) setQuote(quote);
    setIsDialogOpen(false);
  };

  const goBack = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const openModal = (type: string) => {
    setDialogType(type)
    openDialog(type);
  }

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
            <SelectAssets
                usePioneer={usePioneer}
                assets_enabled={assets_enabled}
                openModal={openModal}
                openDialog={openDialog}
                setInputAmount={setInputAmount}
                setIsContinueVisible={setIsContinueVisible}
                setAmountSelected={setAmountSelected}
            />
        );
      case 1:
        return <BeginSwap usePioneer={usePioneer} setTxHash={setTxHash} onAcceptSign={openDialog} quote={quote} />;
      case 2:
        return <CompleteSwap usePioneer={usePioneer} quoteId={quoteId} route={route} txHash={txHash} />;
      default:
        return null;
    }
  };

  return (
      <div>
        {/*/!* Dialog Component *!/*/}
        <DialogRoot open={isDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogType}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              {/* Render content based on dialogType */}
              {dialogType === MODAL_STRINGS.selectAsset && (
                  <Assets usePioneer={usePioneer} isOutbound={false} onClose={() => setIsDialogOpen(false)} assets_enabled={assets_enabled} />
              )}
              {dialogType === MODAL_STRINGS.selectOutbound && (
                  <Assets usePioneer={usePioneer} isOutbound={true} onClose={() => setIsDialogOpen(false)} assets_enabled={assets_enabled}/>
              )}
              {dialogType === MODAL_STRINGS.errorQuote && <ErrorQuote error={error} onClose={() => setIsDialogOpen(false)} />}
              {dialogType === MODAL_STRINGS.pending && <Pending usePioneer={usePioneer} setTxHash={setTxHash} onClose={() => setIsDialogOpen(false)} />}
            </DialogBody>
            <DialogFooter>
              <Button colorScheme="blue" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </DialogContent>
        </DialogRoot>

        <Flex justifyContent="center" alignItems="center" flexDirection="column" minH="80vh">
          {renderStepContent()}
        </Flex>

        {/* Footer */}
        <Flex
            width="100%"
            bg="black"
            justifyContent="center"
            alignItems="center"
            textAlign="center"
            boxShadow="0 -2px 10px rgba(0, 0, 0, 0.3)"
        >
          {showGoBack && <Button onClick={goBack}>Go Back</Button>}
          {isContinueVisible && (
              <Button
                  colorScheme="green"
                  // leftIcon={<RiAddFill />}
                  onClick={handleClickContinue}
              >
                {continueButtonContent}
              </Button>
          )}
        </Flex>
      </div>
  );
}

export default Swap;

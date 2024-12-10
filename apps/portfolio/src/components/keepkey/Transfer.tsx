"use client";

import {
    Box,
    Flex,
    Heading,
    Input,
    Text,
    VStack,
    Link,
    Center,
    Spinner,
    Image,
} from '@chakra-ui/react';
import React, { useState, useCallback, useMemo } from 'react';
import { toaster } from '@/components/ui/toaster';
import { Avatar } from '@/components/ui/avatar';

import { Steps } from './Steps';
import { CoinControl } from './CoinControl';
import { Button } from "@/components/ui/button"

export function Transfer({ usePioneer }: any): JSX.Element {
    const { state } = usePioneer();
    const { app } = state;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputAmount, setInputAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [recipientError, setRecipientError] = useState('');
    const [showSteps, setShowSteps] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [txHash, setTxHash] = useState('');
    const [isMax, setIsMax] = useState(false);
    const [unsignedTx, setUnsignedTx] = useState<any>(null);
    const [signedTx, setSignedTx] = useState<any>(null);
    const [broadcastResult, setBroadcastResult] = useState<any>(null);
    const [showSats, setShowSats] = useState(true);

    const validateAddress = (address: string) => true;
    const caip = app.assetContext?.caip;
    const explorerTxLink = app.assetContext?.explorerTxLink;

    const handleSend = useCallback(async () => {
        if (!inputAmount || !recipient) {
            toaster.create({
                title: 'Error',
                description: 'Both amount and recipient address are required.',
                duration: 5000,
            });
            return;
        }

        if (!validateAddress(recipient)) {
            setRecipientError('Invalid address format.');
            return;
        }

        setIsSubmitting(true);

        setUnsignedTx(null);
        setSignedTx(null);
        setBroadcastResult(null);
        setTxHash('');
        setShowSteps(false);
        setCurrentStep(0);

        const sendPayload = {
            caip: app.assetContext?.caip,
            to: recipient,
            amount: inputAmount,
            feeLevel: 5,
            isMax,
        };

        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
            let unsignedTxResult = await app.buildTx(sendPayload);
            let transactionState: any = {
                method: 'transfer',
                caip,
                params: sendPayload,
                unsignedTx: unsignedTxResult,
                signedTx: null,
                state: 'unsigned',
                context: app.assetContext,
            };
            setUnsignedTx(transactionState);
            setShowSteps(true);
            setCurrentStep(0);
        } catch (error) {
            toaster.create({
                title: 'Transaction Failed',
                description: 'An error occurred during the transaction.',
                duration: 5000,
            });
            setShowSteps(false);
        } finally {
            setIsSubmitting(false);
        }
    }, [app, inputAmount, recipient, isMax]);

    const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setRecipient(value);
        if (validateAddress(value)) {
            setRecipientError('');
        } else {
            setRecipientError('Invalid address format.');
        }
    };

    const handleSendMax = () => {
        try {
            const balance = app.assetContext?.balances[0].balance ?? '0';
            setInputAmount(balance);
            setIsMax(true);
        } catch (error) {
            toaster.create({
                title: 'Error',
                description: 'Unable to load the maximum balance.',
                duration: 5000,
            });
        }
    };

    const handleApproveTx = useCallback(async () => {
        if (!unsignedTx) return;
        setCurrentStep(1);

        try {
            let signedTxResult = await app.signTx({ caip, unsignedTx: unsignedTx.unsignedTx });
            setSignedTx(signedTxResult);
            setCurrentStep(2);
        } catch (error) {
            toaster.create({
                title: 'Signing Failed',
                description: 'An error occurred during the transaction signing.',
                duration: 5000,
            });
        }
    }, [app, unsignedTx, caip]);

    const handleBroadcastTx = useCallback(async () => {
        if (!signedTx) return;
        try {
            let broadcast = await app.broadcastTx(caip, signedTx);
            const finalTxHash = broadcast.txHash || broadcast.txid;
            setTxHash(finalTxHash);
            setBroadcastResult(broadcast);
            setShowSteps(false);
        } catch (error) {
            toaster.create({
                title: 'Broadcast Failed',
                description: 'An error occurred during the broadcast.',
                duration: 5000,
            });
        }
    }, [app, signedTx, caip]);

    // Sample inputs
    const inputsData = useMemo(() => [
        {
            txid: 'a47f60ff416f17cc9b0543f8afe05ae8bad98c9c2c69c207ecc0d50799dc52f0',
            vout: 0,
            value: '38544',
            height: 873975,
            confirmations: 96,
            address: 'bc1q8w2ypqgx39gucxcypqv2m90wz9rvhmmrcnpdjs',
            path: "m/84'/0'/0'/0/0",
            locked: false
        },
        {
            txid: 'a47f60ff416f17cc9b0543f8afe05ae8bad98c9c2c69c207ecc0d50799dc52f0',
            vout: 2,
            value: '20411',
            height: 873975,
            confirmations: 96,
            address: '3M9rBdu7rkVGwmt9gALjuRopAqpVEBdNRR',
            path: "m/49'/0'/0'/0/0",
            locked: false
        }
    ], []);

    const handleSelectionChange = (totalSelectedValue: number) => {
        // Always show native BTC in the form
        const btcValue = totalSelectedValue / 1e8; // Convert sats to BTC
        setInputAmount(btcValue.toFixed(8));
    };

    return (
      <VStack p={8} bg="gray.900" mx="auto" mt={10} textAlign="center" spacing={6}>
          {!showSteps && !broadcastResult && (
            <>
                <Heading as="h2" size="lg" color="teal.300">
                    Send Crypto
                </Heading>

                <Flex align="center" gap={4}>
                    <Avatar size="lg" src={app.assetContext?.icon} />
                    <VStack align="start">
                        <Text fontSize="lg" fontWeight="bold" color="white">
                            {app.assetContext?.name} ({app.assetContext?.symbol})
                        </Text>
                        <Link
                          href={`${app.assetContext?.explorerAddressLink}${app.assetContext?.pubkeys[0].address}`}
                          color="teal.400"
                        >
                            View on Explorer
                        </Link>
                        <Text color="gray.400" fontSize="sm">
                            Asset ID: {app.assetContext?.assetId}
                        </Text>
                        <Text color="gray.400" fontSize="sm">
                            Network: {app.assetContext?.networkName}
                        </Text>
                    </VStack>
                </Flex>

                {/* Coin Control is now shown above the form */}
                <CoinControl
                  inputsData={inputsData}
                  showSats={showSats}
                  onToggleUnit={setShowSats}
                  onSelectionChange={handleSelectionChange}
                />



                <Box w="full" maxW="md">
                    <Input
                      placeholder="Recipient Address"
                      value={recipient}
                      onChange={handleRecipientChange}
                      size="md"
                      bg="gray.800"
                      color="white"
                      _placeholder={{ color: 'gray.500' }}
                    />
                    {recipientError && (
                      <Text color="red.400" fontSize="xs" mt={1}>
                          {recipientError}
                      </Text>
                    )}
                </Box>

                <Box w="full" maxW="md">
                    <Input
                      placeholder="Amount"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      type="number"
                      size="md"
                      bg="gray.800"
                      color="white"
                      _placeholder={{ color: 'gray.500' }}
                    />
                    <Flex justifyContent="space-between" mt={1} align="center">
                        <Text fontSize="sm" color="gray.400">
                            Available Balance: {app.assetContext?.balances[0].balance ?? '0'} {app.assetContext?.symbol}
                        </Text>
                        <Button
                          colorScheme="teal"
                          size="sm"
                          variant="solid"
                          onClick={handleSendMax}
                        >
                            Send Max
                        </Button>
                    </Flex>
                </Box>

                <Flex gap={4} align="center" justify="center">
                    <Button
                      colorScheme="teal"
                      onClick={handleSend}
                      size="md"
                      variant="solid"
                    >
                        Build Transaction
                    </Button>
                </Flex>

                {isSubmitting && !unsignedTx && (
                  <Center mt={8}>
                      <VStack>
                          <Text fontSize="lg" color="gray.300">Building your transaction...</Text>
                          <Spinner size="xl" />
                      </VStack>
                  </Center>
                )}
            </>
          )}

          <Steps
            showSteps={showSteps}
            currentStep={currentStep}
            unsignedTx={unsignedTx}
            signedTx={signedTx}
            onApproveTx={handleApproveTx}
            onBroadcastTx={handleBroadcastTx}
          />

          {!showSteps && broadcastResult && (
            <>
                <Text color="gray.300">Transaction broadcasted successfully!</Text>
                {txHash && (
                  <Box mt={4}>
                      <Text fontSize="md" color="gray.300">
                          Transaction ID:
                      </Text>
                      <Link
                        href={`${explorerTxLink}${txHash}`}
                        color="teal.500"
                      >
                          {txHash}
                      </Link>
                  </Box>
                )}
            </>
          )}
      </VStack>
    );
}

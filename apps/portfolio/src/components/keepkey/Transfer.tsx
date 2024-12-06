import {
    Box,
    Button,
    Flex,
    Heading,
    Input,
    Text,
    VStack,
    Link,
    Center,
    Spinner,
    Image
} from '@chakra-ui/react';
import React, { useState, useCallback } from 'react';
import { toaster } from '@/components/ui/toaster';
import { Avatar } from '@/components/ui/avatar';
import {
    StepsCompletedContent,
    StepsContent,
    StepsItem,
    StepsList,
    StepsRoot,
} from '@/components/ui/steps';

import { TxReview } from '@/components/tx';
import { TxStatus } from '@/components/txStatus';

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

    const validateAddress = (address: string) => {
        // Implement address validation if needed
        return true;
    };

    const caip = app.assetContext?.caip;
    const explorerTxLink = app.assetContext?.explorerTxLink;

    const handleSend = useCallback(async () => {
        let tag = ' | handleSend | ';
        try {
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

            // Clear previous states
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

            // Simulate delay to show spinner
            await new Promise((resolve) => setTimeout(resolve, 2000));

            let unsignedTxResult = await app.buildTx(sendPayload);
            console.log(tag, 'unsignedTx: ', unsignedTxResult);

            let transactionState: any = {
                method: 'transfer',
                caip,
                params: sendPayload,
                unsignedTx: unsignedTxResult, // raw unsigned tx is here
                signedTx: null,
                state: 'unsigned',
                context: app.assetContext,
            };
            setUnsignedTx(transactionState);
            setShowSteps(true);
            setCurrentStep(0); // Step 0 = Review Unsigned Tx

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
        let tag = ' | handleSendMax | ';
        try {
            const balance = app.assetContext?.balances[0].balance ?? '0';
            setInputAmount(balance);
            setIsMax(true);
            console.log(tag, 'Max balance loaded: ', balance);
        } catch (error) {
            console.error(tag, error);
            toaster.create({
                title: 'Error',
                description: 'Unable to load the maximum balance.',
                duration: 5000,
            });
        }
    };

    // Handle Approve Transaction (sign)
    const handleApproveTx = useCallback(async () => {
        let tag = ' | handleApproveTx | ';
        try {
            if (!unsignedTx) return;
            // Move to step 1: Confirm on Device
            setCurrentStep(1);

            // Sign asynchronously
            let signedTxResult = await app.signTx({ caip, unsignedTx: unsignedTx.unsignedTx });
            console.log(tag, 'signedTx: ', signedTxResult);
            setSignedTx(signedTxResult);

            // Once we have signedTx, move to step 2: Show SignedTx and Broadcast button
            setCurrentStep(2);
        } catch (error) {
            toaster.create({
                title: 'Signing Failed',
                description: 'An error occurred during the transaction signing.',
                duration: 5000,
            });
        }
    }, [app, unsignedTx, caip]);

    // Handle Broadcast Transaction
    const handleBroadcastTx = useCallback(async () => {
        let tag = ' | handleBroadcastTx | ';
        try {
            if (!signedTx) return;
            let broadcast = await app.broadcastTx(caip, signedTx);
            console.log(tag, 'broadcast: ', broadcast);

            // Assume broadcast returns a txHash
            const finalTxHash = broadcast.txHash || broadcast.txid;
            setTxHash(finalTxHash);
            setBroadcastResult(broadcast);

            // Hide steps and show TxStatus
            setShowSteps(false);

        } catch (error) {
            toaster.create({
                title: 'Broadcast Failed',
                description: 'An error occurred during the broadcast.',
                duration: 5000,
            });
        }
    }, [app, signedTx, caip]);

    return (
      <VStack p={8} bg="gray.900" mx="auto" mt={10} textAlign="center">
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
                          isExternal
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

                <Box>
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

                <Box>
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
                    <Flex justifyContent="space-between" mt={1}>
                        <Text fontSize="sm" color="gray.400">
                            Available Balance: {app.assetContext?.balances[0].balance ?? '0'}{' '}
                            {app.assetContext?.symbol}
                        </Text>
                        <Button size="sm" colorScheme="teal" onClick={handleSendMax}>
                            Send Max
                        </Button>
                    </Flex>
                </Box>

                <Button
                  colorScheme="teal"
                  onClick={handleSend}
                  size="lg"
                  shadow="md"
                  _hover={{ bg: 'teal.600' }}
                  isLoading={isSubmitting}
                >
                    Build Transaction
                </Button>

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

          {showSteps && (
            <StepsRoot count={3} index={currentStep} mt={4}>
                <StepsList mb={4}>
                    <StepsItem index={0} title="Review Unsigned Tx" />
                    <StepsItem index={1} title="Confirm on Device" />
                    <StepsItem index={2} title="Broadcast Transaction" />
                </StepsList>

                {/* Step 0: Review Unsigned Tx */}
                <StepsContent index={0}>
                    {unsignedTx && !signedTx && (
                      <VStack spacing={4}>
                          {/* Pass the raw unsignedTx data directly */}
                          <TxReview unsignedTx={unsignedTx.unsignedTx} isBuilding={false} />
                          <Button colorScheme="green" onClick={handleApproveTx}>
                              Approve Transaction (Sign)
                          </Button>
                      </VStack>
                    )}
                </StepsContent>

                {/* Step 1: Confirm on Device */}
                <StepsContent index={1}>
                    {!signedTx && (
                      <VStack spacing={4}>
                          <Image
                            src="https://via.placeholder.com/150"
                            alt="Confirm on Device"
                            borderRadius="md"
                          />
                          <Text color="gray.300">Confirm transaction on your device...</Text>
                      </VStack>
                    )}
                </StepsContent>

                {/* Step 2: SignedTx ready, show and Broadcast button */}
                <StepsContent index={2}>
                    {signedTx}
                    <Button colorScheme="blue" onClick={handleBroadcastTx}>
                        Broadcast Transaction
                    </Button>

                    {/*{signedTx && !broadcastResult && (*/}
                    {/*  <VStack spacing={4}>*/}
                    {/*      /!* Pass the signedTx as unsignedTx prop to display in TxReview *!/*/}
                    {/*      {signedTx}*/}
                    {/*      <Button colorScheme="blue" onClick={handleBroadcastTx}>*/}
                    {/*          Broadcast Transaction*/}
                    {/*      </Button>*/}
                    {/*  </VStack>*/}
                    {/*)}*/}
                </StepsContent>

                <StepsCompletedContent>
                    <Text textAlign="center" color="gray.300">
                        All steps are complete!
                    </Text>
                </StepsCompletedContent>
            </StepsRoot>
          )}

          {!showSteps && broadcastResult && (
            <TxStatus broadcastResult={broadcastResult} explorerTxLink={explorerTxLink} txHash={txHash} />
          )}

          {txHash && !showSteps && (
            <Box mt={4}>
                <Text fontSize="md" color="gray.300">
                    Transaction ID:
                </Text>
                <Link
                  href={`${explorerTxLink}${txHash}`}
                  color="teal.500"
                  isExternal
                >
                    {txHash}
                </Link>
            </Box>
          )}
      </VStack>
    );
}

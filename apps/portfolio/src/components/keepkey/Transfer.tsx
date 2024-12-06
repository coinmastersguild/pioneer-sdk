import {
    Badge,
    Box,
    Button,
    Flex,
    Heading,
    Input,
    Text,
    VStack,
    Link,
    Center,
    Spinner
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

import { TxReview } from '@/components/tx'; // Import the new component

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

    const validateAddress = (address: string) => {
        // TODO: Implement actual validation logic
        return true;
    };

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

            // Show a spinner while building the transaction
            // Steps will be shown *after* building is complete
            setShowSteps(false);
            setUnsignedTx(null);

            const sendPayload = {
                caip: app.assetContext?.caip,
                to: recipient,
                amount: inputAmount,
                feeLevel: 5,
                isMax,
            };

            // Simulate building transaction with a delay to show the spinner
            await new Promise((resolve) => setTimeout(resolve, 2000));

            let unsignedTxResult = await app.buildTx(sendPayload);
            console.log(tag, 'unsignedTx: ', unsignedTxResult);

            // Once unsignedTx is ready, show steps and start at step 0 (Review)
            setUnsignedTx(unsignedTxResult);
            setShowSteps(true);
            setCurrentStep(0);
            setTxHash('');

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

    return (
      <VStack
        p={8}
        bg="gray.900"
        mx="auto"
        mt={10}
        textAlign="center"
      >
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

          {/* Show a spinner if we are building (isSubmitting) and no unsignedTx yet */}
          {isSubmitting && !unsignedTx && (
            <Center mt={8}>
                <VStack>
                    <Text fontSize="lg" color="gray.300">Building your transaction...</Text>
                    <Spinner size="xl" />
                </VStack>
            </Center>
          )}

          {/* After building is done, show steps */}
          {showSteps && unsignedTx && (
            <StepsRoot count={3} mt={4}>
                <StepsList mb={4}>
                    <StepsItem index={0} title="Review Unsigned Tx" />
                    <StepsItem index={1} title="Sign Transaction" />
                    <StepsItem index={2} title="Broadcast Transaction" />
                </StepsList>

                {/* Step 1: Review */}
                <StepsContent index={0}>
                    <TxReview unsignedTx={unsignedTx} isBuilding={false} />
                </StepsContent>

                {/* Step 2: Sign (placeholder - add your sign logic) */}
                <StepsContent index={1}>
                    <Text fontSize="lg" color="gray.300">
                        Please sign the transaction on your device.
                    </Text>
                    <Center mt={4}>
                        <Avatar size="2xl" src="https://pioneers.dev/coins/keepkey.png" />
                    </Center>
                </StepsContent>

                {/* Step 3: Broadcast (placeholder - add your broadcast logic) */}
                <StepsContent index={2}>
                    <Text fontSize="lg" color="gray.300">
                        Broadcasting your transaction...
                    </Text>
                    <Center mt={4}>
                        <Spinner size="xl" />
                    </Center>
                </StepsContent>

                <StepsCompletedContent>
                    <Text textAlign="center" color="gray.300">
                        All steps are complete!
                    </Text>
                </StepsCompletedContent>
            </StepsRoot>
          )}

          {txHash && (
            <Box mt={4}>
                <Text fontSize="md" color="gray.300">
                    Transaction ID:
                </Text>
                <Link
                  href={`${app.assetContext?.explorerTxLink}${txHash}`}
                  color="teal.500"
                >
                    {txHash}
                </Link>
            </Box>
          )}
      </VStack>
    );
}

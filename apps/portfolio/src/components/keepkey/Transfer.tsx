import {
    Badge,
    Box,
    Button,
    Flex,
    Heading,
    Input,
    Text,
    VStack,
    Spinner,
    Link,
    Center,
} from '@chakra-ui/react';
import React, { useState, useCallback } from 'react';
//@ts-ignore
import confetti from 'canvas-confetti';
import { toaster } from '@/components/ui/toaster';
import { Avatar } from '@/components/ui/avatar'; // Preserved original Avatar import
import {
    StepsCompletedContent,
    StepsContent,
    StepsItem,
    StepsList,
    StepsRoot,
} from '@/components/ui/steps';

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
    const [isMax, setIsMax] = useState(false); // New state for Send Max

    const validateAddress = (address: string) => {
        // TODO: Replace with actual validation logic (e.g., regex for blockchain address)
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
            setShowSteps(true);
            setCurrentStep(0); // Start with approving on device

            // Simulate user approving on device
            await new Promise((resolve) => setTimeout(resolve, 2000));

            setCurrentStep(1); // Move to building transaction

            const sendPayload = {
                caip: app.assetContext?.caip,
                to: recipient,
                amount: inputAmount,
                feeLevel: 5,
                isMax, // Pass sendMax to the transfer payload
            };

            // Simulate building transaction
            await new Promise((resolve) => setTimeout(resolve, 1000));

            //Build transaction before sending
            const result = await app.transfer(sendPayload, true);
            console.log(tag, 'result: ', result);

            //test as BEX (multi-set)
            // let unsignedTx = await app.buildTx(sendPayload);

            //review edit and approve
            //separate UX for tendermint utxo and evm and other
            //sign
            // let signedTx = await app.signTx({ caip, unsignedTx });
            //
            // //broadcast
            // let broadcast = await app.broadcastTx(caipToNetworkId(caip), signedTx);

            confetti();
            setTxHash(result.txHash || result.txid);
            toaster.create({
                title: 'Transaction Successful',
                description: `Transaction ID: ${result.txHash || result.txid}`,
                duration: 5000,
            });

            setInputAmount('');
            setRecipient('');
            setCurrentStep(2); // Move to confirmation
        } catch (error) {
            toaster.create({
                title: 'Transaction Failed',
                description: 'An error occurred during the transaction.',
                duration: 5000,
            });
            setShowSteps(false); // Hide steps on failure
        } finally {
            setIsSubmitting(false);
        }
    }, [app, inputAmount, recipient]);

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
          >
              Send
          </Button>

          {showSteps && (
            <StepsRoot count={3} mt={4}>
                <StepsList mb={4}>
                    <StepsItem index={0} title="Approve on Device" />
                    <StepsItem index={1} title="Building Transaction" />
                    <StepsItem index={2} title="Confirmation" />
                </StepsList>

                <StepsContent index={0}>
                    <Text fontSize="lg" textAlign="center" color="gray.300">
                        Please approve the transaction on your device.
                    </Text>
                    <Center mt={4}>
                        <Avatar size="2xl" src="https://pioneers.dev/coins/keepkey.png" />
                    </Center>
                </StepsContent>

                <StepsContent index={1}>
                    <Text fontSize="lg" color="gray.300">
                        Building your transaction...
                    </Text>
                    <Center mt={4}>
                        <Spinner size="xl" />
                    </Center>
                </StepsContent>

                <StepsContent index={2}>
                    <Text fontSize="lg" textAlign="center" color="green.500">
                        Transaction Successful!
                    </Text>
                    <Box mt={4} textAlign="center">
                        <Text fontWeight="bold">Transaction ID:</Text>
                        <Link
                          href={`${app.assetContext?.explorerTxLink}${txHash}`}
                          color="teal.500"
                        >
                            {txHash}
                        </Link>
                    </Box>
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

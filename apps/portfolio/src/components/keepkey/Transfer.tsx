import {
    Badge,
    Box,
    Button,
    Flex,
    Heading,
    Input,
    Text,
    VStack,
} from '@chakra-ui/react';
import React, { useState, useCallback } from 'react';
//@ts-ignore
import confetti from 'canvas-confetti';
import { toaster } from '@/components/ui/toaster';
import { Avatar } from '@/components/ui/avatar';
import CountUp from 'react-countup';

export function Transfer({ usePioneer }: any): JSX.Element {
    const { state } = usePioneer();
    const { app } = state;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputAmount, setInputAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [recipientError, setRecipientError] = useState('');

    const validateAddress = (address: string) => {
        // TODO: Replace with actual validation logic (e.g., regex for blockchain address)
        return true;
    };

    const handleSend = useCallback(async () => {
        let tag = ' | handleSend | '
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
            const sendPayload = {
                caip: app.assetContext?.caip,
                to: recipient,
                amount: inputAmount,
                feeLevel: 5,
            };

            const result = await app.transfer(sendPayload, true);
            console.log(tag,"result: ",result)

            confetti();
            toaster.create({
                title: 'Transaction Successful',
                description: `Transaction ID: ${result.txHash || result.txid}`,
                duration: 5000,
            });

            setInputAmount('');
            setRecipient('');
        } catch (error) {
            toaster.create({
                title: 'Transaction Failed',
                description: 'An error occurred during the transaction.',
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [app, app.assetContext, inputAmount, recipient]);

    const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setRecipient(value);
        if (validateAddress(value)) {
            setRecipientError('');
        } else {
            setRecipientError('Invalid address format.');
        }
    };

    return (
      <VStack>
          <Heading as="h1" size="md" color="teal">
              Send Crypto
          </Heading>

          <Flex align="center" gap={2}>
              <Avatar size="md" src={app.assetContext?.icon} />
              <Box>
                  <Text>
                      Asset: <Badge colorScheme="green">{app.assetContext?.name}</Badge>
                  </Text>
                  <Text>
                      CAIP: <Badge colorScheme="purple">{app.assetContext?.caip}</Badge>
                  </Text>
                  <Text>
                      Balance: <Badge colorScheme="blue">{app.assetContext?.balances[0].balance}</Badge>
                  </Text>
                  {/*<Text*/}
                  {/*  fontSize="lg"*/}
                  {/*  fontWeight="bold"*/}
                  {/*  color={isDisabled ? 'gray.400' : 'green.500'}*/}
                  {/*>*/}
                  {/*    <CountUp*/}
                  {/*      start={0}*/}
                  {/*      end={app?.assetContext?.balances[0].balance}*/}
                  {/*      duration={2.5}*/}
                  {/*      separator=","*/}
                  {/*      decimals={2}*/}
                  {/*      prefix="$"*/}
                  {/*    />*/}
                  {/*</Text>*/}
              </Box>
          </Flex>

          <Input
            placeholder="Recipient Address"
            value={recipient}
            onChange={handleRecipientChange}
          />
          {recipientError && (
            <Text color="red.500" fontSize="sm">
                {recipientError}
            </Text>
          )}

          <Input
            placeholder="Amount"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            type="number"
          />
          <Text fontSize="sm" color="gray.500">
              Available Balance: {app.assetContext?.balances[0].balance ?? '0'}
          </Text>

          <Button
            colorScheme="green"
            onClick={handleSend}
          >
              {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
      </VStack>
    );
}

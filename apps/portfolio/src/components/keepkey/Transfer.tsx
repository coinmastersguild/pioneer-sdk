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
import {toaster} from '@/components/ui/toaster';
import {Avatar} from '@/components/ui/avatar';

export function Transfer({ usePioneer }: any): JSX.Element {
    const { state } = usePioneer();
    const { app, assetContext } = state;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputAmount, setInputAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [recipientError, setRecipientError] = useState('');

    const validateAddress = (address: string) => {
        //TODO
        // Replace with actual validation logic (e.g., regex for blockchain address)
        // const isValid = address.startsWith('0x') && address.length === 42;
        return true;
    };

    const handleSend = useCallback(async () => {
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
                caip: assetContext?.caip,
                to: recipient,
                amount: inputAmount,
                feeLevel: 5,
            };

            const result = await app.transfer(sendPayload, true);

            confetti();
            toaster.create({
                title: 'Transaction Successful',
                description: `Transaction ID: ${result.txHash}`,
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
    }, [app, assetContext, inputAmount, recipient]);

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
                <Avatar size="md" src={assetContext?.icon} />
                <Box>
                    <Text>
                        Asset: <Badge colorScheme="green">{assetContext?.name}</Badge>
                    </Text>
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

            <Button
                colorScheme="green"
                onClick={handleSend}
            >
                {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
        </VStack>
    );
}

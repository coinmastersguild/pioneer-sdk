import React from 'react';
import { Flex, Badge, Text } from '@chakra-ui/react';
import { Avatar } from '@/components/ui/avatar';

interface AssetCardProps {
    asset: any;
    balance: any;
}

const formatBalance = (balance: string) => {
    const [integer, decimal] = balance.split('.');
    const largePart = decimal?.slice(0, 4);
    const smallPart = decimal?.slice(4, 8);
    return { integer, largePart, smallPart };
};

export default function AssetCard({ asset, balance }: AssetCardProps) {
    const { integer, largePart, smallPart } = formatBalance(balance.balance);

    return (
        <div>
            <Avatar size="xl" src={asset?.icon} mb={4} />
            <Text fontSize="lg" fontWeight="bold">{asset?.name}</Text>
            <Text fontSize="md" color="gray.400">{asset?.symbol}</Text>

                <Text fontSize="3xl" fontWeight="bold">{integer}.{largePart}<Text fontSize="sm" ml={1}>{smallPart}</Text></Text>

            <Badge colorScheme="teal" mt={2}>{asset?.symbol}</Badge>
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Text,
    Stack,
    Button,
    Image,
    VStack,
    HStack,
    Icon,
    Spinner,
    useBreakpointValue,
} from '@chakra-ui/react';
import { usePioneerContext } from '@/components/providers/pioneer';
import {
    FaTimes,
    FaChevronDown,
    FaChevronUp,
    FaPaperPlane,
    FaQrcode,
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import CountUp from 'react-countup';

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

const chachingSound =
    typeof Audio !== 'undefined' ? new Audio('/sounds/chaching.mp3') : null;

const playSound = (sound: HTMLAudioElement | null) => {
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch((err) => console.error('Error playing sound:', err));
};

const theme = {
    bg: '#000000',
    cardBg: '#111111',
    gold: '#FFD700',
    goldHover: '#FFE135',
    border: '#222222',
};

const middleEllipsis = (text: string, visible = 16) => {
    if (!text || text.length <= visible) return text;
    const slice = Math.floor(visible / 2);
    return `${text.slice(0, slice)}...${text.slice(-slice)}`;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface AssetProps {
    onBackClick?: () => void;
    onSendClick?: () => void;
    onReceiveClick?: () => void;
}

export const Asset = ({
                          onBackClick,
                          onSendClick,
                          onReceiveClick,
                      }: AssetProps) => {
    /* ---------------------------- state ---------------------------- */

    const [loading, setLoading] = useState(true);
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
    const [previousBalance, setPreviousBalance] = useState('0');
    const [lastSync, setLastSync] = useState(Date.now());

    const pioneer = usePioneerContext();
    const { state } = pioneer;
    const { app } = state;
    const assetContext = app?.assetContext;

    const router = useRouter();
    const isMobile = useBreakpointValue({ base: true, md: false });

    /* ------------------------ lifecycle --------------------------- */

    /** Wait for context to appear (hot-reload friendly) */
    useEffect(() => {
        if (assetContext) {
            if (assetContext.balance) setPreviousBalance(assetContext.balance);
            setLoading(false);
            return;
        }

        let tries = 0;
        const interval = setInterval(() => {
            if (pioneer.state.app?.assetContext || tries > 5) {
                setLoading(false);
                clearInterval(interval);
            }
            tries += 1;
        }, 300);

        return () => clearInterval(interval);
    }, [assetContext, pioneer.state.app]);

    /** 15-second market refresh */
    useEffect(() => {
        if (!app) return;
        const id = setInterval(async () => {
            try {
                await app.syncMarket();
                if (app.assetContext?.balance) {
                    const cur = app.assetContext.balance;
                    if (+cur > +previousBalance) playSound(chachingSound);
                    setPreviousBalance(cur);
                }
                setLastSync(Date.now());
            } catch (e) {
                console.error('[Asset] syncMarket error:', e);
            }
        }, 15_000);
        return () => clearInterval(id);
    }, [app, previousBalance]);

    /* ------------------------ handlers ---------------------------- */

    const handleBack = () =>
        onBackClick ? onBackClick() : router.push('/');

    const handleClose = () => router.push('/');

    const toggleDetails = () => setIsDetailsExpanded((p) => !p);

    /* ---------------------- helpers ------------------------------- */

    const formatUsd = (v?: number | null) =>
        v == null ? '$0.00' : `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const formatBalance = (b: string | number) =>
        (+b).toFixed(8);

    /* ---------------------- render guards ------------------------- */

    if (loading) {
        return (
            <Box
                h="600px"
                bg={theme.bg}
                display="flex"
                flexDir="column"
                align="center"
                justify="center"
                w="100%"
                mx="auto"
            >
                <Spinner color={theme.gold} size="xl" mb={4} />
                <Text color="gray.400">Loading asset data...</Text>
            </Box>
        );
    }

    if (!assetContext) {
        return (
            <Box h="600px" bg={theme.bg} w="100%" mx="auto">
                <Box borderBottom="1px" borderColor={theme.border} p={4} bg={theme.cardBg}>
                    <Button
                        size="sm"
                        variant="ghost"
                        color={theme.gold}
                        onClick={handleBack}
                        _hover={{ color: theme.goldHover }}
                    >
                        Back
                    </Button>
                </Box>

                <Flex direction="column" align="center" justify="center" h="400px" p={8}>
                    <Box
                        w="80px"
                        h="80px"
                        borderRadius="full"
                        bg="rgba(254, 215, 226, 0.1)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        mb={4}
                    >
                        <FaTimes color="#FC8181" size="32px" />
                    </Box>

                    <Text fontSize="xl" fontWeight="bold" color="white" mb={2}>
                        Asset Data Not Found
                    </Text>

                    <Text color="gray.400" maxW="sm" mb={6}>
                        We couldn't load the asset data. This might be an invalid URL or a
                        connection problem.
                    </Text>

                    <Button
                        variant="outline"
                        color={theme.gold}
                        borderColor={theme.gold}
                        onClick={handleBack}
                    >
                        Return
                    </Button>
                </Flex>
            </Box>
        );
    }

    /* -------------------------- render ---------------------------- */

    const usdValue =
        assetContext.value ??
        (assetContext.balance && assetContext.priceUsd
            ? +assetContext.balance * assetContext.priceUsd
            : 0);

    return (
        <Box w="100%" pos="relative" pb={8}>
            {/* Sticky toolbar */}
            <Box
                borderBottom="1px"
                borderColor={theme.border}
                p={4}
                bg={theme.cardBg}
                pos="sticky"
                top={0}
                zIndex={10}
            >
                <HStack justify="space-between">
                    <Button
                        size="sm"
                        variant="ghost"
                        color={theme.gold}
                        onClick={handleBack}
                        _hover={{ color: theme.goldHover }}
                    >
                        Back
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        color={theme.gold}
                        onClick={handleClose}
                        _hover={{ color: theme.goldHover }}
                    >
                        Close
                    </Button>
                </HStack>
            </Box>

            <VStack p={6} gap={6} align="stretch">
                {/* Info card ------------------------------------------------ */}
                <Box
                    bg={theme.cardBg}
                    p={6}
                    borderRadius="2xl"
                    boxShadow="lg"
                    border="1px solid"
                    borderColor={theme.border}
                >
                    <VStack gap={4}>
                        <Box
                            borderRadius="full"
                            overflow="hidden"
                            boxSize="80px"
                            bg={theme.cardBg}
                            boxShadow="lg"
                            p={2}
                            borderWidth="1px"
                            borderColor={assetContext.color || theme.border}
                        >
                            <Image
                                src={assetContext.icon}
                                alt={`${assetContext.name} icon`}
                                boxSize="100%"
                                objectFit="contain"
                            />
                        </Box>

                        <Stack align="center" gap={1}>
                            <Text fontSize="2xl" fontWeight="bold" color="white">
                                {assetContext.name}
                            </Text>
                            <Text fontSize="md" color="gray.400">
                                {assetContext.symbol}
                            </Text>
                            <Text fontSize="3xl" fontWeight="bold" color={theme.gold}>
                                $
                                <CountUp
                                    key={`val-${lastSync}`}
                                    end={usdValue}
                                    decimals={2}
                                    duration={1.5}
                                    separator=","
                                />
                            </Text>
                            <Text fontSize="md" color="white">
                                {formatBalance(assetContext.balance)} {assetContext.symbol}
                            </Text>
                        </Stack>
                    </VStack>
                </Box>

                {/* Actions -------------------------------------------------- */}
                <HStack gap={4}>
                    <Button
                        w="full"
                        bg={theme.gold}
                        color="black"
                        _hover={{ bg: theme.goldHover }}
                        onClick={onSendClick}
                    >
                        <Icon as={FaPaperPlane} mr={2} />
                        Send
                    </Button>
                    <Button
                        w="full"
                        variant="outline"
                        borderColor={theme.gold}
                        color={theme.gold}
                        _hover={{ bg: 'rgba(255,215,0,0.1)' }}
                        onClick={onReceiveClick}
                    >
                        <Icon as={FaQrcode} mr={2} />
                        Receive
                    </Button>
                </HStack>

                {/* Details -------------------------------------------------- */}
                <Box
                    p={6}
                    bg={theme.cardBg}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={theme.border}
                >
                    <Flex
                        p={4}
                        borderBottom={isDetailsExpanded ? '1px' : undefined}
                        borderColor={theme.border}
                        align="center"
                        justify="space-between"
                        cursor="pointer"
                        _hover={{ bg: 'rgba(255,215,0,0.05)' }}
                        onClick={toggleDetails}
                    >
                        <Text color={theme.gold} fontSize="lg" fontWeight="bold">
                            Asset Details
                        </Text>
                        <Icon
                            as={isDetailsExpanded ? FaChevronUp : FaChevronDown}
                            color={theme.gold}
                            boxSize={4}
                        />
                    </Flex>

                    {isDetailsExpanded && (
                        <VStack align="stretch" p={4} gap={4}>
                            {/* Network info */}
                            <VStack align="stretch" gap={3}>
                                <Text color="gray.400" fontSize="sm" fontWeight="medium">
                                    Network Information
                                </Text>
                                <HStack justify="space-between">
                                    <Text color="gray.400">Network</Text>
                                    <Text color="white">
                                        {assetContext.networkName ?? 'Unknown'}
                                    </Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text color="gray.400">Chain ID</Text>
                                    <Text color="white">
                                        {assetContext.networkId ?? 'Unknown'}
                                    </Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text color="gray.400">CAIP</Text>
                                    <Text
                                        color="white"
                                        fontSize="sm"
                                        fontFamily="mono"
                                        title={assetContext.caip ?? assetContext.assetId}
                                        cursor="help"
                                        _hover={{ textDecoration: 'underline dotted' }}
                                    >
                                        {middleEllipsis(
                                            assetContext.caip ?? assetContext.assetId,
                                            16,
                                        )}
                                    </Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text color="gray.400">Asset ID</Text>
                                    <Text
                                        color="white"
                                        fontSize="sm"
                                        fontFamily="mono"
                                        title={assetContext.assetId}
                                        cursor="help"
                                        _hover={{ textDecoration: 'underline dotted' }}
                                    >
                                        {middleEllipsis(assetContext.assetId, 16)}
                                    </Text>
                                </HStack>
                            </VStack>

                            {/* Asset info */}
                            <VStack align="stretch" gap={3}>
                                <Text color="gray.400" fontSize="sm" fontWeight="medium">
                                    Asset Information
                                </Text>
                                <HStack justify="space-between">
                                    <Text color="gray.400">Type</Text>
                                    <Text color="white">
                                        {assetContext.networkId?.includes('eip155')
                                            ? 'Token'
                                            : 'Native Asset'}
                                    </Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text color="gray.400">Precision</Text>
                                    <Text color="white">{assetContext.precision}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text color="gray.400">Price</Text>
                                    <Text color="white">
                                        $
                                        <CountUp
                                            key={`price-${lastSync}`}
                                            end={assetContext.priceUsd ?? 0}
                                            decimals={2}
                                            duration={1.5}
                                            separator=","
                                        />
                                    </Text>
                                </HStack>
                            </VStack>

                            {/* Wallet info */}
                            {assetContext.pubkeys?.[0] && (
                                <VStack align="stretch" gap={3}>
                                    <Text color="gray.400" fontSize="sm" fontWeight="medium">
                                        Wallet Information
                                    </Text>
                                    <VStack align="stretch" gap={2}>
                                        <Text color="gray.400" fontSize="sm">
                                            Address
                                        </Text>
                                        <Box
                                            p={3}
                                            bg={theme.bg}
                                            borderRadius="lg"
                                            borderWidth="1px"
                                            borderColor={theme.border}
                                        >
                                            <Text
                                                color="white"
                                                fontSize="sm"
                                                fontFamily="mono"
                                                wordBreak="break-all"
                                            >
                                                {assetContext.pubkeys[0].address}
                                            </Text>
                                        </Box>
                                        <HStack justify="space-between" mt={1}>
                                            <Text color="gray.400" fontSize="xs">
                                                Path
                                            </Text>
                                            <Text color="white" fontSize="xs" fontFamily="mono">
                                                {assetContext.pubkeys[0].path}
                                            </Text>
                                        </HStack>
                                    </VStack>
                                </VStack>
                            )}

                            {/* Explorer links */}
                            {assetContext.explorer && (
                                <VStack align="stretch" gap={3}>
                                    <Text color="gray.400" fontSize="sm" fontWeight="medium">
                                        Explorer Links
                                    </Text>
                                    <HStack gap={2}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            color={theme.gold}
                                            borderColor={theme.border}
                                            _hover={{
                                                bg: 'rgba(255,215,0,0.1)',
                                                borderColor: theme.gold,
                                            }}
                                            onClick={() => window.open(assetContext.explorer, '_blank')}
                                            flex="1"
                                        >
                                            View Explorer
                                        </Button>
                                        {assetContext.pubkeys?.[0] && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                color={theme.gold}
                                                borderColor={theme.border}
                                                _hover={{
                                                    bg: 'rgba(255,215,0,0.1)',
                                                    borderColor: theme.gold,
                                                }}
                                                onClick={() =>
                                                    window.open(
                                                        `${assetContext.explorerAddressLink}${assetContext.pubkeys[0].address}`,
                                                        '_blank',
                                                    )
                                                }
                                                flex="1"
                                            >
                                                View Address
                                            </Button>
                                        )}
                                    </HStack>
                                </VStack>
                            )}
                        </VStack>
                    )}
                </Box>
            </VStack>
        </Box>
    );
};

export default Asset;

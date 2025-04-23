'use client'

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
    IconButton,
    Spinner,
    useDisclosure,
    Icon,
    Grid,
    GridItem,
} from '@chakra-ui/react';

// Add sound effect imports
const chachingSound = typeof Audio !== 'undefined' ? new Audio('/sounds/chaching.mp3') : null;

// Play sound utility function
const playSound = (sound: HTMLAudioElement | null) => {
    if (sound) {
        sound.currentTime = 0; // Reset to start
        sound.play().catch(err => console.error('Error playing sound:', err));
    }
};

import { usePioneerContext } from '@/components/providers/pioneer';
import { FaTimes, FaChevronDown, FaChevronUp, FaPaperPlane, FaQrcode } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useBreakpointValue } from '@chakra-ui/react';
import CountUp from 'react-countup';

// Theme colors - matching our dashboard theme
const theme = {
    bg: '#000000',
    cardBg: '#111111',
    gold: '#FFD700',
    goldHover: '#FFE135',
    border: '#222222',
};

interface AssetProps {
    onBackClick?: () => void;
    onSendClick?: () => void;
    onReceiveClick?: () => void;
}

export const Asset = ({ onBackClick, onSendClick, onReceiveClick }: AssetProps) => {
    // State for managing the component's loading status
    const [loading, setLoading] = useState(true);
    const [lastSync, setLastSync] = useState<number>(Date.now());
    // Detect if we're in wide mode (md or larger screens)
    const isWideMode = useBreakpointValue({ base: false, md: true });
    
    // Add state for tracking expanded/collapsed state of asset details
    // Only expand by default in wide mode
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(isWideMode || false);
    // Add state to track previous balance for comparison
    const [previousBalance, setPreviousBalance] = useState<string>('0');

    // Access pioneer context in the same way as the Dashboard component
    const pioneer = usePioneerContext();
    const { state } = pioneer;
    const { app } = state;
    const assetContext = app?.assetContext;

    const router = useRouter();

    // Format USD value
    const formatUsd = (value: number | null | undefined) => {
        if (value === null || value === undefined || isNaN(value)) return '0.00';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return '0.00';
        return numValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Add component mount/unmount logging and handle loading state
    useEffect(() => {
        console.log('🎯 [Asset] Component mounted with context:', assetContext);

        // For debugging - log the Pioneer context
        console.log('🎯 [Asset] Pioneer context:', {
            app,
            hasApp: !!app,
            hasAssetContext: !!app?.assetContext,
            hasSetAssetContext: !!app?.setAssetContext
        });

        // Check if asset context is already available
        if (assetContext) {
            console.log('✅ [Asset] AssetContext already available on mount');
            // Initialize previousBalance when asset context is available
            if (assetContext.balance) {
                setPreviousBalance(assetContext.balance);
            }
            setLoading(false);
            return;
        }

        // Set a timeout to wait for assetContext to be populated
        let checkCount = 0;
        const maxChecks = 10;

        const checkAssetContext = () => {
            // Re-access the latest context values
            const currentApp = pioneer?.state?.app;
            const currentAssetContext = currentApp?.assetContext;

            if (currentAssetContext) {
                console.log('✅ [Asset] AssetContext became available on check', checkCount);
                setLoading(false);
                return true;
            }

            checkCount++;
            if (checkCount >= maxChecks) {
                console.log('❌ [Asset] AssetContext still null after', maxChecks, 'checks');
                console.log('❌ [Asset] Current app state:', {
                    hasApp: !!currentApp,
                    hasAssetContext: !!currentApp?.assetContext,
                    hasSetAssetContext: !!currentApp?.setAssetContext,
                    isDashboardAvailable: !!currentApp?.dashboard
                });
                setLoading(false);
                return true;
            }

            return false;
        };

        // Immediately check once
        if (checkAssetContext()) return;

        // Then set up an interval for repeated checks
        const timer = setInterval(() => {
            if (checkAssetContext()) {
                clearInterval(timer);
            }
        }, 500); // Check every 500ms

        return () => {
            console.log('👋 [Asset] Component unmounting');
            clearInterval(timer);
        };
    }, [app, assetContext, pioneer]);

    // Set up interval to sync market data every 15 seconds
    useEffect(() => {
        if (!app) return;

        // Initialize previousBalance when component mounts
        if (app.assetContext?.balance) {
            setPreviousBalance(app.assetContext.balance);
        }

        const intervalId = setInterval(() => {
            app
                .syncMarket()
                .then(() => {
                    console.log("📊 [Asset] syncMarket called from Asset component");

                    // Check if balance has increased
                    if (app.assetContext?.balance) {
                        const currentBalance = app.assetContext.balance;
                        const prevBalance = previousBalance;

                        console.log("💰 [Asset] Balance comparison:", {
                            previous: prevBalance,
                            current: currentBalance,
                            increased: parseFloat(currentBalance) > parseFloat(prevBalance)
                        });

                        if (parseFloat(currentBalance) > parseFloat(prevBalance)) {
                            console.log("🎵 [Asset] Balance increased! Playing chaching sound");
                            playSound(chachingSound);
                        }

                        // Update previous balance for next comparison
                        setPreviousBalance(currentBalance);
                    }

                    setLastSync(Date.now());
                })
                .catch((error: any) => {
                    console.error("❌ [Asset] Error in syncMarket:", error);
                });
        }, 15000);

        return () => clearInterval(intervalId);
    }, [app, previousBalance]);

    const handleBack = () => {
        if (onBackClick) {
            // Use the provided onBackClick handler if available
            console.log('🔙 [Asset] Using custom back handler');
            onBackClick();
        } else {
            // Default behavior - navigate to dashboard
            console.log('🔙 [Asset] Back button clicked, navigating to dashboard');
            router.push('/');
        }
    };

    const handleClose = () => {
        // Close button always goes to dashboard regardless of back button behavior
        console.log('❌ [Asset] Close button clicked, navigating to dashboard');
        router.push('/');
    };

    // Add a utility function for middle ellipsis
    const middleEllipsis = (text: string, visibleChars = 16) => {
        if (!text) return '';
        if (text.length <= visibleChars) return text;

        const charsToShow = Math.floor(visibleChars / 2);
        return `${text.substring(0, charsToShow)}...${text.substring(text.length - charsToShow)}`;
    };

    // Toggle details expanded/collapsed state
    const toggleDetails = () => {
        setIsDetailsExpanded(!isDetailsExpanded);
    };

    if (loading) {
        // Show loading state while waiting for context
        return (
            <Box
                minHeight={{ base: "300px", sm: "400px", md: "600px" }}
                bg={theme.bg}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexDirection="column"
                width="100%"
                mx="auto"
            >
                <Spinner color={theme.gold} size="xl" mb={4} />
                <Text color="gray.400">Loading asset data...</Text>
            </Box>
        );
    }

    if (!assetContext) {
        console.log('❌ [Asset] AssetContext is null or undefined');
        console.log('❌ [Asset] This may indicate an issue with the context provider or URL parameters');

        // Show a user-friendly error message with a back button
        return (
            <Box minHeight={{ base: "300px", sm: "400px", md: "600px" }} bg={theme.bg} width="100%" mx="auto">
                <Box
                    borderBottom="1px"
                    borderColor={theme.border}
                    p={4}
                    bg={theme.cardBg}
                >
                    <HStack justify="space-between" align="center">
                        <Button
                            size="sm"
                            variant="ghost"
                            color={theme.gold}
                            onClick={handleBack}
                            _hover={{ color: theme.goldHover }}
                        >
                            <Text>Back</Text>
                        </Button>
                    </HStack>
                </Box>

                <Box
                    p={8}
                    textAlign="center"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minHeight={{ base: "200px", sm: "300px", md: "400px" }}
                >
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

                    <Text color="gray.400" maxWidth="sm" mb={6}>
                        We couldn't load the asset data. This could be due to an invalid URL or a connection issue.
                    </Text>

                    <Button
                        variant="outline"
                        color={theme.gold}
                        borderColor={theme.gold}
                        onClick={handleBack}
                    >
                        Return to Previous Page
                    </Button>
                </Box>
            </Box>
        );
    }

    const formatBalance = (balance: string | number) => {
        const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
        return numBalance.toFixed(8);
    };

    // Calculate the USD value
    const usdValue = (assetContext.value !== undefined && assetContext.value !== null)
        ? assetContext.value
        : (assetContext.balance && assetContext.priceUsd)
            ? parseFloat(assetContext.balance) * assetContext.priceUsd
            : 0;

    // Calculate the price
    const priceUsd = assetContext.priceUsd || 0;

    return (
        <Box
            width="100%"
            position="relative"
            pb={4}
            maxHeight={{ base: "100vh", md: "auto" }}
            overflowY="auto"
        >
            <Box
                borderBottom="1px"
                borderColor={theme.border}
                p={3}
                bg={theme.cardBg}
                position="sticky"
                top={0}
                zIndex={10}
            >
                <HStack justify="space-between" align="center">
                    <Button
                        size="sm"
                        variant="ghost"
                        color={theme.gold}
                        onClick={handleBack}
                        _hover={{ color: theme.goldHover }}
                    >
                        <Text>Back</Text>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        color={theme.gold}
                        onClick={handleClose}
                        _hover={{ color: theme.goldHover }}
                    >
                        <Text>Close</Text>
                    </Button>
                </HStack>
            </Box>

            {/* Responsive layout using grid */}
            <Box p={4}>
                <Grid
                    templateColumns={{ base: "1fr", md: "auto 1fr" }}
                    gap={{ base: 6, md: 8 }}
                    alignItems="start"
                >
                    {/* Left column - Asset icon and info */}
                    <VStack align={{ base: "center", md: "center" }} gap={4}>
                        <Box
                            borderRadius="full"
                            overflow="hidden"
                            boxSize={{ base: "80px", md: "100px" }}
                            bg={theme.cardBg}
                            boxShadow="lg"
                            p={2}
                            borderWidth="1px"
                            borderColor={assetContext.color || theme.border}
                        >
                            <Image
                                src={assetContext.icon}
                                alt={`${assetContext.name} Icon`}
                                boxSize="100%"
                                objectFit="contain"
                            />
                        </Box>
                        <VStack gap={0} align="center">
                            <Text fontSize="2xl" fontWeight="bold" color="white">
                                {assetContext.name}
                            </Text>
                            <Text fontSize="md" color="gray.400">
                                {assetContext.symbol}
                            </Text>
                        </VStack>
                    </VStack>

                    {/* Right column - Balance and action buttons */}
                    <VStack align="stretch" gap={4} w="100%">
                        <VStack align={{ base: "center", md: "start" }} gap={1}>
                            <Text fontSize="3xl" fontWeight="bold" color={theme.gold}>
                                $<CountUp
                                key={`value-${lastSync}`}
                                end={usdValue}
                                decimals={2}
                                duration={1.5}
                                separator=","
                                />
                            </Text>
                            <Text fontSize="md" color="white">
                                {formatBalance(assetContext.balance)} {assetContext.symbol}
                            </Text>
                        </VStack>

                        {/* Action Buttons in horizontal layout on larger screens */}
                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                            <Button
                                size="lg"
                                bg={theme.cardBg}
                                color={theme.gold}
                                borderColor={theme.border}
                                borderWidth="1px"
                                _hover={{
                                    bg: 'rgba(255, 215, 0, 0.1)',
                                    borderColor: theme.gold,
                                }}
                                onClick={onSendClick}
                                height="50px"
                            >
                                <Flex gap={2} align="center">
                                    <FaPaperPlane />
                                    <Text>Send</Text>
                                </Flex>
                            </Button>
                            <Button
                                size="lg"
                                bg={theme.cardBg}
                                color={theme.gold}
                                borderColor={theme.border}
                                borderWidth="1px"
                                _hover={{
                                    bg: 'rgba(255, 215, 0, 0.1)',
                                    borderColor: theme.gold,
                                }}
                                onClick={onReceiveClick}
                                height="50px"
                            >
                                <Flex gap={2} align="center">
                                    <FaQrcode />
                                    <Text>Receive</Text>
                                </Flex>
                            </Button>
                        </Grid>
                    </VStack>
                </Grid>
            </Box>
            
            {/* Asset Details Section - Now Collapsible */}
            <Box
                bg={theme.cardBg}
                borderRadius="xl"
                overflow="hidden"
                borderColor={theme.border}
                borderWidth="1px"
                mt={2}
                mx={4}
            >
                    {/* Clickable header */}
                    <Flex
                        p={3}
                        borderBottom={isDetailsExpanded ? "1px" : "none"}
                        borderColor={theme.border}
                        justifyContent="space-between"
                        alignItems="center"
                        onClick={toggleDetails}
                        cursor="pointer"
                        _hover={{
                            bg: 'rgba(255, 215, 0, 0.05)',
                        }}
                        transition="background 0.2s"
                    >
                        <Text color={theme.gold} fontSize="md" fontWeight="bold">
                            Asset Details
                        </Text>
                        <Icon
                            as={isDetailsExpanded ? FaChevronUp : FaChevronDown}
                            color={theme.gold}
                            boxSize={3}
                        />
                    </Flex>

                    {/* Collapsible content */}
                    {isDetailsExpanded && (
                        <VStack align="stretch" p={3} gap={3}>
                            {/* Network Info */}
                            <VStack align="stretch" gap={3}>
                                <Text color="gray.400" fontSize="sm" fontWeight="medium">
                                    Network Information
                                </Text>
                                <HStack justify="space-between">
                                    <Text color="gray.400">Network</Text>
                                    <Text color="white">{assetContext.networkName || assetContext.networkId?.split(':').pop()}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text color="gray.400">Chain ID</Text>
                                    <Text color="white" fontSize="sm" fontFamily="mono">
                                        {assetContext.chainId}
                                    </Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text color="gray.400">CAIP</Text>
                                    <Text
                                        color="white"
                                        fontSize="sm"
                                        fontFamily="mono"
                                        title={assetContext.caip || assetContext.assetId}
                                        cursor="help"
                                        _hover={{
                                            textDecoration: 'underline',
                                            textDecorationStyle: 'dotted'
                                        }}
                                    >
                                        {middleEllipsis(assetContext.caip || assetContext.assetId, 16)}
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
                                        _hover={{
                                            textDecoration: 'underline',
                                            textDecorationStyle: 'dotted'
                                        }}
                                    >
                                        {middleEllipsis(assetContext.assetId, 16)}
                                    </Text>
                                </HStack>
                            </VStack>

                            {/* Asset Info */}
                            <VStack align="stretch" gap={3}>
                                <Text color="gray.400" fontSize="sm" fontWeight="medium">
                                    Asset Information
                                </Text>
                                <HStack justify="space-between">
                                    <Text color="gray.400">Type</Text>
                                    <Text color="white">
                                        {assetContext.networkId?.includes('eip155') ? 'Token' : 'Native Asset'}
                                    </Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text color="gray.400">Precision</Text>
                                    <Text color="white">{assetContext.precision}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text color="gray.400">Price</Text>
                                    <Text color="white">
                                        $<CountUp
                                        key={`price-${lastSync}`}
                                        end={priceUsd}
                                        decimals={2}
                                        duration={1.5}
                                        separator=","
                                    />
                                    </Text>
                                </HStack>
                            </VStack>

                            {/* Address Info */}
                            {assetContext.pubkeys?.[0] && (
                                <VStack align="stretch" gap={3}>
                                    <Text color="gray.400" fontSize="sm" fontWeight="medium">
                                        Wallet Information
                                    </Text>
                                    <VStack align="stretch" gap={2}>
                                        <Text color="gray.400" fontSize="sm">Address</Text>
                                        <Box
                                            p={3}
                                            bg={theme.bg}
                                            borderRadius="lg"
                                            borderWidth="1px"
                                            borderColor={theme.border}
                                        >
                                            <Text color="white" fontSize="sm" fontFamily="mono" wordBreak="break-all">
                                                {assetContext.pubkeys[0].address}
                                            </Text>
                                        </Box>
                                        <HStack justify="space-between" mt={1}>
                                            <Text color="gray.400" fontSize="xs">Path</Text>
                                            <Text color="white" fontSize="xs" fontFamily="mono">
                                                {assetContext.pubkeys[0].path}
                                            </Text>
                                        </HStack>
                                    </VStack>
                                </VStack>
                            )}

                            {/* Explorer Links */}
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
                                                bg: 'rgba(255, 215, 0, 0.1)',
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
                                                    bg: 'rgba(255, 215, 0, 0.1)',
                                                    borderColor: theme.gold,
                                                }}
                                                onClick={() => window.open(`${assetContext.explorerAddressLink}${assetContext.pubkeys[0].address}`, '_blank')}
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
        </Box>
    );
};

export default Asset; 

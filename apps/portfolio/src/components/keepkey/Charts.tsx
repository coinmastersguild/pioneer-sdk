import { Box, Center, Flex, Text, Spinner, Button } from '@chakra-ui/react';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import CountUp from 'react-countup';

// Register the necessary plugins for Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

export function Charts({ usePioneer, onSelect }: any) {
    const { state } = usePioneer();
    const { app } = state;
    const balances = app.balances || [];
    const [showAll, setShowAll] = useState(false);
    const [activeSegment, setActiveSegment] = useState(null);
    const [totalValueUsd, setTotalValueUsd] = useState(0);
    const [chartData, setChartData] = useState({
        datasets: [],
        labels: [],
    });

    // Custom plugin (keeps it registered but no text rendering here)
    const centerTextPlugin = {
        id: 'centerTextPlugin',
        afterDraw: (chart: any) => {
            if (chart.config.type !== 'doughnut') return;
            const { ctx } = chart;
            ctx.save();
            ctx.restore();
        }
    };

    useEffect(() => {
        ChartJS.register(centerTextPlugin);
        return () => {
            ChartJS.unregister(centerTextPlugin);
        };
    }, [centerTextPlugin]);

    const handleChartClick = (event: any, elements: any) => {
        if (elements.length > 0) {
            const elementIndex = elements[0].index;
            setActiveSegment(elementIndex);
            const selectedAsset = balances.find((balance: any, index: number) => index === elementIndex);

            if (onSelect && selectedAsset) {
                onSelect(selectedAsset);
            }
        } else {
            setActiveSegment(null);
        }
    };

    const handleChartHover = (event: any, elements: any) => {
        if (elements.length > 0) {
            const elementIndex = elements[0].index;
            setActiveSegment(elementIndex);
        } else {
            setActiveSegment(null);
        }
    };

    const options: any = {
        responsive: true,
        onClick: handleChartClick,
        onHover: handleChartHover,
        cutout: '90%',
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: false,
            },
            centerTextPlugin: {},
        },
        maintainAspectRatio: false,
    };

    const updateChart = () => {
        const filteredBalances = showAll
            ? balances
            : balances.filter((balance: any) => parseFloat(balance.valueUsd) >= 10);

        filteredBalances.sort((a: any, b: any) => parseFloat(b.valueUsd) - parseFloat(a.valueUsd));

        const totalValue = filteredBalances.reduce(
            (acc: any, balance: any) => acc + parseFloat(balance.valueUsd),
            0,
        );
        setTotalValueUsd(totalValue);

        const chartDataValues = filteredBalances.map((balance: any) => parseFloat(balance.valueUsd));
        const chartLabels = filteredBalances.map((balance: any) => balance.symbol);

        // Generate random colors for each segment
        const chartColors = filteredBalances.map(
            () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        );

        const dataSet: any = {
            datasets: [
                {
                    data: chartDataValues,
                    backgroundColor: chartColors,  // Apply colors
                    hoverBackgroundColor: chartColors.map((color: any) => `${color}B3`),  // Hover colors
                    borderColor: 'white',
                    borderWidth: 2,
                },
            ],
            labels: chartLabels,
        };
        setChartData(dataSet);
    };

    useEffect(() => {
        updateChart();
    }, [balances, showAll]);

    return (
        <Flex direction="column" align="center" justify="center">
            {balances.length === 0 ? (
                <Center mt="20px">
                    {app?.pubkeys?.length === 0 ? (
                        <Button colorScheme="blue">Pair Wallets</Button>
                    ) : (
                        <>
                            <Spinner mr="3" />
                            <Text>Loading Wallet Balances...</Text>
                        </>
                    )}
                </Center>
            ) : (
                <div>
                    {/* Centered large balance with CountUp animation */}
                    <Center>
                        <Box height="300px" width="300px" position="relative">
                            <Doughnut data={chartData} options={options} />
                            {/* Large animated balance in the center */}
                            <Flex
                                position="absolute"
                                top="0"
                                bottom="0"
                                left="0"
                                right="0"
                                justifyContent="center"
                                alignItems="center"
                                flexDirection="column"
                            >
                                <Text fontSize="3xl" fontWeight="bold" color="green.500">
                                    <CountUp
                                        start={0}
                                        end={totalValueUsd}
                                        duration={2.5}
                                        separator=","
                                        decimals={2}
                                        prefix="$"
                                    />
                                </Text>
                                <Text fontSize="xl" fontWeight="medium" color="gray.300">
                                    {balances.length} Assets
                                </Text>
                            </Flex>
                        </Box>
                    </Center>
                </div>
            )}
        </Flex>
    );
}

export default Charts;

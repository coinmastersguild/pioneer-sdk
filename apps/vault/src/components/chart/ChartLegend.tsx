'use client';

import React from 'react';
import { Box, HStack, Text, Circle, Flex } from '@chakra-ui/react';
import { DonutChartItem } from './DonutChart';

interface ChartLegendProps {
  data: DonutChartItem[];
  total: number;
  formatValue?: (value: number) => string;
  activeIndex?: number; 
  onHoverItem?: (index: number | null) => void;
}

// @ts-ignore - Using any types to resolve issues
const ChartLegend: any = ({
  data,
  total,
  formatValue = (value) => value.toString(),
  activeIndex,
  onHoverItem,
}: ChartLegendProps) => {
  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Get the active item if there is one
  const activeItem = activeIndex !== undefined && activeIndex !== null 
    ? sortedData[activeIndex] 
    : null;

  // If no active item, render empty space with minimal height
  if (!activeItem) {
    return (
      <Box width="100%" height="24px" />
    );
  }

  // Calculate percentage for the active item
  const percent = total > 0 
    ? ((activeItem.value / total) * 100).toFixed(1) 
    : '0';

  return (
    <Box width="100%">
      <Flex 
        justify="center" 
        align="center" 
        py={2}
        px={3}
        borderRadius="md"
        bg={`${activeItem.color}20`}
        borderLeft="2px solid"
        borderColor={activeItem.color}
        boxShadow={`0 1px 6px ${activeItem.color}20`}
        // @ts-ignore - Animation with styling
        animation="fadeIn 0.2s ease-in-out"
        transition="all 0.15s"
      >
        <HStack gap={2} flex="1" justify="center">
          <Circle size="8px" bg={activeItem.color} />
          <Text fontWeight="medium" fontSize="xs" color="white">
            {activeItem.name}
          </Text>
          <Text fontSize="xs" color={activeItem.color} fontWeight="bold">
            {percent}%
          </Text>
          <Text fontSize="xs" color="gray.300">
            ${(activeItem.value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}
          </Text>
        </HStack>
      </Flex>

      {/* Add a styled box for the animation */}
      <Box 
        as="style"
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-3px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `
        }}
      />
    </Box>
  );
};

export default ChartLegend; 
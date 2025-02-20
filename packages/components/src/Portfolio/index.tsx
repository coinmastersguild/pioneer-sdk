import React from 'react';
import {
  Box,
} from '@chakra-ui/react';

export interface PortfolioProps {
  totalValue?: number;
  assets?: Array<{
    symbol: string;
    amount: number;
    value: number;
    change24h?: number;
  }>;
}

export const Portfolio: React.FC<PortfolioProps> = ({ 
  totalValue = 0, 
  assets = [] 
}) => {


  return (
    <Box p={4}>
      Hello World!
    </Box>
  );
}; 

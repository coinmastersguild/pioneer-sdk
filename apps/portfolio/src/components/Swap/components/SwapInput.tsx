import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  Text,
  Input,
  Flex,
  Stack,
  Button,
  chakra,
} from '@chakra-ui/react';
import { FiArrowRight } from 'react-icons/fi';

const StyledFiArrowRight = chakra(FiArrowRight);

function SwapInput({ usePioneer, setInputAmount }: any) {
  const { state } = usePioneer();
  const { app } = state;

  const minUSDValue = 51; // Minimum USD value
  const [usdAmount, setUsdAmount] = useState('');
  const [nativeAmount, setNativeAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isNative, setIsNative] = useState(false); // Toggle between input in USD or native amount

  useEffect(() => {
    updateExchangeRate();
  }, [app?.assetContext]);

  useEffect(() => {
    if (exchangeRate) {
      const nativeValue = (minUSDValue / exchangeRate).toFixed(6);
      setUsdAmount(minUSDValue.toString());
      setNativeAmount(nativeValue);
      setInputAmount(parseFloat(nativeValue));
    }
  }, [exchangeRate]);

  const getAssetBalance = (caip: string) => {
    return app?.balances?.find((balance: any) => balance.caip === caip);
  };

  const updateExchangeRate = () => {
    const assetContextBalance = getAssetBalance(app?.assetContext?.caip);
    const priceUsd = assetContextBalance?.priceUsd || 1;
    setExchangeRate(priceUsd);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (isNative) {
      setNativeAmount(value);
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && exchangeRate) {
        const usdValue = (numericValue * exchangeRate).toFixed(2);
        setUsdAmount(usdValue);
        setInputAmount(numericValue);
      }
    } else {
      setUsdAmount(value);
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && exchangeRate) {
        const nativeValue = (numericValue / exchangeRate).toFixed(6);
        setNativeAmount(nativeValue);
        setInputAmount(parseFloat(nativeValue));
      }
    }
  };

  const handleOutputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (isNative) {
      setUsdAmount(value);
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && exchangeRate) {
        const nativeValue = (numericValue / exchangeRate).toFixed(6);
        setNativeAmount(nativeValue);
        setInputAmount(parseFloat(nativeValue));
      }
    } else {
      setNativeAmount(value);
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && exchangeRate) {
        const usdValue = (numericValue * exchangeRate).toFixed(2);
        setUsdAmount(usdValue);
        setInputAmount(numericValue);
      }
    }
  };

  const toggleCurrency = () => {
    setIsNative(!isNative);
    // Swap the amounts when toggling
    setUsdAmount(nativeAmount);
    setNativeAmount(usdAmount);
  };

  return (
    <Flex justify="center" align="center" p={4}>
      <Box width="100%" maxW="800px">
        <Stack>
          <Box flex={1}>
            <Text mb={2}>You Send</Text>
            <Input
              value={isNative ? nativeAmount : usdAmount}
              onChange={handleInputChange}
              placeholder={isNative ? 'Enter native amount' : `Minimum $${minUSDValue}`}
              type="number"
            />
          </Box>
          <StyledFiArrowRight boxSize={8} color="gray.400" />
          <Box flex={1}>
            <Text mb={2}>You Receive</Text>
            <Input
              value={isNative ? usdAmount : nativeAmount}
              onChange={handleOutputChange}
              placeholder={isNative ? `Minimum $${minUSDValue}` : 'Enter native amount'}
              type="number"
            />
          </Box>
          <Button
            onClick={toggleCurrency}
            colorScheme="blue"
            variant="solid"
            height="100%"
          >
            {isNative ? 'Native' : 'USD'}
          </Button>
        </Stack>
      </Box>
    </Flex>
  );
}

export default SwapInput;

'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Text,
  Stack,
  Flex,
  Input,
  IconButton,
  VStack,
  Image,
  Textarea,
  Spinner,
  CloseButton,
} from '@chakra-ui/react'
import { Skeleton } from '@/components/ui/skeleton'
import { usePioneerContext } from '@/components/providers/pioneer'
import { FaArrowRight, FaPaperPlane, FaTimes, FaWallet, FaExternalLinkAlt, FaCheck, FaCopy } from 'react-icons/fa'
import Confetti from 'react-confetti'
import { KeepKeyUiGlyph } from '@/components/logo/keepkey-ui-glyph'
import { keyframes } from '@emotion/react'

// Add sound effect imports
const wooshSound = typeof Audio !== 'undefined' ? new Audio('/sounds/woosh.mp3') : null;
const chachingSound = typeof Audio !== 'undefined' ? new Audio('/sounds/chaching.mp3') : null;

// Play sound utility function
const playSound = (sound: HTMLAudioElement | null) => {
  if (sound) {
    sound.currentTime = 0; // Reset to start
    sound.play().catch(err => console.error('Error playing sound:', err));
  }
};

// Theme colors - matching our dashboard theme
const theme = {
  bg: '#000000',
  cardBg: '#111111',
  gold: '#FFD700',
  goldHover: '#FFE135',
  border: '#222222',
  formPadding: '16px', // Added for consistent form padding
  borderRadius: '12px', // Added for consistent border radius
}

// Define animation keyframes
const scale = keyframes`
  0% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0.5; }
`

interface SendProps {
  onBackClick?: () => void
}

// Tendermint networks with memo support
const TENDERMINT_SUPPORT = [
  'cosmos:mayachain-mainnet-v1/slip44:931',
  'cosmos:osmosis-1/slip44:118',
  'cosmos:cosmoshub-4/slip44:118',
  'cosmos:kaiyo-1/slip44:118',
  'cosmos:thorchain-mainnet-v1/slip44:931',
]

// Other networks with special tag fields
const OTHER_SUPPORT = ['ripple:4109c6f2045fc7eff4cde8f9905d19c2/slip44:144']

// Add network classification constants at the top after existing constants
const UTXO_NETWORKS = [
  'bip122:000000000019d6689c085ae165831e93', // Bitcoin
  'bip122:12a765e31ffd4059bada1e25190f6e98', // Litecoin
  'bip122:000000000933ea01ad0ee984209779ba', // Dogecoin
  'bip122:000000000000000000651ef99cb9fcbe', // Bitcoin Cash
]

const EVM_NETWORKS = [
  'eip155:1',    // Ethereum
  'eip155:56',   // BSC
  'eip155:137',  // Polygon
  'eip155:43114', // Avalanche
  'eip155:8453', // Base
  'eip155:10',   // Optimism
]

// TypeScript interfaces for transaction data
interface SendPayload {
  caip: string;
  to: string;
  amount: string;
  feeLevel: number;
  isMax: boolean;
  memo?: string;
}

interface TransactionState {
  method: string;
  caip: string;
  params: SendPayload;
  unsignedTx: any;
  signedTx: any;
  state: string;
  context: any;
}

const Send: React.FC<SendProps> = ({ onBackClick }) => {
  // Dialog state
  const [showConfirmation, setShowConfirmation] = useState(false)
  const openConfirmation = () => setShowConfirmation(true)
  const closeConfirmation = () => setShowConfirmation(false)
  
  const pioneer = usePioneerContext()
  const { state } = pioneer
  const { app } = state
  const assetContext = app?.assetContext

  // State for input fields
  const [amount, setAmount] = useState<string>('')
  const [recipient, setRecipient] = useState<string>('')
  const [memo, setMemo] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [balance, setBalance] = useState<string>('0')
  const [totalBalanceUsd, setTotalBalanceUsd] = useState<number>(0)
  
  // Add state to track if we're entering amount in USD
  const [isUsdInput, setIsUsdInput] = useState<boolean>(false)
  
  // Transaction state
  const [txHash, setTxHash] = useState<string>('')
  const [txSuccess, setTxSuccess] = useState<boolean>(false)
  const [isMax, setIsMax] = useState<boolean>(false)
  const [unsignedTx, setUnsignedTx] = useState<any>(null)
  const [signedTx, setSignedTx] = useState<any>(null)
  const [transactionStep, setTransactionStep] = useState<'review' | 'sign' | 'broadcast' | 'success'>('review')
  const [estimatedFee, setEstimatedFee] = useState<string>('0.0001')
  // Add state for fee in USD
  const [estimatedFeeUsd, setEstimatedFeeUsd] = useState<string>('0.00')
  
  // Add states for fee adjustment and transaction details
  const [showTxDetails, setShowTxDetails] = useState<boolean>(false)
  const [selectedFeeLevel, setSelectedFeeLevel] = useState<'slow' | 'average' | 'fastest'>('average')
  const [customFeeOption, setCustomFeeOption] = useState<boolean>(false)
  const [customFeeAmount, setCustomFeeAmount] = useState<string>('')
  // Add state for raw transaction dialog
  const [showRawTxDialog, setShowRawTxDialog] = useState<boolean>(false)
  const [rawTxJson, setRawTxJson] = useState<string>('')
  const [editedRawTxJson, setEditedRawTxJson] = useState<string>('')
  
  // Add a state to track if asset data has loaded
  const [assetLoaded, setAssetLoaded] = useState<boolean>(false)
  
  // Add state for fee options
  const [feeOptions, setFeeOptions] = useState<{
    slow: string;
    average: string;
    fastest: string;
  }>({ slow: '0.0001', average: '0.0002', fastest: '0.0005' })
  
  // Manual copy to clipboard implementation
  const [hasCopied, setHasCopied] = useState(false)
  const copyToClipboard = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash)
        .then(() => {
          setHasCopied(true)
          setTimeout(() => setHasCopied(false), 2000)
        })
        .catch(err => {
          console.error('Error copying to clipboard:', err)
        })
    }
  }

  // Add state for TX building loading indicators
  const [isBuildingTx, setIsBuildingTx] = useState<boolean>(false)

  // Add state for error handling
  const [error, setError] = useState<string | null>(null)
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false)

  // Calculate total balance
  useEffect(() => {
    if (assetContext) {
      try {
        // Store previous balance for comparison
        const prevBalance = balance;
        const newBalance = assetContext.balance || '0';
        
        setBalance(newBalance)
        setTotalBalanceUsd(parseFloat(newBalance) * (assetContext.priceUsd || 0))
        setAssetLoaded(true)
        setLoading(false)
        
        // Play chaching sound if balance increased
        if (prevBalance && newBalance && parseFloat(newBalance) > parseFloat(prevBalance)) {
          playSound(chachingSound);
          console.log('Balance increased! 💰', { previous: prevBalance, new: newBalance });
        }
        
        // Also update fee in USD when asset context changes
        updateFeeInUsd(estimatedFee);
        
        // Fetch fee rates for the current blockchain
        fetchFeeRates();
      } catch (e) {
        console.error('Error setting balance:', e)
        setBalance('0')
        setTotalBalanceUsd(0)
        setLoading(false)
      }
    } else {
      // Check if context is available after a short delay
      const timer = setTimeout(() => {
        if (!assetLoaded) setLoading(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [assetContext, assetLoaded, estimatedFee])

  // Format USD value
  const formatUsd = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })
  }

  // Convert USD to native token amount
  const usdToNative = (usdAmount: string): string => {
    if (!usdAmount || !assetContext.priceUsd || parseFloat(assetContext.priceUsd) === 0) return '0';
    const nativeAmount = parseFloat(usdAmount) / parseFloat(assetContext.priceUsd);
    // Return formatted with appropriate decimal places
    return nativeAmount.toFixed(8);
  }

  // Convert native token amount to USD
  const nativeToUsd = (nativeAmount: string): string => {
    if (!nativeAmount || !assetContext.priceUsd) return '0';
    const usdAmount = parseFloat(nativeAmount) * parseFloat(assetContext.priceUsd);
    // Return with 2 decimal places for USD
    return usdAmount.toFixed(2);
  }

  // Calculate fee in USD
  const updateFeeInUsd = (feeInNative: string) => {
    if (!feeInNative || !assetContext?.priceUsd) {
      setEstimatedFeeUsd('0.00');
      return;
    }
    
    try {
      let feeValue = parseFloat(feeInNative);
      
      // Get network type for proper unit conversion
      const networkId = assetContext.networkId || '';
      const networkType = getNetworkType(networkId);
      
      // Special handling based on network type
      if (networkType === 'EVM' && feeValue > 1) {
        // Convert from gwei to ETH equivalent
        const gweiToEth = 0.000000001;
        feeValue = feeValue * gweiToEth;
      } else if (networkType === 'UTXO') {
        // For UTXO chains, the API might return fee in satoshis
        // Check if the fee seems too large (likely in satoshis)
        if (feeValue > 0.1) {
          // Convert from satoshis to full coin value (1 BCH = 100,000,000 satoshis)
          feeValue = feeValue / 100000000;
        }
      }
      
      const feeUsd = feeValue * parseFloat(assetContext.priceUsd);
      setEstimatedFeeUsd(feeUsd.toFixed(2));
    } catch (error) {
      console.error('Error calculating fee in USD:', error);
      setEstimatedFeeUsd('0.00');
    }
  };

  // Add helper function to classify the network type
  const getNetworkType = (networkId: string): 'UTXO' | 'EVM' | 'TENDERMINT' | 'OTHER' => {
    if (UTXO_NETWORKS.some(id => networkId.startsWith(id)) || networkId.startsWith('bip122:')) {
      return 'UTXO';
    }
    if (EVM_NETWORKS.some(id => networkId.startsWith(id)) || networkId.startsWith('eip155:')) {
      return 'EVM';
    }
    if (TENDERMINT_SUPPORT.some(id => networkId.startsWith(id)) || networkId.startsWith('cosmos:')) {
      return 'TENDERMINT';
    }
    return 'OTHER';
  };

  // Update fetchFeeRates to handle network-specific fee formats
  const fetchFeeRates = async () => {
    if (!assetContext?.networkId) return;
    
    try {
      // Get the blockchain type
      const networkId = assetContext.networkId;
      const networkType = getNetworkType(networkId);
      
      // Network-specific default fees - much more accurate than generic defaults
      const networkSpecificDefaults: Record<string, {slow: string, average: string, fastest: string}> = {
        // EVM chains use gwei
        'eip155:1': { slow: '20', average: '40', fastest: '80' }, // Ethereum
        'eip155:56': { slow: '5', average: '7', fastest: '10' }, // BSC
        'eip155:137': { slow: '30', average: '50', fastest: '100' }, // Polygon
        'eip155:43114': { slow: '25', average: '35', fastest: '50' }, // Avalanche
        'eip155:8453': { slow: '0.05', average: '0.1', fastest: '0.2' }, // Base
        'eip155:10': { slow: '0.001', average: '0.01', fastest: '0.1' }, // Optimism
        
        // UTXO chains use sat/byte
        'bip122:000000000019d6689c085ae165831e93': { slow: '2', average: '5', fastest: '10' }, // Bitcoin
        'bip122:12a765e31ffd4059bada1e25190f6e98': { slow: '1', average: '2', fastest: '5' }, // Litecoin
        'bip122:000000000933ea01ad0ee984209779ba': { slow: '1', average: '2', fastest: '4' }, // Dogecoin
        'bip122:000000000000000000651ef99cb9fcbe': { slow: '1', average: '3', fastest: '6' }, // Bitcoin Cash - sat/byte
        
        // Tendermint chains use flat fees
        'cosmos:cosmoshub-4/slip44:118': { slow: '0.005', average: '0.005', fastest: '0.005' },
        'cosmos:osmosis-1/slip44:118': { slow: '0.035', average: '0.035', fastest: '0.035' },
        'cosmos:thorchain-mainnet-v1/slip44:931': { slow: '0.02', average: '0.02', fastest: '0.02' },
        'cosmos:mayachain-mainnet-v1/slip44:931': { slow: '0.2', average: '0.2', fastest: '0.2' },
        
        // Other chains
        'ripple:4109c6f2045fc7eff4cde8f9905d19c2/slip44:144': { slow: '0.000012', average: '0.000012', fastest: '0.000012' }, // XRP
      };
      
      // Start with reasonable type-specific defaults if we don't have network-specific ones
      let defaultFees;
      switch (networkType) {
        case 'EVM':
          defaultFees = { slow: '30', average: '50', fastest: '80' }; // gwei
          break;
        case 'UTXO':
          defaultFees = { slow: '3', average: '5', fastest: '10' }; // sat/byte
          break;
        case 'TENDERMINT':
          defaultFees = { slow: '0.01', average: '0.01', fastest: '0.01' }; // native token
          break;
        default:
          defaultFees = { slow: '0.001', average: '0.005', fastest: '0.01' }; // generic fallback
      }
      
      // Use network-specific defaults if available
      if (networkSpecificDefaults[networkId]) {
        defaultFees = networkSpecificDefaults[networkId];
      } else {
        // Try to match by chain type
        const chainTypeMatch = Object.keys(networkSpecificDefaults).find(key => networkId.startsWith(key.split(':')[0]));
        if (chainTypeMatch) {
          console.log(`Using defaults from similar chain type: ${chainTypeMatch}`);
          defaultFees = networkSpecificDefaults[chainTypeMatch];
        }
      }

      // Special handling for BCH - ensure fees are shown in proper units
      if (networkId.includes('bitcoincash') || networkId.includes('bip122:000000000000000000651ef99cb9fcbe')) {
        // These are sat/byte rates for BCH, but converted to show as BCH in the UI
        // For BCH transaction size of ~250 bytes, this gives reasonable fee range
        defaultFees = { 
          slow: '0.00000250',    // 1 sat/byte * ~250 bytes / 100,000,000
          average: '0.00000750', // 3 sat/byte * ~250 bytes / 100,000,000
          fastest: '0.00001500'  // 6 sat/byte * ~250 bytes / 100,000,000
        };
        console.log('🔧 Using BCH-specific fee defaults:', defaultFees);
      }
      
      console.log(`Using default fees for network ${networkId}:`, defaultFees);
      
      // Try to get fee rates from the API
      try {
        if (app?.pioneer) {
          const feeRates = await app.pioneer.GetFeeRate({ networkId: networkId });
          console.log('Fee rates from API:', feeRates);
          
          if (feeRates?.data) {
            // Only update if API returned valid values
            if (feeRates.data.slow && feeRates.data.average && feeRates.data.fastest) {
              // Process fee rates based on network type
              switch(networkType) {
                case 'EVM':
                  // Convert to gwei if necessary
                  defaultFees = {
                    slow: feeRates.data.slow.toString(),
                    average: feeRates.data.average.toString(),
                    fastest: feeRates.data.fastest.toString()
                  };
                  break;
                case 'UTXO':
                  // UTXO chains use sats/byte for fee rates
                  defaultFees = {
                    slow: feeRates.data.slow.toString(),
                    average: feeRates.data.average.toString(),
                    fastest: feeRates.data.fastest.toString()
                  };
                  break;
                case 'TENDERMINT':
                  // Tendermint chains often have fixed fees
                  defaultFees = {
                    slow: feeRates.data.slow.toString(),
                    average: feeRates.data.average.toString(),
                    fastest: feeRates.data.fastest.toString()
                  };
                  break;
                default:
                  defaultFees = {
                    slow: feeRates.data.slow.toString(),
                    average: feeRates.data.average.toString(),
                    fastest: feeRates.data.fastest.toString()
                  };
              }
              console.log('Updated fees from API:', defaultFees);
            } else {
              console.warn('API returned incomplete fee data, using defaults');
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch fee rates from API, using network-specific defaults', error);
      }
      
      // Set the fee options
      setFeeOptions(defaultFees);
      
      // Set the estimatedFee based on selected fee level
      setEstimatedFee(defaultFees[selectedFeeLevel]);
      updateFeeInUsd(defaultFees[selectedFeeLevel]);
    } catch (error) {
      console.error('Error fetching fee rates:', error);
    }
  };
  
  // Get fee unit based on network type
  const getFeeUnit = (): string => {
    if (!assetContext?.networkId) return '';
    
    const networkType = getNetworkType(assetContext.networkId);
    
    switch (networkType) {
      case 'EVM':
        return 'GWEI';
      case 'UTXO':
        return 'sats/byte';
      case 'TENDERMINT':
        return assetContext.symbol || '';
      case 'OTHER':
        if (assetContext.networkId.includes('ripple')) {
          return 'XRP';
        }
        return assetContext.symbol || '';
      default:
        return assetContext.symbol || '';
    }
  };
  
  // Format fee display based on network type
  const formatFeeDisplay = (fee: string): string => {
    if (!assetContext?.networkId) return fee;
    
    const networkId = assetContext.networkId;
    const networkType = getNetworkType(networkId);
    
    try {
      const feeValue = parseFloat(fee);
      
      switch (networkType) {
        case 'EVM': {
          // For EVM chains, we're storing the fee in GWEI but display in native token for consistency
          return fee;
        }
        case 'UTXO': {
          // For UTXO chains, check if we need to convert from satoshis
          if (feeValue > 0.1) {
            // If fee is large (likely in satoshis), convert and display in the main unit
            return (feeValue / 100000000).toFixed(8);
          }
          // Otherwise, it's already in the correct unit
          return fee;
        }
        case 'TENDERMINT': {
          // For Tendermint chains, show in native token
          return fee;
        }
        default:
          return fee;
      }
    } catch (error) {
      console.error('Error formatting fee display:', error);
      return fee;
    }
  };

  // Handle fee selection change
  const handleFeeSelectionChange = (feeLevel: 'slow' | 'average' | 'fastest') => {
    setSelectedFeeLevel(feeLevel);
    setCustomFeeOption(false);
    
    // Update the estimated fee
    const newFee = feeOptions[feeLevel];
    setEstimatedFee(newFee);
    updateFeeInUsd(newFee);
  };
  
  // Handle custom fee input
  const handleCustomFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and a single decimal point
    if (/^[0-9]*\.?[0-9]*$/.test(value) || value === '') {
      setCustomFeeAmount(value);
      
      if (value) {
        setEstimatedFee(value);
        updateFeeInUsd(value);
      }
    }
  };

  // Toggle between USD and native input
  const toggleInputMode = () => {
    if (amount) {
      // Convert the current amount when switching modes
      if (isUsdInput) {
        // Converting from USD to native
        setAmount(usdToNative(amount));
      } else {
        // Converting from native to USD
        setAmount(nativeToUsd(amount));
      }
    }
    setIsUsdInput(!isUsdInput);
  }

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and a single decimal point
    if (/^[0-9]*\.?[0-9]*$/.test(value) || value === '') {
      setAmount(value)
      setIsMax(false)
    }
  }

  // Set max amount (full balance)
  const handleSetMax = () => {
    if (isUsdInput) {
      // If in USD mode, set max as the USD value of the balance
      setAmount(nativeToUsd(balance));
    } else {
      // In native mode, set the native balance
      setAmount(balance);
    }
    setIsMax(true);
  }

  // Handle send transaction
  const handleSend = async () => {
    if (!amount || !recipient) {
      console.error('Missing fields')
      return
    }

    // Convert amount to native token if in USD mode
    const nativeAmount = isUsdInput ? usdToNative(amount) : amount;

    // Show loading spinner while building transaction
    setIsBuildingTx(true)
    setLoading(true)
    
    try {
      // Build the transaction first
      setTransactionStep('review')
      const builtTx = await buildTransaction()
      
      // Then show confirmation dialog with the built transaction
      if (builtTx) {
        openConfirmation()
      }
    } catch (error) {
      console.error('Error preparing transaction:', error)
    } finally {
      setIsBuildingTx(false)
      setLoading(false)
    }
  }

  // Build transaction
  const buildTransaction = async () => {
    setLoading(true)
    try {
      // Use the Pioneer SDK to build the transaction
      const caip = assetContext?.caip || assetContext?.assetId
      
      if (!caip) {
        throw new Error('Missing asset CAIP')
      }
      
      // Get network type
      const networkId = assetContext?.networkId || '';
      const networkType = getNetworkType(networkId);
      
      // Add BCH-specific debugging
      const isBCH = networkId.includes('bitcoincash') || networkId.includes('bip122:000000000000000000651ef99cb9fcbe');
      if (isBCH) {
        console.log('🔍 Building Bitcoin Cash transaction:', {
          networkId,
          networkType,
          caip,
          assetContext
        });
      }
      
      // Convert amount to native token if in USD mode
      const nativeAmount = isUsdInput ? usdToNative(amount) : amount;
      
      // Map fee levels to SDK fee level values
      const feeLevelMap = {
        slow: 1,
        average: 5,
        fastest: 9
      };
      
      const sendPayload: SendPayload = {
        caip,
        to: recipient,
        amount: nativeAmount,
        feeLevel: customFeeOption ? 5 : feeLevelMap[selectedFeeLevel], // Use selected or custom fee level
        isMax,
      }
      
      // Add network-specific parameters based on chain type
      switch (networkType) {
        case 'EVM': {
          // For EVM chains, we might need to specify gas settings
          if (customFeeOption && customFeeAmount) {
            // Add custom gas price for EVM chains
            // @ts-ignore - Adding custom property for EVM
            sendPayload.gasPrice = customFeeAmount;
          }
          break;
        }
        
        case 'UTXO': {
          // For UTXO chains, we might need to specify fee rate
          if (customFeeOption && customFeeAmount) {
            // Add custom fee rate for UTXO chains (sats/byte)
            // @ts-ignore - Adding custom property for UTXO
            sendPayload.feeRate = customFeeAmount;
          }
          
          // Add BCH-specific parameters
          if (isBCH) {
            // BCH often requires explicit address format specification
            // @ts-ignore - Adding custom property for BCH
            sendPayload.addressFormat = 'cashaddr';
            console.log('🔧 Added BCH-specific parameters to payload');
          }
          break;
        }
        
        case 'TENDERMINT': {
          // For Tendermint chains, add memo if provided
          if (memo) {
            sendPayload.memo = memo;
          }
          break;
        }
        
        case 'OTHER': {
          // Handle other chains like Ripple
          if (networkId.includes('ripple') && memo) {
            // In Ripple, this might be a "destination tag" instead of a memo
            sendPayload.memo = memo;
          }
          break;
        }
      }
      
      // Add memo for supported chains if provided
      if (memo && supportsMemo) {
        sendPayload.memo = memo;
      }
      
      console.log('Build TX Payload:', sendPayload)
      
      // Call the SDK's buildTx method
      let unsignedTxResult;
      try {
        unsignedTxResult = await app.buildTx(sendPayload);
        console.log('Unsigned TX Result:', unsignedTxResult);
        
        // Add BCH-specific debug logging
        if (isBCH) {
          console.log('🔍 BCH Transaction built successfully:', {
            resultType: typeof unsignedTxResult,
            hasInputs: unsignedTxResult?.inputs ? 'Yes' : 'No',
            hasOutputs: unsignedTxResult?.outputs ? 'Yes' : 'No'
          });
        }
      } catch (buildError) {
        console.error('Transaction build error:', buildError);
        if (isBCH) {
          console.error('🚨 BCH Transaction build failed:', buildError);
          
          // Attempt a fallback approach for BCH
          console.log('🔄 Attempting fallback approach for BCH...');
          
          // Try with a simpler payload or alternative approach
          const simplifiedPayload = {
            ...sendPayload,
            // Force using specific fee level for BCH
            feeLevel: 5
          };
          
          console.log('🔄 Using simplified BCH payload:', simplifiedPayload);
          unsignedTxResult = await app.buildTx(simplifiedPayload);
          console.log('🔄 BCH Fallback transaction result:', unsignedTxResult);
        } else {
          throw buildError; // Re-throw for non-BCH chains
        }
      }
      
      if (!unsignedTxResult) {
        throw new Error('Failed to build transaction: No result returned');
      }
      
      // Extract fee from unsigned transaction result if available
      try {
        // Different chains have different formats for fee information
        let feeValue = estimatedFee; // Use current estimate as fallback
        
        if (unsignedTxResult && typeof unsignedTxResult === 'object') {
          // Extract fee based on network type
          switch (networkType) {
            case 'EVM': {
              // For EVM chains, fee is gasPrice * gasLimit
              if (unsignedTxResult.gasPrice && unsignedTxResult.gasLimit) {
                const gasPrice = parseFloat(unsignedTxResult.gasPrice);
                const gasLimit = parseFloat(unsignedTxResult.gasLimit);
                
                // Convert from wei to native token
                const gweiToEth = 0.000000001;
                feeValue = (gasPrice * gasLimit * gweiToEth).toFixed(8);
              } else if (unsignedTxResult.maxFeePerGas && unsignedTxResult.gasLimit) {
                // For EIP-1559 transactions
                const maxFeePerGas = parseFloat(unsignedTxResult.maxFeePerGas);
                const gasLimit = parseFloat(unsignedTxResult.gasLimit);
                
                // Convert from wei to native token
                const gweiToEth = 0.000000001;
                feeValue = (maxFeePerGas * gasLimit * gweiToEth).toFixed(8);
              }
              break;
            }
            
            case 'UTXO': {
              // For UTXO chains, fee might be directly specified
              if (unsignedTxResult.fee) {
                feeValue = typeof unsignedTxResult.fee === 'string' 
                  ? unsignedTxResult.fee 
                  : unsignedTxResult.fee.toString();
                
                // Validate fee for UTXO chains to prevent unreasonable values
                const parsedFee = parseFloat(feeValue);
                const txAmount = parseFloat(nativeAmount);
                
                // Sanity check: Fee shouldn't be greater than 10% of tx amount unless extremely small tx
                if (parsedFee > txAmount * 0.1 && txAmount > 0.001) {
                  console.warn('⚠️ Fee is suspiciously high, likely in satoshis. Adjusting:', parsedFee);
                  
                  // For BCH and other UTXO chains, if fee seems too large, it's likely in satoshis
                  // A typical BCH fee should be a very small fraction of a BCH
                  if (parsedFee > 0.1) {
                    // Convert from satoshis to full coin (1 BCH = 100,000,000 satoshis)
                    feeValue = (parsedFee / 100000000).toFixed(8);
                    console.log('🔄 Adjusted fee to BCH units:', feeValue);
                  }
                }
              } else if (unsignedTxResult.feeValue) {
                feeValue = unsignedTxResult.feeValue.toString();
                
                // Apply same validation to feeValue
                const parsedFee = parseFloat(feeValue);
                if (parsedFee > 0.1) {
                  feeValue = (parsedFee / 100000000).toFixed(8);
                }
              }
              
              // Special handling for BCH - add double-check for reasonable fee values
              if (isBCH) {
                const parsedFee = parseFloat(feeValue);
                
                // If fee still seems unreasonably high for BCH (greater than 0.01 BCH), force a reasonable value
                if (parsedFee > 0.01) {
                  console.warn('⚠️ BCH fee still too high after adjustment, forcing reasonable value');
                  feeValue = '0.00001'; // Set a reasonable BCH fee
                }
              }
              break;
            }
            
            case 'TENDERMINT': {
              // For Tendermint chains, check common fee patterns
              if (unsignedTxResult.fee) {
                if (typeof unsignedTxResult.fee === 'string') {
                  feeValue = unsignedTxResult.fee;
                } else if (typeof unsignedTxResult.fee === 'object') {
                  if (unsignedTxResult.fee.amount && Array.isArray(unsignedTxResult.fee.amount) && unsignedTxResult.fee.amount.length > 0) {
                    // Cosmos format: fee.amount is an array of {denom, amount}
                    feeValue = unsignedTxResult.fee.amount[0].amount || feeValue;
                  } else {
                    feeValue = unsignedTxResult.fee.amount || unsignedTxResult.fee.value || feeValue;
                  }
                }
              }
              break;
            }
            
            case 'OTHER': {
              // For other chains, try common patterns
              if (unsignedTxResult.fee) {
                feeValue = typeof unsignedTxResult.fee === 'string' 
                  ? unsignedTxResult.fee 
                  : unsignedTxResult.fee.toString();
              }
              break;
            }
          }
        }
        
        // Final sanity check for all chains
        const parsedFee = parseFloat(feeValue);
        const txAmount = parseFloat(nativeAmount);
        
        // If fee is more than 20% of the transaction amount and > 0.1 native units,
        // it's likely an incorrect value (except for very small transactions)
        if (parsedFee > txAmount * 0.2 && parsedFee > 0.1 && txAmount > 0.001) {
          console.warn('⚠️ Fee unreasonably high after all checks, using default');
          
          // Use a reasonable default based on network type
          switch (networkType) {
            case 'UTXO':
              feeValue = '0.00001';
              break;
            case 'EVM':
              feeValue = '0.001';
              break;
            default:
              feeValue = '0.001';
          }
        }
        
        // Update fee state
        console.log('Final extracted fee:', feeValue);
        setEstimatedFee(feeValue);
        
        // Calculate and update fee in USD
        updateFeeInUsd(feeValue);
      } catch (feeError) {
        console.error('Error extracting fee from transaction:', feeError);
        // If we can't extract fee, we still have the default value
        updateFeeInUsd(estimatedFee);
      }
      
      // Store the unsigned transaction
      const transactionState: TransactionState = {
        method: 'transfer',
        caip,
        params: sendPayload,
        unsignedTx: unsignedTxResult,
        signedTx: null,
        state: 'unsigned',
        context: assetContext,
      }
      
      setUnsignedTx(transactionState)
      
      return transactionState
    } catch (error) {
      console.error('Transaction build error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }
  
  // Sign transaction
  const signTransaction = async (txState: TransactionState) => {
    setLoading(true)
    try {
      const caip = assetContext?.caip || assetContext?.assetId
      
      if (!txState?.unsignedTx) {
        throw new Error('No unsigned transaction to sign')
      }
      
      console.log('Signing TX:', txState.unsignedTx)
      
      // Call the SDK's signTx method
      const signedTxResult = await app.signTx({ 
        caip, 
        unsignedTx: txState.unsignedTx 
      })
      
      console.log('Signed TX Result:', signedTxResult)
      setSignedTx(signedTxResult)
      setTransactionStep('broadcast')
      
      // Play woosh sound when transaction is signed successfully
      playSound(wooshSound);
      
      return signedTxResult
    } catch (error: any) {
      console.error('Transaction signing error:', error)
      // Set error message and show error dialog
      setError(error.message || 'Failed to sign transaction')
      setShowErrorDialog(true)
      // Reset transaction step
      setTransactionStep('review')
      throw error
    } finally {
      setLoading(false)
    }
  }
  
  // Broadcast transaction
  const broadcastTransaction = async (signedTxData: any) => {
    setLoading(true)
    try {
      const caip = assetContext?.caip || assetContext?.assetId
      
      if (!signedTxData) {
        throw new Error('No signed transaction to broadcast')
      }
      
      console.log('Broadcasting TX:', signedTxData)
      
      // Call the SDK's broadcastTx method
      const broadcastResult = await app.broadcastTx(caip, signedTxData)
      
      console.log('Broadcast Result:', broadcastResult)
      
      // Extract the transaction hash from the result - handle different result formats
      const finalTxHash = typeof broadcastResult === 'string' 
        ? broadcastResult 
        : broadcastResult?.txHash || broadcastResult?.txid || broadcastResult || '';
      
      console.log('Final TX Hash:', finalTxHash);
      setTxHash(finalTxHash)
      setTxSuccess(true)
      setTransactionStep('success')
      
      return broadcastResult
    } catch (error: any) {
      console.error('Transaction broadcast error:', error)
      // Set error message and show error dialog
      setError(error.message || 'Failed to broadcast transaction')
      setShowErrorDialog(true)
      // Reset transaction step
      setTransactionStep('review')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Confirm and execute transaction
  const confirmTransaction = async () => {
    setLoading(true)
    try {
      // Step 1: Sign the transaction
      setTransactionStep('sign')
      const signedTxData = await signTransaction(unsignedTx)
      
      // Step 2: Broadcast the transaction
      await broadcastTransaction(signedTxData)
      
      console.log('Transaction sent successfully')
    } catch (error) {
      console.error('Transaction error:', error)
      // Error is already handled in the respective functions
    } finally {
      setLoading(false)
    }
  }
  
  // Format transaction details for display
  const formatTransactionDetails = (tx: any): React.ReactNode => {
    if (!tx) return null;
    
    // Get network type for formatting
    const networkType = assetContext?.networkId ? getNetworkType(assetContext.networkId) : 'OTHER';
    const isBCH = assetContext?.networkId?.includes('bitcoincash') || 
                  assetContext?.networkId?.includes('bip122:000000000000000000651ef99cb9fcbe');
    
    // Different formatting based on network type
    switch (networkType) {
      case 'UTXO': {
        return (
          <Box width="100%">
            <Text color="gray.500" fontSize="sm" mb={1}>Transaction Details</Text>
            {tx.inputs && tx.inputs.length > 0 && (
              <Box mb={3}>
                <Text color="gray.500" fontSize="xs">Inputs ({tx.inputs.length})</Text>
                <Box maxH="100px" overflowY="auto" mt={1} p={2} bg="rgba(0,0,0,0.2)" borderRadius="md" fontSize="xs">
                  {tx.inputs.map((input: any, idx: number) => (
                    <Text key={idx} fontFamily="mono" color="white" fontSize="10px" mb={1}>
                      {input.txid?.substring(0, 8)}...{input.txid?.substring(input.txid.length - 8)} : {input.vout} 
                      {input.value && ` (${input.value} sats)`}
                    </Text>
                  ))}
                </Box>
              </Box>
            )}
            
            {tx.outputs && tx.outputs.length > 0 && (
              <Box>
                <Text color="gray.500" fontSize="xs">Outputs ({tx.outputs.length})</Text>
                <Box maxH="100px" overflowY="auto" mt={1} p={2} bg="rgba(0,0,0,0.2)" borderRadius="md" fontSize="xs">
                  {tx.outputs.map((output: any, idx: number) => (
                    <Text key={idx} fontFamily="mono" color="white" fontSize="10px" mb={1} wordBreak="break-all">
                      {output.address ? (
                        <>
                          {output.address?.substring(0, 8)}...{output.address?.substring(output.address.length - 8)}
                          {output.amount && ` (${output.amount} sats)`}
                        </>
                      ) : (
                        <>
                          Change output
                          {output.amount && ` (${output.amount} sats)`}
                        </>
                      )}
                    </Text>
                  ))}
                </Box>
              </Box>
            )}
            
            {tx.fee && (
              <Flex justify="space-between" mt={2}>
                <Text color="gray.500" fontSize="xs">Transaction Fee</Text>
                <Text color="white" fontSize="xs">{tx.fee} sats</Text>
              </Flex>
            )}
          </Box>
        );
      }
      
      case 'EVM': {
        return (
          <Box width="100%">
            <Text color="gray.500" fontSize="sm" mb={1}>Transaction Details</Text>
            <Box maxH="150px" overflowY="auto" mt={1} p={2} bg="rgba(0,0,0,0.2)" borderRadius="md" fontSize="xs">
              {tx.to && (
                <Flex justify="space-between" mb={1}>
                  <Text color="gray.500">To:</Text>
                  <Text color="white" fontFamily="mono" wordBreak="break-all">{tx.to}</Text>
                </Flex>
              )}
              {tx.value && (
                <Flex justify="space-between" mb={1}>
                  <Text color="gray.500">Value:</Text>
                  <Text color="white" fontFamily="mono">{tx.value}</Text>
                </Flex>
              )}
              {tx.gasLimit && (
                <Flex justify="space-between" mb={1}>
                  <Text color="gray.500">Gas Limit:</Text>
                  <Text color="white" fontFamily="mono">{tx.gasLimit}</Text>
                </Flex>
              )}
              {tx.gasPrice && (
                <Flex justify="space-between" mb={1}>
                  <Text color="gray.500">Gas Price:</Text>
                  <Text color="white" fontFamily="mono">{tx.gasPrice} Gwei</Text>
                </Flex>
              )}
            </Box>
          </Box>
        );
      }
      
      default:
        // For other chains, just show the JSON structure
        return (
          <Box width="100%">
            <Text color="gray.500" fontSize="sm" mb={1}>Transaction Details</Text>
            <Box maxH="150px" overflowY="auto" mt={1} p={2} bg="rgba(0,0,0,0.2)" borderRadius="md" fontSize="xs">
              <Text color="white" fontFamily="mono" wordBreak="break-all">
                {JSON.stringify(tx, null, 2)}
              </Text>
            </Box>
          </Box>
        );
    }
  };

  // Function to open raw transaction dialog
  const openRawTxDialog = () => {
    if (unsignedTx?.unsignedTx) {
      const formattedJson = JSON.stringify(unsignedTx.unsignedTx, null, 2);
      setRawTxJson(formattedJson);
      setEditedRawTxJson(formattedJson);
      setShowRawTxDialog(true);
    }
  };

  // Function to handle editing of raw transaction JSON
  const handleRawTxJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedRawTxJson(e.target.value);
  };

  // Function to apply edited JSON to the transaction
  const applyEditedJson = () => {
    try {
      const parsedJson = JSON.parse(editedRawTxJson);
      // Create a new transaction state with the edited unsigned transaction
      const updatedTxState = {
        ...unsignedTx,
        unsignedTx: parsedJson
      };
      setUnsignedTx(updatedTxState);
      setShowRawTxDialog(false);
      // Show a success message or toast here
    } catch (error) {
      console.error('Invalid JSON format:', error);
      // Show an error message or toast here
    }
  };

  // Function to close the dialog without applying changes
  const closeRawTxDialog = () => {
    setShowRawTxDialog(false);
  };

  // Function to handle viewing transaction on explorer
  const viewOnExplorer = () => {
    if (!txHash) {
      console.error('No transaction hash available');
      return;
    }
    
    console.log('Viewing transaction on explorer:', txHash);
    console.log('Asset context:', assetContext);
    
    let explorerUrl;
    
    // First try to use the explorer link from asset context
    if (assetContext?.explorerTxLink) {
      // Check if the URL already ends with a slash
      const baseUrl = assetContext.explorerTxLink.endsWith('/') 
        ? assetContext.explorerTxLink
        : `${assetContext.explorerTxLink}/`;
      
      explorerUrl = `${baseUrl}${txHash}`;
    } 
    // Fallback for different network types
    else if (assetContext?.networkId) {
      const networkId = assetContext.networkId;
      const networkType = getNetworkType(networkId);
      
      switch (networkType) {
        case 'UTXO': {
          if (networkId.includes('bitcoin')) {
            explorerUrl = `https://blockstream.info/tx/${txHash}`;
          } else if (networkId.includes('litecoin')) {
            explorerUrl = `https://blockchair.com/litecoin/transaction/${txHash}`;
          } else if (networkId.includes('dogecoin')) {
            explorerUrl = `https://blockchair.com/dogecoin/transaction/${txHash}`;
          } else if (networkId.includes('bitcoincash')) {
            explorerUrl = `https://blockchair.com/bitcoin-cash/transaction/${txHash}`;
          } else {
            explorerUrl = `https://blockchair.com/${networkId.split(':')[0]}/transaction/${txHash}`;
          }
          break;
        }
        
        case 'EVM': {
          if (networkId.includes('eip155:1')) {
            explorerUrl = `https://etherscan.io/tx/${txHash}`;
          } else if (networkId.includes('eip155:56')) {
            explorerUrl = `https://bscscan.com/tx/${txHash}`;
          } else if (networkId.includes('eip155:137')) {
            explorerUrl = `https://polygonscan.com/tx/${txHash}`;
          } else if (networkId.includes('eip155:43114')) {
            explorerUrl = `https://snowtrace.io/tx/${txHash}`;
          } else if (networkId.includes('eip155:8453')) {
            explorerUrl = `https://basescan.org/tx/${txHash}`;
          } else if (networkId.includes('eip155:10')) {
            explorerUrl = `https://optimistic.etherscan.io/tx/${txHash}`;
          } else {
            explorerUrl = `https://blockscan.com/tx/${txHash}`;
          }
          break;
        }
        
        case 'TENDERMINT': {
          if (networkId.includes('cosmos:cosmoshub')) {
            explorerUrl = `https://www.mintscan.io/cosmos/tx/${txHash}`;
          } else if (networkId.includes('cosmos:osmosis')) {
            explorerUrl = `https://www.mintscan.io/osmosis/tx/${txHash}`;
          } else if (networkId.includes('cosmos:thorchain')) {
            explorerUrl = `https://viewblock.io/thorchain/tx/${txHash}`;
          } else if (networkId.includes('cosmos:mayachain')) {
            explorerUrl = `https://www.mintscan.io/mayachain/tx/${txHash}`;
          } else {
            explorerUrl = `https://www.mintscan.io/${networkId.split(':')[1].split('/')[0]}/tx/${txHash}`;
          }
          break;
        }
        
        case 'OTHER': {
          if (networkId.includes('ripple')) {
            explorerUrl = `https://xrpscan.com/tx/${txHash}`;
          } else {
            explorerUrl = `https://blockchair.com/search?q=${txHash}`;
          }
          break;
        }
        
        default:
          explorerUrl = `https://blockchair.com/search?q=${txHash}`;
      }
    } else {
      // Generic fallback
      explorerUrl = `https://blockchair.com/search?q=${txHash}`;
    }
    
    // Open the explorer in a new tab
    if (explorerUrl) {
      window.open(explorerUrl, '_blank');
    }
  }
  
  // Reset the form after completing a transaction
  const resetForm = () => {
    setAmount('')
    setRecipient('')
    setMemo('')
    setTxHash('')
    setTxSuccess(false)
    setUnsignedTx(null)
    setSignedTx(null)
    setTransactionStep('review')
    setShowConfirmation(false)
  }

  // Close error dialog
  const closeErrorDialog = () => {
    setShowErrorDialog(false)
    setError(null)
  }

  if (!assetContext) {
    return (
      <Box p={6}>
        <Stack gap={4}>
          <Skeleton height="60px" width="100%" />
          <Skeleton height="40px" width="70%" />
          <Skeleton height="80px" width="100%" />
          <Skeleton height="40px" width="90%" />
          <Skeleton height="50px" width="100%" />
          <Text color="gray.400" textAlign="center" mt={2}>
            Loading asset information...
          </Text>
        </Stack>
      </Box>
    )
  }

  const networkColor = assetContext.color || '#3182CE'
  
  // Network supports memo
  const supportsMemo = TENDERMINT_SUPPORT.includes(assetContext.assetId) || OTHER_SUPPORT.includes(assetContext.assetId);

  // Render confirmation overlay if needed
  if (showConfirmation) {
    // Transaction success screen
    if (transactionStep === 'success' && txSuccess) {
      return (
        <Box height="100vh" bg={theme.bg}>
          {/* Show confetti animation */}
          <Confetti 
            width={typeof window !== 'undefined' ? window.innerWidth : 375}
            height={typeof window !== 'undefined' ? window.innerHeight : 600}
            recycle={false}
            numberOfPieces={300}
            gravity={0.2}
            colors={['#FFD700', '#FFFFFF', '#E5C100', '#FFF8D9']}
          />
          
          <Box 
            bg={theme.cardBg}
            borderColor={theme.border}
            borderWidth="1px"
            borderRadius="md"
            width="100%"
            height="100%"
            display="flex"
            flexDirection="column"
            overflow="hidden"
          >
            {/* Header */}
            <Box 
              borderBottom="1px" 
              borderColor={theme.border}
              p={5}
              bg={theme.cardBg}
            >
              <Flex justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="bold" color={theme.gold}>
                  Transaction Complete
                </Text>
                <IconButton
                  aria-label="Close"
                  onClick={resetForm}
                  size="sm"
                  variant="ghost"
                  color={theme.gold}
                >
                  <FaTimes />
                </IconButton>
              </Flex>
            </Box>
            
            {/* Main Content */}
            <Box 
              flex="1" 
              p={5} 
              overflowY="auto"
            >
              <Stack gap={6} align="center">
                {/* Success Icon */}
                <Box 
                  borderRadius="full" 
                  bg="green.500" 
                  color="white" 
                  width="90px" 
                  height="90px" 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                  fontSize="4xl"
                  mt={3}
                  boxShadow="0px 0px 20px rgba(56, 178, 72, 0.5)"
                >
                  <FaCheck />
                </Box>
                
                <Text fontSize="2xl" fontWeight="bold" color="white" textAlign="center">
                  Transaction Sent Successfully!
                </Text>
                
                {/* Asset Icon and Info */}
                <Box 
                  borderRadius="full" 
                  overflow="hidden" 
                  boxSize="60px"
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
                
                <Box width="100%" textAlign="center">
                  <Text color="gray.500" fontSize="sm">Amount Sent</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="white">
                    {isUsdInput ? usdToNative(amount) : amount} {assetContext.symbol}
                  </Text>
                  <Text color="gray.500" fontSize="md" mt={1}>
                    ≈ {formatUsd(parseFloat(isUsdInput ? usdToNative(amount) : amount) * (assetContext.priceUsd || 0))}
                  </Text>
                </Box>
                
                <Box as="hr" borderColor="gray.700" opacity={0.2} my={2} width="100%" />
                
                <Box width="100%">
                  <Text color="gray.500" fontSize="sm" mb={2}>Transaction Hash</Text>
                  <Box
                    p={3}
                    bg={theme.bg}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={theme.border}
                  >
                    <Flex align="center">
                      <Text fontSize="sm" fontFamily="mono" color="white" wordBreak="break-all" flex="1">
                        {txHash ? txHash : 'Transaction hash pending...'}
                      </Text>
                      <IconButton
                        aria-label="Copy to clipboard"
                        onClick={copyToClipboard}
                        size="sm"
                        variant="ghost"
                        color={hasCopied ? "green.400" : "gray.400"}
                        ml={1}
                        disabled={!txHash}
                      >
                        {hasCopied ? <FaCheck /> : <FaCopy />}
                      </IconButton>
                    </Flex>
                  </Box>
                  {txHash && (
                    <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
                      <Box 
                        as="span" 
                        cursor="pointer" 
                        _hover={{ color: theme.goldHover }}
                        onClick={viewOnExplorer}
                        display="inline-flex"
                        alignItems="center"
                      >
                        View on Explorer <FaExternalLinkAlt size="0.7em" style={{ marginLeft: '4px' }} />
                      </Box>
                    </Text>
                  )}
                </Box>
              </Stack>
            </Box>
            
            {/* Footer with Action Buttons */}
            <Box 
              borderTop="1px" 
              borderColor={theme.border}
              p={5}
            >
              <Stack gap={4}>
                <Button
                  width="100%"
                  bg={theme.gold}
                  color="black"
                  _hover={{
                    bg: theme.goldHover,
                  }}
                  onClick={viewOnExplorer}
                  height="56px"
                >
                  <Flex gap={3} align="center">
                    <FaExternalLinkAlt />
                    <Text>View on Explorer</Text>
                  </Flex>
                </Button>
                
                <Button
                  width="100%"
                  variant="outline"
                  color={theme.gold}
                  borderColor={theme.border}
                  _hover={{
                    bg: 'rgba(255, 215, 0, 0.1)',
                    borderColor: theme.gold,
                  }}
                  onClick={resetForm}
                  height="56px"
                >
                  Return to Dashboard
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      );
    }
    
    // Transaction in progress
    return (
      <Box height="100vh" bg={theme.bg}>
        <Box 
          bg={theme.cardBg}
          borderColor={theme.border}
          borderWidth="1px"
          borderRadius="md"
          width="100%"
          height="100%"
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          {/* Header */}
          <Box 
            borderBottom="1px" 
            borderColor={theme.border}
            p={5}
            bg={theme.cardBg}
          >
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="bold" color={theme.gold}>
                {transactionStep === 'review' ? 'Review Transaction' : 
                 transactionStep === 'sign' ? 'Signing Transaction' : 
                 transactionStep === 'broadcast' ? 'Broadcasting Transaction' : 'Confirm Transaction'}
              </Text>
              <IconButton
                aria-label="Close"
                onClick={closeConfirmation}
                size="sm"
                variant="ghost"
                color={theme.gold}
                disabled={loading}
              >
                <FaTimes />
              </IconButton>
            </Flex>
          </Box>
          
          {/* Main Content */}
          <Box 
            flex="1" 
            p={5} 
            overflowY="auto"
          >
            {/* Loading overlay for signing and broadcasting */}
            {(loading && (transactionStep === 'sign' || transactionStep === 'broadcast')) && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="rgba(0, 0, 0, 0.8)"
                zIndex={1000}
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                p={4}
              >
                {transactionStep === 'sign' ? (
                  <>
                    <Image 
                      src="/images/hold-and-release.svg"
                      alt="Hold and Release Button on KeepKey"
                      width="200px"
                      mb={6}
                    />
                    <Text color={theme.gold} fontSize="xl" fontWeight="bold" mb={2}>
                      Check Your KeepKey Device
                    </Text>
                    <Text color="gray.400" fontSize="md" textAlign="center" maxWidth="400px" mb={2}>
                      Please review the transaction details on your KeepKey
                    </Text>
                    <Text color="gray.400" fontSize="md" textAlign="center">
                      Hold the button to confirm or release to cancel
                    </Text>
                  </>
                ) : (
                  <>
                    <KeepKeyUiGlyph
                      boxSize="80px"
                      color={theme.gold}
                      animation={`${scale} 2s ease-in-out infinite`}
                      mb={6}
                    />
                    <Text color={theme.gold} fontSize="xl" fontWeight="bold" mb={2}>
                      Broadcasting Transaction...
                    </Text>
                    <Text color="gray.400" fontSize="md" textAlign="center">
                      Submitting transaction to the network
                    </Text>
                  </>
                )}
              </Box>
            )}
            
            <Stack gap={5}>
              {/* Asset Information */}
              <Flex align="center" gap={3} width="100%">
                <Box 
                  borderRadius="full" 
                  overflow="hidden" 
                  boxSize="40px"
                  p={1}
                  bg={theme.cardBg}
                  border="1px solid"
                  borderColor={theme.border}
                >
                  <Image 
                    src={assetContext.icon}
                    alt={`${assetContext.name} Icon`}
                    boxSize="100%"
                    objectFit="contain"
                  />
                </Box>
                <Box>
                  <Text fontWeight="bold" color="white">
                    {amount} {assetContext.symbol}
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    {formatUsd(parseFloat(amount || '0') * (assetContext.priceUsd || 0))}
                  </Text>
                </Box>
              </Flex>
              
              {/* Recipient Details */}
              <Box 
                p={4}
                bg={theme.bg}
                border="1px solid"
                borderColor={theme.border}
                borderRadius="md"
                width="100%"
              >
                <Text fontSize="sm" color="gray.400" mb={1}>
                  Recipient
                </Text>
                <Text color="white" wordBreak="break-all" fontSize="sm">
                  {recipient}
                </Text>
                
                {memo && (
                  <>
                    <Text fontSize="sm" color="gray.400" mt={3} mb={1}>
                      Memo/Tag
                    </Text>
                    <Text color="white" wordBreak="break-all" fontSize="sm">
                      {memo}
                    </Text>
                  </>
                )}
              </Box>
              
              {/* Fee Details */}
              <Box 
                p={4}
                bg={theme.bg}
                border="1px solid"
                borderColor={theme.border}
                borderRadius="md"
                width="100%"
              >
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.400">
                    Network Fee
                  </Text>
                  <Box textAlign="right">
                    <Text color="white" fontSize="sm">
                      {formatFeeDisplay(estimatedFee)} {assetContext.symbol}
                    </Text>
                    <Text color="gray.400" fontSize="xs">
                      ≈ ${estimatedFeeUsd} USD
                    </Text>
                  </Box>
                </Flex>
                
                <Flex justify="space-between" align="center" mt={3}>
                  <Text fontSize="sm" color="gray.400">
                    Total
                  </Text>
                  <Box textAlign="right">
                    <Text color="white" fontWeight="bold" fontSize="sm">
                      {isMax ? 
                        balance : 
                        (parseFloat(amount || '0') + parseFloat(estimatedFee)).toFixed(8)} {assetContext.symbol}
                    </Text>
                    <Text color="gray.400" fontSize="xs">
                      {formatUsd((parseFloat(amount || '0') + parseFloat(estimatedFee)) * (assetContext.priceUsd || 0))}
                    </Text>
                  </Box>
                </Flex>
              </Box>
              
              {/* Transaction Details */}
              {unsignedTx && (
                <Box width="100%" mt={4}>
                  <Box 
                    as="button" 
                    onClick={() => setShowTxDetails(!showTxDetails)}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    width="100%"
                    p={2}
                    bg="transparent"
                    border="1px solid"
                    borderColor={theme.border}
                    borderRadius="md"
                    color="white"
                    _hover={{ borderColor: theme.gold }}
                  >
                    <Text fontSize="sm">
                      {showTxDetails ? 'Hide Transaction Details' : 'Show Transaction Details'}
                    </Text>
                    <Box transform={showTxDetails ? 'rotate(180deg)' : 'none'} transition="transform 0.2s">
                      <FaArrowRight transform="rotate(90deg)" />
                    </Box>
                  </Box>
                  
                  {showTxDetails && (
                    <Box 
                      mt={3} 
                      p={3} 
                      borderRadius="md" 
                      bg={theme.bg} 
                      borderWidth="1px"
                      borderColor={theme.border}
                    >
                      {formatTransactionDetails(unsignedTx?.unsignedTx)}
                      
                      {/* Add Raw Transaction Button */}
                      <Button
                        mt={3}
                        size="sm"
                        variant="outline"
                        width="100%"
                        borderColor={theme.border}
                        color={theme.gold}
                        _hover={{ borderColor: theme.gold, bg: 'rgba(255, 215, 0, 0.1)' }}
                        onClick={openRawTxDialog}
                      >
                        Edit Raw Transaction JSON
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* Raw Transaction Dialog */}
              {showRawTxDialog && (
                <Box
                  position="fixed"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  bg="rgba(0, 0, 0, 0.8)"
                  zIndex="1000"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  p={4}
                >
                  <Box
                    bg={theme.cardBg}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={theme.border}
                    width="90%"
                    maxWidth="800px"
                    maxHeight="90vh"
                    overflow="hidden"
                    display="flex"
                    flexDirection="column"
                  >
                    <Box
                      p={4}
                      borderBottom="1px"
                      borderColor={theme.border}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Text color={theme.gold} fontWeight="bold" fontSize="lg">
                        Raw Transaction JSON
                      </Text>
                      <IconButton
                        aria-label="Close"
                        size="sm"
                        variant="ghost"
                        color={theme.gold}
                        onClick={closeRawTxDialog}
                      >
                        <FaTimes />
                      </IconButton>
                    </Box>
                    
                    <Box
                      p={4}
                      flex="1"
                      overflowY="auto"
                    >
                      <Text color="gray.400" fontSize="sm" mb={2}>
                        Edit the transaction JSON below:
                      </Text>
                      <Textarea
                        value={editedRawTxJson}
                        onChange={handleRawTxJsonChange}
                        p={3}
                        height="300px"
                        width="100%"
                        fontFamily="mono"
                        fontSize="sm"
                        color="white"
                        bg={theme.bg}
                        border="1px solid"
                        borderColor={theme.border}
                        borderRadius="md"
                        resize="vertical"
                        _focus={{
                          borderColor: theme.gold,
                          outline: "none"
                        }}
                      />
                    </Box>
                    
                    <Box
                      p={4}
                      borderTop="1px"
                      borderColor={theme.border}
                      display="flex"
                      justifyContent="flex-end"
                      gap={3}
                    >
                      <Button
                        variant="outline"
                        color="gray.400"
                        borderColor={theme.border}
                        onClick={closeRawTxDialog}
                      >
                        Cancel
                      </Button>
                      <Button
                        bg={theme.gold}
                        color="black"
                        _hover={{ bg: theme.goldHover }}
                        onClick={applyEditedJson}
                      >
                        Apply Changes
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>
          
          {/* Footer with Action Buttons */}
          <Box 
            borderTop="1px" 
            borderColor={theme.border}
            p={5}
          >
            <Stack gap={3}>
              <Button
                width="100%"
                bg={theme.gold}
                color="black"
                _hover={{
                  bg: theme.goldHover,
                }}
                onClick={confirmTransaction}
                loading={loading}
                height="56px"
                fontSize="lg"
                boxShadow="0px 4px 12px rgba(255, 215, 0, 0.3)"
              >
                Sign & Send
              </Button>
              
              <Button
                width="100%"
                variant="outline"
                color={theme.gold}
                borderColor={theme.border}
                _hover={{
                  bg: 'rgba(255, 215, 0, 0.1)',
                  borderColor: theme.gold,
                }}
                onClick={closeConfirmation}
                height="56px"
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    );
  }

  // Normal send form
  return (
    <Box 
      width="100%" 
      position="relative"
      pb={8} // Add bottom padding to ensure content doesn't get cut off
    >
      {/* Transaction Building Overlay */}
      {isBuildingTx && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.85)"
          zIndex={1000}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          backdropFilter="blur(2px)"
        >
          <KeepKeyUiGlyph
            boxSize="80px"
            color={theme.gold}
            animation={`${scale} 2s ease-in-out infinite`}
            mb={6}
          />
          <Text color={theme.gold} fontSize="xl" fontWeight="bold" mb={2}>
            Building Transaction...
          </Text>
          <Text color="gray.400" fontSize="md" textAlign="center" maxWidth="400px">
            Please wait while we prepare your transaction details
          </Text>
        </Box>
      )}
      
      {/* Error Dialog */}
      {showErrorDialog && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.8)"
          zIndex={2000}
          display="flex"
          justifyContent="center"
          alignItems="center"
          p={4}
        >
          <Box
            bg={theme.cardBg}
            borderRadius="md"
            borderWidth="1px"
            borderColor="red.500"
            width="90%"
            maxWidth="500px"
            overflow="hidden"
            boxShadow="0px 4px 20px rgba(0, 0, 0, 0.5)"
          >
            <Box
              bg="red.500"
              py={4}
              px={6}
              textAlign="center"
            >
              <Flex justify="center" align="center" mb={2}>
                <Box fontSize="24px" mr={2}>
                  <FaTimes />
                </Box>
              </Flex>
              <Text fontSize="lg" fontWeight="bold" color="white">
                Transaction Error
              </Text>
              <Text fontSize="md" color="white" mt={1}>
                {error || 'An error occurred during transaction signing.'}
              </Text>
            </Box>
            
            <Box p={5}>
              <Text color="white" mb={4}>
                There was a problem signing your transaction with KeepKey. Please check your device and try again.
              </Text>
              <Text color="gray.400" fontSize="sm" mb={4}>
                Error details: {error || 'Unknown error'}
              </Text>
              
              <Button
                width="100%"
                bg={theme.gold}
                color="black"
                _hover={{
                  bg: theme.goldHover,
                }}
                onClick={closeErrorDialog}
                height="45px"
              >
                Close
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    
      <Box 
        borderBottom="1px" 
        borderColor={theme.border}
        p={4}
        bg={theme.cardBg}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Flex justify="space-between" align="center">
          <Button
            size="sm"
            variant="ghost"
            color={theme.gold}
            onClick={onBackClick}
            _hover={{ color: theme.goldHover }}
          >
            <Flex align="center" gap={2}>
              <Text>Back</Text>
            </Flex>
          </Button>
          <Text color={theme.gold} fontWeight="bold">
            Send {assetContext?.name || 'Asset'}
          </Text>
          <Box w="20px"></Box> {/* Spacer for alignment */}
        </Flex>
      </Box>
      
      {/* Main Content */}
      <Box p={5}>
        <Stack gap={6} align="center">
          {/* Asset Avatar and Info */}
          <Box 
            bg={theme.cardBg} 
            p={5} 
            borderRadius={theme.borderRadius}
            boxShadow="lg"
            border="1px solid"
            borderColor={theme.border}
            width="100%"
          >
            <VStack align="center" gap={4}>
              <Box 
                borderRadius="full" 
                overflow="hidden" 
                boxSize="70px"
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
              <Stack align="center" gap={1}>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {assetContext.name}
                </Text>
                <Stack>
                  <Text color="gray.400" fontSize="sm" textAlign="center">
                    Balance: {balance} {assetContext.symbol}
                  </Text>
                  <Text color={theme.gold} fontSize="md" textAlign="center" fontWeight="medium">
                    {formatUsd(totalBalanceUsd)}
                  </Text>
                </Stack>
              </Stack>
            </VStack>
          </Box>
          
          {/* Amount */}
          <Box 
            width="100%" 
            bg={theme.cardBg} 
            borderRadius={theme.borderRadius} 
            p={theme.formPadding}
            borderWidth="1px"
            borderColor={theme.border}
          >
            <Stack gap={3}>
              <Text color="white" fontWeight="medium">Amount</Text>
              <Flex>
                <Flex 
                  position="relative" 
                  flex="1"
                  align="center"
                >
                  {isUsdInput && (
                    <Box position="absolute" left="12px" zIndex="1">
                      <Text color={theme.gold} fontWeight="bold">$</Text>
                    </Box>
                  )}
                  <Input
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    color="white"
                    borderColor={theme.border}
                    _hover={{ borderColor: theme.goldHover }}
                    _focus={{ borderColor: theme.gold }}
                    p={3}
                    pl={isUsdInput ? "28px" : "12px"}
                    height="50px"
                    fontSize="lg"
                    flex="1"
                  />
                  {!isUsdInput && (
                    <Box position="absolute" right="12px" zIndex="1">
                      <Text color="gray.500" fontWeight="medium">{assetContext.symbol}</Text>
                    </Box>
                  )}
                </Flex>
                <Button
                  ml={3}
                  bg={theme.cardBg}
                  color={theme.gold}
                  borderColor={theme.border}
                  borderWidth="1px"
                  height="50px"
                  px={4}
                  _hover={{
                    bg: 'rgba(255, 215, 0, 0.1)',
                    borderColor: theme.gold,
                  }}
                  onClick={handleSetMax}
                >
                  MAX
                </Button>
              </Flex>
              <Text 
                fontSize="sm" 
                color="gray.500" 
                ml={2} 
                cursor="pointer" 
                _hover={{ color: theme.goldHover }}
                onClick={toggleInputMode}
                display="flex"
                alignItems="center"
              >
                {isUsdInput ? (
                  <>≈ {amount ? parseFloat(usdToNative(amount)).toFixed(8) : '0'} {assetContext.symbol}</>
                ) : (
                  <>≈ {formatUsd(parseFloat(amount || '0') * (assetContext.priceUsd || 0))}</>
                )}
                <Box as="span" ml={1} fontSize="xs">(click to switch)</Box>
              </Text>
            </Stack>
          </Box>
          
          {/* Recipient */}
          <Box 
            width="100%" 
            bg={theme.cardBg} 
            borderRadius={theme.borderRadius} 
            p={theme.formPadding}
            borderWidth="1px"
            borderColor={theme.border}
          >
            <Stack gap={3}>
              <Text color="white" fontWeight="medium">Recipient</Text>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={`${assetContext.symbol} Address`}
                color="white"
                borderColor={theme.border}
                _hover={{ borderColor: theme.goldHover }}
                _focus={{ borderColor: theme.gold }}
                p={3}
                height="50px"
                fontSize="md"
              />
            </Stack>
          </Box>
          
          {/* Memo/Tag (only for supported networks) */}
          {supportsMemo && (
            <Box 
              width="100%" 
              bg={theme.cardBg} 
              borderRadius={theme.borderRadius} 
              p={theme.formPadding}
              borderWidth="1px"
              borderColor={theme.border}
            >
              <Stack gap={3}>
                <Text color="white" fontWeight="medium">
                  {assetContext.networkId?.includes('cosmos') ? 'Memo' : 'Tag'} (Optional)
                </Text>
                <Input
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder={assetContext.networkId?.includes('cosmos') ? 'Memo' : 'Destination Tag'}
                  color="white"
                  borderColor={theme.border}
                  _hover={{ borderColor: theme.goldHover }}
                  _focus={{ borderColor: theme.gold }}
                  p={3}
                  height="50px"
                  fontSize="md"
                />
              </Stack>
            </Box>
          )}
          
          {/* Fee Estimate */}
          <Box 
            width="100%" 
            bg="rgba(255, 215, 0, 0.05)" 
            borderRadius={theme.borderRadius} 
            p={theme.formPadding}
            borderWidth="1px"
            borderColor="rgba(255, 215, 0, 0.2)"
          >
            <Flex justify="space-between" align="center">
              <Text color="gray.400">Estimated Fee</Text>
              <Stack gap={0} align="flex-end">
                <Text color={theme.gold} fontWeight="medium">
                  {formatFeeDisplay(estimatedFee)} {assetContext.symbol}
                </Text>
                <Text color="gray.500" fontSize="xs">
                  ≈ ${estimatedFeeUsd} USD
                </Text>
              </Stack>
            </Flex>
          </Box>
          
          {/* Send Button */}
          <Button
            mt={4}
            width="100%"
            bg={theme.gold}
            color="black"
            _hover={{
              bg: theme.goldHover,
            }}
            onClick={handleSend}
            disabled={!amount || !recipient}
            height="56px"
            fontSize="lg"
            boxShadow="0px 4px 12px rgba(255, 215, 0, 0.3)"
          >
            <Flex gap={3} align="center" justify="center">
              <FaPaperPlane />
              <Text>Send {assetContext.symbol}</Text>
            </Flex>
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default Send; 
"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo
} from "react";
import {
    Box,
    Flex,
    Heading,
    Input,
    Text,
    VStack,
    Link,
    Center,
    Spinner,
    Image,
    Button as ChakraButton
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { Avatar } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Table } from "@chakra-ui/react";
import { FaCheck, FaLock } from "react-icons/fa";
import {
    ActionBarContent,
    ActionBarRoot,
    ActionBarSelectionTrigger,
    ActionBarSeparator,
} from "@/components/ui/action-bar";
import {
    StepsRoot,
    StepsList,
    StepsItem,
    StepsContent,
    StepsCompletedContent,
    StepsNextTrigger,
    StepsPrevTrigger,
} from "@/components/ui/steps";
import { TxReview } from "@/components/tx";
import { Button } from "@/components/ui/button";

// ---------------------------
// Context and Provider
// ---------------------------
interface BatchOutput {
    recipient: string;
    amount: string;
}

interface TransferContextValue {
    app: any;
    caip: string | undefined;
    explorerTxLink: string | undefined;

    isSubmitting: boolean;
    setIsSubmitting: (v: boolean) => void;

    inputAmount: string;
    setInputAmount: (v: string) => void;

    recipient: string;
    setRecipient: (v: string) => void;
    recipientError: string;
    setRecipientError: (v: string) => void;

    isMax: boolean;
    setIsMax: (v: boolean) => void;

    unsignedTx: any;
    setUnsignedTx: (v: any) => void;

    signedTx: any;
    setSignedTx: (v: any) => void;

    broadcastResult: any;
    setBroadcastResult: (v: any) => void;

    txHash: string;
    setTxHash: (v: string) => void;

    showSats: boolean;
    setShowSats: (v: boolean) => void;

    batchEnabled: boolean;
    setBatchEnabled: (v: boolean) => void;

    opReturnEnabled: boolean;
    setOpReturnEnabled: (v: boolean) => void;

    batchOutputs: BatchOutput[];
    setBatchOutputs: (v: BatchOutput[]) => void;

    opReturnData: string;
    setOpReturnData: (v: string) => void;

    feeLevel: number;
    setFeeLevel: (v: number) => void;

    coinControlEnabled: boolean;
    setCoinControlEnabled: (v: boolean) => void;

    inputsData: any[];
    handleSelectionChange: (totalSelectedValue: number) => void;

    validateAddress: (address: string) => boolean;
    handleSendMax: () => void;
    buildTx: () => Promise<void>;
    signTx: () => Promise<void>;
    broadcastTx: () => Promise<void>;
    canShowAmount: boolean;
}

const TransferContext = createContext<TransferContextValue | undefined>(
  undefined
);

function useTransferContext() {
    const context = useContext(TransferContext);
    if (!context) {
        throw new Error("useTransferContext must be used within a TransferProvider");
    }
    return context;
}

function TransferProvider({ app, children }: { app: any; children: React.ReactNode }) {
    const caip = app.assetContext?.caip;
    const explorerTxLink = app.assetContext?.explorerTxLink;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputAmount, setInputAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [recipientError, setRecipientError] = useState('');
    const [txHash, setTxHash] = useState('');
    const [isMax, setIsMax] = useState(false);
    const [unsignedTx, setUnsignedTx] = useState<any>(null);
    const [signedTx, setSignedTx] = useState<any>(null);
    const [broadcastResult, setBroadcastResult] = useState<any>(null);
    const [showSats, setShowSats] = useState(true);

    const [batchEnabled, setBatchEnabled] = useState(false);
    const [opReturnEnabled, setOpReturnEnabled] = useState(false);
    const [batchOutputs, setBatchOutputs] = useState<BatchOutput[]>([{ recipient: '', amount: '' }]);
    const [opReturnData, setOpReturnData] = useState('');
    const [feeLevel, setFeeLevel] = useState(5);
    const [coinControlEnabled, setCoinControlEnabled] = useState(false);

    const inputsData = useMemo(() => [
        {
            txid: 'a47f60ff416f17cc9b0543f8afe05ae8bad98c9c2c69c207ecc0d50799dc52f0',
            vout: 0,
            value: '38544',
            height: 873975,
            confirmations: 96,
            address: 'bc1q8w2ypqgx39gucxcypqv2m90wz9rvhmmrcnpdjs',
            path: "m/84'/0'/0'/0/0",
            locked: false
        },
        {
            txid: 'a47f60ff416f17cc9b0543f8afe05ae8bad98c9c2c69c207ecc0d50799dc52f0',
            vout: 2,
            value: '20411',
            height: 873975,
            confirmations: 96,
            address: '3M9rBdu7rkVGwmt9gALjuRopAqpVEBdNRR',
            path: "m/49'/0'/0'/0/0",
            locked: false
        }
    ], []);

    const validateAddress = (address: string) => address && address.length > 10;

    const handleSelectionChange = useCallback((totalSelectedValue: number) => {
        if (!batchEnabled) {
            const btcValue = totalSelectedValue / 1e8; // Convert sats to BTC
            setInputAmount(btcValue.toFixed(8));
            setIsMax(false);
        }
    }, [batchEnabled]);

    const handleSendMax = useCallback(() => {
        try {
            const balance = app.assetContext?.balances[0].balance ?? '0';
            setInputAmount(balance);
            setIsMax(true);
        } catch (error) {
            toaster.create({
                title: 'Error',
                description: 'Unable to load the maximum balance.',
                duration: 5000,
            });
        }
    }, [app]);

    const buildTx = useCallback(async () => {
        setIsSubmitting(true);
        setUnsignedTx(null);
        setSignedTx(null);
        setBroadcastResult(null);
        setTxHash('');

        let outputs: { address?: string; amount?: string; opReturn?: string }[] = [];

        if (!batchEnabled) {
            // Single
            if (!recipient || !validateAddress(recipient)) {
                toaster.create({
                    title: 'Error',
                    description: 'A valid recipient address is required.',
                    duration: 5000,
                });
                setIsSubmitting(false);
                return;
            }
            if (!inputAmount && !isMax) {
                toaster.create({
                    title: 'Error',
                    description: 'Please enter an amount.',
                    duration: 5000,
                });
                setIsSubmitting(false);
                return;
            }

            outputs.push({ address: recipient, amount: inputAmount });
        } else {
            // Batch
            const cleaned = batchOutputs.filter(o => o.recipient && validateAddress(o.recipient) && o.amount);
            if (cleaned.length === 0) {
                toaster.create({
                    title: 'Error',
                    description: 'At least one valid batch output is required.',
                    duration: 5000,
                });
                setIsSubmitting(false);
                return;
            }
            outputs = cleaned.map(o => ({ address: o.recipient, amount: o.amount }));
        }

        if (opReturnEnabled && opReturnData.trim() !== '') {
            outputs.push({ opReturn: opReturnData.trim() });
        }

        const sendPayload = {
            caip: caip,
            outputs,
            feeLevel,
            isMax,
        };

        // Simulate building tx
        await new Promise(res => setTimeout(res, 1000));

        try {
            let unsignedTxResult = await app.buildTx(sendPayload);
            let transactionState: any = {
                method: 'transfer',
                caip,
                params: sendPayload,
                unsignedTx: unsignedTxResult,
                signedTx: null,
                state: 'unsigned',
                context: app.assetContext,
            };
            setUnsignedTx(transactionState);
        } catch (error) {
            toaster.create({
                title: 'Transaction Failed',
                description: 'An error occurred during the transaction.',
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [app, recipient, inputAmount, isMax, batchEnabled, batchOutputs, opReturnEnabled, opReturnData, feeLevel, caip]);

    const signTx = useCallback(async () => {
        if (!unsignedTx) return;
        try {
            let signedTxResult = await app.signTx({ caip, unsignedTx: unsignedTx.unsignedTx });
            setSignedTx(signedTxResult);
        } catch (error) {
            toaster.create({
                title: 'Signing Failed',
                description: 'An error occurred during signing.',
                duration: 5000,
            });
        }
    }, [app, caip, unsignedTx]);

    const broadcastTx = useCallback(async () => {
        if (!signedTx) return;
        try {
            let broadcast = await app.broadcastTx(caip, signedTx);
            const finalTxHash = broadcast.txHash || broadcast.txid;
            setTxHash(finalTxHash);
            setBroadcastResult(broadcast);
        } catch (error) {
            toaster.create({
                title: 'Broadcast Failed',
                description: 'An error occurred during the broadcast.',
                duration: 5000,
            });
        }
    }, [app, caip, signedTx]);

    const canShowAmount = useMemo(() => {
        if (batchEnabled) {
            // At least one batch output with a valid address
            return batchOutputs.some(o => o.recipient && validateAddress(o.recipient));
        } else {
            // Single recipient mode
            return recipient && validateAddress(recipient);
        }
    }, [batchEnabled, batchOutputs, recipient]);

    const value: TransferContextValue = {
        app, caip, explorerTxLink,
        isSubmitting, setIsSubmitting,
        inputAmount, setInputAmount,
        recipient, setRecipient,
        recipientError, setRecipientError,
        isMax, setIsMax,
        unsignedTx, setUnsignedTx,
        signedTx, setSignedTx,
        broadcastResult, setBroadcastResult,
        txHash, setTxHash,
        showSats, setShowSats,
        batchEnabled, setBatchEnabled,
        opReturnEnabled, setOpReturnEnabled,
        batchOutputs, setBatchOutputs,
        opReturnData, setOpReturnData,
        feeLevel, setFeeLevel,
        coinControlEnabled, setCoinControlEnabled,
        inputsData,
        handleSelectionChange,
        validateAddress,
        handleSendMax,
        buildTx,
        signTx,
        broadcastTx,
        canShowAmount,
    };

    return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>;
}

// ---------------------------
// CoinControl Component
// ---------------------------
interface InputData {
    txid: string;
    vout: number;
    value: string;
    height: number;
    confirmations: number;
    address: string;
    path: string;
    locked?: boolean;
}

interface CoinControlProps {
    inputsData: InputData[];
    showSats: boolean;
    onToggleUnit: (showSats: boolean) => void;
    onSelectionChange: (totalSelectedValue: number) => void;
}

function CoinControl({
                         inputsData,
                         showSats,
                         onToggleUnit,
                         onSelectionChange
                     }: CoinControlProps) {
    const [selection, setSelection] = useState<string[]>([]);
    const hasSelection = selection.length > 0;
    const indeterminate = hasSelection && selection.length < inputsData.length;

    const handleSelectAll = () => {
        const allUnlocked = inputsData.filter((i) => !i.locked).map((i) => `${i.txid}:${i.vout}`);
        setSelection(allUnlocked);
    };

    const handleClearSelection = () => {
        setSelection([]);
    };

    const toggleRowSelection = (key: string) => {
        setSelection((prev) =>
          prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
        );
    };

    const totalSelectedValue = useMemo(() => {
        let total = 0;
        for (let input of inputsData) {
            const key = `${input.txid}:${input.vout}`;
            if (selection.includes(key)) {
                total += parseInt(input.value, 10);
            }
        }
        return total;
    }, [selection, inputsData]);

    React.useEffect(() => {
        onSelectionChange(totalSelectedValue);
    }, [totalSelectedValue, onSelectionChange]);

    const displayAmount = (value: string) => {
        const valNumber = parseInt(value, 10);
        return showSats ? `${valNumber} sats` : `${(valNumber / 1e8).toFixed(8)} BTC`;
    };

    return (
      <>
          <Flex w="full" maxW="4xl" justifyContent="space-between" alignItems="center" mb={3} mt={6}>
              <Text color="white" fontWeight="semibold">Available Inputs</Text>
              <Flex gap="2" align="center">
                  <Text color="white" fontSize="sm">Show in BTC</Text>
                  <Box
                    as="button"
                    onClick={() => onToggleUnit(!showSats)}
                    px="2"
                    py="1"
                    bg={showSats ? "gray.700" : "teal.600"}
                    borderRadius="md"
                    color="white"
                    fontSize="sm"
                    _hover={{ bg: showSats ? "gray.600" : "teal.500" }}
                  >
                      {showSats ? "Sats" : "BTC"}
                  </Box>
                  <ChakraButton size="sm" colorScheme="teal" onClick={handleSelectAll}>Select All</ChakraButton>
                  <ChakraButton size="sm" variant="outline" colorScheme="gray" onClick={handleClearSelection}>Clear</ChakraButton>
              </Flex>
          </Flex>

          <Table.Root size="sm" interactive>
              <Table.Header>
                  <Table.Row>
                      <Table.ColumnHeader w="6">
                          <Box
                            as="button"
                            w="full"
                            h="full"
                            textAlign="left"
                            onClick={() => {
                                if (selection.length > 0 && !indeterminate) {
                                    handleClearSelection();
                                } else {
                                    handleSelectAll();
                                }
                            }}
                            bg={selection.length > 0 && !indeterminate ? "teal.800" : "transparent"}
                            _hover={{ bg: "teal.900" }}
                            px="2"
                            py="1"
                            borderRadius="md"
                            color="white"
                            fontSize="sm"
                          >
                              All
                          </Box>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>Address</Table.ColumnHeader>
                      <Table.ColumnHeader>Value</Table.ColumnHeader>
                      <Table.ColumnHeader>Confirmations</Table.ColumnHeader>
                      <Table.ColumnHeader>Lock</Table.ColumnHeader>
                  </Table.Row>
              </Table.Header>
              <Table.Body>
                  {inputsData.map((input) => {
                      const key = `${input.txid}:${input.vout}`;
                      const isSelected = selection.includes(key);
                      return (
                        <Table.Row
                          key={key}
                          cursor="pointer"
                          onClick={() => toggleRowSelection(key)}
                          bg={isSelected ? "teal.800" : "transparent"}
                          _hover={{ bg: isSelected ? "teal.700" : "gray.700" }}
                          tabIndex={0}
                          _focusVisible={{ outline: "2px solid teal", outlineOffset: "2px" }}
                        >
                            <Table.Cell>
                                <Box
                                  as="span"
                                  display="inline-block"
                                  w="3"
                                  h="3"
                                  borderRadius="full"
                                  bg={isSelected ? "teal.400" : "gray.600"}
                                />
                            </Table.Cell>
                            <Table.Cell>{input.address}</Table.Cell>
                            <Table.Cell>{displayAmount(input.value)}</Table.Cell>
                            <Table.Cell>{input.confirmations}</Table.Cell>
                            <Table.Cell>
                                <ChakraButton variant={input.locked ? "solid" : "outline"} size="sm" disabled={input.locked}>
                                    <FaLock />
                                </ChakraButton>
                            </Table.Cell>
                        </Table.Row>
                      );
                  })}
              </Table.Body>
          </Table.Root>

          {hasSelection && (
            <Text color="gray.300" fontSize="sm" mt={3}>
                Selected Total: {showSats ? `${totalSelectedValue} sats` : `${(totalSelectedValue / 1e8).toFixed(8)} BTC`}
            </Text>
          )}

          <ActionBarRoot open={hasSelection}>
              <ActionBarContent>
                  <ActionBarSelectionTrigger>
                      {selection.length} selected
                  </ActionBarSelectionTrigger>
                  <ActionBarSeparator />
                  <ChakraButton variant="outline" size="sm">
                      Lock
                  </ChakraButton>
                  <ChakraButton variant="outline" size="sm">
                      Freeze
                  </ChakraButton>
              </ActionBarContent>
          </ActionBarRoot>
      </>
    );
}

// ---------------------------
// Step Components
// ---------------------------
function StepSelectInputs() {
    const {
        app,
        coinControlEnabled, setCoinControlEnabled,
        inputsData, showSats, setShowSats,
        handleSelectionChange
    } = useTransferContext();

    return (
      <VStack align="start" spacing={4} mt={4}>
          <Text color="gray.400" fontSize="sm">
              Asset ID: {app.assetContext?.assetId}
          </Text>

          <Flex align="center" gap={2}>
              <Switch isChecked={coinControlEnabled} onChange={(e) => setCoinControlEnabled(e.target.checked)}>
                  Coin Control
              </Switch>
          </Flex>
          {coinControlEnabled && (
            <CoinControl
              inputsData={inputsData}
              showSats={showSats}
              onToggleUnit={setShowSats}
              onSelectionChange={handleSelectionChange}
            />
          )}
          <Flex gap={4} mt={4}>
              <StepsPrevTrigger asChild>
                  <Button variant="outline" size="sm">Prev</Button>
              </StepsPrevTrigger>
              <StepsNextTrigger asChild>
                  <Button variant="outline" size="sm">Next</Button>
              </StepsNextTrigger>
          </Flex>
      </VStack>
    );
}

function StepSelectOutputs() {
    const {
        app,
        batchEnabled, setBatchEnabled,
        opReturnEnabled, setOpReturnEnabled,
        batchOutputs, setBatchOutputs,
        recipient, setRecipient,
        recipientError,
        opReturnData, setOpReturnData,
        canShowAmount,
        inputAmount, setInputAmount,
        handleSendMax,
        validateAddress
    } = useTransferContext();

    const addBatchOutput = () => {
        setBatchOutputs(prev => [...prev, { recipient: '', amount: '' }]);
    };

    const handleBatchRecipientChange = (index: number, value: string) => {
        setBatchOutputs(prev => {
            const newOutputs = [...prev];
            newOutputs[index].recipient = value;
            return newOutputs;
        });
    };

    const handleBatchAmountChange = (index: number, value: string) => {
        setBatchOutputs(prev => {
            const newOutputs = [...prev];
            newOutputs[index].amount = value;
            return newOutputs;
        });
    };

    const renderBatchOutputs = () => (
      <VStack w="full" maxW="md" spacing={4} mt={4}>
          {batchOutputs.map((output, index) => (
            <Flex key={index} w="full" gap={2}>
                <Input
                  placeholder="Recipient Address"
                  value={output.recipient}
                  onChange={(e) => handleBatchRecipientChange(index, e.target.value)}
                  size="sm"
                  bg="gray.800"
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                />
                <Input
                  placeholder="Amount"
                  value={output.amount}
                  onChange={(e) => handleBatchAmountChange(index, e.target.value)}
                  type="number"
                  size="sm"
                  bg="gray.800"
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                />
            </Flex>
          ))}
          <Button variant="outline" size="sm" onClick={addBatchOutput}>
              Add another output
          </Button>
      </VStack>
    );

    return (
      <VStack spacing={4} align="start">
          <Flex gap={8} align="center" justify="center" mt={4}>
              <Flex align="center" gap={2}>
                  <Switch isChecked={batchEnabled} onChange={(e) => setBatchEnabled(e.target.checked)}>
                      Batch Output
                  </Switch>
              </Flex>
              <Flex align="center" gap={2}>
                  <Switch isChecked={opReturnEnabled} onChange={(e) => setOpReturnEnabled(e.target.checked)}>
                      OP_RETURN
                  </Switch>
              </Flex>
          </Flex>

          {batchEnabled ? (
            renderBatchOutputs()
          ) : (
            <Box w="full" maxW="md" mt={4}>
                <Input
                  placeholder="Recipient Address"
                  value={recipient}
                  onChange={(e) => {
                      setRecipient(e.target.value);
                  }}
                  size="md"
                  bg="gray.800"
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                />
                {recipientError && (
                  <Text color="red.400" fontSize="xs" mt={1}>
                      {recipientError}
                  </Text>
                )}
            </Box>
          )}

          {opReturnEnabled && (
            <Box w="full" maxW="md">
                <Input
                  placeholder="OP_RETURN Data (hex)"
                  value={opReturnData}
                  onChange={(e) => setOpReturnData(e.target.value)}
                  size="md"
                  bg="gray.800"
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                  mt={4}
                />
            </Box>
          )}

          {canShowAmount && !batchEnabled && (
            <Box w="full" maxW="md" mt={4}>
                <Input
                  placeholder="Amount"
                  value={inputAmount}
                  onChange={(e) => {
                      setInputAmount(e.target.value);
                  }}
                  type="number"
                  size="md"
                  bg="gray.800"
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                />
                <Flex justifyContent="space-between" mt={1} align="center">
                    <Text fontSize="sm" color="gray.400">
                        Available Balance: {app.assetContext?.balances[0].balance ?? '0'} {app.assetContext?.symbol}
                    </Text>
                    <Button
                      colorScheme="teal"
                      size="sm"
                      variant="solid"
                      onClick={handleSendMax}
                    >
                        Send Max
                    </Button>
                </Flex>
            </Box>
          )}

          <Flex gap={4} mt={4}>
              <StepsPrevTrigger asChild>
                  <Button variant="outline" size="sm">Prev</Button>
              </StepsPrevTrigger>
              <StepsNextTrigger asChild>
                  <Button variant="outline" size="sm">Next</Button>
              </StepsNextTrigger>
          </Flex>
      </VStack>
    );
}

function StepSelectFees() {
    const {
        feeLevel, setFeeLevel,
        buildTx
    } = useTransferContext();

    return (
      <VStack spacing={4}>
          <Text color="gray.300">Select Fee Level</Text>
          <Flex gap={2}>
              <Button variant={feeLevel===1?"solid":"outline"} colorScheme="green" size="sm" onClick={()=>setFeeLevel(1)}>Slow</Button>
              <Button variant={feeLevel===3?"solid":"outline"} colorScheme="green" size="sm" onClick={()=>setFeeLevel(3)}>Medium</Button>
              <Button variant={feeLevel===5?"solid":"outline"} colorScheme="green" size="sm" onClick={()=>setFeeLevel(5)}>Fast</Button>
          </Flex>

          <Button colorScheme="green" onClick={buildTx} size="md" variant="solid">
              Build Transaction
          </Button>

          <Flex gap={4} mt={4}>
              <StepsPrevTrigger asChild>
                  <Button variant="outline" size="sm">Prev</Button>
              </StepsPrevTrigger>
              <StepsNextTrigger asChild>
                  <Button variant="outline" size="sm">Next</Button>
              </StepsNextTrigger>
          </Flex>
      </VStack>
    );
}

function StepConfirmTx() {
    const {
        unsignedTx,
        signedTx,
        signTx
    } = useTransferContext();

    return (
      <>
          {unsignedTx && !signedTx && (
            <VStack
              maxW="full"
              w="full"
              whiteSpace="normal"
              overflowWrap="break-word"
              wordBreak="break-all"
              spacing={4}
              align="stretch"
            >
                <TxReview unsignedTx={unsignedTx.unsignedTx} isBuilding={false} />
                <Text color="gray.300">Review the transaction details above.</Text>
            </VStack>
          )}
          <Flex gap={4} mt={4}>
              <StepsPrevTrigger asChild>
                  <Button variant="outline" size="sm">Prev</Button>
              </StepsPrevTrigger>
              <StepsNextTrigger asChild>
                  <Button variant="outline" size="sm" onClick={signTx}>
                      Sign Transaction
                  </Button>
              </StepsNextTrigger>
          </Flex>
      </>
    );
}

function StepSignTx() {
    const {
        signedTx,
        broadcastTx
    } = useTransferContext();

    return (
      <>
          {!signedTx && (
            <VStack spacing={4}>
                <Image
                  src="https://via.placeholder.com/150"
                  alt="Confirm on Device"
                  borderRadius="md"
                />
                <Text color="gray.300">Confirm transaction on your device...</Text>
            </VStack>
          )}
          <Flex gap={4} mt={4}>
              <StepsPrevTrigger asChild>
                  <Button variant="outline" size="sm">Prev</Button>
              </StepsPrevTrigger>
              <StepsNextTrigger asChild>
                  <Button variant="outline" size="sm" onClick={broadcastTx} isDisabled={!signedTx}>
                      Next
                  </Button>
              </StepsNextTrigger>
          </Flex>
      </>
    );
}

function StepBroadcastTx() {
    const {
        signedTx,
        broadcastResult,
        txHash,
        explorerTxLink
    } = useTransferContext();

    return (
      <>
          {signedTx && !broadcastResult && (
            <VStack spacing={4}>
                <Button colorScheme="green">Broadcast Transaction</Button>
            </VStack>
          )}

          {broadcastResult && (
            <VStack spacing={4}>
                <Text color="gray.300">Transaction broadcasted successfully!</Text>
                {txHash && (
                  <Box mt={4}>
                      <Text fontSize="md" color="gray.300">
                          Transaction ID:
                      </Text>
                      <Link
                        href={`${explorerTxLink}${txHash}`}
                        color="teal.500"
                        isExternal
                      >
                          {txHash}
                      </Link>
                  </Box>
                )}
            </VStack>
          )}

          <Flex gap={4} mt={4}>
              <StepsPrevTrigger asChild>
                  <Button variant="outline" size="sm">Prev</Button>
              </StepsPrevTrigger>
          </Flex>
      </>
    );
}

// ---------------------------
// Steps Component
// ---------------------------
function Steps() {
    const { app } = useTransferContext();

    return (
      <StepsRoot
        orientation="horizontal"
        defaultValue={0}
        count={6}
        colorPalette="green"
        variant="solid"
        mt={4}
      >
          <StepsList mb={4}>
              <StepsItem index={0} title="Inputs" icon={<FaCheck />} />
              <StepsItem index={1} title="Outputs" icon={<FaCheck />} />
              <StepsItem index={2} title="Fees" icon={<FaCheck />} />
              <StepsItem index={3} title="Review" icon={<FaCheck />} />
              <StepsItem index={4} title="Sign" icon={<FaCheck />} />
              <StepsItem index={5} title="Broadcast" icon={<FaCheck />} />
          </StepsList>

          <StepsContent index={0}><StepSelectInputs/></StepsContent>
          <StepsContent index={1}><StepSelectOutputs/></StepsContent>
          <StepsContent index={2}><StepSelectFees/></StepsContent>
          <StepsContent index={3}><StepConfirmTx/></StepsContent>
          <StepsContent index={4}><StepSignTx/></StepsContent>
          <StepsContent index={5}><StepBroadcastTx/></StepsContent>

          <StepsCompletedContent>
              <Text textAlign="center" color="gray.300">
                  All steps are complete!
              </Text>
          </StepsCompletedContent>
      </StepsRoot>
    );
}

// ---------------------------
// Transfer Component
// ---------------------------
export function Transfer({ usePioneer }: any): JSX.Element {
    const { state } = usePioneer();
    const { app } = state;

    return (
      <TransferProvider app={app}>
          <VStack>
              <Steps />
          </VStack>
      </TransferProvider>
    );
}

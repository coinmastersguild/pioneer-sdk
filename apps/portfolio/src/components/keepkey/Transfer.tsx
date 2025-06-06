"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo
} from "react";
import {
    Text,
    VStack,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { FaCheck,
    FaExternalLinkAlt,
    FaSignInAlt,
    FaDollarSign,
    FaEye,
    FaSignature,
    FaBroadcastTower  } from "react-icons/fa";
import {
    StepsRoot,
    StepsList,
    StepsItem,
    StepsContent,
    StepsCompletedContent,
} from "@/components/ui/steps";

// Importing steps from the newly created /steps directory
import { StepSelectInputs } from "./steps/StepSelectInputs";
import { StepSelectOutputs } from "./steps/StepSelectOutputs";
import { StepSelectFees } from "./steps/StepSelectFees";
import { StepConfirmTx } from "./steps/StepConfirmTx";
import { StepSignTx } from "./steps/StepSignTx";
import { StepBroadcastTx } from "./steps/StepBroadcastTx";
const TAG = " | Transfer | "
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
    setBatchOutputs: (v: any) => void;

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

export function useTransferContext() {
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
        let tag = TAG + " | buildTx | "
        try{
            //console.log(tag,"buildTx clicked!!!! ")
            //
            setIsSubmitting(true);
            setUnsignedTx(null);
            setSignedTx(null);
            setBroadcastResult(null);
            setTxHash('');

            let outputs: { address?: string; amount?: string; opReturn?: string }[] = [];

            if (!batchEnabled) {
                //console.log(tag," Not a Batch TX")
                // Single
                // if (!recipient || !validateAddress(recipient)) {
                //     toaster.create({
                //         title: 'Error',
                //         description: 'A valid recipient address is required.',
                //         duration: 5000,
                //     });
                //     setIsSubmitting(false);
                //     return;
                // }
                // if (!inputAmount && !isMax) {
                //     toaster.create({
                //         title: 'Error',
                //         description: 'Please enter an amount.',
                //         duration: 5000,
                //     });
                //     setIsSubmitting(false);
                //     return;
                // }

                let params = { address: recipient, amount: inputAmount }
                //console.log(tag," params: ",params)

                outputs.push(params);
            } else {
                //console.log(tag," Batch TX! ")
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
                to:outputs[0].address,
                amount:outputs[0].amount,
                feeLevel:5, //TODO fee level
                isMax,
            };
            //console.log(tag,"sendPayload: ",sendPayload)
            // Simulate building tx
            // await new Promise(res => setTimeout(res, 1000));

            try {
                //console.log(tag,"sendPayload: ",sendPayload)

                /*
                            const sendPayload = {
                                caip,
                                isMax: true,
                                to: FAUCET_ADDRESS,
                                amount: balance,
                                feeLevel: 5 // Options
                            };

                 */

                let unsignedTxResult = await app.buildTx(sendPayload);
                //console.log(tag,"unsignedTxResult: ",unsignedTxResult)

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
        }catch(e){
            console.error(e)
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
        let tag = TAG + " | broadcastTx | "
        try{
            if (!signedTx) {
                console.error(tag,"No signedTx")
                toaster.create({
                    title: 'Broadcast Failed',
                    description: 'Unable to sign! tx not built!.',
                    duration: 5000,
                });
                throw Error('Unable to sign!')
            }
            try {
                let broadcast = await app.broadcastTx(caip, signedTx);
                //console.log(tag,"broadcast: ",broadcast)
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
        }catch(e){
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

    const value: any = {
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

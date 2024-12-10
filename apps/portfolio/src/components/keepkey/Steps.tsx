"use client";

import React from 'react';
import { VStack, Text, Image } from '@chakra-ui/react';
import {
  StepsCompletedContent,
  StepsContent,
  StepsItem,
  StepsList,
  StepsRoot,
} from '@/components/ui/steps';
import { TxReview } from '@/components/tx';
import { Button } from '@/components/ui/button';

interface StepsProps {
  showSteps: boolean;
  currentStep: number;
  unsignedTx: any;
  signedTx: any;
  onApproveTx: () => void;
  onBroadcastTx: () => void;
}

export function Steps({
                        showSteps,
                        currentStep,
                        unsignedTx,
                        signedTx,
                        onApproveTx,
                        onBroadcastTx,
                      }: StepsProps) {
  if (!showSteps) return null;

  return (
    // Add a color scheme or palette if supported by your StepsRoot
    // If StepsRoot supports colorScheme directly, use `colorScheme="green"`.
    // If it requires `colorPalette`, try `colorPalette="green"`.
    <StepsRoot count={3} mt={4} currentIndex={currentStep} colorScheme="green">
      <StepsList mb={4}>
        <StepsItem index={0} title="Review Unsigned Tx" />
        <StepsItem index={1} title="Confirm on Device" />
        <StepsItem index={2} title="Broadcast Transaction" />
      </StepsList>

      {/* Step 0: Review Unsigned Tx */}
      <StepsContent index={0}>
        {unsignedTx && !signedTx && (
          // Constrain width and ensure wrapping
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
            <Button colorScheme="green" onClick={onApproveTx}>
              Approve Transaction (Sign)
            </Button>
          </VStack>
        )}
      </StepsContent>

      {/* Step 1: Confirm on Device */}
      <StepsContent index={1}>
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
      </StepsContent>

      {/* Step 2: Broadcast Transaction */}
      <StepsContent index={2}>
        {signedTx && (
          <VStack spacing={4}>
            <Button colorScheme="green" onClick={onBroadcastTx}>
              Broadcast Transaction
            </Button>
          </VStack>
        )}
      </StepsContent>

      <StepsCompletedContent>
        <Text textAlign="center" color="gray.300">
          All steps are complete!
        </Text>
      </StepsCompletedContent>
    </StepsRoot>
  );
}

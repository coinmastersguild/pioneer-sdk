'use client';
/*
  Comlete swap step
 */
import { Card, CardBody, Text } from "@chakra-ui/react";
import React, { useEffect } from "react";
// import Track from "../components/Track";

const CompleteSwap = ({ usePioneer, txHash }: any) => {
  const { state } = usePioneer();
  const { app, assetContext } = state;

  const saveToPendingTransactions = () => {
    if (typeof window !== 'undefined') {
      const storedData = window.localStorage.getItem("pendingTransactions");
      let pendingTransactions: string[] = [];

      // Check if storedData is not null and is a valid JSON array
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (Array.isArray(parsedData)) {
            pendingTransactions = parsedData;
          }
        } catch (e) {
          console.error(
            "Error parsing pendingTransactions from localStorage:",
            e
          );
        }
      }

      // Check if the txHash is not already in the pendingTransactions array
      if (!pendingTransactions.includes(txHash)) {
        // Add the new txHash to the pendingTransactions array
        pendingTransactions.push(txHash);

        // Save the updated array back to local storage
        window.localStorage.setItem(
          "pendingTransactions",
          JSON.stringify(pendingTransactions)
        );
      }
    }
  };

  let openLink = (e: any) => {
    if (typeof window !== 'undefined') {
      window.open(
        `${app.swapKit.getExplorerTxUrl(assetContext.chain, txHash as string)}`,
        '_blank',
      );
    }
  }

  useEffect(() => {
    if (txHash) {
      saveToPendingTransactions();
    }
  }, [txHash]);

  return (
    <div>
      <Card.Root>
        <Text>Your input TXID: {txHash} </Text>
      </Card.Root>
      <br />
    </div>
  );
};

export default CompleteSwap;

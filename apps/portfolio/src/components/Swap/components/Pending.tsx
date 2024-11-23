import { Button, Link } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';

const Pending = ({ usePioneer, onClose, setTxHash }: any) => {
    const { createTx, readTx } = usePioneer();
    const [pendingTransactions, setPendingTransactions] = useState<string[]>([]);

    let getTxs = async function () {
        try {
            // Retrieve and parse data from local storage
            let storedData: any = window.localStorage.getItem('pendingTransactions');
            if (storedData && storedData.length > 0) {
                setPendingTransactions(JSON.parse(storedData));
                //get txs
                let txs: any = await readTx();
                //console.log('txs: ', txs);
                if (!txs || txs.length === 0) {
                    //create from local storage
                    storedData = JSON.parse(storedData);
                    //console.log('storedData: ', storedData);
                    let newTx = {
                        status: 'pending',
                        txid: storedData[0],
                    }
                    //console.log('newTx: ', newTx);
                    let txs = await createTx(newTx);
                    //console.log('txs: ', txs);
                }
            }
        } catch (e) {
            //console.log('error: ', e);
        }
    };

    useEffect(() => {
        getTxs();
    }, []);

    // const handleMark = (txId: string, status: 'success' | 'failed') => {
    //   // Remove the transaction from the list
    //   const updatedTransactions = pendingTransactions.filter((tx) => tx !== txId);
    //
    //   // Update state and local storage
    //   setPendingTransactions(updatedTransactions);
    //   window.localStorage.setItem('pendingTransactions', JSON.stringify(updatedTransactions));
    //
    //   // Optionally, handle additional logic based on the status
    //   //console.log(`Transaction ${txId} marked as ${status}`);
    //   onClose();
    // };

    return (
        <div>
            {pendingTransactions.map((txId, index) => (
                <div key={index}>

                    <Button onClick={() => getTxs()}>refresh</Button>
                    {/*<Button onClick={() => handleMark(txId, 'success')}>Mark Success</Button>*/}
                    {/*<Button onClick={() => handleMark(txId, 'failed')}>Mark Failed</Button>*/}
                </div>
            ))}
        </div>
    );
};

export default Pending;

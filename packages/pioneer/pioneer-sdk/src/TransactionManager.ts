/*
    Tx Manager
*/
import type EventEmitter from 'events';

import { CAIP_TO_COIN_MAP, SUPPORTED_CAIPS } from './supportedCaips';
import { createUnsignedEvmTx } from './txbuilder/createUnsignedEvmTx';
import { createUnsignedRippleTx } from './txbuilder/createUnsignedRippleTx';
import { createUnsignedTendermintTx } from './txbuilder/createUnsignedTendermintTx';
import { createUnsignedUxtoTx } from './txbuilder/createUnsignedUxtoTx';

const TAG = ' | Transaction | ';

interface TransactionDependencies {
  context: string;
  assetContext: any;
  balances: any[];
  pubkeys: any[];
  nodes: any[];
  pioneer: any;
  keepKeySdk: any;
}

export class TransactionManager {
  private context: string;
  private assetContext: any;
  private balances: any[];
  private pubkeys: any[];
  private nodes: any[];
  private pioneer: any;
  private keepKeySdk: any;
  private events: EventEmitter;

  constructor(dependencies: TransactionDependencies, events: EventEmitter) {
    this.context = dependencies.context;
    this.assetContext = dependencies.assetContext;
    this.balances = dependencies.balances;
    this.pubkeys = dependencies.pubkeys;
    this.nodes = dependencies.nodes;
    this.pioneer = dependencies.pioneer;
    this.keepKeySdk = dependencies.keepKeySdk;
    this.events = events;
  }

  async classifyCaip(caip: string): Promise<string> {
    if (SUPPORTED_CAIPS.UTXO.includes(caip)) return 'UTXO';
    if (SUPPORTED_CAIPS.TENDERMINT.includes(caip)) return 'TENDERMINT';
    if (caip.startsWith('eip155')) return 'EIP155';
    if (SUPPORTED_CAIPS.OTHER.includes(caip)) return 'OTHER';
    throw new Error(`Unsupported CAIP: ${caip}`);
  }

  async transfer({ caip, to, amount, memo }: any): Promise<any> {
    let tag = TAG + ' | transfer | ';
    try {
      if (!this.pioneer) throw Error('Failed to init! pioneer');
      if (!caip) throw Error('Missing required param! caip');
      if (!to) throw Error('Missing required param! to');
      if (!amount) throw Error('Missing required param! amount');
      if (!memo) memo = ' ';
      const type = await this.classifyCaip(caip);

      let unsignedTx;
      switch (type) {
        case 'UTXO': {
          console.log(tag, 'UTXO transaction');
          unsignedTx = await createUnsignedUxtoTx(
            caip,
            to,
            amount,
            memo,
            this.pubkeys,
            this.pioneer,
            this.keepKeySdk,
          );
          break;
        }
        case 'TENDERMINT': {
          console.log(tag, 'Tendermint transaction');
          const txType = 'transfer';
          unsignedTx = await createUnsignedTendermintTx(
            caip,
            txType,
            to,
            amount,
            memo,
            this.pubkeys,
            this.pioneer,
            this.keepKeySdk,
          );
          break;
        }
        case 'EIP155': {
          console.log(tag, 'EIP-155 transaction');
          unsignedTx = await createUnsignedEvmTx(
            caip,
            to,
            amount,
            memo,
            this.pubkeys,
            this.pioneer,
            this.keepKeySdk,
          );
          break;
        }
        case 'OTHER': {
          console.log(tag, 'Other transaction type');
          unsignedTx = await createUnsignedRippleTx(
            caip,
            to,
            amount,
            memo,
            this.pubkeys,
            this.pioneer,
            this.keepKeySdk,
          );
          break;
        }
        default: {
          throw new Error(`Unsupported CAIP: ${caip}`);
        }
      }

      return unsignedTx;
    } catch (e: any) {
      console.error(tag, e);
      throw e;
    }
  }

  async sign({ caip, unsignedTx }: any): Promise<any> {
    let tag = TAG + ' | sign | ';
    try {
      if (!this.pioneer) throw Error('Failed to init! pioneer');

      const type = await this.classifyCaip(caip);
      let signedTx: any;

      switch (type) {
        case 'UTXO': {
          const coin = CAIP_TO_COIN_MAP[caip];
          if (!coin) throw Error(`Unsupported UTXO coin type for CAIP: ${caip}`);

          const signPayload = {
            coin,
            inputs: unsignedTx.inputs,
            outputs: unsignedTx.outputs,
            version: 1,
            locktime: 0,
            opReturnData: unsignedTx.memo,
          };

          console.log('signPayload: ', JSON.stringify(signPayload));
          const responseSign = await this.keepKeySdk.utxo.utxoSignTransaction(signPayload);
          signedTx = responseSign.serializedTx;
          break;
        }
        case 'TENDERMINT': {
          switch (caip) {
            case 'cosmos:cosmoshub-4/slip44:118': {
              if (unsignedTx.signDoc.msgs[0].type === 'cosmos-sdk/MsgSend') {
                console.log(tag, 'transfer:');
                console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign = await this.keepKeySdk.cosmos.cosmosSignAmino(unsignedTx);
                console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else {
                throw new Error(
                  `Unsupported CosmosHub message type: ${unsignedTx.signDoc.msgs[0].type}`,
                );
              }
              break;
            }
            case 'cosmos:osmosis-1/slip44:118': {
              if (unsignedTx.signDoc.msgs[0].type === 'cosmos-sdk/MsgSend') {
                console.log(tag, 'transfer:');
                console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign = await this.keepKeySdk.osmosis.osmosisSignAmino(unsignedTx);
                console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else {
                throw new Error(
                  `Unsupported CosmosHub message type: ${unsignedTx.signDoc.msgs[0].type}`,
                );
              }
              break;
            }
            case 'cosmos:thorchain-mainnet-v1/slip44:931': {
              //transfer
              if (unsignedTx.signDoc.msgs[0].type === 'cosmos-sdk/MsgSend') {
                console.log(tag, 'transfer:');
                console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.thorchain.thorchainSignAminoTransfer(unsignedTx);
                console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else if (unsignedTx.signDoc.msgs[0].type === 'cosmos-sdk/MsgDeposit') {
                console.log(tag, 'transfer:');
                console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.thorchain.thorchainSignAminoDeposit(unsignedTx);
                console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else {
                throw new Error(
                  `Unsupported CosmosHub message type: ${unsignedTx.signDoc.msgs[0].type}`,
                );
              }
              //deposit
              break;
            }
            case 'cosmos:mayachain-mainnet-v1/slip44:931': {
              console.log(tag, ' mayachain tx detected! ');
              if (unsignedTx.signDoc.msgs[0].type === 'mayachain/MsgSend') {
                console.log(tag, 'transfer:');
                console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.mayachain.mayachainSignAminoTransfer(unsignedTx);
                console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else if (unsignedTx.signDoc.msgs[0].type === 'mayachain/MsgDeposit') {
                console.log(tag, 'transfer:');
                console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.mayachain.mayachainSignAminoDeposit(unsignedTx);
                console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else {
                throw new Error(
                  `Unsupported mayachain message type: ${unsignedTx.signDoc.msgs[0].type}`,
                );
              }
              break;
            }
            default: {
              throw new Error(`Unsupported Tendermint CAIP: ${caip}`);
            }
          }
          break;
        }
        case 'EIP155': {
          const responseSign = await this.keepKeySdk.eth.ethSignTransaction(unsignedTx);
          console.log(tag, 'responseSign: ', responseSign);
          if (!responseSign.serialized) throw new Error('Failed to sign transaction');
          signedTx = responseSign.serialized;
          break;
        }
        case 'OTHER': {
          console.log(tag, 'OTHER: ', caip);
          if (caip === 'ripple:4109c6f2045fc7eff4cde8f9905d19c2/slip44:144') {
            console.log(tag, 'unsignedTx: ', JSON.stringify(unsignedTx));
            let responseSign = await this.keepKeySdk.xrp.xrpSignTransaction(unsignedTx);
            console.log(tag, 'responseSign: ', responseSign);
            if (typeof responseSign === 'string') responseSign = JSON.parse(responseSign);
            signedTx = responseSign.serializedTx;
          } else {
            throw new Error(`Unsupported OTHER CAIP: ${caip}`);
          }
          break;
        }
        default: {
          throw new Error(`Unsupported CAIP: ${caip}`);
        }
      }
      if (!signedTx) throw Error('Failed to sign! missing signedTx');
      return signedTx;
    } catch (e: any) {
      console.error(tag, e);
      throw e;
    }
  }

  async broadcast({ networkId, serialized }: any): Promise<any> {
    let tag = TAG + ' | broadcast | ';
    try {
      if (!this.pioneer) throw Error('Failed to init! pioneer');
      if (!serialized) throw Error('Failed to broadcast! missing serialized2');
      let result = await this.pioneer.Broadcast({ networkId, serialized });
      result = result.data;
      console.log(tag, 'result:', result);
      return result.txid;
    } catch (e: any) {
      console.error(tag, e);
      throw e;
    }
  }
}

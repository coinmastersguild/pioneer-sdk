/*
    Tx Manager
 */
import type EventEmitter from 'events';

import { CAIP_TO_COIN_MAP, SUPPORTED_CAIPS } from './supportedCaips';
import { createUnsignedEvmTx } from './txbuilder/createUnsignedEvmTx';
import { createUnsignedTendermintTx } from './txbuilder/createUnsignedTendermintTx';
import { createUnsignedUxtoTx } from './txbuilder/createUnsignedUxtoTx';
import { createUnsignedRippleTx } from './txbuilder/createUnsignedRippleTx';

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
      //console.log(tag, 'caip: ', caip);
      //console.log(tag, 'to: ', to);
      //console.log(tag, 'amount: ', amount);

      const type = await this.classifyCaip(caip);

      let unsignedTx;
      switch (type) {
        case 'UTXO':
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
        case 'TENDERMINT':
          console.log(tag, 'Tendermint transaction');
          unsignedTx = await createUnsignedTendermintTx(
            caip,
            to,
            amount,
            memo,
            this.pubkeys,
            this.pioneer,
            this.keepKeySdk,
          );
          break;
        case 'EIP155':
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
        case 'OTHER':
          //xrp
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
        default:
          throw new Error(`Unsupported CAIP: ${caip}`);
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
          // Detect and handle specific Tendermint-based blockchains
          switch (caip) {
            case 'cosmos:cosmoshub-4/slip44:118': {
              // CosmosHub transaction
              if (unsignedTx.signDoc.msgs[0].type === 'cosmos-sdk/MsgSend') {
                console.log(tag, 'Detected CosmosHub Transfer');
                const responseSign = await this.keepKeySdk.cosmos.cosmosSignAmino(unsignedTx);
                signedTx = responseSign.serializedTx;
              } else if (unsignedTx.signDoc.msgs[0].type === 'cosmos-sdk/MsgIbcTransfer') {
                console.log(tag, 'Detected CosmosHub IBC Transfer');
                const responseSign =
                  await this.keepKeySdk.cosmos.cosmosSignAminoIbcTransfer(unsignedTx);
                signedTx = responseSign.serializedTx;
              } else if (unsignedTx.signDoc.msgs[0].type === 'cosmos-sdk/MsgDelegate') {
                console.log(tag, 'Detected CosmosHub Delegation');
                const responseSign =
                  await this.keepKeySdk.cosmos.cosmosSignAminoDelegate(unsignedTx);
                signedTx = responseSign.serializedTx;
              } else {
                throw new Error(
                  `Unsupported CosmosHub message type: ${unsignedTx.signDoc.msgs[0].type}`,
                );
              }
              break;
            }
            case 'cosmos:osmosis-1/slip44:118': {
              // Osmosis transaction
              if (unsignedTx.signDoc.msgs[0].type === 'osmosis/MsgSend') {
                console.log(tag, 'Detected Osmosis Transfer');
                const responseSign = await this.keepKeySdk.cosmos.cosmosSignAmino(unsignedTx);
                signedTx = responseSign.serializedTx;
              } else {
                throw new Error(
                  `Unsupported Osmosis message type: ${unsignedTx.signDoc.msgs[0].type}`,
                );
              }
              break;
            }
            case 'cosmos:mayachain-mainnet-v1/slip44:931': {
              // Mayachain transaction
              if (unsignedTx.signDoc.msgs[0].type === 'thorchain/MsgSend') {
                console.log(tag, 'Detected Mayachain Transfer');
                const responseSign = await this.keepKeySdk.utxo.utxoSignTransaction(unsignedTx);
                signedTx = responseSign.serializedTx;
              } else {
                throw new Error(
                  `Unsupported Mayachain message type: ${unsignedTx.signDoc.msgs[0].type}`,
                );
              }
              break;
            }
            case 'cosmos:thorchain-mainnet-v1/slip44:931': {
              // Thorchain transaction
              if (unsignedTx.signDoc.msgs[0].type === 'thorchain/MsgSend') {
                console.log(tag, 'Detected Thorchain Transfer');
                const responseSign =
                  await this.keepKeySdk.thorchain.thorchainSignAminoTransfer(unsignedTx);
                signedTx = responseSign.serializedTx;
              } else if (unsignedTx.signDoc.msgs[0].type === 'thorchain/MsgDeposit') {
                console.log(tag, 'Detected Thorchain Deposit');
                const responseSign =
                  await this.keepKeySdk.thorchain.thorchainSignAminoDeposit(unsignedTx);
                signedTx = responseSign.serializedTx;
              } else {
                throw new Error(
                  `Unsupported Thorchain message type: ${unsignedTx.signDoc.msgs[0].type}`,
                );
              }
              break;
            }
            default:
              throw new Error(`Unsupported Tendermint CAIP: ${caip}`);
          }
        }

        case 'EIP155': {
          console.log(tag, 'Signing EIP-155 transaction');
          const responseSign = await this.keepKeySdk.eth.ethSignTransaction(unsignedTx);
          console.log(tag, responseSign);
          signedTx = responseSign.serializedTx;
          break;
        }

        case 'OTHER': {
          console.log('KEEPKEY input: ', unsignedTx);
          if (caip === 'ripple:4109c6f2045fc7eff4cde8f9905d19c2/slip44:144') {
            let responseSign = await this.keepKeySdk.xrp.xrpSignTransaction(unsignedTx);
            console.log(tag, responseSign);
            signedTx = responseSign.serializedTx;
          }
        }

        default: {
          throw new Error(`Unsupported CAIP: ${caip}`);
        }
      }

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
      let result = await this.pioneer.Broadcast({ networkId, serialized });
      result = result.data;
      return result.txid;
    } catch (e: any) {
      console.error(tag, e);
      throw e;
    }
  }
}

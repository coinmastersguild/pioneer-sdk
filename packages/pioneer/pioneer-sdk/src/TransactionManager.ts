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

  async transfer({ caip, to, amount, memo, isMax = false }: any): Promise<any> {
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
          unsignedTx = await createUnsignedUxtoTx(
            caip,
            to,
            amount,
            memo,
            this.pubkeys,
            this.pioneer,
            this.keepKeySdk,
            isMax,
          );
          break;
        }
        case 'TENDERMINT': {
          const txType = 'transfer';
          unsignedTx = await createUnsignedTendermintTx(
            caip,
            txType,
            amount,
            memo,
            this.pubkeys,
            this.pioneer,
            this.keepKeySdk,
            isMax,
            to,
          );
          break;
        }
        case 'EIP155': {
          unsignedTx = await createUnsignedEvmTx(
            caip,
            to,
            amount,
            memo,
            this.pubkeys,
            this.pioneer,
            this.keepKeySdk,
            isMax,
          );
          break;
        }
        case 'OTHER': {
          unsignedTx = await createUnsignedRippleTx(
            caip,
            to,
            amount,
            memo,
            this.pubkeys,
            this.pioneer,
            this.keepKeySdk,
            isMax,
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

          const signPayload: any = {
            coin,
            inputs: unsignedTx.inputs,
            outputs: unsignedTx.outputs,
            version: 1,
            locktime: 0,
            // opReturnData: unsignedTx.memo,
          };
          if (unsignedTx.memo && unsignedTx.memo !== ' ') {
            signPayload.opReturnData = unsignedTx.memo;
          }

          const responseSign = await this.keepKeySdk.utxo.utxoSignTransaction(signPayload);
          signedTx = responseSign.serializedTx;
          break;
        }
        case 'TENDERMINT': {
          switch (caip) {
            case 'cosmos:cosmoshub-4/slip44:118': {
              const msgType = unsignedTx.signDoc.msgs[0].type;
              if (msgType === 'cosmos-sdk/MsgSend') {
                const responseSign = await this.keepKeySdk.cosmos.cosmosSignAmino(unsignedTx);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgDelegate') {
                const responseSign =
                  await this.keepKeySdk.cosmos.cosmosSignAminoDelegate(unsignedTx);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgUndelegate') {
                const responseSign =
                  await this.keepKeySdk.cosmos.cosmosSignAminoUndelegate(unsignedTx);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgBeginRedelegate') {
                const responseSign =
                  await this.keepKeySdk.cosmos.cosmosSignAminoRedelegate(unsignedTx);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgWithdrawDelegationReward') {
                const responseSign =
                  await this.keepKeySdk.cosmos.cosmosSignAminoWithdrawDelegatorRewardsAll(
                    unsignedTx,
                  );
                signedTx = responseSign.serialized;
              } else {
                throw new Error(`Unsupported CosmosHub message type: ${msgType}`);
              }
              break;
            }
            case 'cosmos:osmosis-1/slip44:118': {
              const msgType = unsignedTx.signDoc.msgs[0].type;
              if (msgType === 'cosmos-sdk/MsgSend') {
                const responseSign = await this.keepKeySdk.osmosis.osmosisSignAmino(unsignedTx);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgDelegate') {
                const responseSign =
                  await this.keepKeySdk.osmosis.osmoSignAminoDelegate(unsignedTx);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgUndelegate') {
                const responseSign =
                  await this.keepKeySdk.osmosis.osmoSignAminoUndelegate(unsignedTx);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgBeginRedelegate') {
                const responseSign =
                  await this.keepKeySdk.osmosis.osmoSignAminoRedelegate(unsignedTx);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgWithdrawDelegationReward') {
                const responseSign =
                  await this.keepKeySdk.osmosis.osmoSignAminoWithdrawDelegatorRewardsAll(
                    unsignedTx,
                  );
                signedTx = responseSign.serialized;
              } else {
                throw new Error(`Unsupported Osmosis message type: ${msgType}`);
              }
              break;
            }
            case 'cosmos:thorchain-mainnet-v1/slip44:931': {
              if (unsignedTx.signDoc.msgs[0].type === 'thorchain/MsgSend') {
                const responseSign =
                  await this.keepKeySdk.thorchain.thorchainSignAminoTransfer(unsignedTx);
                signedTx = responseSign.serialized;
              } else if (unsignedTx.signDoc.msgs[0].type === 'thorchain/MsgDeposit') {
                const responseSign =
                  await this.keepKeySdk.thorchain.thorchainSignAminoDeposit(unsignedTx);
                signedTx = responseSign.serialized;
              } else {
                throw new Error(
                  `Unsupported Thorchain message type: ${unsignedTx.signDoc.msgs[0].type}`,
                );
              }
              break;
            }
            case 'cosmos:mayachain-mainnet-v1/slip44:931':
            case 'cosmos:mayachain-mainnet-v1/denom:maya': {
              if (unsignedTx.signDoc.msgs[0].type === 'mayachain/MsgSend') {
                const responseSign =
                  await this.keepKeySdk.mayachain.mayachainSignAminoTransfer(unsignedTx);
                signedTx = responseSign.serialized;
              } else if (unsignedTx.signDoc.msgs[0].type === 'mayachain/MsgDeposit') {
                const responseSign =
                  await this.keepKeySdk.mayachain.mayachainSignAminoDeposit(unsignedTx);
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
          if (responseSign?.serialized) {
            const serialized = responseSign.serialized;
            if (serialized.length > 140) {
              signedTx = serialized;
            } else {
              console.error(
                tag,
                'EIP155 signing returned incomplete transaction - only signature components',
              );
              throw new Error(
                'KeepKey returned incomplete transaction - cannot reconstruct without r,s,v components',
              );
            }
          } else {
            console.error(
              tag,
              'EIP155 signing failed - no valid signature in response:',
              responseSign,
            );
            throw new Error('Failed to sign transaction - no valid signature in response');
          }
          break;
        }
        case 'OTHER': {
          if (caip === 'ripple:4109c6f2045fc7eff4cde8f9905d19c2/slip44:144') {
            let responseSign = await this.keepKeySdk.xrp.xrpSignTransaction(unsignedTx);
            if (typeof responseSign === 'string') responseSign = JSON.parse(responseSign);
            signedTx = responseSign.value.signatures[0].serializedTx;
          } else {
            throw new Error(`Unsupported OTHER CAIP: ${caip}`);
          }
          break;
        }
        default: {
          throw new Error(`Unsupported CAIP: ${caip}`);
        }
      }

      if (!signedTx) {
        console.error(tag, 'CRITICAL ERROR: signedTx is missing after signing process');
        console.error(tag, 'CAIP:', caip);
        console.error(tag, 'Type:', type);
        throw Error('Failed to sign! missing signedTx');
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
      if (!serialized) throw Error('Failed to broadcast! missing serialized2');
      let result = await this.pioneer.Broadcast({ networkId, serialized });
      result = result.data;
      if (result.error) {
        return result;
      } else {
        return result.txid;
      }
    } catch (e: any) {
      console.error(tag, e);
      throw e;
    }
  }
}

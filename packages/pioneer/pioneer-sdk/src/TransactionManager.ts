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
          //console.log(tag, 'UTXO transaction');
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
          //console.log(tag, 'Tendermint transaction');
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
          //console.log(tag, 'EIP-155 transaction');
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
          //console.log(tag, 'Other transaction type');
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

      console.log(tag, '🔍 Debug - Starting signing process for CAIP:', caip);
      console.log(tag, '🔍 Debug - UnsignedTx keys:', Object.keys(unsignedTx));

      const type = await this.classifyCaip(caip);
      console.log(tag, '🔍 Debug - Classified type:', type);
      let signedTx: any;

      switch (type) {
        case 'UTXO': {
          console.log(tag, '🔍 Debug - Processing UTXO transaction');
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

          console.log(tag, '🔍 Debug - UTXO signPayload coin:', coin);
          console.log(
            tag,
            '🔍 Debug - UTXO signPayload inputs length:',
            signPayload.inputs?.length,
          );
          console.log(
            tag,
            '🔍 Debug - UTXO signPayload outputs length:',
            signPayload.outputs?.length,
          );

          const responseSign = await this.keepKeySdk.utxo.utxoSignTransaction(signPayload);
          console.log(tag, '🔍 Debug - UTXO responseSign responseSign:', responseSign);
          console.log(
            tag,
            '🔍 Debug - UTXO responseSign full object:',
            JSON.stringify(responseSign, null, 2),
          );
          console.log(
            tag,
            '🔍 Debug - UTXO responseSign.serializedTx raw value:',
            responseSign?.serializedTx,
          );
          console.log(
            tag,
            '🔍 Debug - UTXO responseSign.serializedTx type:',
            typeof responseSign?.serializedTx,
          );

          signedTx = responseSign.serializedTx;
          console.log(tag, '🔍 Debug - UTXO signedTx assigned:', signedTx);
          break;
        }
        case 'TENDERMINT': {
          switch (caip) {
            case 'cosmos:cosmoshub-4/slip44:118': {
              const msgType = unsignedTx.signDoc.msgs[0].type;
              if (msgType === 'cosmos-sdk/MsgSend') {
                //console.log(tag, 'transfer:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign = await this.keepKeySdk.cosmos.cosmosSignAmino(unsignedTx);
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgDelegate') {
                //console.log(tag, 'delegate:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.cosmos.cosmosSignAminoDelegate(unsignedTx);
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgUndelegate') {
                //console.log(tag, 'undelegate:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.cosmos.cosmosSignAminoUndelegate(unsignedTx);
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgBeginRedelegate') {
                //console.log(tag, 'redelegate:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.cosmos.cosmosSignAminoRedelegate(unsignedTx);
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgWithdrawDelegationReward') {
                //console.log(tag, 'claim rewards:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.cosmos.cosmosSignAminoWithdrawDelegatorRewardsAll(
                    unsignedTx,
                  );
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else {
                throw new Error(`Unsupported CosmosHub message type: ${msgType}`);
              }
              break;
            }
            case 'cosmos:osmosis-1/slip44:118': {
              //console.log(tag, 'Osmosis transaction');
              const msgType = unsignedTx.signDoc.msgs[0].type;
              if (msgType === 'cosmos-sdk/MsgSend') {
                //console.log(tag, 'osmosis transfer:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign = await this.keepKeySdk.osmosis.osmosisSignAmino(unsignedTx);
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgDelegate') {
                //console.log(tag, 'osmosis delegate:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.osmosis.osmoSignAminoDelegate(unsignedTx);
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgUndelegate') {
                //console.log(tag, 'osmosis undelegate:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.osmosis.osmoSignAminoUndelegate(unsignedTx);
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgBeginRedelegate') {
                //console.log(tag, 'osmosis redelegate:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.osmosis.osmoSignAminoRedelegate(unsignedTx);
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else if (msgType === 'cosmos-sdk/MsgWithdrawDelegationReward') {
                //console.log(tag, 'osmosis claim rewards:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.osmosis.osmoSignAminoWithdrawDelegatorRewardsAll(
                    unsignedTx,
                  );
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else {
                throw new Error(`Unsupported Osmosis message type: ${msgType}`);
              }
              break;
            }
            case 'cosmos:thorchain-mainnet-v1/slip44:931': {
              //console.log(tag, 'Thorchain transaction');
              //transfer
              if (unsignedTx.signDoc.msgs[0].type === 'thorchain/MsgSend') {
                //console.log(tag, 'MsgSend:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.thorchain.thorchainSignAminoTransfer(unsignedTx);
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else if (unsignedTx.signDoc.msgs[0].type === 'thorchain/MsgDeposit') {
                //console.log(tag, 'MsgDeposit:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.thorchain.thorchainSignAminoDeposit(unsignedTx);
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else {
                throw new Error(
                  `Unsupported Thorchain message type: ${unsignedTx.signDoc.msgs[0].type}`,
                );
              }
              //deposit
              break;
            }
            case 'cosmos:mayachain-mainnet-v1/slip44:931': // CACAO (native)
            case 'cosmos:mayachain-mainnet-v1/denom:maya': {
              // MAYA token
              //console.log(tag, ' mayachain tx detected! ');
              if (unsignedTx.signDoc.msgs[0].type === 'mayachain/MsgSend') {
                //console.log(tag, 'transfer:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.mayachain.mayachainSignAminoTransfer(unsignedTx);
                //console.log(tag, 'responseSign:', responseSign);
                signedTx = responseSign.serialized;
              } else if (unsignedTx.signDoc.msgs[0].type === 'mayachain/MsgDeposit') {
                //console.log(tag, 'transfer:');
                //console.log(tag, 'unsignedTx:', JSON.stringify(unsignedTx));
                const responseSign =
                  await this.keepKeySdk.mayachain.mayachainSignAminoDeposit(unsignedTx);
                //console.log(tag, 'responseSign:', responseSign);
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
          console.log(tag, '🔍 Debug - Processing EIP155 transaction');
          console.log(tag, '🔍 Debug - EIP155 unsignedTx structure:', {
            chainId: unsignedTx.chainId,
            nonce: unsignedTx.nonce,
            gas: unsignedTx.gas,
            gasPrice: unsignedTx.gasPrice,
            to: unsignedTx.to,
            value: unsignedTx.value,
            data: unsignedTx.data,
          });

          const responseSign = await this.keepKeySdk.eth.ethSignTransaction(unsignedTx);
          console.log(tag, '🔍 Debug - EIP155 responseSign keys:', Object.keys(responseSign || {}));
          console.log(tag, '🔍 Debug - EIP155 responseSign structure:', responseSign);

          // Check if we have the signature components
          if (responseSign?.serialized) {
            // Fallback to using serialized if it exists and looks like a full transaction
            const serialized = responseSign.serialized;
            // Check if it's a full transaction (should start with 0x and be much longer than just signature)
            if (serialized.length > 140) {
              // A signature alone is ~130 chars, full tx is much longer
              console.log(tag, '🔍 Debug - Using responseSign.serialized as full transaction');
              signedTx = serialized;
            } else {
              // It's likely just the signature, need to reconstruct
              console.error(
                tag,
                '🚨 EIP155 signing returned incomplete transaction - only signature components',
              );
              throw new Error(
                'KeepKey returned incomplete transaction - cannot reconstruct without r,s,v components',
              );
            }
          } else {
            console.error(
              tag,
              '🚨 EIP155 signing failed - no valid signature in response:',
              responseSign,
            );
            throw new Error('Failed to sign transaction - no valid signature in response');
          }

          console.log(tag, '🔍 Debug - EIP155 signedTx assigned:', !!signedTx);
          console.log(tag, '🔍 Debug - EIP155 signedTx length:', signedTx?.length);
          break;
        }
        case 'OTHER': {
          //console.log(tag, 'OTHER: ', caip);
          if (caip === 'ripple:4109c6f2045fc7eff4cde8f9905d19c2/slip44:144') {
            //console.log(tag, 'unsignedTx: ', JSON.stringify(unsignedTx));
            let responseSign = await this.keepKeySdk.xrp.xrpSignTransaction(unsignedTx);
            //console.log(tag, 'responseSign: ', responseSign);
            if (typeof responseSign === 'string') responseSign = JSON.parse(responseSign);
            //console.log(tag, 'responseSign.value: ', responseSign.value);
            //console.log(tag, 'responseSign.value.signatures: ', responseSign.value.signatures);
            //console.log(tag, 'responseSign.value.signatures: ', responseSign.value.signatures[0]);
            /* Old debug code commented out
            //console.log(
              tag,
              'responseSign.value.signatures: ',
              responseSign.value.signatures[0].serializedTx,
            );
            */

            // Access serializedTx from signatures array
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

      console.log(tag, '🔍 Debug - Final signedTx check - exists:', !!signedTx);
      console.log(tag, '🔍 Debug - Final signedTx type:', typeof signedTx);
      console.log(
        tag,
        '🔍 Debug - Final signedTx length/keys:',
        signedTx?.length || Object.keys(signedTx || {}).length,
      );

      if (!signedTx) {
        console.error(tag, '🚨 CRITICAL ERROR: signedTx is missing after signing process');
        console.error(tag, '🚨 CAIP:', caip);
        console.error(tag, '🚨 Type:', type);
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
      console.log(tag, 'result:', result);
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

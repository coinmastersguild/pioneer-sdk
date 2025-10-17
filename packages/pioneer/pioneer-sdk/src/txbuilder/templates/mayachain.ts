export const mayachainTransferTemplate = (params: {
  account_number: string;
  chain_id: string;
  fee: { gas: string; amount: any[] };
  from_address: string;
  to_address: string;
  asset: string;
  amount: string;
  memo: string;
  sequence: string;
  addressNList?: number[]; // Optional: derivation path for signing
}) => ({
  signerAddress: params.from_address,
  addressNList: params.addressNList, // Include addressNList for correct signing path
  signDoc: {
    account_number: params.account_number,
    chain_id: params.chain_id,
    fee: params.fee,
    msgs: [
      {
        value: {
          amount: [{ denom: params.asset, amount: params.amount }],
          to_address: params.to_address,
          from_address: params.from_address,
        },
        type: 'mayachain/MsgSend' as const,
      },
    ],
    memo: params.memo,
    sequence: params.sequence,
  },
});

export const mayachainDepositTemplate = (params: {
  account_number: string;
  chain_id: string;
  fee: { gas: string; amount: any[] };
  from_address: string;
  asset: string;
  amount: string;
  memo: string;
  sequence: string;
}) => ({
  signerAddress: params.from_address,
  signDoc: {
    account_number: params.account_number,
    chain_id: params.chain_id,
    fee: params.fee,
    msgs: [
      {
        value: {
          coins: [{ asset: params.asset, amount: params.amount }],
          memo: params.memo,
          signer: params.from_address,
        },
        type: 'mayachain/MsgDeposit',
      },
    ],
    memo: params.memo,
    sequence: params.sequence,
  },
});

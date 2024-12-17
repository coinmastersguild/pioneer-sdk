export const thorchainTransferTemplate = (params: {
  account_number: string;
  chain_id: string;
  fee: { gas: string; amount: any[] };
  from_address: string;
  to_address: string;
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
          amount: [{ denom: params.asset, amount: params.amount }],
          to_address: params.to_address,
          from_address: params.from_address,
        },
        type: 'cosmos-sdk/MsgSend' as const,
      },
    ],
    memo: params.memo,
    sequence: params.sequence,
  },
});

export const thorchainDepositTemplate = (params: {
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
          coins: [{ asset: 'THOR.RUNE', amount: params.amount }],
          memo: params.memo,
          signer: params.from_address,
        },
        type: 'thorchain/MsgDeposit',
      },
    ],
    memo: params.memo,
    sequence: params.sequence,
  },
});

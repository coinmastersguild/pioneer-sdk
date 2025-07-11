export const cosmosDelegateTemplate = (params: {
  account_number: string;
  chain_id: string;
  fee: { gas: string; amount: any[] };
  from_address: string;
  validator_address: string;
  amount: string;
  denom: string;
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
          delegator_address: params.from_address,
          validator_address: params.validator_address,
          amount: {
            denom: params.denom,
            amount: params.amount,
          },
        },
        type: 'cosmos-sdk/MsgDelegate',
      },
    ],
    memo: params.memo,
    sequence: params.sequence,
  },
});

export const cosmosUndelegateTemplate = (params: {
  account_number: string;
  chain_id: string;
  fee: { gas: string; amount: any[] };
  from_address: string;
  validator_address: string;
  amount: string;
  denom: string;
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
          delegator_address: params.from_address,
          validator_address: params.validator_address,
          amount: {
            denom: params.denom,
            amount: params.amount,
          },
        },
        type: 'cosmos-sdk/MsgUndelegate',
      },
    ],
    memo: params.memo,
    sequence: params.sequence,
  },
});

export const cosmosRedelegateTemplate = (params: {
  account_number: string;
  chain_id: string;
  fee: { gas: string; amount: any[] };
  from_address: string;
  validator_src_address: string;
  validator_dst_address: string;
  amount: string;
  denom: string;
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
          delegator_address: params.from_address,
          validator_src_address: params.validator_src_address,
          validator_dst_address: params.validator_dst_address,
          amount: {
            denom: params.denom,
            amount: params.amount,
          },
        },
        type: 'cosmos-sdk/MsgBeginRedelegate',
      },
    ],
    memo: params.memo,
    sequence: params.sequence,
  },
});

export const cosmosClaimRewardsTemplate = (params: {
  account_number: string;
  chain_id: string;
  fee: { gas: string; amount: any[] };
  from_address: string;
  validator_address: string;
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
          delegator_address: params.from_address,
          validator_address: params.validator_address,
        },
        type: 'cosmos-sdk/MsgWithdrawDelegatorReward',
      },
    ],
    memo: params.memo,
    sequence: params.sequence,
  },
});

export const cosmosClaimAllRewardsTemplate = (params: {
  account_number: string;
  chain_id: string;
  fee: { gas: string; amount: any[] };
  from_address: string;
  validator_addresses: string[];
  memo: string;
  sequence: string;
}) => ({
  signerAddress: params.from_address,
  signDoc: {
    account_number: params.account_number,
    chain_id: params.chain_id,
    fee: params.fee,
    msgs: params.validator_addresses.map((validator_address) => ({
      value: {
        delegator_address: params.from_address,
        validator_address,
      },
      type: 'cosmos-sdk/MsgWithdrawDelegatorReward',
    })),
    memo: params.memo,
    sequence: params.sequence,
  },
}); 
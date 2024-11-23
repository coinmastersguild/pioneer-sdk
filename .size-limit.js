const sizeMap = {
  xxs: '10 KB',
  xs: '50 KB',
  s: '100 KB',
  m: '250 KB',
  l: '1 MB',
  xl: '2 MB',
  xxl: '5 MB',
};

const getSizeFor = (packagePath, sizeType, isApp = false, packageNameOverride = null) => {
  const size = sizeMap[sizeType];
  if (!size) throw new Error(`Unknown size type ${sizeType}`);

  const basePath = isApp ? './apps/' : './packages/';
  const packageName = packageNameOverride || packagePath.split('/').pop();

  const packagePrefix = packagePath.includes('toolboxes') ? 'toolbox-' : packagePath.includes('wallets') ? 'wallet-' : '';

  return [
    {
      limit: size,
      path: `${basePath}${packagePath}/dist/*.cjs`,
      name: `@${packagePrefix}${packageName} - CommonJS`,
    },
    {
      limit: size,
      path: `${basePath}${packagePath}/dist/*.js`,
      name: `@${packagePrefix}${packageName} - ES Modules`,
    },
  ];
};

module.exports = [
  // Pioneer
  ...getSizeFor('pioneer', 'xxl', true, 'pioneer-sdk/pioneer-react'),
  ...getSizeFor('pioneer/pioneer-sdk', 'xxl'),

  // Other packages
  ...getSizeFor('coinmasters/api', 'xxs'),
  ...getSizeFor('coinmasters/core', 'xs'),
  ...getSizeFor('coinmasters/helpers', 'xs'),
  ...getSizeFor('coinmasters/sdk', 'xxl'),
  ...getSizeFor('coinmasters/tokens', 'xl'),
  ...getSizeFor('coinmasters/types', 'xxs'),

  ...getSizeFor('toolboxes/cosmos', 'l'),
  ...getSizeFor('toolboxes/evm', 'l'),
  ...getSizeFor('toolboxes/utxo', 'l'),

  ...getSizeFor('wallets/evm-extensions', 'xxs'),
  ...getSizeFor('wallets/keepkey', 'm'),
  ...getSizeFor('wallets/keplr', 'xxs'),
  ...getSizeFor('wallets/keystore', 'm'),
  ...getSizeFor('wallets/ledger', 'xl'),
  ...getSizeFor('wallets/okx', 'xxs'),
  ...getSizeFor('wallets/trezor', 's'),
  ...getSizeFor('wallets/wc', 'l'),
  ...getSizeFor('wallets/xdefi', 'xxs'),
];

# Pioneer SDK
(pioneer sdk is a fork of swapkit) more info on [swapkit](https://docs.thorswap.finance/swapkit-docs).


    Pioneer SDK

        A ultra-powerfull SDK to the pioneer platform

              ,    .  ,   .           .
          *  / \_ *  / \_      .-.  *       *   /\'__        *
            /    \  /    \,   ( ₿ )     .    _/  /  \  *'.
       .   /\/\  /\/ :' __ \_   -           _^/  ^/    `--.
          /    \/  \  _/  \-'\      *    /.' ^_   \_   .'\  *
        /\  .-   `. \/     \ /==~=-=~=-=-;.  _/ \ -. `_/   \
       /  `-.__ ^   / .-'.--\ =-=~_=-=~=^/  _ `--./ .-'  `-
      /        `.  / /       `.~-^=-=~=^=.-'      '-._ `._

                             A Product of the CoinMasters Guild
                                              - Highlander

## Upstream Additions
* KeepKey Wallet
* osmo
* xrp
* DASH
* ZEC
* UTXO support

## Powered by Pioneer API

api docs: [https://pioneers.dev/docs](https://pioneers.dev/docs)

## Pioneer SDK

### _Integrate Blockchains easily_

## Packages

This repo contains packages around SwapKit sdk and its integrations with different blockchains.

| Package                                                                                                             | Description                                            |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [@coinmasters/api](https://www.npmjs.com/package/@coinmasters/api)                                                  | SwapKit API wrapper                                    |
| [@coinmasters/core](https://www.npmjs.com/package/@coinmasters/core)                                                | Core package for SwapKit                               |
| [@coinmasters/sdk](https://www.npmjs.com/package/@coinmasters/sdk)                                                  | All-in-one package for SwapKit                         |
| [@coinmasters/tokens](https://www.npmjs.com/package/@coinmasters/tokens)                                            | Static tokens lists with decimals & contract addresses |
| [@coinmasters/types](https://www.npmjs.com/package/@coinmasters/types)                                              | Types & enums for SwapKit                              |
| [@coinmasters/toolbox-cosmos](https://www.npmjs.com/package/@coinmasters/toolbox-cosmos)                            | Integrate Cosmos chains                                |
| [@coinmasters/toolbox-evm](https://www.npmjs.com/package/@coinmasters/toolbox-evm)                                  | Integrate EVM chain                                    |
| [@coinmasters/toolbox-utxo](https://www.npmjs.com/package/@coinmasters/toolbox-utxo)                                | Integrate UTXO chain                                   |
| [@coinmasters/wallet-evm-extensions](https://www.npmjs.com/package/@coinmasters/wallet-evm-extensions)              | EVM Browser Extensions                                 |
| [@coinmasters/wallet-keplr](https://www.npmjs.com/package/@coinmasters/wallet-keplr)                                | Keplr Wallet                                           |
| [@coinmasters/wallet-keystore](https://www.npmjs.com/package/@coinmasters/wallet-keystore)                          | Keystore Wallet                                        |
| [@coinmasters/wallet-ledger](https://www.npmjs.com/package/@coinmasters/wallet-ledger)                              | Ledger Wallet                                          |
| [@coinmasters/wallet-okx](https://www.npmjs.com/package/@coinmasters/wallet-okx)                                    | OKX Wallet                                             |
| [@coinmasters/wallet-trezor](https://www.npmjs.com/package/@coinmasters/wallet-trezor)                              | Trezor Wallet                                          |
| [@coinmasters/wallet-wc](https://www.npmjs.com/package/@coinmasters/wallet-wc)                                      | Walletconnect Wallet                                   |
| [@coinmasters/wallet-xdefi](https://www.npmjs.com/package/@coinmasters/wallet-xdefi)                                | XDEFI Wallet                                           |

## Contributing

#### Pre-requisites

1.

```bash
npm install -g pnpm
```

2.

```pre
Copy .env.example to .env and fill it with data
```

### Installation

```bash
pnpm bootstrap;
```

#### Branches

- `master` - production branch
- `develop` - development branch - all PRs should be merged here first
- `nightly` - branch for nightly builds - can be used for testing purposes

#### Testing

To run tests use `pnpm test` command.

#### Pull requests

- PRs should be created from `develop` branch
- PRs should be reviewed by at least Code Owner (see CODEOWNERS file)
- PRs should have scope in commit message (see commit messages section)
- PRs should have tests if it's possible
- PRs should have changeset file if it's needed (see release section)

#### New package

To create new package use `pnpm generate` and pick one of the options
It will setup the package with the necessary files for bundling and publishing.

### Release and publish

Packages are automatically published to npm when new PR is merged to `main` & `develop` branches.
To automate and handle process we use [changesets](https://github.com/changesets/changesets) and github action workflows.

<b>Before running `pnpm changeset` you have to pull `main` & `develop`</b>

To release new version of package you need to create PR with changes and add changeset file to your commit.

```bash
pnpm changeset
```

After PR is merged to `develop` branch with changeset file, github action will create new PR with updated versions of packages and changelogs.

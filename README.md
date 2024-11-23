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


| Package                                                                                                             | Description                                            |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [@coinmasters/tokens](https://www.npmjs.com/package/@coinmasters/tokens)                                            | Static tokens lists with decimals & contract addresses |
| [@coinmasters/types](https://www.npmjs.com/package/@coinmasters/types)                                              | Types & enums for SwapKit                              |
| [@coinmasters/pioneer-react](https://www.npmjs.com/package/@coinmasters/pioneer-react)                                              | Pioneer React provider                              |
| [@coinmasters/pioneer-sdk](https://www.npmjs.com/package/@coinmasters/pioneer-sdk)                                              | Pioneer sdk                              |


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

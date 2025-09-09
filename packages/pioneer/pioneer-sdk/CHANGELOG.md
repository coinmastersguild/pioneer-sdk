# @coinmasters/pioneer-sdk

## 4.13.22

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/api@3.10.9
  - @coinmasters/types@4.10.2

## 4.13.21

### Patch Changes

- bump

## 4.13.20

### Patch Changes

- bump

## 4.13.19

### Patch Changes

- bump

## 4.13.18

### Patch Changes

- bump

## 4.13.17

### Patch Changes

- bump

## 4.13.16

### Patch Changes

- bump

## 4.13.15

### Patch Changes

- bump

## 4.13.14

### Patch Changes

- bump

## 4.13.13

### Patch Changes

- bump

## 4.13.11

### Patch Changes

- bump

## 4.13.8

### Patch Changes

- bump

## 4.13.7

### Patch Changes

- bump

## 4.13.6

### Patch Changes

- bump

## 4.13.5

### Patch Changes

- bump

## 4.13.4

### Patch Changes

- bump

## 4.13.3

### Patch Changes

- bump

## 4.13.2

### Patch Changes

- bump

## 4.13.1

### Patch Changes

- bump

- Fix incorrect CAIP assignment for ERC-20 tokens

  - Add CAIP validator to detect and correct incorrect CAIP identifiers
  - Fix critical bug where eETH gets assigned native ETH CAIP (eip155:1/slip44:60)
  - Integrate validation into getCharts.ts to catch issues from Pioneer API
  - Automatically correct known tokens (eETH, WETH, USDC, USDT)
  - Log CRITICAL issues when tokens use native asset CAIPs
  - Mark corrected balances with caipCorrected flag
  - Add comprehensive debug logging for swap operations
  - Improve recipient address resolution for cross-chain swaps

  This prevents the bug where clicking ETH shows eETH instead, as each token now gets its correct unique CAIP identifier.

- Updated dependencies []:
  - @coinmasters/api@3.10.9
  - @coinmasters/types@4.10.2

## 4.13.0

### Minor Changes

- bump

## 4.12.22

### Patch Changes

- bump

## 4.12.21

### Patch Changes

- bump

## 4.12.20

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/api@3.10.8
  - @coinmasters/types@4.10.1

## 4.12.19

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/api@3.10.7
  - @coinmasters/types@4.10.1

## 4.12.18

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/api@3.10.6
  - @coinmasters/types@4.10.1

## 4.12.17

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/api@3.10.5
  - @coinmasters/types@4.10.1

## 4.12.16

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/api@3.10.4
  - @coinmasters/types@4.10.1

## 4.12.15

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/api@3.10.3
  - @coinmasters/types@4.10.1

## 4.12.13

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/api@3.10.2
  - @coinmasters/types@4.10.1

## 4.12.11

### Patch Changes

- bump

## 4.12.10

### Patch Changes

- bump

## 4.12.8

### Patch Changes

- bump

## 4.12.7

### Patch Changes

- bump

## 4.12.6

### Patch Changes

- bump

## 4.12.5

### Patch Changes

- bump

## 4.12.4

### Patch Changes

- bump

## 4.12.3

### Patch Changes

- bump

## 4.12.2

### Patch Changes

- buimp

## 4.12.1

### Patch Changes

- bump

## 4.12.0

### Minor Changes

- bump

## 4.11.0

### Minor Changes

- bump

## 4.10.3

### Patch Changes

- Maintenance release - updating dependencies and removing deprecated pioneer-react package

- Updated dependencies []:
  - @coinmasters/api@3.10.1
  - @coinmasters/tokens@3.10.1
  - @coinmasters/types@4.10.1

## 4.10.0

### Minor Changes

- bump

### Patch Changes

- Updated dependencies []:
  - @coinmasters/tokens@3.10.0
  - @coinmasters/types@4.10.0
  - @coinmasters/api@3.10.0

## 4.9.0

### Minor Changes

- bump

### Patch Changes

- Updated dependencies []:
  - @coinmasters/api@3.9.0
  - @coinmasters/tokens@3.9.0
  - @coinmasters/types@4.9.0

## 4.8.33

### Patch Changes

- bump

## 4.8.32

### Patch Changes

- bump

## 4.8.31

### Patch Changes

- bump

## 4.8.30

### Patch Changes

- bump

## 4.8.29

### Patch Changes

- bump

## 4.8.28

### Patch Changes

- bump

## 4.8.26

### Patch Changes

- bump

## 4.8.25

### Patch Changes

- bump

## 4.8.24

### Patch Changes

- bump

## 4.8.23

### Patch Changes

- bump

## 4.8.22

### Patch Changes

- bump

## 4.8.21

### Patch Changes

- bump

## 4.8.20

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/tokens@3.8.14
  - @coinmasters/types@4.8.14
  - @coinmasters/api@3.8.14

## 4.8.19

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/api@3.8.13
  - @coinmasters/tokens@3.8.13
  - @coinmasters/types@4.8.13

## 4.8.18

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/tokens@3.8.12
  - @coinmasters/types@4.8.12
  - @coinmasters/api@3.8.12

## 4.8.17

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/api@3.8.11
  - @coinmasters/tokens@3.8.11
  - @coinmasters/types@4.8.11

## 4.8.16

### Patch Changes

- bump

## 4.8.15

### Patch Changes

- bump

## 4.8.14

### Patch Changes

- bump

## 4.8.13

### Patch Changes

- bump

## 4.8.12

### Patch Changes

- bump

## 4.8.11

### Patch Changes

- bump

## 4.8.10

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/tokens@3.8.10
  - @coinmasters/types@4.8.10
  - @coinmasters/api@3.8.10

## 4.8.9

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/api@3.8.9
  - @coinmasters/tokens@3.8.9
  - @coinmasters/types@4.8.9

## 4.8.8

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/toolbox-cosmos@11.1.8
  - @coinmasters/toolbox-ripple@11.1.8
  - @coinmasters/tokens@3.8.8
  - @coinmasters/toolbox-utxo@11.1.8
  - @coinmasters/types@4.8.8
  - @coinmasters/toolbox-evm@11.1.8
  - @coinmasters/core@12.0.8
  - @coinmasters/api@3.8.8

## 4.8.7

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/toolbox-cosmos@11.1.7
  - @coinmasters/toolbox-ripple@11.1.7
  - @coinmasters/tokens@3.8.7
  - @coinmasters/toolbox-utxo@11.1.7
  - @coinmasters/types@4.8.7
  - @coinmasters/toolbox-evm@11.1.7
  - @coinmasters/core@12.0.7
  - @coinmasters/api@3.8.7

## 4.8.6

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/toolbox-cosmos@11.1.6
  - @coinmasters/toolbox-ripple@11.1.6
  - @coinmasters/tokens@3.8.6
  - @coinmasters/toolbox-utxo@11.1.6
  - @coinmasters/types@4.8.6
  - @coinmasters/toolbox-evm@11.1.6
  - @coinmasters/core@12.0.6
  - @coinmasters/api@3.8.6

## 4.8.5

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/toolbox-cosmos@11.1.5
  - @coinmasters/toolbox-ripple@11.1.5
  - @coinmasters/tokens@3.8.5
  - @coinmasters/toolbox-utxo@11.1.5
  - @coinmasters/types@4.8.5
  - @coinmasters/toolbox-evm@11.1.5
  - @coinmasters/core@12.0.5
  - @coinmasters/api@3.8.5

## 4.8.4

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/toolbox-cosmos@11.1.4
  - @coinmasters/toolbox-ripple@11.1.4
  - @coinmasters/tokens@3.8.4
  - @coinmasters/toolbox-utxo@11.1.4
  - @coinmasters/types@4.8.4
  - @coinmasters/toolbox-evm@11.1.4
  - @coinmasters/core@12.0.4
  - @coinmasters/api@3.8.4

## 4.8.3

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/toolbox-cosmos@11.1.3
  - @coinmasters/toolbox-ripple@11.1.3
  - @coinmasters/tokens@3.8.3
  - @coinmasters/toolbox-utxo@11.1.3
  - @coinmasters/types@4.8.3
  - @coinmasters/toolbox-evm@11.1.3
  - @coinmasters/core@12.0.3
  - @coinmasters/api@3.8.3

## 4.8.2

### Patch Changes

- bump

- Updated dependencies []:
  - @coinmasters/toolbox-cosmos@11.1.2
  - @coinmasters/toolbox-ripple@11.1.2
  - @coinmasters/tokens@3.8.2
  - @coinmasters/toolbox-utxo@11.1.2
  - @coinmasters/types@4.8.2
  - @coinmasters/toolbox-evm@11.1.2
  - @coinmasters/core@12.0.2
  - @coinmasters/api@3.8.2

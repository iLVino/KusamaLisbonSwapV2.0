# KusamaSwap v2: Hardhat Edition

A Uniswap V2-style AMM DEX ported to Westend on PolkaVM for the Polkadot Hackathon, built with Hardhat.

## Overview
KusamaSwap v2 ports a minimal Uniswap V2 Pair contract to Westend, supporting KSM/USDT liquidity addition and token swaps. It uses Solidity 0.8.28 with Hardhat.

- **Track**: Porting Existing Smart Contracts
- **Original Source**: [Uniswap V2 Pair](https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol)
- **Deployed on**: Westend Testnet
- **Contracts**: `UniswapV2Pair.sol` (minimal, mint [and swap]), `MockERC20.sol` (KSM/USDT)
- **Based on**: [hardhat-polkadot-example](https://github.com/UtkarshBhardwaj007/hardhat-polkadot-example)
- **Hackathon Idea**: [Issue #19](https://github.com/polkadot-developers/hackathon-guide/issues/19)

## Setup
1. Clone the repo: `git clone https://github.com/your-username/kusamaswap-hardhat`
2. Install dependencies: `npm install`
3. Set private key: `npx hardhat vars set WESTEND_HUB_PK <private_key>`
4. Compile: `npx hardhat compile`
5. Deploy:
   - KSM: `npx hardhat ignition deploy ./ignition/modules/KSMModule.ts --network westendAssetHub`
   - USDT: `npx hardhat ignition deploy ./ignition/modules/USDTModule.ts --network westendAssetHub`
   - Pair: `npx hardhat ignition deploy ./ignition/modules/PairModule.ts --network westendAssetHub`
6. Test: `npx hardhat run scripts/test-mint.ts --network westendAssetHub`
         `npx hardhat run scripts/test-swap.ts --network westendAssetHub`

## Deployed Contracts
- KSM: `0x4FB451440e632eB25B0bBc5e40DF0aE88CCd33fd` 
- USDT: `0x369c6E27533c5bC20277a24aB32C43358EE949A3`
- Pair: `0x935E7f86531335c02A458253f220F7D412172D2D`

## Gas Cost Comparison
| Action         | PolkaVM (Westend) Gas | Ethereum Gas | Notes                     |
|----------------|-----------------------|--------------|---------------------------|
| Deploy KSM     | 316638451715000       | ~600k        | MockERC20 deployment      |
| Deploy USDT    | 316638451715000       | ~600k        | MockERC20 deployment      |
| Deploy Pair    | 306916585041666       | ~1.2M        | PolkaVM initcode limits   |
| Add Liquidity  | 31093251728333        | ~200k        | `mint` call               |
| Swap           | 44885218385000        | ~80k         | No fee for MVP            |

## Test Logs
- **Liquidity Addition**:
  - Approved 1000 KSM and 1000 USDT to Pair (`0xPairAddress`).
  - Transferred 1000 KSM and 1000 USDT to Pair.
  - Minted ~999 LP tokens to `0x93eC5e12AC770eF01920dF0D870b5A075937b55b`.
  - Reserves: ~1000 KSM, ~1000 USDT.
  - Sent 10 KSM to Pair, received ~9.9 USDT.


## Setup Details
- **Hardhat**: v2.24.0
- **Westend RPC**: `https://westend-asset-hub-eth-rpc.polkadot.io`

- Deployed `MyToken` ERC-20 as a stepping stone.

## Future Improvements
- Add `burn` if initcode allows.
- Integrate Mocha/Chai tests.
- Compare PolkaVM performance with other EVM chains.
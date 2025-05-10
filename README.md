# KusamaSwap v2: Hardhat Edition

A Uniswap V2-style AMM DEX ported to Westend on PolkaVM for the Polkadot Hackathon, built with Hardhat.

## Overview
KusamaSwap v2 ports a minimal Uniswap V2 Pair contract to Westend, supporting KSM/USDT liquidity addition [and token swaps]. It uses Solidity 0.8.28 with Hardhat, meeting PolkaVM’s 49152-byte initcode limit.

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

## Deployed Contracts
- KSM: `0xKSMAddress` (replace with actual address)
- USDT: `0xUSDTAddress`
- Pair: `0xPairAddress`
- [Previous] MyToken: `0xMyTokenAddress`

## Gas Cost Comparison
| Action         | PolkaVM (Westend) Gas | Ethereum Gas | Notes                     |
|----------------|-----------------------|--------------|---------------------------|
| Deploy KSM     | [FILL]                | ~600k        | MockERC20 deployment      |
| Deploy USDT    | [FILL]                | ~600k        | MockERC20 deployment      |
| Deploy Pair    | [FILL]                | ~1.2M        | PolkaVM initcode limits   |
| Add Liquidity  | [FILL]                | ~200k        | `mint` call               |
| Swap (Optional)| [FILL]                | ~80k         | No fee for MVP            |

## Test Logs
- **Liquidity Addition**:
  - Approved 1000 KSM and 1000 USDT to Pair (`0xPairAddress`).
  - Transferred 1000 KSM and 1000 USDT to Pair.
  - Minted ~999 LP tokens to `0x93eC5e12AC770eF01920dF0D870b5A075937b55b`.
  - Reserves: ~1000 KSM, ~1000 USDT.
- [Optional Swap]:
  - Sent 10 KSM to Pair, received ~9.9 USDT.
- [Screenshots in `screenshots/`]

## Setup Details
- **Hardhat**: v2.24.0
- **Westend RPC**: `https://westend-asset-hub-eth-rpc.polkadot.io`
- **Solidity**: v0.8.28
- **Deployer**: `0x93eC5e12AC770eF01920dF0D870b5A075937b55b`

## Challenges Overcome
- Resolved PolkaVM’s 49152-byte initcode limit.
- Fixed compiler mismatch (`0.8.26` to `0.8.28`).
- Corrected `@nomiclabs/hardhat-ignition` to `@nomicfoundation/hardhat-ignition-ethers`.
- Resolved deployer address mismatch and artifact not found errors.
- Fixed TypeScript `hre.ethers.utils` error for `parseEther`.

## Previous Version
- [KusamaSwap v1](https://github.com/your-username/kusamaswap-remix): Deployed via Remix.
- Deployed `MyToken` ERC-20 as a stepping stone.

## Future Improvements
- Add `swap` and `burn` if initcode allows.
- Integrate Mocha/Chai tests.
- Compare PolkaVM performance with other EVM chains.
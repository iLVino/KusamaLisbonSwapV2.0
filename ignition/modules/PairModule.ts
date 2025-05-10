// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const PairModule = buildModule('PairModule', (m) => {
  // Parameters for KSM and USDT addresses (replace with actual addresses after deployment)
  const ksmAddress = m.getParameter('ksmAddress', '0x4FB451440e632eB25B0bBc5e40DF0aE88CCd33fd');
  const usdtAddress = m.getParameter('usdtAddress', '0x369c6E27533c5bC20277a24aB32C43358EE949A3');

  const pair = m.contract('UniswapV2Pair', [ksmAddress, usdtAddress]);

  return { pair };
});

export default PairModule;
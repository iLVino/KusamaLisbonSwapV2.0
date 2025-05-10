// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const USDTModule = buildModule('USDTModule', (m) => {
  const initialSupply = m.getParameter('usdtInitialSupply', 1_000_000n * 10n ** 18n);

  const usdt = m.contract('MockERC20', ['Tether', 'USDT', initialSupply]);

  return { usdt };
});

export default USDTModule;
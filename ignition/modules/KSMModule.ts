// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const KSMModule = buildModule('KSMModule', (m) => {
  const initialSupply = m.getParameter('ksmInitialSupply', 1_000_000n * 10n ** 18n);

  const ksm = m.contract('MockERC20', ['Kusama', 'KSM', initialSupply]);

  return { ksm };
});

export default KSMModule;
import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const ksm = await hre.ethers.getContractAt("MockERC20", "0x4FB451440e632eB25B0bBc5e40DF0aE88CCd33fd");
  const usdt = await hre.ethers.getContractAt("MockERC20", "0x369c6E27533c5bC20277a24aB32C43358EE949A3");
  const pair = await hre.ethers.getContractAt("UniswapV2Pair", "0x935E7f86531335c02A458253f220F7D412172D2D");

  const amountIn = ethers.parseEther("10");
  await ksm.transfer(pair, amountIn);
  const swapTx = await pair.swap(0, ethers.parseEther("9.9"), deployer.address);
  const receipt = await swapTx.wait();

  console.log("USDT Balance:", (await usdt.balanceOf(deployer.address)).toString());
  if (receipt) {
    console.log("Gas Used for Swap:", receipt.gasUsed.toString());
  } else {
    console.log("Swap transaction receipt is null.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
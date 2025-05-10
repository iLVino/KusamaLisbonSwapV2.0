import hre from "hardhat";
import { ethers } from "ethers"; // Import ethers explicitly

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const ksm = await hre.ethers.getContractAt("MockERC20", "0x4FB451440e632eB25B0bBc5e40DF0aE88CCd33fd");
  const usdt = await hre.ethers.getContractAt("MockERC20", "0x369c6E27533c5bC20277a24aB32C43358EE949A3");
  const pair = await hre.ethers.getContractAt("UniswapV2Pair", "0x935E7f86531335c02A458253f220F7D412172D2D");

  const amount = ethers.parseEther("1000"); // Use ethers.parseEther
  await ksm.approve(pair, amount);
  await usdt.approve(pair, amount);
  await ksm.transfer(pair, amount);
  await usdt.transfer(pair, amount);
  await pair.mint(deployer.address);

  console.log("LP Tokens:", (await pair.balanceOf(deployer.address)).toString());
  const [reserve0, reserve1] = await pair.getReserves();
  console.log("Reserves:", reserve0.toString(), reserve1.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
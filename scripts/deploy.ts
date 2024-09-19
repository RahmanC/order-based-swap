import { ethers } from "hardhat";
import { OrderBasedSwap__factory } from "../typechain-types";

async function main() {
  console.log("Deploying OrderBasedSwap contract...");

  // Get the ContractFactory and Signer
  const [deployer] = await ethers.getSigners();
  const orderBasedSwapFactory: OrderBasedSwap__factory =
    await ethers.getContractFactory("OrderBasedSwap");

  // Deploy the contract
  const orderBasedSwap = await orderBasedSwapFactory.deploy();

  await orderBasedSwap.waitForDeployment();

  console.log("OrderBasedSwap deployed to:", orderBasedSwap.target);
  console.log("Deployed by:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

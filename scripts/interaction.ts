import { ethers } from "hardhat";
import { OrderBasedSwap } from "../typechain-types";
import { IERC20 } from "../typechain-types/@openzeppelin/contracts/token/ERC20/IERC20";

async function main() {
  const orderBasedSwapAddress = "0x5f58879Fe3a4330B6D85c1015971Ea6e5175AeDD";
  const orderBasedSwap = (await ethers.getContractAt(
    "OrderBasedSwap",
    orderBasedSwapAddress
  )) as OrderBasedSwap;

  const [owner, user1, user2] = await ethers.getSigners();

  const tokenAAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
  const tokenBAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI

  const tokenA = (await ethers.getContractAt(
    "IERC20",
    tokenAAddress
  )) as IERC20;
  const tokenB = (await ethers.getContractAt(
    "IERC20",
    tokenBAddress
  )) as IERC20;

  const amountA = ethers.parseUnits("100", 6); // 100 USDC
  const amountB = ethers.parseUnits("200", 18); // 200 DAI

  console.log("Checking balances...");
  const user1BalanceA = await tokenA.balanceOf(user1.address);
  const user2BalanceB = await tokenB.balanceOf(user2.address);
  console.log(
    `User1 balance of USDC: ${ethers.formatUnits(user1BalanceA, 6)} USDC`
  );
  console.log(
    `User2 balance of DAI: ${ethers.formatUnits(user2BalanceB, 18)} DAI`
  );

  // Approve tokens
  console.log("Approving tokens...");
  await tokenA.connect(user1).approve(orderBasedSwap.getAddress(), amountA);
  await tokenB.connect(user2).approve(orderBasedSwap.getAddress(), amountB);
  console.log("Tokens approved");

  console.log("Creating an order...");
  try {
    const tx1 = await orderBasedSwap
      .connect(user1)
      .createOrder(tokenAAddress, amountA, tokenBAddress, amountB);
    console.log("Transaction sent, waiting for confirmation...");
    const receipt1 = await tx1.wait();
    console.log("Transaction confirmed");

    console.log("Transaction receipt:", receipt1);

    // Get the current order ID from the contract
    const currentOrderId = await orderBasedSwap.nextOrderId();
    console.log("Current order ID from contract:", currentOrderId.toString());

    // fulfill the order
    console.log("Fulfilling the order...");
    const tx2 = await orderBasedSwap
      .connect(user2)
      .fulfillOrder(BigInt(currentOrderId.toString()) - 1n);
    await tx2.wait();
    console.log("Order fulfilled");

    // Check balances
    const user1BalanceB = await tokenB.balanceOf(user1.address);
    const user2BalanceA = await tokenA.balanceOf(user2.address);
    console.log(
      `User1 balance of DAI: ${ethers.formatUnits(user1BalanceB, 18)} DAI`
    );
    console.log(
      `User2 balance of USDC: ${ethers.formatUnits(user2BalanceA, 6)} USDC`
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

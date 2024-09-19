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

  const tokenAAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const tokenBAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

  const tokenA = (await ethers.getContractAt(
    "IERC20",
    tokenAAddress
  )) as IERC20;
  const tokenB = (await ethers.getContractAt(
    "IERC20",
    tokenBAddress
  )) as IERC20;

  const amountA = ethers.parseEther("100");
  const amountB = ethers.parseEther("200");

  // Approve tokens
  await tokenA.connect(user1).approve(orderBasedSwap.getAddress(), amountA);
  await tokenB.connect(user2).approve(orderBasedSwap.getAddress(), amountB);

  console.log("Creating an order...");
  const tx1 = await orderBasedSwap
    .connect(user1)
    .createOrder(tokenAAddress, amountA, tokenBAddress, amountB);
  const receipt1 = (await tx1.wait()) as any;
  const orderId = receipt1?.logs[0].args?.orderId;
  console.log(`Order created with ID: ${orderId}`);

  console.log("Fulfilling the order...");
  const tx2 = await orderBasedSwap.connect(user2).fulfillOrder(orderId);
  await tx2.wait();
  console.log("Order fulfilled");

  // Check balances
  const user1BalanceB = await tokenB.balanceOf(user1.address);
  const user2BalanceA = await tokenA.balanceOf(user2.address);
  console.log(
    `User1 balance of Token B: ${ethers.formatEther(user1BalanceB)} TKB`
  );
  console.log(
    `User2 balance of Token A: ${ethers.formatEther(user2BalanceA)} TKA`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

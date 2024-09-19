import { expect } from "chai";
import { ethers } from "hardhat";
import { OrderBasedSwap, MockERC20 } from "../typechain-types";

describe("OrderBasedSwap", function () {
  let orderBasedSwap: OrderBasedSwap;
  let tokenA: MockERC20;
  let tokenB: MockERC20;
  let owner: any;
  let user1: any;
  let user2: any;

  const initialSupply = ethers.parseEther("1000000");
  const depositAmount = ethers.parseEther("100");
  const requestedAmount = ethers.parseEther("200");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = (await MockERC20.deploy(
      "Token A",
      "TKA",
      initialSupply
    )) as MockERC20;
    tokenB = (await MockERC20.deploy(
      "Token B",
      "TKB",
      initialSupply
    )) as MockERC20;

    // Deploy contract
    const OrderBasedSwap = await ethers.getContractFactory("OrderBasedSwap");
    orderBasedSwap = (await OrderBasedSwap.deploy()) as OrderBasedSwap;

    // Transfer tokens to users
    await tokenA.transfer(user1.address, depositAmount);
    await tokenB.transfer(user2.address, requestedAmount);

    // Approve tokens for the contract
    await tokenA
      .connect(user1)
      .approve(await orderBasedSwap.getAddress(), depositAmount);
    await tokenB
      .connect(user2)
      .approve(await orderBasedSwap.getAddress(), requestedAmount);
  });

  it("should create an order", async function () {
    await expect(
      orderBasedSwap
        .connect(user1)
        .createOrder(
          await tokenA.getAddress(),
          depositAmount,
          await tokenB.getAddress(),
          requestedAmount
        )
    )
      .to.emit(orderBasedSwap, "OrderCreated")
      .withArgs(
        0,
        user1.address,
        await tokenA.getAddress(),
        depositAmount,
        await tokenB.getAddress(),
        requestedAmount
      );

    const order = await orderBasedSwap.orders(0);
    expect(order.depositor).to.equal(user1.address);
    expect(order.depositToken).to.equal(await tokenA.getAddress());
    expect(order.depositAmount).to.equal(depositAmount);
    expect(order.requestedToken).to.equal(await tokenB.getAddress());
    expect(order.requestedAmount).to.equal(requestedAmount);
    expect(order.fulfilled).to.be.false;
  });

  it("should fulfill an order", async function () {
    await orderBasedSwap
      .connect(user1)
      .createOrder(
        await tokenA.getAddress(),
        depositAmount,
        await tokenB.getAddress(),
        requestedAmount
      );

    await expect(orderBasedSwap.connect(user2).fulfillOrder(0))
      .to.emit(orderBasedSwap, "OrderFulfilled")
      .withArgs(0, user2.address, await tokenB.getAddress(), requestedAmount);

    const order = await orderBasedSwap.orders(0);
    expect(order.fulfilled).to.be.true;

    expect(await tokenA.balanceOf(user2.address)).to.equal(depositAmount);
    expect(await tokenB.balanceOf(user1.address)).to.equal(requestedAmount);
  });

  it("should not allow fulfilling an already fulfilled order", async function () {
    await orderBasedSwap
      .connect(user1)
      .createOrder(
        await tokenA.getAddress(),
        depositAmount,
        await tokenB.getAddress(),
        requestedAmount
      );

    await orderBasedSwap.connect(user2).fulfillOrder(0);

    await expect(
      orderBasedSwap.connect(user2).fulfillOrder(0)
    ).to.be.revertedWith("Order already fulfilled");
  });

  it("should allow owner to withdraw tokens", async function () {
    // Send some tokens to the contract
    await tokenA.transfer(await orderBasedSwap.getAddress(), depositAmount);

    await expect(
      orderBasedSwap
        .connect(owner)
        .withdrawTokens(await tokenA.getAddress(), depositAmount)
    ).to.changeTokenBalance(tokenA, owner, depositAmount);
  });
});

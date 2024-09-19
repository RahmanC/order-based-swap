// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OrderBasedSwap is Ownable(msg.sender) {
    using SafeERC20 for IERC20;

    struct Order {
        address depositor;
        IERC20 depositToken;
        uint256 depositAmount;
        IERC20 requestedToken;
        uint256 requestedAmount;
        bool fulfilled;
    }

    uint256 public nextOrderId;
    mapping(uint256 => Order) public orders;

    event OrderCreated(
        uint256 orderId,
        address indexed depositor,
        address depositToken,
        uint256 depositAmount,
        address requestedToken,
        uint256 requestedAmount
    );

    event OrderFulfilled(
        uint256 orderId,
        address indexed fulfiller,
        address requestedToken,
        uint256 requestedAmount
    );

    // User creates an order by depositing tokens
    function createOrder(
        IERC20 _depositToken,
        uint256 _depositAmount,
        IERC20 _requestedToken,
        uint256 _requestedAmount
    ) external {
        require(_depositAmount > 0, "Deposit amount must be greater than zero");
        require(_requestedAmount > 0, "Requested amount must be greater than zero");

        // Transfer deposit tokens to contract
        _depositToken.safeTransferFrom(msg.sender, address(this), _depositAmount);

        // Create and store the order
        orders[nextOrderId] = Order({
            depositor: msg.sender,
            depositToken: _depositToken,
            depositAmount: _depositAmount,
            requestedToken: _requestedToken,
            requestedAmount: _requestedAmount,
            fulfilled: false
        });

        emit OrderCreated(nextOrderId, msg.sender, address(_depositToken), _depositAmount, address(_requestedToken), _requestedAmount);

        nextOrderId++;
    }

    // User fulfills an order by providing the requested tokens
    function fulfillOrder(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        require(!order.fulfilled, "Order already fulfilled");
        require(order.requestedAmount > 0, "Invalid order");

        // Transfer requested tokens from fulfiller to depositor
        order.requestedToken.safeTransferFrom(msg.sender, order.depositor, order.requestedAmount);

        // Transfer deposit tokens from contract to fulfiller
        order.depositToken.safeTransfer(msg.sender, order.depositAmount);

        // Mark order as fulfilled
        order.fulfilled = true;

        emit OrderFulfilled(_orderId, msg.sender, address(order.requestedToken), order.requestedAmount);
    }

    // Emergency function to allow admin to withdraw any tokens accidentally sent to the contract
    function withdrawTokens(IERC20 _token, uint256 _amount) external onlyOwner {
        _token.safeTransfer(owner(), _amount);
    }
}

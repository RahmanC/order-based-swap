import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_MAINNET_API_KEY_URL,
      },
    },
    "lisk-sepolia": {
      url: process.env.LISK_RPC_URL!,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY!],
      gasPrice: 1000000000,
    },
  },
  etherscan: {
    apiKey: {
      "lisk-sepolia": "123",
    },
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com/",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
  lockGasLimit: 200000000000,
  gasPrice: 10000000000,
};

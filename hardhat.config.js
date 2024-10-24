require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require("dotenv").config()
require("@nomicfoundation/hardhat-ethers")
require("hardhat-deploy-ethers")
require("@nomicfoundation/hardhat-chai-matchers");

/** @type import('hardhat/config').HardhatUserConfig */

const { SEPOLIA_URL, PRIVATE_KEY, ETHERSCAN_API_KEY, REPORT_GAS } = process.env

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            // // If you want to do some forking, uncomment this
            // forking: {
            //   url: MAINNET_RPC_URL
            // }
            chainId: 31337,
        },
        localhost: {
            //accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            chainId: 31337,
        },
        sepolia: {
            url: SEPOLIA_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            //   accounts: {
            //     mnemonic: MNEMONIC,
            //   },
            saveDeployments: true,
            chainId: 11155111,
        },
    },
    etherscan: {
        // npx hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
        apiKey: {
            sepolia: ETHERSCAN_API_KEY,
        },
        customChains: [],
    },
    gasReporter: {
        enabled: REPORT_GAS,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        player: {
            default: 1,
        },
        player2: { default: 2 },
    },
    mocha: {
        timeout: 200000, // 200 seconds max for running tests
    },
    solidity: {
        compilers: [
            {
                version: "0.8.7",
            },
            {
                version: "0.8.24",
            },
            {
                version: "0.8.20",
            },
        ],
    },
}

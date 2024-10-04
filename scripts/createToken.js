const { ethers } = require("hardhat")

async function createToken() {}

createToken()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })

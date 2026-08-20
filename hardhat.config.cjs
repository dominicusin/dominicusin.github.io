/* Hardhat config — DAO test network. CommonJS for Hardhat 2.x.
   Uses the 2.x-compatible plugin set (hardhat-ethers 3.x / chai-matchers 2.x
   / network-helpers 1.x), all of which resolve `hardhat/plugins` correctly
   under Hardhat 2.29.x. */
require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-chai-matchers');
const { HardhatUserConfig } = require('hardhat/config');

/** @type {HardhatUserConfig} */
module.exports = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'cancun'
    }
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false
    },
    // Sepolia / Goerli are driven by CI/CD secrets (no hardcoded keys).
    // Provide DEPLOY_PRIVATE_KEY + SEPOLIA_RPC_URL (or GOERLI_RPC_URL) as
    // environment variables when running `hardhat run --network sepolia`.
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: process.env.DEPLOY_PRIVATE_KEY ? [process.env.DEPLOY_PRIVATE_KEY] : []
    },
    goerli: {
      url: process.env.GOERLI_RPC_URL || '',
      accounts: process.env.DEPLOY_PRIVATE_KEY ? [process.env.DEPLOY_PRIVATE_KEY] : []
    }
  },
  paths: {
    sources: './contracts',
    tests: './tests/hardhat',
    cache: './cache_hardhat',
    artifacts: './artifacts_hardhat'
  },
  mocha: {
    timeout: 60000
  }
};

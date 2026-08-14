/* Hardhat config — DAO test network (v4.0). CommonJS for Hardhat 2.x. */
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

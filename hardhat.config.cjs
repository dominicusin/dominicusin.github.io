/* Hardhat config — DAO test network. CommonJS for Hardhat 2.x.
   hardhat ^2.22.0 + @nomicfoundation/* 2.x/3.x plugins are the stable,
   CI-passing set (Hardhat 3.x requires ESM config + incompatible
   chai-matchers, and currently breaks `hardhat test` here). */
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
    // Sepolia / Goerli deploys require DEPLOY_PRIVATE_KEY + SEPOLIA_RPC_URL
    // (or GOERLI_RPC_URL) repository secrets; intentionally omitted so tests
    // run without secrets. Add them here when deploying.
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

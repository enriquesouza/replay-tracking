require("@nomicfoundation/hardhat-toolbox");

/**
 * Hardhat config — Hardened 2026-07-05.
 * - Solidity 0.8.35, EVM `osaka`, optimizer 200 runs.
 * - Hardhat 2.28.6, toolbox 6.1.2.
 * - Gas reporter optional via `REPORT_GAS=true`.
 * - Coverage via `solidity-coverage` plugin (registered conditionally).
 * - `paths.tests = "./tests/hardhat"` keeps Hardhat out of Vitest's way.
 *
 * See .upgrade/v2/01-solidity-security.md for the contract-side changes.
 */

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.35",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "osaka",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./tests/hardhat",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: false,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
    },
    localhost: {
      url: process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545",
      chainId: 31337,
    },
    "camp-network-testnet": {
      url: process.env.CAMP_RPC_URL || "https://rpc.camp-network-testnet.gelato.digital",
      chainId: 325000,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    token: "ETH",
    gasPriceApi: process.env.GAS_PRICE_API,
  },
  mocha: {
    timeout: 60_000,
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  warnings: {
    // Surface every warning, including the "0.8.35 not fully supported" notice.
    // We use 0.8.35 because it's the latest stable; the warning is benign.
    solc: false,
  },
};

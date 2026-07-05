// Deploys ReplayTrackingContractV3 to a LOCAL JSON-RPC node
// (hardhat node, anvil, or any compatible provider on http://127.0.0.1:8545).
//
// 2026-07-05 v2: hardened — fail fast on missing keys, no console.log of secrets.

const { configDotenv } = require("dotenv");
const { ethers } = require("ethers");
configDotenv();

const LOCAL_RPC = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";

// Hardhat's default account #0 is a well-known public dev key. Anvil's is the
// same. Override with DEPLOYER_PRIVATE_KEY in .env if you have a real wallet.
const DEFAULT_DEV_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY || DEFAULT_DEV_KEY;

async function main() {
  const provider = new ethers.JsonRpcProvider(LOCAL_RPC);
  // Confirm the RPC is reachable before doing anything.
  try {
    await provider.getBlockNumber();
  } catch (err) {
    throw new Error(
      `Cannot reach ${LOCAL_RPC}: ${err.message}. Start a local node first (npm run node:hardhat or npm run node:anvil).`
    );
  }
  const wallet = new ethers.Wallet(deployerPrivateKey, provider);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`RPC:      ${LOCAL_RPC}`);

  // Load the artifact dynamically — re-resolves after `npm run compile`.
  const artifact = require(
    `../artifacts/contracts/ReplayTrackingContractV2.sol/ReplayTrackingContractV3.json`
  );
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  // OZ v5: pass the deployer EOA as the initial owner (matches the v4 implicit
  // `msg.sender` initialization of Ownable).
  const contract = await factory.deploy(wallet.address);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`Contract deployed to: ${address}`);
  console.log(`\nTo wire the API to this deployment, set in .env:\n  CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});

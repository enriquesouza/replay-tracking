// Deploys ReplayTrackingContractV3 to a JSON-RPC node reachable via
// LOCAL_RPC_URL. Defaults to a local node on http://127.0.0.1:8545.

const { configDotenv } = require("dotenv");
const { ethers } = require("ethers");
configDotenv();

const LOCAL_RPC = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const DEFAULT_ANVIL_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY || DEFAULT_ANVIL_KEY;

async function main() {
  const provider = new ethers.JsonRpcProvider(LOCAL_RPC);
  try {
    await provider.getBlockNumber();
  } catch (err) {
    throw new Error(`Cannot reach ${LOCAL_RPC}: ${err.message}`);
  }
  const wallet = new ethers.Wallet(deployerPrivateKey, provider);

  const artifact = require(
    `../artifacts/contracts/ReplayTrackingContractV2.sol/ReplayTrackingContractV3.json`
  );
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log(`Deployer: ${wallet.address}`);
  console.log(`RPC:      ${LOCAL_RPC}`);

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

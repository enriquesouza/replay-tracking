// Deploys ReplayTrackingContractV3 to a remote chain (defaults to
// https://rpc-campnetwork.xyz — Camp Network mainnet).
//
// 2026-07-05 v2: hardened — fail fast, no secret logging, gas sanity check.

const { configDotenv } = require("dotenv");
const { ethers } = require("ethers");
configDotenv();

const RPC_URL = process.env.RPC_URL || "https://rpc-campnetwork.xyz";

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY is required for prod deploys");
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  // Confirm the RPC is reachable.
  try {
    await provider.getBlockNumber();
  } catch (err) {
    throw new Error(`Cannot reach ${RPC_URL}: ${err.message}`);
  }
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

  // Sanity-check the wallet balance.
  const balance = await provider.getBalance(wallet.address);
  if (balance < ethers.parseEther("0.001")) {
    throw new Error(
      `Wallet ${wallet.address} has ${ethers.formatEther(balance)} ETH — too low for a deploy`
    );
  }

  const artifact = require(`../artifacts/contracts/ReplayTrackingContractV2.sol/ReplayTrackingContractV3.json`);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log(`Deployer: ${wallet.address}`);
  console.log(`RPC:      ${RPC_URL}`);
  console.log(`Balance:  ${ethers.formatEther(balance)} ETH`);

  // OZ v5: pass the deployer EOA as the initial owner.
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
